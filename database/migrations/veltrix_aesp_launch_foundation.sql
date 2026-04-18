begin;

alter table public.user_global_reputation
  add column if not exists active_xp integer not null default 0;

alter table public.user_project_reputation
  add column if not exists active_xp integer not null default 0;

alter table public.campaigns
  add column if not exists campaign_mode text not null default 'offchain',
  add column if not exists reward_type text not null default 'perk',
  add column if not exists reward_pool_amount numeric not null default 0,
  add column if not exists min_xp_required numeric not null default 0,
  add column if not exists activity_threshold numeric not null default 0,
  add column if not exists lock_days integer not null default 0;

create table if not exists public.wallet_link_nonces (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  wallet_address text not null,
  chain text not null default 'evm',
  nonce text not null,
  message text not null,
  expires_at timestamp with time zone not null,
  consumed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_wallet_link_nonces_auth_user_id
  on public.wallet_link_nonces (auth_user_id);

create index if not exists idx_wallet_link_nonces_wallet_address
  on public.wallet_link_nonces (wallet_address);

create table if not exists public.project_wallets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  chain text not null,
  wallet_address text not null,
  label text not null,
  wallet_type text not null default 'treasury',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint project_wallets_project_chain_wallet_key unique (project_id, chain, wallet_address)
);

create index if not exists idx_project_wallets_project_id
  on public.project_wallets (project_id);

create table if not exists public.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  chain text not null,
  contract_address text not null,
  asset_type text not null,
  symbol text not null,
  decimals integer not null default 18,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint project_assets_project_chain_contract_key unique (project_id, chain, contract_address)
);

create index if not exists idx_project_assets_project_id
  on public.project_assets (project_id);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  project_id uuid references public.projects(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  source_type text not null,
  source_ref text not null,
  base_value numeric not null default 0,
  xp_amount numeric not null default 0,
  quality_multiplier numeric not null default 1,
  trust_multiplier numeric not null default 1,
  action_multiplier numeric not null default 1,
  effective_xp numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint xp_events_source_unique unique (auth_user_id, source_type, source_ref)
);

create index if not exists idx_xp_events_auth_user_id
  on public.xp_events (auth_user_id);

create index if not exists idx_xp_events_project_id
  on public.xp_events (project_id);

create index if not exists idx_xp_events_campaign_id
  on public.xp_events (campaign_id);

create table if not exists public.onchain_events (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  wallet_link_id uuid references public.wallet_links(id) on delete set null,
  chain text not null,
  tx_hash text not null,
  block_time timestamp with time zone not null,
  event_type text not null,
  contract_address text not null,
  token_address text,
  usd_value numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint onchain_events_chain_tx_hash_event_key unique (chain, tx_hash, event_type, contract_address)
);

create index if not exists idx_onchain_events_auth_user_id
  on public.onchain_events (auth_user_id);

create index if not exists idx_onchain_events_project_id
  on public.onchain_events (project_id);

create table if not exists public.xp_stakes (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  staked_xp numeric not null,
  active_multiplier numeric not null default 1,
  lock_start_at timestamp with time zone not null default now(),
  lock_end_at timestamp with time zone,
  last_activity_at timestamp with time zone,
  state text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_xp_stakes_auth_user_id
  on public.xp_stakes (auth_user_id);

create index if not exists idx_xp_stakes_campaign_id
  on public.xp_stakes (campaign_id);

create table if not exists public.reward_distributions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  auth_user_id uuid not null,
  reward_asset text not null,
  reward_amount numeric not null default 0,
  calculation_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint reward_distributions_campaign_user_asset_key unique (campaign_id, auth_user_id, reward_asset)
);

create index if not exists idx_reward_distributions_campaign_id
  on public.reward_distributions (campaign_id);

create index if not exists idx_reward_distributions_auth_user_id
  on public.reward_distributions (auth_user_id);

create table if not exists public.trust_snapshots (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  score numeric not null default 50,
  reasons jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_trust_snapshots_auth_user_id
  on public.trust_snapshots (auth_user_id);

create table if not exists public.community_subscriptions (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.project_integrations(id) on delete cascade,
  provider text not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  enabled boolean not null default true,
  scope_mode text not null default 'project_only',
  delivery_mode text not null default 'broadcast',
  target_channel_id text,
  target_thread_id text,
  target_chat_id text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint community_subscriptions_integration_id_key unique (integration_id)
);

create index if not exists idx_community_subscriptions_project_id
  on public.community_subscriptions (project_id);

create index if not exists idx_community_subscriptions_provider
  on public.community_subscriptions (provider);

create table if not exists public.community_subscription_filters (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.community_subscriptions(id) on delete cascade,
  featured_only boolean not null default false,
  live_only boolean not null default false,
  min_xp numeric not null default 0,
  allow_campaigns boolean not null default true,
  allow_quests boolean not null default true,
  allow_raids boolean not null default true,
  allow_rewards boolean not null default false,
  allow_announcements boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint community_subscription_filters_subscription_id_key unique (subscription_id)
);

create table if not exists public.community_subscription_scopes (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.community_subscriptions(id) on delete cascade,
  scope_type text not null,
  scope_ref_id uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint community_subscription_scopes_unique unique (subscription_id, scope_type, scope_ref_id)
);

create index if not exists idx_community_subscription_scopes_subscription_id
  on public.community_subscription_scopes (subscription_id);

alter table public.wallet_link_nonces enable row level security;
alter table public.project_wallets enable row level security;
alter table public.project_assets enable row level security;
alter table public.xp_events enable row level security;
alter table public.onchain_events enable row level security;
alter table public.xp_stakes enable row level security;
alter table public.reward_distributions enable row level security;
alter table public.trust_snapshots enable row level security;
alter table public.community_subscriptions enable row level security;
alter table public.community_subscription_filters enable row level security;
alter table public.community_subscription_scopes enable row level security;

create policy "authenticated read wallet link nonces"
on public.wallet_link_nonces
for select to authenticated
using (true);

create policy "authenticated manage wallet link nonces"
on public.wallet_link_nonces
for all to authenticated
using (true)
with check (true);

create policy "authenticated read project wallets"
on public.project_wallets
for select to authenticated
using (true);

create policy "authenticated manage project wallets"
on public.project_wallets
for all to authenticated
using (true)
with check (true);

create policy "authenticated read project assets"
on public.project_assets
for select to authenticated
using (true);

create policy "authenticated manage project assets"
on public.project_assets
for all to authenticated
using (true)
with check (true);

create policy "authenticated read xp events"
on public.xp_events
for select to authenticated
using (true);

create policy "authenticated manage xp events"
on public.xp_events
for all to authenticated
using (true)
with check (true);

create policy "authenticated read onchain events"
on public.onchain_events
for select to authenticated
using (true);

create policy "authenticated manage onchain events"
on public.onchain_events
for all to authenticated
using (true)
with check (true);

create policy "authenticated read xp stakes"
on public.xp_stakes
for select to authenticated
using (true);

create policy "authenticated manage xp stakes"
on public.xp_stakes
for all to authenticated
using (true)
with check (true);

create policy "authenticated read reward distributions"
on public.reward_distributions
for select to authenticated
using (true);

create policy "authenticated manage reward distributions"
on public.reward_distributions
for all to authenticated
using (true)
with check (true);

create policy "authenticated read trust snapshots"
on public.trust_snapshots
for select to authenticated
using (true);

create policy "authenticated manage trust snapshots"
on public.trust_snapshots
for all to authenticated
using (true)
with check (true);

create policy "authenticated read community subscriptions"
on public.community_subscriptions
for select to authenticated
using (true);

create policy "authenticated manage community subscriptions"
on public.community_subscriptions
for all to authenticated
using (true)
with check (true);

create policy "authenticated read community subscription filters"
on public.community_subscription_filters
for select to authenticated
using (true);

create policy "authenticated manage community subscription filters"
on public.community_subscription_filters
for all to authenticated
using (true)
with check (true);

create policy "authenticated read community subscription scopes"
on public.community_subscription_scopes
for select to authenticated
using (true);

create policy "authenticated manage community subscription scopes"
on public.community_subscription_scopes
for all to authenticated
using (true)
with check (true);

commit;
