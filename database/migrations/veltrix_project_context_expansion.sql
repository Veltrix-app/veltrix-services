begin;

alter table public.projects
  add column if not exists docs_url text not null default '',
  add column if not exists waitlist_url text not null default '',
  add column if not exists launch_post_url text not null default '',
  add column if not exists token_contract_address text not null default '',
  add column if not exists nft_contract_address text not null default '',
  add column if not exists primary_wallet text not null default '',
  add column if not exists brand_accent text not null default '',
  add column if not exists brand_mood text not null default '';

create index if not exists idx_projects_launch_post_url
  on public.projects (launch_post_url);

create index if not exists idx_projects_waitlist_url
  on public.projects (waitlist_url);

create index if not exists idx_projects_token_contract_address
  on public.projects (token_contract_address);

commit;

select
  id,
  name,
  docs_url,
  waitlist_url,
  launch_post_url,
  token_contract_address,
  nft_contract_address,
  primary_wallet,
  brand_accent,
  brand_mood
from public.projects
order by created_at desc
limit 20;
