-- VYNTRO QA, release engineering, and environment discipline v1
-- Run this migration manually in the Supabase SQL editor before deploying the first Phase 15 tranche.

begin;

create table if not exists public.release_runs (
  id uuid primary key default gen_random_uuid(),
  release_ref text not null unique,
  title text not null,
  summary text not null default ''::text,
  target_environment text not null default 'production',
  state text not null default 'draft',
  decision text not null default 'undecided',
  decision_notes text not null default ''::text,
  blocker_summary text not null default ''::text,
  rollback_notes text not null default ''::text,
  owner_auth_user_id uuid,
  approved_at timestamp with time zone,
  deploying_at timestamp with time zone,
  verified_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint release_runs_target_environment_check
    check (target_environment in ('local', 'preview', 'production')),
  constraint release_runs_state_check
    check (state in ('draft', 'ready_for_review', 'approved', 'deploying', 'smoke_pending', 'verified', 'degraded', 'rolled_back')),
  constraint release_runs_decision_check
    check (decision in ('undecided', 'go', 'no_go', 'watch'))
);

create index if not exists idx_release_runs_state_created
  on public.release_runs (state, created_at desc);

create index if not exists idx_release_runs_target_environment
  on public.release_runs (target_environment, created_at desc);

create table if not exists public.release_run_services (
  id uuid primary key default gen_random_uuid(),
  release_run_id uuid not null references public.release_runs(id) on delete cascade,
  service_key text not null,
  inclusion_status text not null default 'included',
  gate_mode text not null default 'light',
  deploy_status text not null default 'pending',
  version_label text,
  notes text not null default ''::text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint release_run_services_service_key_check
    check (service_key in ('webapp', 'portal', 'docs', 'community_bot')),
  constraint release_run_services_inclusion_status_check
    check (inclusion_status in ('included', 'not_in_scope')),
  constraint release_run_services_gate_mode_check
    check (gate_mode in ('hard', 'light')),
  constraint release_run_services_deploy_status_check
    check (deploy_status in ('pending', 'ready', 'deployed', 'degraded', 'rolled_back')),
  constraint release_run_services_release_key_unique unique (release_run_id, service_key)
);

create index if not exists idx_release_run_services_release
  on public.release_run_services (release_run_id, service_key);

create index if not exists idx_release_run_services_deploy_status
  on public.release_run_services (deploy_status, updated_at desc);

create table if not exists public.release_run_checks (
  id uuid primary key default gen_random_uuid(),
  release_run_id uuid not null references public.release_runs(id) on delete cascade,
  service_key text,
  check_block text not null,
  check_key text not null,
  label text not null,
  result text not null default 'not_run',
  severity text not null default 'P2',
  is_blocking boolean not null default false,
  summary text not null default ''::text,
  next_action text not null default ''::text,
  verified_by_auth_user_id uuid,
  verified_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint release_run_checks_service_key_check
    check (service_key is null or service_key in ('webapp', 'portal', 'docs', 'community_bot')),
  constraint release_run_checks_block_check
    check (check_block in ('scope', 'environment', 'database', 'deploy', 'smoke', 'rollback')),
  constraint release_run_checks_result_check
    check (result in ('not_run', 'passed', 'warning', 'failed')),
  constraint release_run_checks_severity_check
    check (severity in ('P0', 'P1', 'P2', 'P3')),
  constraint release_run_checks_release_key_unique unique (release_run_id, check_key)
);

create index if not exists idx_release_run_checks_release
  on public.release_run_checks (release_run_id, check_block, result);

create index if not exists idx_release_run_checks_blocking
  on public.release_run_checks (release_run_id, is_blocking, result);

create table if not exists public.release_run_smoke_results (
  id uuid primary key default gen_random_uuid(),
  release_run_id uuid not null references public.release_runs(id) on delete cascade,
  service_key text,
  smoke_category text not null,
  scenario_key text not null,
  scenario_label text not null,
  result text not null default 'not_run',
  notes text not null default ''::text,
  verified_by_auth_user_id uuid,
  verified_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint release_run_smoke_results_service_key_check
    check (service_key is null or service_key in ('webapp', 'portal', 'docs', 'community_bot')),
  constraint release_run_smoke_results_category_check
    check (
      smoke_category in (
        'auth_and_entry',
        'billing_and_account',
        'support_and_status',
        'security_and_trust',
        'success_and_analytics',
        'docs_and_public_surfaces',
        'community_bot_readiness'
      )
    ),
  constraint release_run_smoke_results_result_check
    check (result in ('not_run', 'passed', 'warning', 'failed')),
  constraint release_run_smoke_results_release_key_unique unique (release_run_id, scenario_key)
);

create index if not exists idx_release_run_smoke_results_release
  on public.release_run_smoke_results (release_run_id, smoke_category, result);

create table if not exists public.environment_audits (
  id uuid primary key default gen_random_uuid(),
  release_run_id uuid not null references public.release_runs(id) on delete cascade,
  service_key text not null,
  target_environment text not null,
  status text not null default 'not_reviewed',
  summary text not null default ''::text,
  required_keys text[] not null default '{}'::text[],
  missing_keys text[] not null default '{}'::text[],
  mismatch_notes text[] not null default '{}'::text[],
  verified_by_auth_user_id uuid,
  verified_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint environment_audits_service_key_check
    check (service_key in ('webapp', 'portal', 'docs', 'community_bot')),
  constraint environment_audits_target_environment_check
    check (target_environment in ('local', 'preview', 'production')),
  constraint environment_audits_status_check
    check (status in ('not_reviewed', 'ready', 'warning', 'critical')),
  constraint environment_audits_release_key_unique unique (release_run_id, service_key)
);

create index if not exists idx_environment_audits_release
  on public.environment_audits (release_run_id, status);

create table if not exists public.migration_release_links (
  id uuid primary key default gen_random_uuid(),
  release_run_id uuid not null references public.release_runs(id) on delete cascade,
  migration_filename text not null,
  review_state text not null default 'not_reviewed',
  run_state text not null default 'pending',
  mitigation_notes text not null default ''::text,
  reviewed_by_auth_user_id uuid,
  reviewed_at timestamp with time zone,
  executed_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint migration_release_links_review_state_check
    check (review_state in ('not_reviewed', 'reviewed', 'approved')),
  constraint migration_release_links_run_state_check
    check (run_state in ('not_needed', 'pending', 'run', 'blocked')),
  constraint migration_release_links_release_filename_unique unique (release_run_id, migration_filename)
);

create index if not exists idx_migration_release_links_release
  on public.migration_release_links (release_run_id, review_state, run_state);

commit;
