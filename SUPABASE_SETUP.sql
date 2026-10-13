-- Mind: schema for creator profiles, shareable prompts and private image uploads.
-- Run once in the Supabase SQL Editor before deploying the app.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  name text not null default '',
  role text not null default '',
  source text not null default '',
  usage_type text not null default '' check (usage_type in ('', 'individual', 'team')),
  team_name text not null default '',
  team_size text not null default '',
  invited_emails jsonb not null default '[]'::jsonb,
  creator_name text not null default '',
  creator_icon text not null default '🧠',
  creator_slug text not null default '',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_creator_slug_unique
  on public.profiles (creator_slug)
  where creator_slug <> '';

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users (id) on delete cascade,
  creator_name text not null,
  creator_slug text not null,
  slug text not null unique,
  title text not null,
  content text not null,
  description text not null default '',
  category text not null default '',
  model text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prompts_title_length check (char_length(title) between 1 and 120),
  constraint prompts_content_length check (char_length(content) between 1 and 20000)
);

create index if not exists prompts_creator_updated_idx
  on public.prompts (creator_id, updated_at desc);
create index if not exists prompts_public_feed_idx
  on public.prompts (created_at desc)
  where status = 'published';

create or replace function public.require_prompt_result_image()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and not exists (
    select 1 from public.prompt_images i
    where i.prompt_id = new.id and i.role in ('gallery', 'after')
  ) then
    raise exception 'Adicione uma imagem de resultado antes de publicar o prompt.';
  end if;
  return new;
end;
$$;

drop trigger if exists prompts_require_result_image on public.prompts;
create trigger prompts_require_result_image
  before insert or update of status on public.prompts
  for each row execute function public.require_prompt_result_image();

create table if not exists public.prompt_images (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  creator_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  role text not null check (role in ('gallery', 'reference', 'before', 'after')),
  position integer not null default 0 check (position >= 0),
  label text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists prompt_images_prompt_position_idx
  on public.prompt_images (prompt_id, position);

create table if not exists public.prompt_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, prompt_id)
);

alter table public.profiles enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_images enable row level security;
alter table public.prompt_favorites enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.prompts, public.prompt_images to anon, authenticated;
grant insert, update, delete on public.prompts, public.prompt_images to authenticated;
grant select, insert, delete on public.prompt_favorites to authenticated;

drop policy if exists "Users read their own profile" on public.profiles;
create policy "Users read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users create their own profile" on public.profiles;
create policy "Users create their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users delete their own profile" on public.profiles;
create policy "Users delete their own profile"
  on public.profiles for delete to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Published prompts are public and creators read their own" on public.prompts;
create policy "Published prompts are public and creators read their own"
  on public.prompts for select to anon, authenticated
  using (status = 'published' or creator_id = (select auth.uid()));

drop policy if exists "Creators publish their own prompts" on public.prompts;
create policy "Creators publish their own prompts"
  on public.prompts for insert to authenticated
  with check (creator_id = (select auth.uid()) and status = 'draft');

drop policy if exists "Creators edit their own prompts" on public.prompts;
create policy "Creators edit their own prompts"
  on public.prompts for update to authenticated
  using (creator_id = (select auth.uid()))
  with check (creator_id = (select auth.uid()));

drop policy if exists "Creators delete their own prompts" on public.prompts;
create policy "Creators delete their own prompts"
  on public.prompts for delete to authenticated
  using (creator_id = (select auth.uid()));

drop policy if exists "Published prompt images and owner images are readable" on public.prompt_images;
create policy "Published prompt images and owner images are readable"
  on public.prompt_images for select to anon, authenticated
  using (
    creator_id = (select auth.uid())
    or exists (
      select 1 from public.prompts p
      where p.id = prompt_images.prompt_id and p.status = 'published'
    )
  );

drop policy if exists "Creators add images to their prompts" on public.prompt_images;
create policy "Creators add images to their prompts"
  on public.prompt_images for insert to authenticated
  with check (
    creator_id = (select auth.uid())
    and exists (
      select 1 from public.prompts p
      where p.id = prompt_images.prompt_id and p.creator_id = (select auth.uid())
    )
  );

drop policy if exists "Creators update their prompt images" on public.prompt_images;
create policy "Creators update their prompt images"
  on public.prompt_images for update to authenticated
  using (creator_id = (select auth.uid()))
  with check (
    creator_id = (select auth.uid())
    and exists (
      select 1 from public.prompts p
      where p.id = prompt_images.prompt_id and p.creator_id = (select auth.uid())
    )
  );

drop policy if exists "Creators remove their prompt images" on public.prompt_images;
create policy "Creators remove their prompt images"
  on public.prompt_images for delete to authenticated
  using (creator_id = (select auth.uid()));

drop policy if exists "Users read their own favorites" on public.prompt_favorites;
create policy "Users read their own favorites"
  on public.prompt_favorites for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users favorite visible prompts" on public.prompt_favorites;
create policy "Users favorite visible prompts"
  on public.prompt_favorites for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.prompts p
      where p.id = prompt_id
        and (p.status = 'published' or p.creator_id = (select auth.uid()))
    )
  );

drop policy if exists "Users remove their own favorites" on public.prompt_favorites;
create policy "Users remove their own favorites"
  on public.prompt_favorites for delete to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prompt-images',
  'prompt-images',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Creators upload their own prompt images" on storage.objects;
create policy "Creators upload their own prompt images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'prompt-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Owners and published prompts can sign images" on storage.objects;
create policy "Owners and published prompts can sign images"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'prompt-images'
    and exists (
      select 1
      from public.prompt_images i
      join public.prompts p on p.id = i.prompt_id
      where i.storage_path = storage.objects.name
        and (p.status = 'published' or p.creator_id = (select auth.uid()))
    )
  );

drop policy if exists "Creators delete their own prompt image files" on storage.objects;
create policy "Creators delete their own prompt image files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'prompt-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
