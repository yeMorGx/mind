-- Optional advertiser coupon; existing campaigns retain their current appearance.
alter table public.mind_campaigns
  add column coupon_code text not null default ''
  constraint mind_campaign_coupon_code_check check (
    char_length(coupon_code) <= 48
    and coupon_code !~ '[[:cntrl:]]'
  );

-- Existing schedule RLS still limits visibility to campaigns currently on air.
grant select (coupon_code) on public.mind_campaigns to anon, authenticated;
