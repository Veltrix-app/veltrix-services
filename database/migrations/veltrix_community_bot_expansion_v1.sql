begin;

create table if not exists public.community_bot_settings (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.project_integrations(id) on delete cascade,
  provider text not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  commands_enabled boolean not null default true,
  rank_sync_enabled boolean not null default false,
  rank_source text not null default 'project_xp',
  leaderboard_enabled boolean not null default true,
  leaderboard_scope text not null default 'project',
  leaderboard_period text not null default 'weekly',
  leaderboard_target_channel_id text,
  leaderboard_top_n integer not null default 10,
  leaderboard_cadence text not null default 'manual',
  raid_ops_enabled boolean not null default false,
  last_rank_sync_at timestamp with time zone,
  last_leaderboard_posted_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint community_bot_settings_integration_id_key unique (integration_id)
);

create index if not exists idx_community_bot_settings_project_id
  on public.community_bot_settings (project_id);

create index if not exists idx_community_bot_settings_provider
  on public.community_bot_settings (provider);

create table if not exists public.community_rank_rules (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.project_integrations(id) on delete cascade,
  source_type text not null,
  threshold numeric not null default 0,
  discord_role_id text not null,
  label text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint community_rank_rules_unique unique (integration_id, source_type, threshold, discord_role_id)
);

create index if not exists idx_community_rank_rules_integration_id
  on public.community_rank_rules (integration_id);

alter table public.community_bot_settings enable row level security;
alter table public.community_rank_rules enable row level security;

create policy "authenticated read community bot settings"
on public.community_bot_settings
for select
to authenticated
using (true);

create policy "authenticated manage community bot settings"
on public.community_bot_settings
for all
to authenticated
using (true)
with check (true);

create policy "authenticated read community rank rules"
on public.community_rank_rules
for select
to authenticated
using (true);

create policy "authenticated manage community rank rules"
on public.community_rank_rules
for all
to authenticated
using (true)
with check (true);

commit;
