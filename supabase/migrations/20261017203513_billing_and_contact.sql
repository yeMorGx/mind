-- Rollout is OFF. Activate only after Stripe, webhook and legacy rules are configured.
create schema if not exists mind_billing;
revoke all on schema mind_billing from public,anon,authenticated;
grant usage on schema mind_billing to service_role;
create table public.mind_billing_settings (
 id boolean primary key default true check(id), enabled boolean not null default false,
 legacy_rules_confirmed boolean not null default false
);
insert into public.mind_billing_settings(id) values(true);
create table public.mind_subscriptions (
 actor_id text primary key,
 customer_id text unique,
 subscription_id text unique,
 plan text not null default 'free' check(plan in('free','plus','premium')),
 status text not null default 'none',
 period_start timestamptz, period_end timestamptz,
 cancel_at_period_end boolean not null default false,
 observed_at timestamptz not null default '-infinity',
 checkout_key uuid, checkout_plan text, checkout_cadence text, checkout_expires_at timestamptz,
 updated_at timestamptz not null default now()
);
create table public.mind_prompt_access (
 creator_id text not null,prompt_id text not null,
 access_mode text not null default 'metered' check(access_mode in('free','metered')),
 primary key(creator_id,prompt_id)
);
create table mind_billing.prompt_content (
 creator_id text not null,prompt_id text not null,content text not null,
 primary key(creator_id,prompt_id)
);
create table public.mind_prompt_unlocks (
 actor_id text not null,creator_id text not null,prompt_id text not null,
 created_at timestamptz not null default now(),
 primary key(actor_id,creator_id,prompt_id)
);
create index mind_unlock_usage_idx on public.mind_prompt_unlocks(actor_id,created_at);
create table public.mind_stripe_events (
 id text primary key, processed_at timestamptz not null default now()
);
create table public.mind_inquiries (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in('careers','business')),
 name text not null check(char_length(name) between 2 and 100),
 email text not null check(char_length(email) between 3 and 254),
 organization text not null default '' check(char_length(organization)<=160),
 subject text not null check(char_length(subject) between 2 and 120),
 website text not null default '' check(char_length(website)<=2048),
 budget text not null default '' check(char_length(budget)<=80),
 message text not null check(char_length(message) between 20 and 5000),
 consent boolean not null check(consent),
 ip_hash text not null,
 created_at timestamptz not null default now()
);
create index mind_inquiry_rate_idx on public.mind_inquiries(ip_hash,created_at);
-- All billing state and leads are server-only; no client can self-assign a plan.
do $$ declare t text; begin
 foreach t in array array['mind_billing_settings','mind_subscriptions','mind_prompt_access','mind_prompt_unlocks','mind_stripe_events','mind_inquiries'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
alter table mind_billing.prompt_content enable row level security;
revoke all on mind_billing.prompt_content from public,anon,authenticated;
grant all on mind_billing.prompt_content to service_role;

create function public.mind_billing_session() returns text
language sql stable security invoker set search_path='' as $$
 select public_id from public.mind_accounts where id=(select auth.uid()) and mind_security.mfa_satisfied();
$$;
revoke all on function public.mind_billing_session() from public,anon;
grant execute on function public.mind_billing_session() to authenticated;

create function mind_billing.effective_plan(actor text) returns text
language sql stable security definer set search_path='' as $$
 select coalesce((select plan from public.mind_subscriptions where actor_id=actor
 and status in('active','trialing') and period_end>now()),'free');
$$;
revoke all on function mind_billing.effective_plan(text) from public,anon,authenticated;

create function public.mind_billing_status(actor text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p text; row_value public.mind_subscriptions; start_at timestamptz; end_at timestamptz; quota integer; used integer;
begin
 insert into public.mind_subscriptions(actor_id) values(actor) on conflict do nothing;
 select * into row_value from public.mind_subscriptions where actor_id=actor;
 p:=mind_billing.effective_plan(actor);
 if p='free' then start_at:=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';end_at:=start_at+interval '1 day';quota:=2;
 else
  select max(row_value.period_start+make_interval(months=>n)) into start_at from generate_series(0,12) n where row_value.period_start+make_interval(months=>n)<=now();
  select least(row_value.period_end,min(row_value.period_start+make_interval(months=>n))) into end_at from generate_series(1,13) n where row_value.period_start+make_interval(months=>n)>now();
  quota:=case when p='plus' then 100 else null end;
 end if;
 select count(*) into used from public.mind_prompt_unlocks where actor_id=actor and created_at>=start_at and created_at<end_at;
 return jsonb_build_object('enabled',(select enabled from public.mind_billing_settings where id),
 'plan',p,'status',row_value.status,'periodEnd',row_value.period_end,'cancelAtPeriodEnd',row_value.cancel_at_period_end,
 'hasCustomer',row_value.customer_id is not null,'hasSubscription',row_value.subscription_id is not null and row_value.status not in('canceled','incomplete_expired'),
 'used',used,'limit',quota,'remaining',case when quota is null then null else greatest(0,quota-used) end,'resetsAt',end_at);
end $$;

create function public.mind_reserve_checkout(actor text, chosen_plan text, cadence text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.mind_subscriptions;
begin
 if chosen_plan not in('plus','premium') or cadence not in('monthly','yearly') then raise exception 'Plano inválido.';end if;
 insert into public.mind_subscriptions(actor_id) values(actor) on conflict do nothing;
 select * into s from public.mind_subscriptions where actor_id=actor for update;
 if s.subscription_id is not null and s.status not in('canceled','incomplete_expired') then raise exception 'Gerencie sua assinatura atual para trocar o plano.';end if;
 if s.checkout_key is not null and s.checkout_expires_at>now() then
  if s.checkout_plan<>chosen_plan or s.checkout_cadence<>cadence then raise exception 'Já há um checkout aberto. Conclua-o ou aguarde 35 minutos para escolher outro plano.';end if;
 else
  update public.mind_subscriptions set checkout_key=gen_random_uuid(),checkout_plan=chosen_plan,checkout_cadence=cadence,checkout_expires_at=now()+interval '35 minutes' where actor_id=actor returning * into s;
 end if;
 return jsonb_build_object('key',s.checkout_key,'expiresAt',s.checkout_expires_at,'customerId',s.customer_id);
end $$;

create function public.mind_apply_subscription(event_id text, actor text, customer text, subscription text,
 new_plan text,new_status text,starts_at timestamptz,ends_at timestamptz,cancel_pending boolean,observed timestamptz) returns void
language plpgsql security definer set search_path='' as $$
declare old_value public.mind_subscriptions;
begin
 select * into old_value from public.mind_subscriptions where actor_id=actor for update;
 if not found or old_value.customer_id is distinct from customer then raise exception 'Assinatura sem vínculo com a conta.';end if;
 if exists(select 1 from public.mind_stripe_events where id=event_id) then return;end if;
 if new_plan not in('free','plus','premium') then raise exception 'Plano inválido.';end if;
 if observed>=old_value.observed_at then
  update public.mind_subscriptions set subscription_id=subscription,plan=new_plan,status=new_status,
   period_start=starts_at,period_end=ends_at,cancel_at_period_end=cancel_pending,observed_at=observed,updated_at=now(),
   checkout_key=null,checkout_expires_at=null where actor_id=actor;
 end if;
 insert into public.mind_stripe_events(id) values(event_id) on conflict do nothing;
end $$;

alter table public.mind_public_prompts add column requires_unlock boolean not null default false;
alter table public.mind_directory_prompts add column requires_unlock boolean not null default false;
create function mind_billing.protect_prompt() returns trigger
language plpgsql security definer set search_path='' as $$
declare mode_value text; original text;
begin
 original:=new.document->>'content';
 if original='Conteúdo disponível após desbloqueio.' then
  select content into original from mind_billing.prompt_content where creator_id=new.creator_id and prompt_id=new.prompt_id;
 end if;
 if original is null or char_length(btrim(original))=0 then raise exception 'Texto original do prompt não encontrado.';end if;
 insert into mind_billing.prompt_content values(new.creator_id,new.prompt_id,original)
 on conflict(creator_id,prompt_id) do update set content=excluded.content;
 select access_mode into mode_value from public.mind_prompt_access where creator_id=new.creator_id and prompt_id=new.prompt_id;
 new.requires_unlock:=coalesce((select enabled from public.mind_billing_settings where id),false) and coalesce(mode_value,'metered')<>'free';
 new.document:=jsonb_set(new.document,'{content}',to_jsonb(case when new.requires_unlock then 'Conteúdo disponível após desbloqueio.' else original end));
 return new;
end $$;
create trigger mind_protect_public_prompt before insert or update on public.mind_public_prompts for each row execute function mind_billing.protect_prompt();
create trigger mind_protect_directory_prompt before insert or update on public.mind_directory_prompts for each row execute function mind_billing.protect_prompt();

-- A legacy account migration copies directory snapshots back into its private library.
-- Restore the preserved source text there, rather than importing the public placeholder.
create function mind_billing.restore_private_prompt() returns trigger
language plpgsql security definer set search_path='' as $$
declare original text;
begin
 if new.document->>'content'='Conteúdo disponível após desbloqueio.' then
  select c.content into original from mind_billing.prompt_content c join public.mind_accounts a on a.public_id=c.creator_id
  where a.id=new.owner_id and c.prompt_id=new.id;
  if original is not null then new.document:=jsonb_set(new.document,'{content}',to_jsonb(original));end if;
 end if;
 return new;
end $$;
create trigger mind_restore_private_prompt before insert or update on public.mind_prompts for each row execute function mind_billing.restore_private_prompt();

create function public.mind_prompt_entitlement(actor text, creator text, prompt text, consume boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare doc jsonb; locked boolean; original text; account_status jsonb; already boolean;
begin
 -- A per-account lock makes the quota atomic across tabs and devices.
 insert into public.mind_subscriptions(actor_id) values(actor) on conflict do nothing;
 perform 1 from public.mind_subscriptions where actor_id=actor for update;
 select document,requires_unlock into doc,locked from public.mind_public_prompts where creator_id=creator and prompt_id=prompt;
 if not found then select document,requires_unlock into doc,locked from public.mind_directory_prompts where creator_id=creator and prompt_id=prompt;end if;
 if doc is null then raise exception 'Este prompt não está público.';end if;
 account_status:=public.mind_billing_status(actor);
 already:=exists(select 1 from public.mind_prompt_unlocks where actor_id=actor and creator_id=creator and prompt_id=prompt);
 if not locked then return jsonb_build_object('unlocked',true,'content',doc->>'content','billing',account_status);end if;
 select content into original from mind_billing.prompt_content where creator_id=creator and prompt_id=prompt;
 if original is null then raise exception 'Não foi possível carregar o conteúdo.';end if;
 if actor=creator or already then return jsonb_build_object('unlocked',true,'content',original,'billing',account_status);end if;
 if not consume then return jsonb_build_object('unlocked',false,'billing',account_status);end if;
 if (account_status->>'remaining')::integer=0 then return jsonb_build_object('unlocked',false,'limitReached',true,'billing',account_status);end if;
 insert into public.mind_prompt_unlocks(actor_id,creator_id,prompt_id) values(actor,creator,prompt) on conflict do nothing;
 return jsonb_build_object('unlocked',true,'content',original,'billing',public.mind_billing_status(actor));
end $$;

create function public.mind_set_prompt_access(actor text, prompt text, chosen_mode text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if chosen_mode not in('free','metered') then raise exception 'Escolha uma opção de acesso.';end if;
 if not exists(select 1 from public.mind_public_prompts where creator_id=actor and prompt_id=prompt)
 and not exists(select 1 from public.mind_directory_prompts where creator_id=actor and prompt_id=prompt) then raise exception 'Publique o prompt antes de ajustar o acesso.';end if;
 insert into public.mind_prompt_access values(actor,prompt,chosen_mode) on conflict(creator_id,prompt_id) do update set access_mode=excluded.access_mode;
 update public.mind_public_prompts set document=document where creator_id=actor and prompt_id=prompt;
 update public.mind_directory_prompts set document=document where creator_id=actor and prompt_id=prompt;
end $$;

create function mind_billing.publication_quota() returns trigger
language plpgsql security definer set search_path='' as $$
declare actor text; p text; total integer; quota integer;
begin
 if not (select enabled from public.mind_billing_settings where id) then return new;end if;
 actor:=new.creator_id;
 perform pg_advisory_xact_lock(hashtextextended('mind-publish:'||actor,0));
 if tg_table_name='mind_resources' then
  if new.status<>'published' then return new;end if;
  if tg_op='UPDATE' then if old.status='published' then return new;end if;end if;
 else
  if tg_op='UPDATE' or exists(select 1 from public.mind_public_prompts where creator_id=actor and prompt_id=new.prompt_id)
   or exists(select 1 from public.mind_directory_prompts where creator_id=actor and prompt_id=new.prompt_id) then return new;end if;
 end if;
 p:=mind_billing.effective_plan(actor);quota:=case p when 'free' then 5 when 'plus' then 50 else null end;
 if quota is null then return new;end if;
 select count(*) into total from (
  select prompt_id id from public.mind_public_prompts where creator_id=actor union
  select prompt_id from public.mind_directory_prompts where creator_id=actor union
  select 'resource:'||id::text from public.mind_resources where creator_id=actor and status='published'
 ) publications;
 if total>=quota then raise exception 'Seu plano permite % publicações. Gerencie sua assinatura ou retire uma publicação para continuar.',quota;end if;
 return new;
end $$;
create trigger mind_prompt_plan_quota before insert on public.mind_public_prompts for each row execute function mind_billing.publication_quota();
create trigger mind_directory_plan_quota before insert on public.mind_directory_prompts for each row execute function mind_billing.publication_quota();
create trigger mind_resource_plan_quota before insert or update on public.mind_resources for each row execute function mind_billing.publication_quota();

create function mind_billing.refresh_access() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.enabled and not new.legacy_rules_confirmed then raise exception 'Confirme a proteção das cópias públicas do Firebase antes de ativar os limites.';end if;
 if new.enabled is distinct from old.enabled then
  update public.mind_public_prompts set document=document;
  update public.mind_directory_prompts set document=document;
 end if;
 return new;
end $$;
-- AFTER ensures protect_prompt observes the new setting; updates are one transaction.
create trigger mind_billing_rollout after update on public.mind_billing_settings for each row execute function mind_billing.refresh_access();

create function public.mind_submit_inquiry(payload jsonb, fingerprint text) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('mind-contact:'||fingerprint,0));
 if (select count(*) from public.mind_inquiries where ip_hash=fingerprint and created_at>now()-interval '1 hour')>=3
 or (select count(*) from public.mind_inquiries where ip_hash=fingerprint and created_at>now()-interval '1 day')>=10 then raise exception 'Muitas mensagens. Aguarde antes de enviar outra.';end if;
 insert into public.mind_inquiries(kind,name,email,organization,subject,website,budget,message,consent,ip_hash)
 values(payload->>'kind',payload->>'name',payload->>'email',coalesce(payload->>'organization',''),payload->>'subject',coalesce(payload->>'website',''),coalesce(payload->>'budget',''),payload->>'message',(payload->>'consent')::boolean,fingerprint) returning id into result;
 return result;
end $$;

-- Service-only RPCs accept actor IDs ONLY after server-side identity verification.
revoke all on all functions in schema mind_billing from public,anon,authenticated;
grant execute on all functions in schema mind_billing to service_role;
do $$ declare sig text; begin
 foreach sig in array array[
 'public.mind_billing_status(text)','public.mind_reserve_checkout(text,text,text)',
 'public.mind_apply_subscription(text,text,text,text,text,text,timestamptz,timestamptz,boolean,timestamptz)',
 'public.mind_prompt_entitlement(text,text,text,boolean)','public.mind_set_prompt_access(text,text,text)',
 'public.mind_submit_inquiry(jsonb,text)'] loop
  execute 'revoke all on function '||sig||' from public,anon,authenticated';
  execute 'grant execute on function '||sig||' to service_role';
 end loop;
end $$;
