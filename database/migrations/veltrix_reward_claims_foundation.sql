begin;

alter table public.reward_claims
  add column if not exists status text not null default 'pending',
  add column if not exists fulfillment_notes text not null default '',
  add column if not exists delivery_payload jsonb not null default '{}'::jsonb,
  add column if not exists reviewed_at timestamp with time zone,
  add column if not exists updated_at timestamp with time zone not null default now();

create index if not exists idx_reward_claims_status
  on public.reward_claims (status);

create index if not exists idx_reward_claims_updated_at
  on public.reward_claims (updated_at desc);

update public.reward_claims
set status = coalesce(status, 'pending'),
    updated_at = coalesce(updated_at, created_at, now())
where status is distinct from coalesce(status, 'pending')
   or updated_at is null;

commit;
