-- High-quality profile media is stored as files, not aggressively compressed JSON data URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('mind-profile-images','mind-profile-images',true,8388608,array['image/webp','image/gif'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy mind_profile_images_public_read on storage.objects for select to anon,authenticated
using(bucket_id='mind-profile-images');
-- No client write policy: uploads pass through a verified, MFA-aware server session.

create function mind_billing.guard_profile_animation() returns trigger
language plpgsql security definer set search_path='' as $$
declare field text; old_url text; new_url text;
begin
 foreach field in array array['avatarUrl','bannerUrl'] loop
  new_url:=coalesce(new.profile->>field,'');
  old_url:='';
  if tg_op='UPDATE' then old_url:=coalesce(old.profile->>field,'');end if;
  if new_url is distinct from old_url and new_url ~* '\.gif([?#].*)?$' then
   if mind_billing.effective_plan(new.public_id) not in('plus','premium') then
    raise exception 'GIFs estão disponíveis nos planos Plus e Premium.';
   end if;
  end if;
 end loop;
 return new;
end $$;
revoke all on function mind_billing.guard_profile_animation() from public,anon,authenticated;
grant execute on function mind_billing.guard_profile_animation() to service_role;
create trigger mind_native_profile_animation before insert or update of profile on public.mind_creators
for each row execute function mind_billing.guard_profile_animation();
create trigger mind_directory_profile_animation before insert or update of profile on public.mind_creator_directory
for each row execute function mind_billing.guard_profile_animation();
