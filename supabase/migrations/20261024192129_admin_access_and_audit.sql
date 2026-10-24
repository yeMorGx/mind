create table public.mind_admin_memberships (
 actor_id text primary key references public.mind_accounts(public_id),
 role text not null check(role in('owner','admin','moderator')),
 active boolean not null default true, created_at timestamptz not null default now()
);
create table public.mind_admin_audit (
 id bigint generated always as identity primary key,
 actor_id text not null, action text not null, target_id text,
 details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index mind_admin_audit_created_idx on public.mind_admin_audit(created_at desc,id desc);
create table public.mind_admin_rate_limits (
 actor_id text primary key, window_start timestamptz not null, requests integer not null
);
alter table public.mind_admin_memberships enable row level security;
alter table public.mind_admin_audit enable row level security;
alter table public.mind_admin_rate_limits enable row level security;
revoke all on public.mind_admin_memberships,public.mind_admin_audit,public.mind_admin_rate_limits from public,anon,authenticated;
grant all on public.mind_admin_memberships,public.mind_admin_audit,public.mind_admin_rate_limits to service_role;
grant usage,select on sequence public.mind_admin_audit_id_seq to service_role;
-- Initial membership is explicitly bound to the existing, verified owner account.
insert into public.mind_admin_memberships(actor_id,role)
 select a.public_id,'owner' from public.mind_accounts a join auth.users u on u.id=a.id
 join public.mind_badges b on b.public_id=a.public_id
 where lower(u.email)='gabrielmcgoes@gmail.com' and 'owner'=any(b.badges);
-- Client-side badge-admin claims no longer provide a separate native write path.
revoke insert,update,delete on public.mind_badges from authenticated;

create function public.mind_admin_session_active(account uuid,session uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.sessions where id=session and user_id=account and (not_after is null or not_after>now()));
$$;
create function public.mind_admin_rate(actor text) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into public.mind_admin_rate_limits values(actor,now(),1)
 on conflict(actor_id) do update set
 requests=case when mind_admin_rate_limits.window_start<now()-interval '1 minute' then 1 else mind_admin_rate_limits.requests+1 end,
 window_start=case when mind_admin_rate_limits.window_start<now()-interval '1 minute' then now() else mind_admin_rate_limits.window_start end
 returning requests into n;
 return n<=60;
end $$;
create function public.mind_admin_users(search_value text default '',page_value integer default 0) returns jsonb
language sql stable security definer set search_path='' as $$
 with identities as (
  select public_id from public.mind_creators union select public_id from public.mind_creator_directory
 ), people as (
  select i.public_id,coalesce(n.profile,d.profile)->>'name' name,coalesce(n.profile,d.profile)->>'avatarUrl' avatar,
  u.username,coalesce(b.badges,d.badges,'{}'::text[]) badges,mind_billing.effective_plan(i.public_id) plan
  from identities i left join public.mind_creators n using(public_id) left join public.mind_creator_directory d using(public_id)
  left join public.mind_usernames u using(public_id) left join public.mind_badges b using(public_id)
 ), filtered as (
  select * from people where search_value='' or name ilike '%'||left(search_value,80)||'%' or username ilike '%'||left(ltrim(search_value,'@'),80)||'%'
 )
 select jsonb_build_object('total',(select count(*) from filtered),'items',coalesce((select jsonb_agg(row_to_json(p)) from (select * from filtered order by lower(name),public_id limit 25 offset least(greatest(page_value,0),10000)*25) p),'[]'::jsonb));
$$;
create function public.mind_admin_overview() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'profiles',(select count(*) from (select public_id from public.mind_creators union select public_id from public.mind_creator_directory) p),
 'publications',(select count(*) from (select creator_id,prompt_id from public.mind_public_prompts union select creator_id,prompt_id from public.mind_directory_prompts) p)+(select count(*) from public.mind_resources where status='published'),
 'copiesToday',(select count(*) from public.mind_prompt_copies where created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'),
 'activeCampaigns',(select count(*) from public.mind_campaigns where status='active'));
$$;
create function public.mind_admin_set_badges(actor text,target text,desired text[],reason text) returns void
language plpgsql security definer set search_path='' as $$
declare previous text[];
begin
 perform pg_advisory_xact_lock(hashtextextended('mind-badges:'||target,0));
 if not exists(select 1 from public.mind_admin_memberships where actor_id=actor and active and role in('owner','admin')) then raise exception 'Acesso restrito à administração.';end if;
 if desired is null or cardinality(desired)>4 or not(desired<@array['verified','moderator','creator','partner']) or char_length(btrim(reason)) not between 5 and 500 then raise exception 'Confira os emblemas e o motivo.';end if;
 if not exists(select 1 from public.mind_creators where public_id=target) and not exists(select 1 from public.mind_creator_directory where public_id=target) then raise exception 'Conta não encontrada.';end if;
 select coalesce((select badges from public.mind_badges where public_id=target),(select badges from public.mind_creator_directory where public_id=target),'{}'::text[]) into previous;
 if 'owner'=any(previous) or exists(select 1 from public.mind_admin_memberships where actor_id=target and role='owner') then raise exception 'O fundador é gerenciado exclusivamente no servidor.';end if;
 if exists(select 1 from public.mind_creators where public_id=target) then
  insert into public.mind_badges(public_id,badges) values(target,desired) on conflict(public_id) do update set badges=excluded.badges;
 end if;
 update public.mind_creator_directory set badges=desired,updated_at=now() where public_id=target;
 insert into public.mind_admin_audit(actor_id,action,target_id,details) values(actor,'badges.update',target,jsonb_build_object('before',previous,'after',desired,'reason',btrim(reason)));
end $$;
do $$ declare sig text; begin
 foreach sig in array array['mind_admin_session_active(uuid,uuid)','mind_admin_rate(text)','mind_admin_users(text,integer)','mind_admin_overview()','mind_admin_set_badges(text,text,text[],text)'] loop
  execute 'revoke all on function public.'||sig||' from public,anon,authenticated';
  execute 'grant execute on function public.'||sig||' to service_role';
 end loop;
end $$;
create function mind_billing.audit_campaign_change() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.mind_admin_memberships where actor_id=new.updated_by and active and role in('owner','admin')) then raise exception 'Acesso restrito à administração.';end if;
 insert into public.mind_admin_audit(actor_id,action,target_id,details)
 values(new.updated_by,case when tg_op='INSERT' then 'campaign.create' else 'campaign.update' end,new.id::text,
 jsonb_build_object('status',new.status,'previousStatus',case when tg_op='UPDATE' then old.status else null end));
 return new;
end $$;
revoke all on function mind_billing.audit_campaign_change() from public,anon,authenticated;
grant execute on function mind_billing.audit_campaign_change() to service_role;
create trigger mind_campaign_audit after insert or update on public.mind_campaigns for each row execute function mind_billing.audit_campaign_change();
