-- VYNTRO Swap transaction tracking
-- Run this migration before enabling the VYNTRO Swap production flow.

begin;

create table if not exists public.defi_swap_intents (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  chain_id integer not null default 8453,
  sell_token_address text not null,
  sell_token_symbol text not null,
  buy_token_address text not null,
  buy_token_symbol text not null,
  sell_amount_raw text not null,
  expected_buy_amount_raw text not null default '0',
  provider text not null check (provider in ('0x', 'uniswap')),
  route_summary text not null default '',
  slippage_bps integer not null default 50,
  platform_fee_bps integer not null default 0,
  platform_fee_recipient text,
  status text not null default 'quoted' check (status in ('quoted', 'submitted', 'confirmed', 'failed', 'expired')),
  tx_hash text unique,
  error_message text,
  quote_payload jsonb not null default '{}'::jsonb,
  transaction_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  submitted_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  failed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.defi_swap_fee_ledger (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid unique references public.defi_swap_intents(id) on delete set null,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  chain_id integer not null default 8453,
  fee_bps integer not null default 0,
  fee_recipient text,
  sell_token_symbol text not null,
  buy_token_symbol text not null,
  sell_amount_raw text not null,
  estimated_fee_raw text not null default '0',
  tx_hash text,
  status text not null default 'pending' check (status in ('pending', 'collected', 'waived', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_defi_swap_intents_auth_user
  on public.defi_swap_intents(auth_user_id, created_at desc);

create index if not exists idx_defi_swap_intents_wallet
  on public.defi_swap_intents(wallet_address, created_at desc);

create index if not exists idx_defi_swap_intents_status
  on public.defi_swap_intents(status, created_at desc);

create index if not exists idx_defi_swap_fee_ledger_wallet
  on public.defi_swap_fee_ledger(wallet_address, created_at desc);

alter table public.defi_swap_intents enable row level security;
alter table public.defi_swap_fee_ledger enable row level security;

drop policy if exists "defi swap intents select own" on public.defi_swap_intents;
create policy "defi swap intents select own"
on public.defi_swap_intents
for select
to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "defi swap fee ledger select own" on public.defi_swap_fee_ledger;
create policy "defi swap fee ledger select own"
on public.defi_swap_fee_ledger
for select
to authenticated
using (auth.uid() = auth_user_id);

commit;
