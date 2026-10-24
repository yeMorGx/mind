-- Expand visual recognition only; membership authorization and founder protection stay mandatory.
create or replace function public.mind_admin_set_badges(actor text,target text,desired text[],reason text) returns void
language plpgsql security definer set search_path='' as $$
declare previous text[];
begin
 perform pg_advisory_xact_lock(hashtextextended('mind-badges:'||target,0));
 if not exists(select 1 from public.mind_admin_memberships where actor_id=actor and active and role in('owner','admin')) then raise exception 'Acesso restrito à administração.';end if;
 if desired is null or cardinality(desired)>10 or array_position(desired,null) is not null or not(desired<@array['verified','moderator','creator','partner','team','ambassador','contributor','pioneer','educator','developer']) or reason is null or char_length(btrim(reason)) not between 5 and 500 then raise exception 'Confira os emblemas e o motivo.';end if;
 if not exists(select 1 from public.mind_creators where public_id=target) and not exists(select 1 from public.mind_creator_directory where public_id=target) then raise exception 'Conta não encontrada.';end if;
 select coalesce((select badges from public.mind_badges where public_id=target),(select badges from public.mind_creator_directory where public_id=target),'{}'::text[]) into previous;
 if 'owner'=any(previous) or exists(select 1 from public.mind_admin_memberships where actor_id=target and role='owner') then raise exception 'O fundador é gerenciado exclusivamente no servidor.';end if;
 if exists(select 1 from public.mind_creators where public_id=target) then
  insert into public.mind_badges(public_id,badges) values(target,desired) on conflict(public_id) do update set badges=excluded.badges;
 end if;
 update public.mind_creator_directory set badges=desired,updated_at=now() where public_id=target;
 insert into public.mind_admin_audit(actor_id,action,target_id,details) values(actor,'badges.update',target,jsonb_build_object('before',previous,'after',desired,'reason',btrim(reason)));
end $$;
revoke all on function public.mind_admin_set_badges(text,text,text[],text) from public,anon,authenticated;
grant execute on function public.mind_admin_set_badges(text,text,text[],text) to service_role;
