alter table public.mind_plan_grants
 add column granted_by text references public.mind_admin_memberships(actor_id);

create index mind_plan_grants_expires_idx on public.mind_plan_grants(expires_at);

-- Preserve who originally issued the owner's complimentary grant, which predates
-- grant attribution. Resolve the owner by their verified account email.
update public.mind_plan_grants g
set granted_by=a.public_id
from public.mind_accounts a
join auth.users u on u.id=a.id
where g.actor_id=a.public_id
  and lower(u.email)='gabrielmcgoes@gmail.com'
  and g.granted_by is null;

create or replace function public.mind_admin_sales_data(actor text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not exists(
  select 1 from public.mind_admin_memberships
  where actor_id=actor and active and role in('owner','admin')
 ) then raise exception 'Acesso restrito à administração.'; end if;

 with identities as (
  select public_id from public.mind_creators
  union
  select public_id from public.mind_creator_directory
 ), people as (
  select i.public_id,
   coalesce(nullif(coalesce(n.profile,d.profile)->>'name',''),'Conta Mind') name,
   coalesce(n.profile,d.profile)->>'avatarUrl' avatar,
   u.username,coalesce(b.badges,'{}'::text[]) badges
  from identities i
  left join public.mind_creators n using(public_id)
  left join public.mind_creator_directory d using(public_id)
  left join public.mind_usernames u using(public_id)
  left join public.mind_badges b using(public_id)
 ), subscriptions as (
  select s.actor_id,s.customer_id,s.subscription_id,s.plan,s.status,s.period_start,s.period_end,
   s.cancel_at_period_end,s.updated_at,p.name,p.avatar,p.username,p.badges
  from public.mind_subscriptions s
  left join people p on p.public_id=s.actor_id
  where s.subscription_id is not null
 ), grants as (
  select g.actor_id,g.plan,g.reason,g.granted_at,g.granted_by,g.expires_at,
   (g.expires_at is null or g.expires_at>now()) active,p.name,p.avatar,p.username,p.badges
  from public.mind_plan_grants g
  left join people p on p.public_id=g.actor_id
 )
 select jsonb_build_object(
  'summary',jsonb_build_object(
   'activeSubscriptions',(select count(*) from subscriptions where status in('active','trialing') and period_end>now()),
   'activeManualGrants',(select count(*) from grants where expires_at is null or expires_at>now())
  ),
  'subscriptions',coalesce((
   select jsonb_agg(jsonb_build_object(
    'public_id',actor_id,'customer_id',customer_id,'subscription_id',subscription_id,
    'name',name,'avatar',avatar,'username',username,'badges',badges,'plan',plan,'status',status,
    'period_start',period_start,'period_end',period_end,'cancel_at_period_end',cancel_at_period_end,'updated_at',updated_at
   ) order by updated_at desc)
   from (select * from subscriptions order by updated_at desc limit 50) recent
  ),'[]'::jsonb),
  'grants',coalesce((
   select jsonb_agg(jsonb_build_object(
    'public_id',actor_id,'name',name,'avatar',avatar,'username',username,'badges',badges,'plan',plan,
    'reason',reason,'granted_at',granted_at,'granted_by',granted_by,'expires_at',expires_at,'active',active
   ) order by granted_at desc)
   from (select * from grants order by granted_at desc limit 50) recent
  ),'[]'::jsonb)
 ) into result;
 return result;
end
$$;

create or replace function public.mind_admin_grant_premium(actor text,target text,expires_at timestamptz,reason text) returns void
language plpgsql security definer set search_path='' as $$
declare previous public.mind_plan_grants; saved public.mind_plan_grants;
begin
 if not exists(
  select 1 from public.mind_admin_memberships
  where actor_id=actor and active and role in('owner','admin')
 ) then raise exception 'Acesso restrito à administração.'; end if;
 if target is null or char_length(target) not between 1 and 128
  or reason is null or char_length(btrim(reason)) not between 5 and 500
  or (expires_at is not null and expires_at<=now())
 then raise exception 'Confira a conta, a validade e o motivo da concessão.'; end if;
 if not exists(select 1 from public.mind_creators where public_id=target)
  and not exists(select 1 from public.mind_creator_directory where public_id=target)
 then raise exception 'Conta não encontrada.'; end if;

 perform pg_advisory_xact_lock(hashtextextended('mind-plan:'||target,0));
 insert into public.mind_subscriptions(actor_id) values(target) on conflict(actor_id) do nothing;
 select * into previous from public.mind_plan_grants where actor_id=target for update;
 insert into public.mind_plan_grants(actor_id,plan,reason,granted_by,granted_at,expires_at)
 values(target,'premium',btrim(reason),actor,now(),expires_at)
 on conflict(actor_id) do update set plan='premium',reason=excluded.reason,granted_by=excluded.granted_by,
  granted_at=excluded.granted_at,expires_at=excluded.expires_at
 returning * into saved;
 insert into public.mind_admin_audit(actor_id,action,target_id,details)
 values(actor,'plan.grant',target,jsonb_build_object(
  'plan','premium','source','manual','before',case when previous.actor_id is null then null else to_jsonb(previous) end,
  'after',to_jsonb(saved),'reason',btrim(reason)
 ));
end
$$;

create or replace function public.mind_admin_revoke_premium(actor text,target text,reason text) returns void
language plpgsql security definer set search_path='' as $$
declare previous public.mind_plan_grants;
begin
 if not exists(
  select 1 from public.mind_admin_memberships
  where actor_id=actor and active and role in('owner','admin')
 ) then raise exception 'Acesso restrito à administração.'; end if;
 if target is null or char_length(target) not between 1 and 128
  or reason is null or char_length(btrim(reason)) not between 5 and 500
 then raise exception 'Confira a conta e o motivo da revogação.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('mind-plan:'||target,0));
 select * into previous from public.mind_plan_grants where actor_id=target for update;
 if not found then raise exception 'A conta não possui uma concessão manual de Premium.'; end if;
 delete from public.mind_plan_grants where actor_id=target;
 insert into public.mind_admin_audit(actor_id,action,target_id,details)
 values(actor,'plan.revoke',target,jsonb_build_object('before',to_jsonb(previous),'reason',btrim(reason)));
end
$$;

do $$ declare sig text; begin
 foreach sig in array array[
  'mind_admin_sales_data(text)',
  'mind_admin_grant_premium(text,text,timestamp with time zone,text)',
  'mind_admin_revoke_premium(text,text,text)'
 ] loop
  execute 'revoke all on function public.'||sig||' from public,anon,authenticated';
  execute 'grant execute on function public.'||sig||' to service_role';
 end loop;
end $$;
