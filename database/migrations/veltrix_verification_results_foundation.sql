begin;

create table if not exists public.verification_results (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  project_id uuid references public.projects(id) on delete set null,
  quest_id uuid references public.quests(id) on delete set null,
  source_table text not null,
  source_id uuid not null,
  verification_type text not null default 'manual_review',
  route text not null default 'manual_review',
  decision_status text not null default 'pending',
  decision_reason text not null default '',
  confidence_score integer not null default 50,
  required_config_keys text[] not null default '{}'::text[],
  missing_config_keys text[] not null default '{}'::text[],
  duplicate_signal_types text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_verification_results_source
  on public.verification_results (source_table, source_id);

create index if not exists idx_verification_results_project
  on public.verification_results (project_id, created_at desc);

create index if not exists idx_verification_results_status
  on public.verification_results (decision_status, created_at desc);

alter table public.verification_results enable row level security;

create policy "authenticated read verification results"
on public.verification_results
for select
to authenticated
using (true);

create policy "authenticated insert verification results"
on public.verification_results
for insert
to authenticated
with check (true);

create policy "authenticated update verification results"
on public.verification_results
for update
to authenticated
using (true)
with check (true);

commit;
