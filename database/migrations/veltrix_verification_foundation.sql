begin;

create table if not exists public.wallet_links (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  wallet_address text not null unique,
  chain text not null default 'evm',
  source text not null default 'profile_manual',
  verified boolean not null default false,
  verified_at timestamp with time zone,
  last_seen_at timestamp with time zone,
  risk_label text not null default 'unknown',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.review_flags (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  project_id uuid references public.projects(id) on delete cascade,
  source_table text not null,
  source_id text not null,
  flag_type text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  reason text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_wallet_links_auth_user_id
  on public.wallet_links (auth_user_id);

create index if not exists idx_wallet_links_risk_label
  on public.wallet_links (risk_label);

create index if not exists idx_review_flags_auth_user_id
  on public.review_flags (auth_user_id);

create index if not exists idx_review_flags_project_id
  on public.review_flags (project_id);

create index if not exists idx_review_flags_status
  on public.review_flags (status);

alter table public.wallet_links enable row level security;
alter table public.review_flags enable row level security;

create policy "authenticated read wallet links"
on public.wallet_links
for select
to authenticated
using (true);

create policy "authenticated manage wallet links"
on public.wallet_links
for all
to authenticated
using (true)
with check (true);

create policy "authenticated read review flags"
on public.review_flags
for select
to authenticated
using (true);

create policy "authenticated manage review flags"
on public.review_flags
for all
to authenticated
using (true)
with check (true);

insert into public.wallet_links (
  auth_user_id,
  wallet_address,
  chain,
  source,
  verified,
  risk_label,
  metadata
)
select
  auth_user_id,
  wallet,
  'evm',
  'profile_manual',
  false,
  case
    when status = 'flagged' then 'watch'
    else 'unknown'
  end,
  '{}'::jsonb
from public.user_profiles
where auth_user_id is not null
  and coalesce(wallet, '') <> ''
on conflict (wallet_address) do update set
  auth_user_id = excluded.auth_user_id,
  updated_at = now();

insert into public.review_flags (
  auth_user_id,
  source_table,
  source_id,
  flag_type,
  severity,
  status,
  reason,
  metadata
)
select
  ugr.auth_user_id,
  'user_global_reputation',
  ugr.auth_user_id::text,
  'high_sybil_score',
  case
    when ugr.sybil_score >= 85 then 'high'
    when ugr.sybil_score >= 70 then 'medium'
    else 'low'
  end,
  'open',
  'Seeded from user_global_reputation sybil score backfill.',
  jsonb_build_object('sybil_score', ugr.sybil_score)
from public.user_global_reputation ugr
where ugr.sybil_score >= 70
  and not exists (
    select 1
    from public.review_flags rf
    where rf.source_table = 'user_global_reputation'
      and rf.source_id = ugr.auth_user_id::text
      and rf.flag_type = 'high_sybil_score'
  );

commit;
