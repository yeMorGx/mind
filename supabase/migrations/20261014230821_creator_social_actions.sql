-- Shared public identities preserve social data through Firebase-to-native migration.
create table public.mind_follows (
  actor_id text not null, target_id text not null,
  created_at timestamptz not null default now(),
  primary key(actor_id,target_id),
  constraint no_self_follow check(actor_id<>target_id)
);
create index mind_follows_target_idx on public.mind_follows(target_id);
create table public.mind_likes (
  actor_id text not null, creator_id text not null, prompt_id text not null,
  created_at timestamptz not null default now(),
  primary key(actor_id,creator_id,prompt_id)
);
create index mind_likes_prompt_idx on public.mind_likes(creator_id,prompt_id);
alter table public.mind_follows enable row level security;
alter table public.mind_likes enable row level security;
revoke all on public.mind_follows,public.mind_likes from public,anon,authenticated;
grant select on public.mind_follows,public.mind_likes to anon,authenticated;
grant insert(actor_id,target_id),delete on public.mind_follows to authenticated;
grant insert(actor_id,creator_id,prompt_id),delete on public.mind_likes to authenticated;
grant all on public.mind_follows,public.mind_likes to service_role;
create policy public_follows on public.mind_follows for select to anon,authenticated using(true);
create policy public_likes on public.mind_likes for select to anon,authenticated using(
  exists(select 1 from public.mind_public_prompts p where p.creator_id=mind_likes.creator_id and p.prompt_id=mind_likes.prompt_id)
  or exists(select 1 from public.mind_directory_prompts p where p.creator_id=mind_likes.creator_id and p.prompt_id=mind_likes.prompt_id)
);
create policy own_follow_insert on public.mind_follows for insert to authenticated with check(
  actor_id=(select public_id from public.mind_accounts where id=(select auth.uid()))
  and exists(select 1 from public.mind_usernames u where u.public_id=actor_id)
  and (exists(select 1 from public.mind_creators c where c.public_id=target_id) or exists(select 1 from public.mind_creator_directory c where c.public_id=target_id))
);
create policy own_follow_delete on public.mind_follows for delete to authenticated using(actor_id=(select public_id from public.mind_accounts where id=(select auth.uid())));
create policy own_like_insert on public.mind_likes for insert to authenticated with check(
  actor_id=(select public_id from public.mind_accounts where id=(select auth.uid()))
  and exists(select 1 from public.mind_usernames u where u.public_id=actor_id)
  and (exists(select 1 from public.mind_public_prompts p where p.creator_id=mind_likes.creator_id and p.prompt_id=mind_likes.prompt_id)
    or exists(select 1 from public.mind_directory_prompts p where p.creator_id=mind_likes.creator_id and p.prompt_id=mind_likes.prompt_id))
);
create policy own_like_delete on public.mind_likes for delete to authenticated using(actor_id=(select public_id from public.mind_accounts where id=(select auth.uid())));

-- No privileged execution: native writes remain subject to ownership policies.
create function public.mind_set_social(kind_value text,target_value text,prompt_value text,active_value boolean) returns void
language plpgsql security invoker set search_path='' as $$
declare actor_value text;
begin
  select public_id into actor_value from public.mind_accounts where id=(select auth.uid());
  if actor_value is null then raise exception 'Entre novamente na sua conta.'; end if;
  if active_value is null then raise exception 'Solicitação inválida.'; end if;
  if kind_value='follow' then
    if active_value then insert into public.mind_follows(actor_id,target_id) values(actor_value,target_value) on conflict do nothing;
    else delete from public.mind_follows where actor_id=actor_value and target_id=target_value; end if;
  elsif kind_value='like' then
    if active_value then insert into public.mind_likes(actor_id,creator_id,prompt_id) values(actor_value,target_value,prompt_value) on conflict do nothing;
    else delete from public.mind_likes where actor_id=actor_value and creator_id=target_value and prompt_id=prompt_value; end if;
  else raise exception 'Solicitação inválida.'; end if;
end $$;
revoke all on function public.mind_set_social(text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.mind_set_social(text,text,text,boolean) to authenticated;

-- Service-only bridge. The Edge Function supplies actor_value from a verified JWT.
create function public.mind_set_legacy_social(actor_value text,kind_value text,target_value text,prompt_value text,active_value boolean) returns void
language plpgsql security invoker set search_path='' as $$
begin
  if exists(select 1 from public.mind_accounts where public_id=actor_value) then raise exception 'Sua conta já foi migrada. Entre com Google.'; end if;
  if not exists(select 1 from public.mind_usernames where public_id=actor_value) then raise exception 'Escolha seu @ antes de continuar.'; end if;
  if active_value is null then raise exception 'Solicitação inválida.'; end if;
  if kind_value='follow' then
    if actor_value=target_value then raise exception 'Você não pode seguir seu próprio perfil.'; end if;
    if active_value then
      if not exists(select 1 from public.mind_creators where public_id=target_value) and not exists(select 1 from public.mind_creator_directory where public_id=target_value) then raise exception 'Perfil não encontrado.'; end if;
      insert into public.mind_follows(actor_id,target_id) values(actor_value,target_value) on conflict do nothing;
    else delete from public.mind_follows where actor_id=actor_value and target_id=target_value; end if;
  elsif kind_value='like' then
    if active_value then
      if not exists(select 1 from public.mind_public_prompts where creator_id=target_value and prompt_id=prompt_value) and not exists(select 1 from public.mind_directory_prompts where creator_id=target_value and prompt_id=prompt_value) then raise exception 'Este prompt não está público.'; end if;
      insert into public.mind_likes(actor_id,creator_id,prompt_id) values(actor_value,target_value,prompt_value) on conflict do nothing;
    else delete from public.mind_likes where actor_id=actor_value and creator_id=target_value and prompt_id=prompt_value; end if;
  else raise exception 'Solicitação inválida.'; end if;
end $$;
revoke all on function public.mind_set_legacy_social(text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.mind_set_legacy_social(text,text,text,text,boolean) to service_role;

-- Bounded batch reads expose public counts and public relationship state only.
create function public.mind_social_snapshot(targets_value jsonb,actor_value text default null)
returns table(creator_id text,prompt_id text,followers bigint,following bigint,likes bigint,is_following boolean,is_liked boolean)
language sql stable security invoker set search_path='' as $$
  with targets as (
    select distinct item->>'creatorId' as creator_id,nullif(item->>'promptId','') as prompt_id
    from jsonb_array_elements(case when jsonb_typeof(targets_value)='array' then targets_value else '[]'::jsonb end) with ordinality as source(item,position)
    where position<=80
  )
  select t.creator_id,t.prompt_id,
    (select count(*) from public.mind_follows f where f.target_id=t.creator_id),
    (select count(*) from public.mind_follows f where f.actor_id=t.creator_id),
    (select count(*) from public.mind_likes l where l.creator_id=t.creator_id and l.prompt_id=t.prompt_id),
    exists(select 1 from public.mind_follows f where f.actor_id=actor_value and f.target_id=t.creator_id),
    exists(select 1 from public.mind_likes l where l.actor_id=actor_value and l.creator_id=t.creator_id and l.prompt_id=t.prompt_id)
  from targets t where exists(select 1 from public.mind_creators c where c.public_id=t.creator_id) or exists(select 1 from public.mind_creator_directory c where c.public_id=t.creator_id);
$$;
revoke all on function public.mind_social_snapshot(jsonb,text) from public;
grant execute on function public.mind_social_snapshot(jsonb,text) to anon,authenticated;
