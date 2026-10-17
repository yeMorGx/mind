-- Standalone Markdown publications and MCP directory. Existing prompts are untouched.
create function public.mind_valid_resource(value jsonb, kind_value text, published boolean) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare field text; args_value jsonb; config_value jsonb;
begin
 if jsonb_typeof(value) is distinct from 'object' or octet_length(value::text)>250000 then return false; end if;
 if (value-array['title','summary','category','coverUrl','description','instructions','license','credits','fileName','content','clients','developer','website','repository','documentation','transport','remoteUrl','command','args','config','authentication','permissions','pricing'])<>'{}'::jsonb then return false;end if;
 foreach field in array array['title','summary','category','coverUrl','description','instructions','license','credits','fileName','content','developer','website','repository','documentation','transport','remoteUrl','command','args','config','authentication','permissions','pricing'] loop
  if jsonb_typeof(value->field) is distinct from 'string' then return false;end if;
 end loop;
 if char_length(btrim(value->>'title')) not between 1 and 120 or char_length(value->>'summary')>180 or char_length(value->>'category')>80 or char_length(value->>'description')>5000 or char_length(value->>'instructions')>5000 or char_length(value->>'content')>100000 or char_length(value->>'fileName')>80 or char_length(value->>'config')>10000 or char_length(value->>'command')>500 or char_length(value->>'args')>5000 then return false;end if;
 foreach field in array array['license','credits','developer','authentication','permissions','pricing'] loop
  if char_length(value->>field)>1000 then return false;end if;
 end loop;
 foreach field in array array['website','repository','documentation','remoteUrl'] loop
  if value->>field<>'' and ((value->>field)!~ '^https://[^/@[:space:]]+([/?#]|$)' or char_length(value->>field)>2048) then return false;end if;
 end loop;
 if char_length(value->>'coverUrl')>80000 or (value->>'coverUrl'<>'' and value->>'coverUrl' !~ '^https://[^/@[:space:]]+([/?#]|$)' and value->>'coverUrl' !~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$') then return false;end if;
 if jsonb_typeof(value->'clients') is distinct from 'array' then return false;end if;
 if jsonb_array_length(value->'clients')>9 or exists(select 1 from jsonb_array_elements(value->'clients') item where jsonb_typeof(item)<>'string' or item#>>'{}' not in('Claude','Claude Code','ChatGPT','Codex','Cursor','Gemini CLI','VS Code','Windsurf','Outro')) then return false;end if;
 if kind_value='markdown' then
  if value->>'fileName' !~* '^[[:alnum:]_. -]{1,76}\.md$' or char_length(btrim(value->>'content'))=0 then return false;end if;
 elsif kind_value='mcp' then
  if value->>'transport' not in('remote','stdio') then return false;end if;
  if value->>'args'<>'' then
   args_value:=(value->>'args')::jsonb;
   if jsonb_typeof(args_value)<>'array' then return false;end if;
   if exists(select 1 from jsonb_array_elements(args_value) item where jsonb_typeof(item)<>'string') then return false;end if;
  end if;
  if value->>'config'<>'' then config_value:=(value->>'config')::jsonb;if jsonb_typeof(config_value)<>'object' then return false;end if;end if;
  if published and (btrim(value->>'developer')='' or btrim(value->>'website')='' or btrim(value->>'documentation')='' or (value->>'config'='' and ((value->>'transport'='remote' and value->>'remoteUrl'='') or (value->>'transport'='stdio' and btrim(value->>'command')='')))) then return false;end if;
 else return false;end if;
 if published and (btrim(value->>'summary')='' or btrim(value->>'category')='' or btrim(value->>'instructions')='' or btrim(value->>'license')='') then return false;end if;
 return true;
exception when others then return false;
end $$;
revoke all on function public.mind_valid_resource(jsonb,text,boolean) from public;
grant execute on function public.mind_valid_resource(jsonb,text,boolean) to anon,authenticated,service_role;

create table public.mind_resources(
 id uuid primary key,
 creator_id text not null,
 kind text not null check(kind in('markdown','mcp')),
 status text not null default 'draft' check(status in('draft','published')),
 document jsonb not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint mind_resource_document_valid check(public.mind_valid_resource(document,kind,status='published'))
);
create index mind_resources_creator_idx on public.mind_resources(creator_id,kind,created_at desc);
create index mind_resources_public_idx on public.mind_resources(kind,created_at desc) where status='published';
alter table public.mind_resources enable row level security;
revoke all on public.mind_resources from public,anon,authenticated;
grant select on public.mind_resources to anon,authenticated;
grant insert(id,creator_id,kind,status,document),update(status,document),delete on public.mind_resources to authenticated;
grant all on public.mind_resources to service_role;
create policy resource_public_read on public.mind_resources for select to anon,authenticated using(status='published');
create policy resource_owner_read on public.mind_resources for select to authenticated using(creator_id=(select public_id from public.mind_accounts where id=(select auth.uid())) and (select mind_security.mfa_satisfied()));
create policy resource_owner_insert on public.mind_resources for insert to authenticated with check(creator_id=(select public_id from public.mind_accounts where id=(select auth.uid())) and (select mind_security.mfa_satisfied()) and exists(select 1 from public.mind_usernames u where u.public_id=creator_id));
create policy resource_owner_update on public.mind_resources for update to authenticated using(creator_id=(select public_id from public.mind_accounts where id=(select auth.uid())) and (select mind_security.mfa_satisfied())) with check(creator_id=(select public_id from public.mind_accounts where id=(select auth.uid())) and (select mind_security.mfa_satisfied()) and exists(select 1 from public.mind_usernames u where u.public_id=creator_id));
create policy resource_owner_delete on public.mind_resources for delete to authenticated using(creator_id=(select public_id from public.mind_accounts where id=(select auth.uid())) and (select mind_security.mfa_satisfied()));

create function mind_security.stamp_resource() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='UPDATE' and (new.id<>old.id or new.creator_id<>old.creator_id or new.kind<>old.kind or new.created_at<>old.created_at) then raise exception 'A identidade da publicação não pode ser alterada.';end if;
 new.updated_at:=clock_timestamp();return new;
end $$;
revoke all on function mind_security.stamp_resource() from public,anon,authenticated;
create trigger mind_resource_stamp before insert or update on public.mind_resources for each row execute function mind_security.stamp_resource();

create table public.mind_resource_favorites(
 actor_id text not null,
 resource_id uuid not null references public.mind_resources(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(actor_id,resource_id)
);
create index mind_resource_favorites_resource_idx on public.mind_resource_favorites(resource_id);
alter table public.mind_resource_favorites enable row level security;
revoke all on public.mind_resource_favorites from public,anon,authenticated;
grant select,delete on public.mind_resource_favorites to authenticated;
grant insert(actor_id,resource_id) on public.mind_resource_favorites to authenticated;
grant all on public.mind_resource_favorites to service_role;
create policy resource_favorite_read on public.mind_resource_favorites for select to authenticated using(actor_id=(select public_id from public.mind_accounts where id=(select auth.uid())) and (select mind_security.mfa_satisfied()));
create policy resource_favorite_insert on public.mind_resource_favorites for insert to authenticated with check(actor_id=(select public_id from public.mind_accounts where id=(select auth.uid())) and (select mind_security.mfa_satisfied()) and exists(select 1 from public.mind_resources r where r.id=resource_id and r.status='published'));
create policy resource_favorite_delete on public.mind_resource_favorites for delete to authenticated using(actor_id=(select public_id from public.mind_accounts where id=(select auth.uid())) and (select mind_security.mfa_satisfied()));

-- Namespaced social IDs keep comments/likes separate from prompt IDs.
create function public.mind_is_public_resource(creator_value text,resource_value text) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.mind_resources where creator_id=creator_value and 'resource_'||id::text=resource_value and status='published');
$$;
revoke all on function public.mind_is_public_resource(text,text) from public;
grant execute on function public.mind_is_public_resource(text,text) to anon,authenticated,service_role;
create policy resource_like_read on public.mind_likes for select to anon,authenticated using(public.mind_is_public_resource(creator_id,prompt_id));
create policy resource_like_insert on public.mind_likes for insert to authenticated with check(actor_id=(select public_id from public.mind_accounts where id=(select auth.uid())) and exists(select 1 from public.mind_usernames u where u.public_id=actor_id) and public.mind_is_public_resource(creator_id,prompt_id));
create policy resource_comment_read on public.mind_comments for select to anon,authenticated using(public.mind_is_public_resource(creator_id,prompt_id));
create policy resource_comment_insert on public.mind_comments for insert to authenticated with check(actor_id=(select public_id from public.mind_accounts where id=(select auth.uid())) and exists(select 1 from public.mind_usernames u where u.public_id=actor_id) and public.mind_is_public_resource(creator_id,prompt_id));

-- Remove resource interactions on deletion; unpublishing only hides them via RLS.
create function mind_security.remove_resource_social() returns trigger language plpgsql security definer set search_path='' as $$
begin
 delete from public.mind_comments where creator_id=old.creator_id and prompt_id='resource_'||old.id::text;
 delete from public.mind_likes where creator_id=old.creator_id and prompt_id='resource_'||old.id::text;
 return old;
end $$;
revoke all on function mind_security.remove_resource_social() from public,anon,authenticated;
create trigger mind_resource_social_cleanup after delete on public.mind_resources for each row execute function mind_security.remove_resource_social();

create function public.mind_resource_search_vector(value jsonb) returns tsvector
language sql immutable parallel safe security invoker set search_path='' as $$
 select setweight(to_tsvector('portuguese'::regconfig,public.mind_search_normalize(value->>'title')),'A')
 || setweight(to_tsvector('portuguese'::regconfig,public.mind_search_normalize(coalesce(value->>'summary','')||' '||coalesce(value->>'category','')||' '||coalesce(value->>'fileName','')||' '||coalesce(value->>'clients','')||' '||coalesce(value->>'developer',''))),'B')
 || setweight(to_tsvector('portuguese'::regconfig,public.mind_search_normalize(coalesce(value->>'description','')||' '||coalesce(value->>'content',''))),'C');
$$;
revoke all on function public.mind_resource_search_vector(jsonb) from public;
grant execute on function public.mind_resource_search_vector(jsonb) to anon,authenticated,service_role;
create index mind_resources_search_idx on public.mind_resources using gin(public.mind_resource_search_vector(document)) where status='published';
create function public.mind_search_resources(search_term text,resource_kind text default null,result_limit integer default 24)
returns table(id uuid,kind text,title text,summary text)
language sql stable security invoker set search_path='' as $$
 with input as(select public.mind_search_normalize(left(btrim(coalesce(search_term,'')),80)) term), query as (
 select term,plainto_tsquery('portuguese'::regconfig,term) full_query,
 coalesce((select to_tsquery('portuguese'::regconfig,string_agg(quote_literal(word)||':*',' & ')) from regexp_split_to_table(term,'[^a-z0-9_]+') word where length(word)>0 and to_tsvector('portuguese'::regconfig,word)<>''::tsvector),''::tsquery) prefix_query from input where length(term)>=2
 )
 select r.id,r.kind,r.document->>'title',r.document->>'summary' from public.mind_resources r cross join query q
 where r.status='published' and (resource_kind is null or r.kind=resource_kind) and (public.mind_resource_search_vector(r.document)@@q.full_query or public.mind_resource_search_vector(r.document)@@q.prefix_query)
 order by (public.mind_search_normalize(r.document->>'title')=q.term) desc,(ts_rank(public.mind_resource_search_vector(r.document),q.full_query)+ts_rank(public.mind_resource_search_vector(r.document),q.prefix_query)) desc,r.created_at desc,r.id
 limit greatest(1,least(coalesce(result_limit,24),100));
$$;
revoke all on function public.mind_search_resources(text,text,integer) from public;
grant execute on function public.mind_search_resources(text,text,integer) to anon,authenticated;

create or replace function public.mind_set_legacy_social(actor_value text,kind_value text,target_value text,prompt_value text,active_value boolean) returns void
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
      if not exists(select 1 from public.mind_public_prompts where creator_id=target_value and prompt_id=prompt_value) and not exists(select 1 from public.mind_directory_prompts where creator_id=target_value and prompt_id=prompt_value) and not public.mind_is_public_resource(target_value,prompt_value) then raise exception 'Este prompt não está público.'; end if;
      insert into public.mind_likes(actor_id,creator_id,prompt_id) values(actor_value,target_value,prompt_value) on conflict do nothing;
    else delete from public.mind_likes where actor_id=actor_value and creator_id=target_value and prompt_id=prompt_value; end if;
  else raise exception 'Solicitação inválida.'; end if;
end $$;

create or replace function public.mind_write_legacy_comment(actor_value text,target_value text,prompt_value text,id_value uuid,body_value text,delete_value boolean) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.mind_accounts where public_id=actor_value) then raise exception 'Sua conta já foi migrada. Entre novamente.';end if;
 if delete_value then delete from public.mind_comments where id=id_value and creator_id=target_value and prompt_id=prompt_value and actor_value in(actor_id,creator_id);return;end if;
 if not exists(select 1 from public.mind_usernames where public_id=actor_value) then raise exception 'Escolha seu @ para comentar.';end if;
 if not exists(select 1 from public.mind_public_prompts where creator_id=target_value and prompt_id=prompt_value) and not exists(select 1 from public.mind_directory_prompts where creator_id=target_value and prompt_id=prompt_value) and not public.mind_is_public_resource(target_value,prompt_value) then raise exception 'Este prompt não está público.';end if;
 insert into public.mind_comments(id,actor_id,creator_id,prompt_id,body) values(id_value,actor_value,target_value,prompt_value,btrim(body_value)) on conflict do nothing;
end $$;

notify pgrst, 'reload schema';
