begin;

create table if not exists public.campaign_analytics_daily (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  snapshot_date date not null,
  participants integer not null default 0,
  submissions integer not null default 0,
  approved_submissions integer not null default 0,
  pending_submissions integer not null default 0,
  rejected_submissions integer not null default 0,
  auto_approved_submissions integer not null default 0,
  duplicate_signal_count integer not null default 0,
  open_review_flags integer not null default 0,
  average_confidence integer not null default 0,
  created_at timestamp with time zone not null default now(),
  unique (campaign_id, snapshot_date)
);

create index if not exists idx_campaign_analytics_daily_project_date
  on public.campaign_analytics_daily (project_id, snapshot_date desc);

create index if not exists idx_campaign_analytics_daily_campaign_date
  on public.campaign_analytics_daily (campaign_id, snapshot_date desc);

alter table public.campaign_analytics_daily enable row level security;

create policy "authenticated read campaign analytics daily"
on public.campaign_analytics_daily
for select
to authenticated
using (true);

create policy "authenticated write campaign analytics daily"
on public.campaign_analytics_daily
for all
to authenticated
using (true)
with check (true);

commit;
