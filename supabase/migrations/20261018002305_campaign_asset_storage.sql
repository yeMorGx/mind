insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mind-campaign-assets',
  'mind-campaign-assets',
  true,
  31457280,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists mind_campaign_assets_public_read on storage.objects;
create policy mind_campaign_assets_public_read
on storage.objects for select to anon, authenticated
using (bucket_id = 'mind-campaign-assets');
