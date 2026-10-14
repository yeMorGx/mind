-- Only explicit publication creates a public snapshot. Private Firebase records
-- remain in Firebase and are read by the bridge with the owner's bearer token.
create table public.mind_directory_prompts (
  creator_id text not null references public.mind_creator_directory(public_id),
  prompt_id text not null,
  workspace_id text not null,
  document jsonb not null check (
    jsonb_typeof(document)='object'
    and (document-array['title','content','description','category','model','images','createdAt','updatedAt'])='{}'::jsonb
    and char_length(document->>'title') between 1 and 120
    and char_length(document->>'content') between 1 and 20000
    and jsonb_typeof(document->'images')='array'
    and jsonb_array_length(document->'images')<=8
    and octet_length(document::text)<=900000
  ),
  primary key(creator_id,prompt_id)
);
alter table public.mind_directory_prompts enable row level security;
revoke all on public.mind_directory_prompts from public,anon,authenticated;
grant select on public.mind_directory_prompts to anon,authenticated;
grant select,insert,update,delete on public.mind_directory_prompts to service_role;
create policy published_directory_prompts on public.mind_directory_prompts
  for select to anon,authenticated using(true);
