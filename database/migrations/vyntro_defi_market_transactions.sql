-- VYNTRO DeFi borrow/lending transaction tracking
-- Run this migration before enabling XP rewards for market activity.

begin;

create table if not exists public.defi_market_transactions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  chain_id integer not null default 8453,
  market_slug text not null,
  m_token_address text not null,
  asset_symbol text not null,
  action text not null check (
    action in ('supply', 'withdraw', 'enable-collateral', 'borrow', 'repay')
  ),
  amount_raw text not null default '0',
  tx_hash text not null unique,
  status text not null check (status in ('submitted', 'confirmed', 'failed')),
  error_message text,
  submitted_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  failed_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_defi_market_transactions_auth_user
  on public.defi_market_transactions(auth_user_id, created_at desc);

create index if not exists idx_defi_market_transactions_wallet
  on public.defi_market_transactions(wallet_address, created_at desc);

create index if not exists idx_defi_market_transactions_market_status
  on public.defi_market_transactions(market_slug, status, created_at desc);

alter table public.defi_market_transactions enable row level security;

drop policy if exists "defi market transactions select own" on public.defi_market_transactions;
create policy "defi market transactions select own"
on public.defi_market_transactions
for select
to authenticated
using (auth.uid() = auth_user_id);

commit;
