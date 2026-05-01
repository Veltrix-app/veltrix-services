begin;

create table if not exists public.risk_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  auth_user_id uuid not null,
  wallet_address text,
  event_type text not null,
  risk_category text not null check (
    risk_category in (
      'wallet_graph',
      'session_velocity',
      'quest_abuse',
      'raid_abuse',
      'reward_abuse',
      'defi_abuse',
      'social_abuse',
      'manual_review'
    )
  ),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  source_type text not null check (
    source_type in ('review_flag', 'trust_snapshot', 'onchain_signal', 'manual', 'project_escalation')
  ),
  source_id text not null,
  dedupe_key text not null unique,
  reason text not null,
  evidence jsonb not null default '{}'::jsonb,
  score_delta numeric not null default 0,
  recommended_action text not null check (
    recommended_action in ('allow', 'watch', 'review_required', 'reward_hold', 'xp_suspended', 'suspend', 'ban')
  ),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved', 'dismissed')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_reward_distributions_campaign_status
  on public.reward_distributions (campaign_id, status, updated_at desc);

comment on column public.reward_distributions.status is
  'Reward distribution lifecycle. Trust Engine v2 may set held_for_review or blocked before claims become available.';

create index if not exists idx_risk_events_project_created
  on public.risk_events (project_id, created_at desc);

create index if not exists idx_risk_events_auth_user_created
  on public.risk_events (auth_user_id, created_at desc);

create index if not exists idx_risk_events_category_severity
  on public.risk_events (risk_category, severity, created_at desc);

create table if not exists public.risk_event_rollups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  auth_user_id uuid not null,
  risk_level text not null default 'clear' check (risk_level in ('clear', 'low', 'medium', 'high', 'critical')),
  open_event_count integer not null default 0,
  high_event_count integer not null default 0,
  critical_event_count integer not null default 0,
  latest_recommended_action text not null default 'allow' check (
    latest_recommended_action in ('allow', 'watch', 'review_required', 'reward_hold', 'xp_suspended', 'suspend', 'ban')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (project_id, auth_user_id)
);

create index if not exists idx_risk_event_rollups_project_level
  on public.risk_event_rollups (project_id, risk_level, updated_at desc);

create table if not exists public.trust_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  auth_user_id uuid not null,
  actor_auth_user_id uuid,
  actor_role text,
  action text not null check (
    action in ('allow', 'watch', 'review_required', 'reward_hold', 'xp_suspended', 'suspend', 'ban', 'restore')
  ),
  previous_status text,
  new_status text not null,
  reason text not null,
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_trust_decisions_project_created
  on public.trust_decisions (project_id, created_at desc);

create index if not exists idx_trust_decisions_auth_user_created
  on public.trust_decisions (auth_user_id, created_at desc);

create table if not exists public.session_risk_events (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  project_id uuid references public.projects(id) on delete cascade,
  ip_hash text,
  user_agent_hash text,
  session_hash text,
  request_path text,
  event_type text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_session_risk_events_auth_user_created
  on public.session_risk_events (auth_user_id, created_at desc);

create index if not exists idx_session_risk_events_session_created
  on public.session_risk_events (session_hash, created_at desc);

create table if not exists public.wallet_graph_edges (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  auth_user_id uuid not null,
  wallet_address text not null,
  related_wallet_address text not null,
  edge_type text not null check (
    edge_type in ('shared_funder', 'shared_withdrawal', 'transfer_cluster', 'same_session', 'operator_link', 'manual_link')
  ),
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (project_id, wallet_address, related_wallet_address, edge_type)
);

create index if not exists idx_wallet_graph_edges_project_wallet
  on public.wallet_graph_edges (project_id, wallet_address);

create index if not exists idx_wallet_graph_edges_project_related_wallet
  on public.wallet_graph_edges (project_id, related_wallet_address);

alter table public.risk_events enable row level security;
alter table public.risk_event_rollups enable row level security;
alter table public.trust_decisions enable row level security;
alter table public.session_risk_events enable row level security;
alter table public.wallet_graph_edges enable row level security;

drop policy if exists "risk events scoped read" on public.risk_events;
drop policy if exists "risk events super admin mutate" on public.risk_events;

create policy "risk events scoped read"
on public.risk_events
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);

create policy "risk events super admin mutate"
on public.risk_events
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "risk event rollups scoped read" on public.risk_event_rollups;
drop policy if exists "risk event rollups super admin mutate" on public.risk_event_rollups;

create policy "risk event rollups scoped read"
on public.risk_event_rollups
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);

create policy "risk event rollups super admin mutate"
on public.risk_event_rollups
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "trust decisions scoped read" on public.trust_decisions;
drop policy if exists "trust decisions super admin mutate" on public.trust_decisions;

create policy "trust decisions scoped read"
on public.trust_decisions
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or (
    project_id is not null
    and public.has_project_role(auth.uid(), project_id, array['owner','admin','reviewer'])
  )
);

create policy "trust decisions super admin mutate"
on public.trust_decisions
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "session risk events private read" on public.session_risk_events;
drop policy if exists "session risk events super admin mutate" on public.session_risk_events;

create policy "session risk events private read"
on public.session_risk_events
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
);

create policy "session risk events super admin mutate"
on public.session_risk_events
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "wallet graph edges scoped read" on public.wallet_graph_edges;
drop policy if exists "wallet graph edges super admin mutate" on public.wallet_graph_edges;

create policy "wallet graph edges scoped read"
on public.wallet_graph_edges
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);

create policy "wallet graph edges super admin mutate"
on public.wallet_graph_edges
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

comment on table public.risk_events is
  'Premium VYNTRO Trust Engine evidence ledger for wallet, social, reward, raid, quest and DeFi fraud signals.';

comment on table public.risk_event_rollups is
  'Per-project Trust Engine rollup used for calm portal reads and fast risk filtering.';

comment on table public.trust_decisions is
  'Operator and engine decision history for status changes, reward holds and XP suspensions.';

comment on table public.session_risk_events is
  'Privacy-preserving hashed session velocity evidence for anti-fraud analysis.';

comment on table public.wallet_graph_edges is
  'Wallet graph relationship evidence used by VYNTRO Trust Engine clustering.';

commit;
