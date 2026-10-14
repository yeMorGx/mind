-- Active accounts are released only by an administrator-approved mapping and
-- a confirmed Supabase identity. Source JSON metadata cannot grant access.
create table mind_migration.account_claims (
  firebase_uid text primary key,
  expected_email text not null unique check (expected_email = lower(expected_email)),
  import_checksum text not null references mind_migration.firebase_imports(checksum),
  is_owner boolean not null default false,
  claimed_by uuid unique references auth.users(id),
  claimed_at timestamptz
);
alter table mind_migration.account_claims enable row level security;
revoke all on mind_migration.account_claims from public, anon, authenticated;

create table public.mind_accounts (
  id uuid primary key references auth.users(id),
  public_id text not null unique,
  onboarding jsonb not null,
  creator_profile jsonb not null,
  badge_admin boolean not null default false
);
create table public.mind_creators (
  public_id text primary key references public.mind_accounts(public_id),
  owner_id uuid not null unique references public.mind_accounts(id),
  profile jsonb not null check (jsonb_typeof(profile) = 'object'
    and (profile - array['name','bio','headline','avatarUrl','bannerUrl']) = '{}'::jsonb
    and jsonb_typeof(profile->'name')='string'
    and char_length(profile->>'name') between 1 and 80
    and char_length(coalesce(profile->>'bio','')) <= 1000
    and char_length(coalesce(profile->>'headline','')) <= 100
    and char_length(coalesce(profile->>'avatarUrl','')) <= 80000
    and char_length(coalesce(profile->>'bannerUrl','')) <= 80000)
);
create table public.mind_workspaces (
  id text primary key,
  owner_id uuid not null references public.mind_accounts(id),
  document jsonb not null,
  unique(id,owner_id)
);
create table public.mind_prompts (
  workspace_id text not null,
  id text not null,
  owner_id uuid not null references public.mind_accounts(id),
  document jsonb not null,
  primary key(workspace_id,id),
  foreign key(workspace_id,owner_id) references public.mind_workspaces(id,owner_id),
  unique(workspace_id,id,owner_id)
);
create table public.mind_public_prompts (
  creator_id text not null references public.mind_creators(public_id),
  prompt_id text not null,
  workspace_id text not null,
  owner_id uuid not null references public.mind_accounts(id),
  document jsonb not null,
  primary key(creator_id,prompt_id),
  foreign key(workspace_id,prompt_id,owner_id) references public.mind_prompts(workspace_id,id,owner_id) on delete cascade
);
create table public.mind_badges (
  public_id text primary key references public.mind_creators(public_id),
  badges text[] not null default '{}'
);
create index mind_prompts_owner_idx on public.mind_prompts(owner_id);
create index mind_workspaces_owner_idx on public.mind_workspaces(owner_id);
create index mind_public_prompts_owner_idx on public.mind_public_prompts(owner_id);

alter table public.mind_accounts enable row level security;
alter table public.mind_creators enable row level security;
alter table public.mind_workspaces enable row level security;
alter table public.mind_prompts enable row level security;
alter table public.mind_public_prompts enable row level security;
alter table public.mind_badges enable row level security;
revoke all on public.mind_accounts,public.mind_creators,public.mind_workspaces,public.mind_prompts,public.mind_public_prompts,public.mind_badges from public,anon,authenticated;
grant select on public.mind_accounts to authenticated;
grant update(onboarding,creator_profile) on public.mind_accounts to authenticated;
grant select on public.mind_creators,public.mind_public_prompts,public.mind_badges to anon,authenticated;
grant update(profile) on public.mind_creators to authenticated;
grant select,insert,delete on public.mind_workspaces,public.mind_prompts to authenticated;
grant update(document) on public.mind_workspaces,public.mind_prompts to authenticated;
grant insert,update,delete on public.mind_public_prompts,public.mind_badges to authenticated;

create policy own_account on public.mind_accounts for select to authenticated using(id=(select auth.uid()));
create policy edit_own_account on public.mind_accounts for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy public_creators on public.mind_creators for select to anon,authenticated using(true);
create policy edit_creator on public.mind_creators for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy own_workspace on public.mind_workspaces for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy own_prompts on public.mind_prompts for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy public_prompts on public.mind_public_prompts for select to anon,authenticated using(true);
create policy edit_public_prompt on public.mind_public_prompts for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()) and creator_id=(select public_id from public.mind_accounts where id=(select auth.uid())));
create policy public_badges on public.mind_badges for select to anon,authenticated using(true);
create policy admin_badges on public.mind_badges for all to authenticated
  using(coalesce((select badge_admin from public.mind_accounts where id=(select auth.uid())),false) and not ('owner'=any(badges)))
  with check(coalesce((select badge_admin from public.mind_accounts where id=(select auth.uid())),false) and cardinality(badges)<=4 and badges<@array['verified','moderator','creator','partner']);

create function mind_migration.claim_account(expected_public_id text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  account public.mind_accounts;
  approval mind_migration.account_claims;
  identity_email text;
  backup jsonb;
  source_profile jsonb;
  creator jsonb;
  source_prompt jsonb;
begin
  if auth.uid() is null then raise exception 'Entre na conta para concluir a migração.'; end if;
  select * into account from public.mind_accounts where id=auth.uid();
  if found then
    if expected_public_id is not null and expected_public_id<>account.public_id then raise exception 'Entre com a mesma conta Google usada no Mind.'; end if;
    return to_jsonb(account);
  end if;
  select lower(email) into identity_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
  if identity_email is null then raise exception 'Confirme sua identidade antes de migrar.'; end if;
  select * into approval from mind_migration.account_claims where expected_email=identity_email for update;
  if not found or expected_public_id is null or approval.firebase_uid<>expected_public_id then raise exception 'Não há uma migração autorizada para esta conta. Entre com a conta original do backup.'; end if;
  if approval.claimed_by is not null and approval.claimed_by<>auth.uid() then raise exception 'Esta migração já está vinculada a outra conta.'; end if;
  select convert_from(raw_payload,'UTF8')::jsonb into backup from mind_migration.firebase_imports where checksum=approval.import_checksum and firebase_uid=approval.firebase_uid;
  if backup is null then raise exception 'Backup de origem não encontrado.'; end if;
  source_profile:=backup->'profile';
  creator:=jsonb_build_object('name',coalesce(nullif(source_profile->'creatorProfile'->>'name',''),nullif(source_profile->>'name',''),'Criador Mind'),
    'bio',coalesce(source_profile->'creatorProfile'->>'bio',''),'headline',coalesce(source_profile->'creatorProfile'->>'headline',''),
    'avatarUrl',coalesce(source_profile->'creatorProfile'->>'avatarUrl',''),'bannerUrl',coalesce(source_profile->'creatorProfile'->>'bannerUrl',''));
  insert into public.mind_accounts values(auth.uid(),approval.firebase_uid,source_profile,creator,approval.is_owner) returning * into account;
  insert into public.mind_creators values(account.public_id,account.id,creator);
  if jsonb_typeof(backup->'workspace')='object' then
    insert into public.mind_workspaces values(backup->'workspace'->>'id',account.id,backup->'workspace'->'data');
    for source_prompt in select value from jsonb_array_elements(backup->'prompts') loop
      insert into public.mind_prompts values(backup->'workspace'->>'id',source_prompt->>'id',account.id,source_prompt->'data');
      if source_prompt->'data'->>'isPublished'='true' then
        insert into public.mind_public_prompts values(account.public_id,source_prompt->>'id',backup->'workspace'->>'id',account.id,
          source_prompt->'data'-array['createdBy','isFavorite','isPublished']);
      end if;
    end loop;
  end if;
  if approval.is_owner then insert into public.mind_badges values(account.public_id,array['owner','verified']); end if;
  update mind_migration.account_claims set claimed_by=account.id,claimed_at=now() where firebase_uid=account.public_id;
  return to_jsonb(account);
end $$;
revoke all on function mind_migration.claim_account(text) from public,anon,authenticated;
grant usage on schema mind_migration to authenticated;
grant execute on function mind_migration.claim_account(text) to authenticated;
create function public.mind_bootstrap_account(expected_public_id text default null)
returns jsonb language sql security invoker set search_path='' as $$ select mind_migration.claim_account(expected_public_id) $$;
revoke all on function public.mind_bootstrap_account(text) from public,anon,authenticated;
grant execute on function public.mind_bootstrap_account(text) to authenticated;

create function public.mind_save_profile(profile_values jsonb) returns void
language plpgsql security invoker set search_path='' as $$
begin
  update public.mind_accounts set creator_profile=profile_values where id=auth.uid();
  if not found then raise exception 'Conta não encontrada.'; end if;
  update public.mind_creators set profile=profile_values where owner_id=auth.uid();
end $$;

create function public.mind_save_prompt(workspace text,prompt text,values_json jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare account_public_id text;
begin
  select public_id into account_public_id from public.mind_accounts where id=auth.uid();
  if account_public_id is null then raise exception 'Entre novamente na conta.'; end if;
  update public.mind_prompts set document=values_json where workspace_id=workspace and id=prompt and owner_id=auth.uid();
  if not found then raise exception 'Prompt não encontrado.'; end if;
  if values_json->>'isPublished'='true' then
    insert into public.mind_public_prompts values(account_public_id,prompt,workspace,auth.uid(),values_json-array['createdBy','isFavorite','isPublished'])
    on conflict(creator_id,prompt_id) do update set document=excluded.document;
  else
    delete from public.mind_public_prompts where creator_id=account_public_id and prompt_id=prompt;
  end if;
end $$;
revoke all on function public.mind_save_profile(jsonb),public.mind_save_prompt(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.mind_save_profile(jsonb),public.mind_save_prompt(text,text,jsonb) to authenticated;
