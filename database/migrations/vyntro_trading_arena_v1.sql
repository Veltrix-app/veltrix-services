-- VYNTRO Trading Arena: snapshot and live-tracked trading competitions.
-- Apply before enabling project Trading Arena creation, jobs, or settlement.

begin;

create table if not exists public.trading_competitions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  created_by_auth_user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null default '',
  banner_url text,
  status text not null default 'draft',
  tracking_mode text not null default 'snapshot',
  scoring_mode text not null default 'hybrid',
  chain text not null default 'base',
  quote_symbol text not null default 'USDC',
  registration_starts_at timestamp with time zone,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone not null,
  freeze_at timestamp with time zone,
  snapshot_cadence text not null default 'hourly',
  budget_cap_cents integer not null default 0,
  current_cost_cents integer not null default 0,
  cost_status text not null default 'ok',
  rules jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint trading_competitions_status_check check (
    status in ('draft', 'scheduled', 'live', 'paused', 'settling', 'settled', 'cancelled')
  ),
  constraint trading_competitions_tracking_mode_check check (
    tracking_mode in ('snapshot', 'live')
  ),
  constraint trading_competitions_scoring_mode_check check (
    scoring_mode in ('volume', 'roi', 'hybrid')
  ),
  constraint trading_competitions_cost_status_check check (
    cost_status in ('ok', 'near_cap', 'capped', 'provider_failure')
  ),
  constraint trading_competitions_snapshot_cadence_check check (
    snapshot_cadence in ('start_end', 'hourly', 'daily')
  ),
  constraint trading_competitions_window_check check (ends_at > starts_at),
  constraint trading_competitions_cost_check check (
    budget_cap_cents >= 0 and current_cost_cents >= 0
  )
);

create table if not exists public.trading_competition_pairs (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  chain text not null default 'base',
  base_symbol text not null,
  quote_symbol text not null default 'USDC',
  base_token_address text not null,
  quote_token_address text,
  pool_address text,
  router_address text,
  min_trade_usd numeric not null default 5,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint trading_competition_pairs_min_trade_check check (min_trade_usd >= 0)
);

create table if not exists public.trading_competition_rewards (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  reward_asset text not null,
  reward_amount numeric not null default 0,
  rank_from integer,
  rank_to integer,
  reward_type text not null default 'rank',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint trading_competition_rewards_type_check check (
    reward_type in ('rank', 'raffle', 'participation', 'xp')
  ),
  constraint trading_competition_rewards_amount_check check (reward_amount >= 0),
  constraint trading_competition_rewards_rank_check check (
    rank_from is null or rank_to is null or rank_to >= rank_from
  )
);

create table if not exists public.trading_competition_participants (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  wallet_link_id uuid references public.wallet_links(id) on delete set null,
  status text not null default 'joined',
  joined_at timestamp with time zone not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint trading_competition_participants_status_check check (
    status in ('joined', 'eligible', 'flagged', 'excluded', 'settled')
  ),
  constraint trading_competition_participants_unique unique (competition_id, auth_user_id),
  constraint trading_competition_participants_wallet_unique unique (competition_id, wallet_address)
);

create table if not exists public.trading_competition_snapshots (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  pair_id uuid references public.trading_competition_pairs(id) on delete cascade,
  participant_id uuid references public.trading_competition_participants(id) on delete cascade,
  snapshot_type text not null,
  snapshot_at timestamp with time zone not null default now(),
  price_usd numeric,
  liquidity_usd numeric,
  wallet_balance numeric,
  wallet_value_usd numeric,
  source_provider text not null default 'internal',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint trading_competition_snapshots_type_check check (
    snapshot_type in ('start', 'periodic', 'end', 'manual')
  )
);

create table if not exists public.trading_competition_events (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  pair_id uuid references public.trading_competition_pairs(id) on delete set null,
  participant_id uuid references public.trading_competition_participants(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  wallet_address text not null,
  chain text not null default 'base',
  tx_hash text not null,
  log_index integer not null default 0,
  block_number bigint,
  block_time timestamp with time zone not null,
  side text not null,
  base_amount numeric not null default 0,
  quote_amount numeric not null default 0,
  usd_value numeric not null default 0,
  source_provider text not null default 'rpc',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint trading_competition_events_side_check check (side in ('buy', 'sell', 'swap')),
  constraint trading_competition_events_unique unique (competition_id, chain, tx_hash, log_index),
  constraint trading_competition_events_value_check check (
    base_amount >= 0 and quote_amount >= 0 and usd_value >= 0
  )
);

create table if not exists public.trading_competition_leaderboard (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  participant_id uuid not null references public.trading_competition_participants(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  rank integer not null,
  score numeric not null default 0,
  volume_usd numeric not null default 0,
  roi_percent numeric not null default 0,
  trade_count integer not null default 0,
  flags_count integer not null default 0,
  status text not null default 'active',
  score_breakdown jsonb not null default '{}'::jsonb,
  calculated_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint trading_competition_leaderboard_status_check check (
    status in ('active', 'flagged', 'excluded', 'final')
  ),
  constraint trading_competition_leaderboard_unique unique (competition_id, participant_id),
  constraint trading_competition_leaderboard_rank_check check (rank > 0)
);

create table if not exists public.trading_competition_flags (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  participant_id uuid references public.trading_competition_participants(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  wallet_address text,
  flag_type text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  summary text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint trading_competition_flags_severity_check check (
    severity in ('low', 'medium', 'high', 'critical')
  ),
  constraint trading_competition_flags_status_check check (
    status in ('open', 'reviewed', 'dismissed', 'upheld')
  )
);

create table if not exists public.tracking_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  competition_id uuid references public.trading_competitions(id) on delete cascade,
  provider text not null,
  chain text not null default 'base',
  operation_type text not null,
  unit_count numeric not null default 0,
  estimated_cost_cents integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint tracking_usage_ledger_operation_check check (
    operation_type in ('snapshot', 'rpc_call', 'log_scan', 'event_decode', 'leaderboard_rebuild', 'retry', 'storage_write')
  ),
  constraint tracking_usage_ledger_cost_check check (
    unit_count >= 0 and estimated_cost_cents >= 0
  )
);

create table if not exists public.tracking_provider_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  competition_id uuid references public.trading_competitions(id) on delete cascade,
  provider text not null,
  job_type text not null,
  status text not null default 'queued',
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  latest_block_number bigint,
  latest_snapshot_at timestamp with time zone,
  events_processed integer not null default 0,
  usage_cents integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tracking_provider_runs_status_check check (
    status in ('queued', 'running', 'succeeded', 'failed', 'skipped')
  ),
  constraint tracking_provider_runs_usage_check check (
    events_processed >= 0 and usage_cents >= 0
  )
);

create index if not exists idx_trading_competitions_project_status
  on public.trading_competitions(project_id, status, starts_at desc);

create index if not exists idx_trading_competitions_mode_status
  on public.trading_competitions(tracking_mode, status, starts_at);

create index if not exists idx_trading_pairs_competition
  on public.trading_competition_pairs(competition_id, is_active);

create index if not exists idx_trading_rewards_competition
  on public.trading_competition_rewards(competition_id, rank_from, rank_to);

create index if not exists idx_trading_participants_competition
  on public.trading_competition_participants(competition_id, status);

create index if not exists idx_trading_participants_wallet
  on public.trading_competition_participants(wallet_address);

create index if not exists idx_trading_snapshots_competition_type
  on public.trading_competition_snapshots(competition_id, snapshot_type, snapshot_at desc);

create index if not exists idx_trading_events_competition_time
  on public.trading_competition_events(competition_id, block_time desc);

create index if not exists idx_trading_events_wallet
  on public.trading_competition_events(wallet_address, block_time desc);

create index if not exists idx_trading_leaderboard_competition_rank
  on public.trading_competition_leaderboard(competition_id, rank);

create index if not exists idx_trading_flags_competition_status
  on public.trading_competition_flags(competition_id, status, severity);

create index if not exists idx_tracking_usage_competition
  on public.tracking_usage_ledger(competition_id, created_at desc);

create index if not exists idx_tracking_provider_runs_competition
  on public.tracking_provider_runs(competition_id, created_at desc);

alter table public.trading_competitions enable row level security;
alter table public.trading_competition_pairs enable row level security;
alter table public.trading_competition_rewards enable row level security;
alter table public.trading_competition_participants enable row level security;
alter table public.trading_competition_snapshots enable row level security;
alter table public.trading_competition_events enable row level security;
alter table public.trading_competition_leaderboard enable row level security;
alter table public.trading_competition_flags enable row level security;
alter table public.tracking_usage_ledger enable row level security;
alter table public.tracking_provider_runs enable row level security;

drop policy if exists "authenticated read trading competitions" on public.trading_competitions;
create policy "authenticated read trading competitions"
on public.trading_competitions
for select
to authenticated
using (true);

drop policy if exists "authenticated read trading pairs" on public.trading_competition_pairs;
create policy "authenticated read trading pairs"
on public.trading_competition_pairs
for select
to authenticated
using (true);

drop policy if exists "authenticated read trading rewards" on public.trading_competition_rewards;
create policy "authenticated read trading rewards"
on public.trading_competition_rewards
for select
to authenticated
using (true);

drop policy if exists "authenticated read trading participants" on public.trading_competition_participants;
create policy "authenticated read trading participants"
on public.trading_competition_participants
for select
to authenticated
using (true);

drop policy if exists "authenticated read trading snapshots" on public.trading_competition_snapshots;
create policy "authenticated read trading snapshots"
on public.trading_competition_snapshots
for select
to authenticated
using (true);

drop policy if exists "authenticated read trading events" on public.trading_competition_events;
create policy "authenticated read trading events"
on public.trading_competition_events
for select
to authenticated
using (true);

drop policy if exists "authenticated read trading leaderboard" on public.trading_competition_leaderboard;
create policy "authenticated read trading leaderboard"
on public.trading_competition_leaderboard
for select
to authenticated
using (true);

drop policy if exists "authenticated read own trading flags" on public.trading_competition_flags;
create policy "authenticated read own trading flags"
on public.trading_competition_flags
for select
to authenticated
using (auth.uid() = auth_user_id or auth_user_id is null);

drop policy if exists "authenticated read tracking usage" on public.tracking_usage_ledger;
create policy "authenticated read tracking usage"
on public.tracking_usage_ledger
for select
to authenticated
using (true);

drop policy if exists "authenticated read tracking provider runs" on public.tracking_provider_runs;
create policy "authenticated read tracking provider runs"
on public.tracking_provider_runs
for select
to authenticated
using (true);

comment on table public.trading_competitions is
  'VYNTRO Trading Arena competition shell with snapshot/live tracking, scoring and budget state.';

comment on table public.tracking_usage_ledger is
  'Metered tracking operations for pricing live trading competitions safely.';

commit;
