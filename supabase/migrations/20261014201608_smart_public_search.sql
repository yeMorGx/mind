-- Ranked, accent-insensitive suggestions from public snapshots only.
create function public.mind_search_normalize(value text) returns text
language sql immutable parallel safe security invoker set search_path='' as $$
  select translate(lower(coalesce(value,'')), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn');
$$;
revoke all on function public.mind_search_normalize(text) from public;
grant execute on function public.mind_search_normalize(text) to anon,authenticated,service_role;

create function public.mind_prompt_search_vector(value jsonb) returns tsvector
language sql immutable parallel safe security invoker set search_path='' as $$
  select setweight(to_tsvector('portuguese'::regconfig,public.mind_search_normalize(value->>'title')),'A')
    || setweight(to_tsvector('portuguese'::regconfig,public.mind_search_normalize(coalesce(value->>'description','')||' '||coalesce(value->>'category','')||' '||coalesce(value->>'model',''))),'B')
    || setweight(to_tsvector('portuguese'::regconfig,public.mind_search_normalize(value->>'content')),'C');
$$;
revoke all on function public.mind_prompt_search_vector(jsonb) from public;
grant execute on function public.mind_prompt_search_vector(jsonb) to anon,authenticated,service_role;
create index mind_public_prompt_search_idx on public.mind_public_prompts using gin (public.mind_prompt_search_vector(document));
create index mind_directory_prompt_search_idx on public.mind_directory_prompts using gin (public.mind_prompt_search_vector(document));

create function public.mind_search_prompts(search_term text,result_limit integer default 8)
returns table(creator_id text,prompt_id text,title text,description text,model text,creator_name text)
language sql stable security invoker set search_path='' as $$
  with input as (
    select public.mind_search_normalize(left(btrim(coalesce(search_term,'')),80)) as term
  ), query as (
    select term,plainto_tsquery('portuguese'::regconfig,term) as full_query,
      coalesce((select to_tsquery('portuguese'::regconfig,string_agg(quote_literal(word)||':*',' & '))
        from regexp_split_to_table(term,'[^a-z0-9_]+') word
        where length(word)>0 and to_tsvector('portuguese'::regconfig,word)<>''::tsvector),''::tsquery) as prefix_query
    from input where length(term)>=2
  ), snapshots as (
    select p.creator_id,p.prompt_id,p.document,c.profile from public.mind_public_prompts p join public.mind_creators c on c.public_id=p.creator_id
    union all
    select p.creator_id,p.prompt_id,p.document,c.profile from public.mind_directory_prompts p join public.mind_creator_directory c on c.public_id=p.creator_id
  )
  select s.creator_id,s.prompt_id,coalesce(s.document->>'title',''),left(coalesce(s.document->>'description',''),160),coalesce(s.document->>'model',''),coalesce(s.profile->>'name','Criador Mind')
  from snapshots s cross join query q
  where public.mind_prompt_search_vector(s.document) @@ q.full_query or public.mind_prompt_search_vector(s.document) @@ q.prefix_query
  order by (public.mind_search_normalize(s.document->>'title')=q.term) desc,
    (strpos(public.mind_search_normalize(s.document->>'title'),q.term)>0) desc,
    (ts_rank(public.mind_prompt_search_vector(s.document),q.full_query)+ts_rank(public.mind_prompt_search_vector(s.document),q.prefix_query)) desc,
    s.document->>'title',s.creator_id,s.prompt_id
  limit greatest(1,least(coalesce(result_limit,8),24));
$$;
revoke all on function public.mind_search_prompts(text,integer) from public;
grant execute on function public.mind_search_prompts(text,integer) to anon,authenticated;
