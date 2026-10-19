-- Copies, including repeated copies, are metered. Unlock records retain access history.
create table public.mind_prompt_copies (
 id uuid primary key, actor_id text not null, creator_id text not null, prompt_id text not null,
 created_at timestamptz not null default now()
);
create index mind_copy_usage_idx on public.mind_prompt_copies(actor_id,created_at);
create table public.mind_plan_grants (
 actor_id text primary key references public.mind_subscriptions(actor_id),
 plan text not null check(plan='premium'), reason text not null,
 granted_at timestamptz not null default now(), expires_at timestamptz
);
alter table public.mind_prompt_copies enable row level security;
alter table public.mind_plan_grants enable row level security;
revoke all on public.mind_prompt_copies,public.mind_plan_grants from public,anon,authenticated;
grant all on public.mind_prompt_copies,public.mind_plan_grants to service_role;

create or replace function mind_billing.effective_plan(actor text) returns text
language sql stable security definer set search_path='' as $$
 select coalesce(
  (select plan from public.mind_plan_grants where actor_id=actor and (expires_at is null or expires_at>now())),
  (select plan from public.mind_subscriptions where actor_id=actor and status in('active','trialing') and period_end>now()),'free');
$$;
create or replace function public.mind_billing_status(actor text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p text; row_value public.mind_subscriptions; start_at timestamptz; end_at timestamptz; quota integer; used integer;
begin
 insert into public.mind_subscriptions(actor_id) values(actor) on conflict do nothing;
 select * into row_value from public.mind_subscriptions where actor_id=actor;
 p:=mind_billing.effective_plan(actor);
 if p='free' then start_at:=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';end_at:=start_at+interval '1 day';quota:=2;
 elsif row_value.period_end is null or row_value.period_end<=now() then
  start_at:=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC';end_at:=start_at+interval '1 month';quota:=case when p='plus' then 100 else null end;
 else
  select max(row_value.period_start+make_interval(months=>n)) into start_at from generate_series(0,12) n where row_value.period_start+make_interval(months=>n)<=now();
  select least(row_value.period_end,min(row_value.period_start+make_interval(months=>n))) into end_at from generate_series(1,13) n where row_value.period_start+make_interval(months=>n)>now();
  quota:=case when p='plus' then 100 else null end;
 end if;
 select count(*) into used from public.mind_prompt_copies where actor_id=actor and created_at>=start_at and created_at<end_at;
 return jsonb_build_object('enabled',(select enabled from public.mind_billing_settings where id),
 'complimentary',exists(select 1 from public.mind_plan_grants where actor_id=actor and (expires_at is null or expires_at>now())),
 'plan',p,'status',case when p='premium' and exists(select 1 from public.mind_plan_grants where actor_id=actor and (expires_at is null or expires_at>now())) then 'active' else row_value.status end,'periodEnd',row_value.period_end,'cancelAtPeriodEnd',row_value.cancel_at_period_end,
 'hasCustomer',row_value.customer_id is not null,'hasSubscription',row_value.subscription_id is not null and row_value.status not in('canceled','incomplete_expired'),
 'used',used,'limit',quota,'remaining',case when quota is null then null else greatest(0,quota-used) end,'resetsAt',end_at);
end $$;

create function public.mind_copy_prompt(actor text,creator text,prompt text,request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; account_status jsonb;
begin
 insert into public.mind_subscriptions(actor_id) values(actor) on conflict do nothing;
 perform 1 from public.mind_subscriptions where actor_id=actor for update;
 -- Same lock serializes unlocks and copies across tabs/devices.
 account_status:=public.mind_billing_status(actor);
 if exists(select 1 from public.mind_prompt_copies where id=request_id and actor_id=actor and creator_id=creator and prompt_id=prompt) then
  return public.mind_prompt_entitlement(actor,creator,prompt,false);
 end if;
 if (account_status->>'enabled')::boolean and (account_status->>'remaining')::integer=0 then
  return jsonb_build_object('unlocked',false,'limitReached',true,'billing',account_status);
 end if;
 result:=public.mind_prompt_entitlement(actor,creator,prompt,true);
 if not (result->>'unlocked')::boolean then return result;end if;
 if (account_status->>'enabled')::boolean then
  insert into public.mind_prompt_copies(id,actor_id,creator_id,prompt_id) values(request_id,actor,creator,prompt);
 end if;
 return jsonb_set(result,'{billing}',public.mind_billing_status(actor));
end $$;
revoke all on function public.mind_copy_prompt(text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.mind_copy_prompt(text,text,text,uuid) to service_role;

-- Complimentary owner entitlement, separate from real Stripe subscription/payment state.
-- Resolve the authenticated account by email; never create or guess a public ID.
insert into public.mind_subscriptions(actor_id)
 select a.public_id from public.mind_accounts a join auth.users u on u.id=a.id
 where lower(u.email)='gabrielmcgoes@gmail.com' on conflict do nothing;
insert into public.mind_plan_grants(actor_id,plan,reason)
 select a.public_id,'premium','Complimentary Premium requested by account owner, 2026-10-19'
 from public.mind_accounts a join auth.users u on u.id=a.id
 where lower(u.email)='gabrielmcgoes@gmail.com'
 on conflict(actor_id) do update set plan=excluded.plan,reason=excluded.reason,expires_at=null;
