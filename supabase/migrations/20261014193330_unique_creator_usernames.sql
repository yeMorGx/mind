-- One public identifier per person, shared by Firebase and native accounts.
create table public.mind_usernames (
  public_id text primary key,
  username text not null unique,
  constraint valid_username check (username=lower(username) and username ~ '^[a-z][a-z0-9_]{2,23}$')
);
alter table public.mind_usernames enable row level security;
revoke all on public.mind_usernames from public,anon,authenticated;
grant select on public.mind_usernames to anon,authenticated;
grant insert(public_id,username),update(username) on public.mind_usernames to authenticated;
grant select,insert,update,delete on public.mind_usernames to service_role;
create policy public_usernames on public.mind_usernames for select to anon,authenticated using(true);
create policy own_username_insert on public.mind_usernames for insert to authenticated
  with check(public_id=(select public_id from public.mind_accounts where id=(select auth.uid())));
create policy own_username_update on public.mind_usernames for update to authenticated
  using(public_id=(select public_id from public.mind_accounts where id=(select auth.uid())))
  with check(public_id=(select public_id from public.mind_accounts where id=(select auth.uid())));

-- This invoker trigger runs with the existing profile writer's permissions:
-- service_role for the verified Firebase bridge, postgres inside native bootstrap.
create function public.mind_assign_username() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  loop
    begin
      insert into public.mind_usernames values(new.public_id,'criador_'||substr(replace(gen_random_uuid()::text,'-',''),1,16));
      return new;
    exception when unique_violation then
      if exists(select 1 from public.mind_usernames where public_id=new.public_id) then return new; end if;
    end;
  end loop;
end $$;
revoke all on function public.mind_assign_username() from public,anon,authenticated;
grant execute on function public.mind_assign_username() to service_role;
create trigger assign_directory_username after insert on public.mind_creator_directory for each row execute function public.mind_assign_username();
create trigger assign_native_username after insert on public.mind_creators for each row execute function public.mind_assign_username();

do $$
declare identity_id text;
begin
  for identity_id in select public_id from public.mind_creator_directory union select public_id from public.mind_creators loop
    loop
      begin
        insert into public.mind_usernames values(identity_id,'criador_'||substr(replace(gen_random_uuid()::text,'-',''),1,16));
        exit;
      exception when unique_violation then
        if exists(select 1 from public.mind_usernames where public_id=identity_id) then exit; end if;
      end;
    end loop;
  end loop;
end $$;

-- A name conflict rolls the profile update back in the same transaction.
create function public.mind_save_creator_profile(profile_values jsonb,username_value text) returns void
language plpgsql security invoker set search_path='' as $$
declare identity_id text; requested text:=lower(regexp_replace(btrim(username_value),'^@',''));
begin
  select public_id into identity_id from public.mind_accounts where id=(select auth.uid());
  if identity_id is null then raise exception 'Entre novamente na conta.'; end if;
  if requested is null or requested !~ '^[a-z][a-z0-9_]{2,23}$' then raise exception 'Use de 3 a 24 caracteres no @: letras, números e _, começando com uma letra.'; end if;
  perform public.mind_save_profile(profile_values);
  insert into public.mind_usernames values(identity_id,requested)
    on conflict(public_id) do update set username=excluded.username;
exception when unique_violation then raise exception 'Este @ já está em uso. Escolha outro.';
end $$;
revoke all on function public.mind_save_creator_profile(jsonb,text) from public,anon,authenticated;
grant execute on function public.mind_save_creator_profile(jsonb,text) to authenticated;

-- Only the bridge may supply a Firebase public_id, after verifying its JWT.
create function public.mind_save_directory_identity(public_id_value text,profile_values jsonb,username_value text default null,ensure_only boolean default false) returns void
language plpgsql security invoker set search_path='' as $$
declare requested text:=lower(regexp_replace(btrim(username_value),'^@',''));
begin
  if exists(select 1 from public.mind_creators where public_id=public_id_value) then
    if ensure_only then return; end if;
    raise exception 'Sua conta já foi migrada. Conclua o login Google para editar o perfil.';
  end if;
  if ensure_only then
    insert into public.mind_creator_directory(public_id,profile) values(public_id_value,profile_values) on conflict(public_id) do nothing;
    return;
  end if;
  if requested is not null and requested !~ '^[a-z][a-z0-9_]{2,23}$' then raise exception 'Use de 3 a 24 caracteres no @: letras, números e _, começando com uma letra.'; end if;
  insert into public.mind_creator_directory(public_id,profile) values(public_id_value,profile_values)
    on conflict(public_id) do update set profile=excluded.profile,updated_at=now();
  if requested is not null then
    insert into public.mind_usernames values(public_id_value,requested)
      on conflict(public_id) do update set username=excluded.username;
  end if;
exception when unique_violation then raise exception 'Este @ já está em uso. Escolha outro.';
end $$;
revoke all on function public.mind_save_directory_identity(text,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.mind_save_directory_identity(text,jsonb,text,boolean) to service_role;

create function public.mind_search_creators(search_term text default '')
returns table(public_id text,username text,name text,headline text,avatar_url text,badges text[])
language sql stable security invoker set search_path='' as $$
  select u.public_id,u.username,
    coalesce(n.profile,d.profile)->>'name',
    coalesce(n.profile,d.profile)->>'headline',
    coalesce(n.profile,d.profile)->>'avatarUrl',
    coalesce(b.badges,d.badges,'{}'::text[])
  from public.mind_usernames u
  left join public.mind_creators n on n.public_id=u.public_id
  left join public.mind_creator_directory d on d.public_id=u.public_id
  left join public.mind_badges b on b.public_id=u.public_id
  where coalesce(n.profile,d.profile) is not null and (
    strpos(u.username,lower(regexp_replace(left(btrim(coalesce(search_term,'')),80),'^@','')))>0
    or strpos(lower(coalesce(n.profile,d.profile)->>'name'),lower(regexp_replace(left(btrim(coalesce(search_term,'')),80),'^@','')))>0)
  order by (u.username=lower(regexp_replace(btrim(coalesce(search_term,'')),'^@',''))) desc,u.username
  limit 20;
$$;
revoke all on function public.mind_search_creators(text) from public;
grant execute on function public.mind_search_creators(text) to anon,authenticated;
