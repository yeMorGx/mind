-- Independent of billing rollout: campaigns do not grant subscription benefits.
create table public.mind_campaigns (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 2 and 100),
 placements text[] not null default array['prompts','mcps','markdown']::text[] check(cardinality(placements)<=4 and placements<@array['hero','prompts','mcps','markdown']::text[]),
 kind text not null check(kind in('affiliate','sponsored')),
 status text not null default 'draft' check(status in('draft','active','paused','archived')),
 advertiser text not null default '' check(char_length(advertiser)<=80),
 title text not null default '' check(char_length(title)<=96),
 description text not null default '' check(char_length(description)<=220),
 logo_url text not null default '' check(char_length(logo_url)<=2048),
 image_url text not null default '' check(char_length(image_url)<=2048),
 image_alt text not null default '' check(char_length(image_alt)<=160),
 video_url text not null default '' check(char_length(video_url)<=2048),
 cta_label text not null default 'Conhecer' check(char_length(cta_label)<=32),
 target_url text not null default '' check(char_length(target_url)<=2048),
 starts_at timestamptz, ends_at timestamptz,
 created_by text not null, updated_by text not null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(ends_at is null or (starts_at is not null and ends_at>starts_at)),
 check(status<>'active' or (cardinality(placements)>0 and advertiser<>'' and title<>'' and description<>'' and image_url<>'' and image_alt<>'' and cta_label<>'' and target_url<>'' and starts_at is not null))
);
create index mind_campaign_schedule_idx on public.mind_campaigns(status,starts_at,ends_at);
alter table public.mind_campaigns enable row level security;
revoke all on public.mind_campaigns from public,anon,authenticated;
grant all on public.mind_campaigns to service_role;
-- No internal names, account identifiers, draft content or analytics in the public projection.
grant select(id,placements,kind,advertiser,title,description,logo_url,image_url,image_alt,video_url,cta_label,target_url,starts_at,ends_at) on public.mind_campaigns to anon,authenticated;
create policy campaign_current_public on public.mind_campaigns for select to anon,authenticated
 using(status='active' and starts_at<=now() and (ends_at is null or ends_at>now()));
create function public.mind_campaign_touch() returns trigger language plpgsql security invoker set search_path='' as $$
 begin new.updated_at:=clock_timestamp();return new;end;
$$;
revoke all on function public.mind_campaign_touch() from public,anon,authenticated;
create trigger mind_campaign_updated before update on public.mind_campaigns for each row execute function public.mind_campaign_touch();

create table public.mind_campaign_events (
 campaign_id uuid not null references public.mind_campaigns(id) on delete cascade,
 visitor_hash text not null check(visitor_hash~'^[a-f0-9]{64}$'),
 event_kind text not null check(event_kind in('view','click')),
 day date not null,ip_hash text not null check(ip_hash~'^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),
 primary key(campaign_id,visitor_hash,event_kind,day)
);
create index mind_campaign_event_rate_idx on public.mind_campaign_events(ip_hash,day);
alter table public.mind_campaign_events enable row level security;
revoke all on public.mind_campaign_events from public,anon,authenticated;
grant all on public.mind_campaign_events to service_role;

-- Session lookup observes existing account RLS and MFA. Admin authorization remains server-side.
create function public.mind_campaign_session() returns text language sql stable security invoker set search_path='' as $$
 select public_id from public.mind_accounts where id=(select auth.uid()) and mind_security.mfa_satisfied();
$$;
revoke all on function public.mind_campaign_session() from public,anon;
grant execute on function public.mind_campaign_session() to authenticated;

create function public.mind_campaign_record_event(campaign uuid,event_kind text,visitor_hash text,address_hash text)
 returns boolean language plpgsql security invoker set search_path='' as $$
 declare today date:=(now() at time zone 'UTC')::date;
 begin
 if event_kind not in('view','click') or visitor_hash!~'^[a-f0-9]{64}$' or address_hash!~'^[a-f0-9]{64}$' then return false;end if;
 if not exists(select 1 from public.mind_campaigns c where c.id=campaign and c.status='active' and c.starts_at<=now() and (c.ends_at is null or c.ends_at>now())) then return false;end if;
 perform pg_advisory_xact_lock(hashtextextended('mind-campaign:'||address_hash,0));
 -- Limits abuse without retaining raw IP, email, UID, referrer or browser fingerprint.
 if (select count(*) from public.mind_campaign_events e where e.ip_hash=address_hash and e.day=today)>=500 then return false;end if;
 if event_kind='click' then
   insert into public.mind_campaign_events(campaign_id,event_kind,visitor_hash,ip_hash,day)
   values(campaign,'view',visitor_hash,address_hash,today) on conflict do nothing;
 end if;
 insert into public.mind_campaign_events(campaign_id,event_kind,visitor_hash,ip_hash,day)
 values(campaign,event_kind,visitor_hash,address_hash,today) on conflict do nothing;
 return true;
 end;
$$;
revoke all on function public.mind_campaign_record_event(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.mind_campaign_record_event(uuid,text,text,text) to service_role;
create function public.mind_campaign_metrics(campaign_ids uuid[]) returns table(id uuid,views bigint,clicks bigint)
 language sql stable security invoker set search_path='' as $$
 select campaign_id,count(*) filter(where event_kind='view'),count(*) filter(where event_kind='click')
 from public.mind_campaign_events where campaign_id=any(campaign_ids) group by campaign_id;
$$;
revoke all on function public.mind_campaign_metrics(uuid[]) from public,anon,authenticated;
grant execute on function public.mind_campaign_metrics(uuid[]) to service_role;
