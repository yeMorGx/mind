-- Owner chose Stripe + Supabase without changing Firebase.
-- Protection here covers Supabase snapshots; no legacy Firebase protection is claimed.
create or replace function mind_billing.refresh_access() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.enabled is distinct from old.enabled then
  update public.mind_public_prompts set document=document;
  update public.mind_directory_prompts set document=document;
 end if;
 return new;
end $$;

revoke all on function mind_billing.refresh_access() from public, anon, authenticated;
grant execute on function mind_billing.refresh_access() to service_role;

comment on column public.mind_billing_settings.legacy_rules_confirmed is
 'Legacy historical flag. Supabase-only rollout does not require or set it; Firebase is outside this rollout.';
