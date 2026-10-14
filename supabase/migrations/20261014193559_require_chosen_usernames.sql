-- Usernames must be chosen by their owner, never generated automatically.
drop trigger assign_directory_username on public.mind_creator_directory;
drop trigger assign_native_username on public.mind_creators;
drop function public.mind_assign_username();
-- The preceding migration was just applied; these are its unclaimed defaults.
delete from public.mind_usernames where username ~ '^criador_[0-9a-f]{16}$';

create function public.mind_set_username(username_value text) returns void
language plpgsql security invoker set search_path='' as $$
declare identity_id text; requested text:=lower(regexp_replace(btrim(username_value),'^@',''));
begin
  select public_id into identity_id from public.mind_accounts where id=(select auth.uid());
  if identity_id is null then raise exception 'Entre novamente na conta.'; end if;
  if requested is null or requested !~ '^[a-z][a-z0-9_]{2,23}$' then raise exception 'Use de 3 a 24 caracteres no @: letras, números e _, começando com uma letra.'; end if;
  insert into public.mind_usernames values(identity_id,requested) on conflict(public_id) do update set username=excluded.username;
exception when unique_violation then raise exception 'Este @ já está em uso. Escolha outro.';
end $$;
revoke all on function public.mind_set_username(text) from public,anon,authenticated;
grant execute on function public.mind_set_username(text) to authenticated;

create function public.mind_set_directory_username(public_id_value text,username_value text) returns void
language plpgsql security invoker set search_path='' as $$
declare requested text:=lower(regexp_replace(btrim(username_value),'^@',''));
begin
  if exists(select 1 from public.mind_creators where public_id=public_id_value) then raise exception 'Sua conta já foi migrada. Conclua o login Google.'; end if;
  if not exists(select 1 from public.mind_creator_directory where public_id=public_id_value) then raise exception 'Entre novamente na conta para preparar seu perfil.'; end if;
  if requested is null or requested !~ '^[a-z][a-z0-9_]{2,23}$' then raise exception 'Use de 3 a 24 caracteres no @: letras, números e _, começando com uma letra.'; end if;
  insert into public.mind_usernames values(public_id_value,requested) on conflict(public_id) do update set username=excluded.username;
exception when unique_violation then raise exception 'Este @ já está em uso. Escolha outro.';
end $$;
revoke all on function public.mind_set_directory_username(text,text) from public,anon,authenticated;
grant execute on function public.mind_set_directory_username(text,text) to service_role;
