-- Public identity is independent of the account's database migration.
-- Legacy Firebase owners write only through a server that verifies their JWT.
create table public.mind_creator_directory (
  public_id text primary key,
  profile jsonb not null check (jsonb_typeof(profile)='object'
    and (profile-array['name','bio','headline','avatarUrl','bannerUrl'])='{}'::jsonb
    and jsonb_typeof(profile->'name')='string'
    and char_length(profile->>'name') between 1 and 80
    and char_length(coalesce(profile->>'bio',''))<=1000
    and char_length(coalesce(profile->>'headline',''))<=100
    and char_length(coalesce(profile->>'avatarUrl',''))<=80000
    and char_length(coalesce(profile->>'bannerUrl',''))<=80000),
  badges text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.mind_creator_directory enable row level security;
revoke all on public.mind_creator_directory from public,anon,authenticated;
grant select on public.mind_creator_directory to anon,authenticated;
grant select,insert,update,delete on public.mind_creator_directory to service_role;
create policy public_directory on public.mind_creator_directory for select to anon,authenticated using(true);
