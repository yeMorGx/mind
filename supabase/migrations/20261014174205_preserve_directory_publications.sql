create or replace function mind_migration.claim_account(expected_public_id text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  account public.mind_accounts;
  approval mind_migration.account_claims;
  identity_email text;
  backup jsonb;
  source_profile jsonb;
  creator jsonb;
  source_prompt jsonb;
  publication public.mind_directory_prompts;
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
  -- Keep profile edits made after the backup, without changing ownership or roles.
  creator := coalesce((select profile from public.mind_creator_directory where public_id=approval.firebase_uid), creator);
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
  -- Publications made through the Firebase bridge after the backup remain
  -- available after the owner confirms migration. Transfer, then remove the
  -- bridge snapshots in this same transaction so native unpublish has one target.
  for publication in select * from public.mind_directory_prompts where creator_id=account.public_id loop
    if exists(select 1 from public.mind_workspaces where id=publication.workspace_id and owner_id=account.id) then
      insert into public.mind_prompts values(publication.workspace_id,publication.prompt_id,account.id,
        publication.document || jsonb_build_object('createdBy',account.public_id,'isFavorite',false,'isPublished',true))
      on conflict(workspace_id,id) do update set document=public.mind_prompts.document || publication.document || jsonb_build_object('isPublished',true);
      insert into public.mind_public_prompts values(account.public_id,publication.prompt_id,publication.workspace_id,account.id,publication.document)
      on conflict(creator_id,prompt_id) do update set document=excluded.document;
    else
      raise exception 'Biblioteca publicada não encontrada no backup. Atualize o backup antes de migrar.';
    end if;
  end loop;
  delete from public.mind_directory_prompts where creator_id=account.public_id;
  if approval.is_owner then insert into public.mind_badges values(account.public_id,array['owner','verified']); end if;
  update mind_migration.account_claims set claimed_by=account.id,claimed_at=now() where firebase_uid=account.public_id;
  return to_jsonb(account);
end $$;
revoke all on function mind_migration.claim_account(text) from public,anon,authenticated;
grant usage on schema mind_migration to authenticated;
grant execute on function mind_migration.claim_account(text) to authenticated;
