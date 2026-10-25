alter table public.mind_directory_prompts drop constraint mind_directory_prompts_document_check;
alter table public.mind_directory_prompts add constraint mind_directory_prompts_document_check check(
  jsonb_typeof(document)='object'
  and (document-array['title','content','description','category','model','images','createdAt','updatedAt','kind','summary','videoUrl','videoPath','siteUrl','coverMode','coverImageId'])='{}'::jsonb
  and char_length(document->>'title') between 1 and 120
  and char_length(document->>'content') between 1 and 20000
  and jsonb_typeof(document->'images')='array'
  and jsonb_array_length(document->'images')<=8
  and octet_length(document::text)<=900000
  and coalesce(document->>'kind','image') in('image','website','video')
  and char_length(coalesce(document->>'summary',''))<=180
  and char_length(coalesce(document->>'videoUrl',''))<=2048
  and char_length(coalesce(document->>'siteUrl',''))<=2048
  and char_length(coalesce(document->>'videoPath',''))<=180
  and coalesce(document->>'coverMode','auto') in('auto','image','compare')
  and char_length(coalesce(document->>'coverImageId',''))<=128
);
