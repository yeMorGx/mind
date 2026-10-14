create index account_claims_import_idx on mind_migration.account_claims(import_checksum);
create index mind_prompts_workspace_owner_idx on public.mind_prompts(workspace_id,owner_id);
create index mind_public_prompts_source_idx on public.mind_public_prompts(workspace_id,prompt_id,owner_id);

drop policy edit_public_prompt on public.mind_public_prompts;
create policy insert_public_prompt on public.mind_public_prompts for insert to authenticated
  with check(owner_id=(select auth.uid()) and creator_id=(select public_id from public.mind_accounts where id=(select auth.uid())));
create policy update_public_prompt on public.mind_public_prompts for update to authenticated
  using(owner_id=(select auth.uid()))
  with check(owner_id=(select auth.uid()) and creator_id=(select public_id from public.mind_accounts where id=(select auth.uid())));
create policy delete_public_prompt on public.mind_public_prompts for delete to authenticated using(owner_id=(select auth.uid()));

drop policy admin_badges on public.mind_badges;
create policy insert_badges on public.mind_badges for insert to authenticated
  with check(coalesce((select badge_admin from public.mind_accounts where id=(select auth.uid())),false) and cardinality(badges)<=4 and badges<@array['verified','moderator','creator','partner']);
create policy update_badges on public.mind_badges for update to authenticated
  using(coalesce((select badge_admin from public.mind_accounts where id=(select auth.uid())),false) and not ('owner'=any(badges)))
  with check(coalesce((select badge_admin from public.mind_accounts where id=(select auth.uid())),false) and cardinality(badges)<=4 and badges<@array['verified','moderator','creator','partner']);
create policy delete_badges on public.mind_badges for delete to authenticated
  using(coalesce((select badge_admin from public.mind_accounts where id=(select auth.uid())),false) and not ('owner'=any(badges)));

alter table public.mind_accounts add constraint mind_onboarding_object check(jsonb_typeof(onboarding)='object');
alter table public.mind_accounts add constraint mind_private_profile_object check(jsonb_typeof(creator_profile)='object');
alter table public.mind_workspaces add constraint mind_workspace_object check(jsonb_typeof(document)='object');
alter table public.mind_prompts add constraint mind_prompt_object check(jsonb_typeof(document)='object');
alter table public.mind_public_prompts add constraint mind_public_prompt_object check(jsonb_typeof(document)='object');
