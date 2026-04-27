-- Tweet-to-Raid Autopilot v1
-- Manual ingest MVP plus X API-ready source/event tables.

alter table if exists public.raids
  add column if not exists source_provider text,
  add column if not exists source_url text,
  add column if not exists source_external_id text,
  add column if not exists source_event_id uuid,
  add column if not exists ends_at timestamptz,
  add column if not exists generated_by text,
  add column if not exists delivery_metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_raids_source_external
  on public.raids (source_provider, source_external_id)
  where source_provider is not null and source_external_id is not null;

create index if not exists idx_raids_ends_at
  on public.raids (ends_at)
  where ends_at is not null;

create table if not exists public.x_raid_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  integration_id uuid,
  x_account_id text,
  x_username text not null,
  mode text not null default 'review',
  status text not null default 'paused',
  required_hashtags text[] not null default '{}'::text[],
  exclude_replies boolean not null default true,
  exclude_reposts boolean not null default true,
  cooldown_minutes integer not null default 30,
  max_raids_per_day integer not null default 6,
  default_reward_xp integer not null default 50,
  default_duration_minutes integer not null default 1440,
  default_campaign_id uuid references public.campaigns(id) on delete set null,
  default_button_label text not null default 'Open raid',
  default_artwork_url text,
  metadata jsonb not null default '{}'::jsonb,
  last_event_at timestamptz,
  last_raid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint x_raid_sources_mode_check check (mode in ('review', 'auto_live')),
  constraint x_raid_sources_status_check check (status in ('active', 'paused', 'blocked')),
  constraint x_raid_sources_cooldown_check check (cooldown_minutes >= 0),
  constraint x_raid_sources_daily_cap_check check (max_raids_per_day > 0 and max_raids_per_day <= 48),
  constraint x_raid_sources_reward_check check (default_reward_xp > 0 and default_reward_xp <= 500),
  constraint x_raid_sources_duration_check check (default_duration_minutes >= 15 and default_duration_minutes <= 10080)
);

create unique index if not exists idx_x_raid_sources_project_username
  on public.x_raid_sources (project_id, lower(x_username));

create index if not exists idx_x_raid_sources_project_status
  on public.x_raid_sources (project_id, status, mode);

create table if not exists public.x_raid_ingest_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_id uuid references public.x_raid_sources(id) on delete set null,
  x_post_id text not null,
  x_author_id text,
  x_username text not null,
  post_url text,
  text text not null default '',
  media_urls text[] not null default '{}'::text[],
  received_at timestamptz not null default now(),
  decision text not null default 'skipped',
  decision_reason text not null default 'received',
  raid_id uuid,
  candidate_id uuid,
  delivery_metadata jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint x_raid_ingest_events_decision_check check (
    decision in ('created_raid', 'created_candidate', 'skipped', 'failed')
  )
);

create unique index if not exists idx_x_raid_ingest_events_project_post
  on public.x_raid_ingest_events (project_id, x_post_id);

create index if not exists idx_x_raid_ingest_events_source_received
  on public.x_raid_ingest_events (source_id, received_at desc);

create table if not exists public.raid_generation_candidates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_event_id uuid references public.x_raid_ingest_events(id) on delete set null,
  status text not null default 'pending',
  title text not null,
  short_description text,
  tweet_url text,
  banner text,
  reward_xp integer not null default 50,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  approved_by_auth_user_id uuid,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint raid_generation_candidates_status_check check (
    status in ('pending', 'approved', 'rejected', 'expired')
  ),
  constraint raid_generation_candidates_reward_check check (reward_xp > 0 and reward_xp <= 500)
);

create index if not exists idx_raid_generation_candidates_project_status
  on public.raid_generation_candidates (project_id, status, created_at desc);

create index if not exists idx_raid_generation_candidates_source_event
  on public.raid_generation_candidates (source_event_id);

alter table public.x_raid_sources enable row level security;
alter table public.x_raid_ingest_events enable row level security;
alter table public.raid_generation_candidates enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'x_raid_sources'
      and policyname = 'x_raid_sources_service_role_all'
  ) then
    create policy x_raid_sources_service_role_all
      on public.x_raid_sources
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'x_raid_ingest_events'
      and policyname = 'x_raid_ingest_events_service_role_all'
  ) then
    create policy x_raid_ingest_events_service_role_all
      on public.x_raid_ingest_events
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'raid_generation_candidates'
      and policyname = 'raid_generation_candidates_service_role_all'
  ) then
    create policy raid_generation_candidates_service_role_all
      on public.raid_generation_candidates
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;
