create table public.mind_comments (
 id uuid primary key,
 actor_id text not null,
 creator_id text not null,
 prompt_id text not null,
 body text not null check(char_length(btrim(body)) between 1 and 1500),
 created_at timestamptz not null default now()
);
create index mind_comments_prompt_idx on public.mind_comments(creator_id,prompt_id,created_at desc,id desc);
create index mind_comments_actor_idx on public.mind_comments(actor_id,created_at desc);
alter table public.mind_comments enable row level security;
revoke all on public.mind_comments from public,anon,authenticated;
grant select on public.mind_comments to anon,authenticated;
grant insert(id,actor_id,creator_id,prompt_id,body),delete on public.mind_comments to authenticated;
grant all on public.mind_comments to service_role;
create policy public_prompt_comments on public.mind_comments for select to anon,authenticated using(
 exists(select 1 from public.mind_public_prompts p where p.creator_id=mind_comments.creator_id and p.prompt_id=mind_comments.prompt_id)
 or exists(select 1 from public.mind_directory_prompts p where p.creator_id=mind_comments.creator_id and p.prompt_id=mind_comments.prompt_id)
);
create policy own_comment_insert on public.mind_comments for insert to authenticated with check(
 actor_id=(select public_id from public.mind_accounts where id=(select auth.uid()))
 and exists(select 1 from public.mind_usernames u where u.public_id=actor_id)
 and (exists(select 1 from public.mind_public_prompts p where p.creator_id=mind_comments.creator_id and p.prompt_id=mind_comments.prompt_id)
 or exists(select 1 from public.mind_directory_prompts p where p.creator_id=mind_comments.creator_id and p.prompt_id=mind_comments.prompt_id))
);
create policy own_comment_delete on public.mind_comments for delete to authenticated using(
 (select public_id from public.mind_accounts where id=(select auth.uid())) in (actor_id,creator_id)
);
create policy require_comment_mfa_insert on public.mind_comments as restrictive for insert to authenticated with check((select mind_security.mfa_satisfied()));
create policy require_comment_mfa_delete on public.mind_comments as restrictive for delete to authenticated using((select mind_security.mfa_satisfied()));
create function mind_security.limit_comments() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(new.actor_id,0));
 if (select count(*) from public.mind_comments where actor_id=new.actor_id and created_at>now()-interval '1 minute')>=10 then raise exception 'Aguarde um minuto antes de enviar mais comentários.';end if;
 return new;
end $$;
revoke all on function mind_security.limit_comments() from public,anon,authenticated;
create trigger mind_comment_rate before insert on public.mind_comments for each row execute function mind_security.limit_comments();
create function public.mind_read_comments(creator_value text,prompt_value text,before_time timestamptz default null,before_id uuid default null)
returns table(id uuid,actor_id text,body text,created_at timestamptz,author_name text,avatar_url text,username text,badges text[])
language sql stable security invoker set search_path='' as $$
 select c.id,c.actor_id,c.body,c.created_at,coalesce(n.profile->>'name',d.profile->>'name','Criador Mind'),coalesce(n.profile->>'avatarUrl',d.profile->>'avatarUrl',''),u.username,coalesce(b.badges,d.badges,'{}'::text[])
 from public.mind_comments c left join public.mind_creators n on n.public_id=c.actor_id left join public.mind_creator_directory d on d.public_id=c.actor_id left join public.mind_usernames u on u.public_id=c.actor_id left join public.mind_badges b on b.public_id=c.actor_id
 where c.creator_id=creator_value and c.prompt_id=prompt_value and (before_time is null or (c.created_at,c.id)<(before_time,before_id))
 order by c.created_at desc,c.id desc limit 21;
$$;
revoke all on function public.mind_read_comments(text,text,timestamptz,uuid) from public;
grant execute on function public.mind_read_comments(text,text,timestamptz,uuid) to anon,authenticated;
create function public.mind_write_legacy_comment(actor_value text,target_value text,prompt_value text,id_value uuid,body_value text,delete_value boolean) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.mind_accounts where public_id=actor_value) then raise exception 'Sua conta já foi migrada. Entre novamente.';end if;
 if delete_value then delete from public.mind_comments where id=id_value and creator_id=target_value and prompt_id=prompt_value and actor_value in(actor_id,creator_id);return;end if;
 if not exists(select 1 from public.mind_usernames where public_id=actor_value) then raise exception 'Escolha seu @ para comentar.';end if;
 if not exists(select 1 from public.mind_public_prompts where creator_id=target_value and prompt_id=prompt_value) and not exists(select 1 from public.mind_directory_prompts where creator_id=target_value and prompt_id=prompt_value) then raise exception 'Este prompt não está público.';end if;
 insert into public.mind_comments(id,actor_id,creator_id,prompt_id,body) values(id_value,actor_value,target_value,prompt_value,btrim(body_value)) on conflict do nothing;
end $$;
revoke all on function public.mind_write_legacy_comment(text,text,text,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.mind_write_legacy_comment(text,text,text,uuid,text,boolean) to service_role;

-- Private uploads become readable to guests only while referenced by a published prompt.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('mind-prompt-videos','mind-prompt-videos',false,31457280,array['video/mp4','video/webm']);
create policy mind_video_read_public on storage.objects for select to anon,authenticated using(bucket_id='mind-prompt-videos' and (
 exists(select 1 from public.mind_public_prompts p where p.document->>'videoPath'=name)
 or exists(select 1 from public.mind_directory_prompts p where p.document->>'videoPath'=name)
));
create policy mind_video_read_own on storage.objects for select to authenticated using(bucket_id='mind-prompt-videos' and (storage.foldername(name))[1]=(select public_id from public.mind_accounts where id=(select auth.uid())) and (select mind_security.mfa_satisfied()));

alter table public.mind_directory_prompts drop constraint mind_directory_prompts_document_check;
alter table public.mind_directory_prompts add constraint mind_directory_prompts_document_check check(
 jsonb_typeof(document)='object'
 and (document-array['title','content','description','category','model','images','createdAt','updatedAt','kind','summary','videoUrl','videoPath','siteUrl'])='{}'::jsonb
 and char_length(document->>'title') between 1 and 120 and char_length(document->>'content') between 1 and 20000
 and jsonb_typeof(document->'images')='array' and jsonb_array_length(document->'images')<=8
 and octet_length(document::text)<=900000
 and coalesce(document->>'kind','image') in('image','website','video')
 and char_length(coalesce(document->>'summary',''))<=180
 and char_length(coalesce(document->>'videoUrl',''))<=2048
 and char_length(coalesce(document->>'siteUrl',''))<=2048
 and char_length(coalesce(document->>'videoPath',''))<=180
);

-- A publication must never turn another creator's private upload into a public file.
do $$ declare t text;begin
 foreach t in array array['mind_prompts','mind_public_prompts'] loop
  execute format('create policy own_video_insert on public.%I as restrictive for insert to authenticated with check(coalesce(document->>''videoPath'','''')='''' or split_part(document->>''videoPath'',''/'',1)=(select public_id from public.mind_accounts where id=(select auth.uid())))',t);
  execute format('create policy own_video_update on public.%I as restrictive for update to authenticated using(true) with check(coalesce(document->>''videoPath'','''')='''' or split_part(document->>''videoPath'',''/'',1)=(select public_id from public.mind_accounts where id=(select auth.uid())))',t);
 end loop;
end $$;
