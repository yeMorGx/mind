-- Assurance must still exist in the live session and account, not only an old JWT.
create or replace function public.mind_admin_session_active(account uuid,session uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.sessions s where s.id=session and s.user_id=account and s.aal='aal2' and (s.not_after is null or s.not_after>now()))
 and exists(select 1 from auth.mfa_factors f where f.user_id=account and f.status='verified');
$$;
revoke all on function public.mind_admin_session_active(uuid,uuid) from public,anon,authenticated;
grant execute on function public.mind_admin_session_active(uuid,uuid) to service_role;
