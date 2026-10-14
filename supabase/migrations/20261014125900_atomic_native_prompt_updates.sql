create or replace function public.mind_save_prompt(workspace text,prompt text,values_json jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare account_public_id text; updated_document jsonb;
begin
  select public_id into account_public_id from public.mind_accounts where id=auth.uid();
  if account_public_id is null then raise exception 'Entre novamente na conta.'; end if;
  update public.mind_prompts set document=document || values_json
    where workspace_id=workspace and id=prompt and owner_id=auth.uid()
    returning document into updated_document;
  if not found then raise exception 'Prompt não encontrado.'; end if;
  if updated_document->>'isPublished'='true' then
    insert into public.mind_public_prompts values(account_public_id,prompt,workspace,auth.uid(),updated_document-array['createdBy','isFavorite','isPublished'])
    on conflict(creator_id,prompt_id) do update set document=excluded.document;
  else
    delete from public.mind_public_prompts where creator_id=account_public_id and prompt_id=prompt;
  end if;
end $$;
revoke all on function public.mind_save_prompt(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.mind_save_prompt(text,text,jsonb) to authenticated;
