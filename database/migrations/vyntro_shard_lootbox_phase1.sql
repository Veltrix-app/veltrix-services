begin;

create table if not exists public.shard_ledger (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  source_type text not null,
  source_ref text not null,
  source_dedupe_key text not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint shard_ledger_amount_nonzero check (amount <> 0),
  constraint shard_ledger_source_unique unique (auth_user_id, source_dedupe_key)
);

create index if not exists idx_shard_ledger_auth_created
  on public.shard_ledger (auth_user_id, created_at desc);

create index if not exists idx_shard_ledger_source_type_created
  on public.shard_ledger (source_type, created_at desc);

create table if not exists public.lootbox_tiers (
  id text primary key,
  label text not null,
  price_shards integer not null,
  asset_path text not null,
  min_level integer not null default 0,
  featured_completions_required integer,
  requires_clean_trust boolean not null default false,
  requires_season_window boolean not null default false,
  odds jsonb not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint lootbox_tiers_price_positive check (price_shards > 0)
);

create table if not exists public.lootbox_pool_items (
  id uuid primary key default gen_random_uuid(),
  tier_id text not null references public.lootbox_tiers(id) on delete cascade,
  rarity text not null,
  label text not null,
  item_type text not null,
  weight numeric not null,
  stock integer,
  unlimited_stock boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint lootbox_pool_items_weight_positive check (weight > 0),
  constraint lootbox_pool_items_stock_nonnegative check (stock is null or stock >= 0),
  constraint lootbox_pool_items_tier_label_type_key unique (tier_id, label, item_type)
);

create index if not exists idx_lootbox_pool_items_tier_active
  on public.lootbox_pool_items (tier_id, active);

create table if not exists public.lootbox_opens (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  tier_id text not null references public.lootbox_tiers(id),
  pool_item_id uuid references public.lootbox_pool_items(id) on delete set null,
  shard_spend integer not null,
  odds_snapshot jsonb not null,
  result_snapshot jsonb not null,
  status text not null default 'granted',
  created_at timestamp with time zone not null default now(),
  constraint lootbox_opens_spend_positive check (shard_spend > 0),
  constraint lootbox_opens_status_check check (status in ('granted', 'held_for_review'))
);

create index if not exists idx_lootbox_opens_auth_created
  on public.lootbox_opens (auth_user_id, created_at desc);

create table if not exists public.user_inventory (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  lootbox_open_id uuid references public.lootbox_opens(id) on delete set null,
  item_type text not null,
  rarity text not null,
  label text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'owned',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_inventory_status_check check (status in ('owned', 'pending_review', 'claimed', 'expired'))
);

create index if not exists idx_user_inventory_auth_created
  on public.user_inventory (auth_user_id, created_at desc);

alter table public.shard_ledger enable row level security;
alter table public.lootbox_tiers enable row level security;
alter table public.lootbox_pool_items enable row level security;
alter table public.lootbox_opens enable row level security;
alter table public.user_inventory enable row level security;

drop policy if exists "members read own shard ledger" on public.shard_ledger;
create policy "members read own shard ledger"
on public.shard_ledger for select to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "members read active lootbox tiers" on public.lootbox_tiers;
create policy "members read active lootbox tiers"
on public.lootbox_tiers for select to authenticated
using (active = true);

drop policy if exists "members read active lootbox pool items" on public.lootbox_pool_items;
create policy "members read active lootbox pool items"
on public.lootbox_pool_items for select to authenticated
using (active = true);

drop policy if exists "members read own lootbox opens" on public.lootbox_opens;
create policy "members read own lootbox opens"
on public.lootbox_opens for select to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "members read own inventory" on public.user_inventory;
create policy "members read own inventory"
on public.user_inventory for select to authenticated
using (auth.uid() = auth_user_id);

insert into public.lootbox_tiers (
  id,
  label,
  price_shards,
  asset_path,
  min_level,
  featured_completions_required,
  requires_clean_trust,
  requires_season_window,
  odds,
  sort_order
) values
  ('common', 'Common Lootbox', 250, '/assets/lootboxes/common-lootbox.webp', 0, null, false, false, '{"common":70,"rare":22,"epic":6,"legendary":1.8,"mythic":0.2}'::jsonb, 10),
  ('rare', 'Rare Lootbox', 750, '/assets/lootboxes/rare-lootbox.webp', 3, null, false, false, '{"common":35,"rare":45,"epic":15,"legendary":4.5,"mythic":0.5}'::jsonb, 20),
  ('epic', 'Epic Lootbox', 2000, '/assets/lootboxes/epic-lootbox.webp', 8, 3, false, false, '{"common":0,"rare":35,"epic":45,"legendary":17,"mythic":3}'::jsonb, 30),
  ('legendary', 'Legendary Lootbox', 6000, '/assets/lootboxes/legendary-lootbox.webp', 15, null, true, false, '{"common":0,"rare":0,"epic":45,"legendary":48,"mythic":7}'::jsonb, 40),
  ('mythic', 'Mythic Lootbox', 18000, '/assets/lootboxes/mythic-lootbox.webp', 25, null, true, true, '{"common":0,"rare":0,"epic":0,"legendary":55,"mythic":45}'::jsonb, 50)
on conflict (id) do update
set
  label = excluded.label,
  price_shards = excluded.price_shards,
  asset_path = excluded.asset_path,
  min_level = excluded.min_level,
  featured_completions_required = excluded.featured_completions_required,
  requires_clean_trust = excluded.requires_clean_trust,
  requires_season_window = excluded.requires_season_window,
  odds = excluded.odds,
  sort_order = excluded.sort_order,
  active = true,
  updated_at = now();

insert into public.lootbox_pool_items (tier_id, rarity, label, item_type, weight, unlimited_stock, payload) values
  ('common', 'common', 'Shard Hunter Title', 'title', 70, true, '{"title":"Shard Hunter"}'::jsonb),
  ('common', 'rare', '10 Percent Shard Refund', 'shard_refund_percent', 22, true, '{"refundPercent":10}'::jsonb),
  ('common', 'epic', 'Streak Protector', 'streak_protector', 6, true, '{"uses":1}'::jsonb),
  ('common', 'legendary', 'Raid Catalyst Title', 'title', 1.8, true, '{"title":"Raid Catalyst"}'::jsonb),
  ('common', 'mythic', 'Mythic Window Token', 'season_access', 0.2, true, '{"window":"mythic-preview"}'::jsonb),
  ('rare', 'common', 'Shard Hunter Title', 'title', 35, true, '{"title":"Shard Hunter"}'::jsonb),
  ('rare', 'rare', '25 Percent Shard Refund', 'shard_refund_percent', 45, true, '{"refundPercent":25}'::jsonb),
  ('rare', 'epic', 'Vault Runner Title', 'title', 15, true, '{"title":"Vault Runner"}'::jsonb),
  ('rare', 'legendary', 'Profile Glow', 'profile_cosmetic', 4.5, true, '{"cosmetic":"profile-glow-gold"}'::jsonb),
  ('rare', 'mythic', 'Mythic Window Token', 'season_access', 0.5, true, '{"window":"mythic-preview"}'::jsonb),
  ('epic', 'rare', 'Rare Shard Refund', 'shard_refund_percent', 35, true, '{"refundPercent":20}'::jsonb),
  ('epic', 'epic', 'Vault Runner Profile Frame', 'profile_cosmetic', 45, true, '{"cosmetic":"frame-vault-runner"}'::jsonb),
  ('epic', 'legendary', 'Streak Protector Pack', 'streak_protector', 17, true, '{"uses":3}'::jsonb),
  ('epic', 'mythic', 'Mythic Preview Key', 'season_access', 3, true, '{"window":"mythic-preview"}'::jsonb),
  ('legendary', 'epic', 'Epic Shard Refund', 'shard_refund_percent', 45, true, '{"refundPercent":30}'::jsonb),
  ('legendary', 'legendary', 'Legend Profile Glow', 'profile_cosmetic', 48, true, '{"cosmetic":"profile-glow-legend"}'::jsonb),
  ('legendary', 'mythic', 'Season Catalyst', 'season_access', 7, true, '{"window":"season-catalyst"}'::jsonb),
  ('mythic', 'legendary', 'Legendary Shard Refund', 'shard_refund_percent', 55, true, '{"refundPercent":40}'::jsonb),
  ('mythic', 'mythic', 'Mythic Founder Aura', 'profile_cosmetic', 45, true, '{"cosmetic":"aura-mythic-founder"}'::jsonb)
on conflict (tier_id, label, item_type) do update
set
  rarity = excluded.rarity,
  weight = excluded.weight,
  unlimited_stock = excluded.unlimited_stock,
  payload = excluded.payload,
  active = true,
  updated_at = now();

commit;
