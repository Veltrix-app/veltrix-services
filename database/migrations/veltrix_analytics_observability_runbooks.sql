-- VYNTRO Analytics, Observability, and Runbooks
-- Run this migration manually in the Supabase SQL editor before deploying the first Phase 7 tranche.

begin;

create table if not exists public.platform_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null,
  metric_section text not null,
  metric_scope text not null default 'platform',
  snapshot_date date not null,
  window_start timestamp with time zone,
  window_end timestamp with time zone,
  metric_value numeric(18,4) not null default 0,
  previous_value numeric(18,4),
  unit text not null default 'count',
  health_state text not null default 'healthy',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint platform_metric_snapshots_scope_check
    check (metric_scope = 'platform'),
  constraint platform_metric_snapshots_section_check
    check (metric_section in ('activation', 'readiness', 'community', 'rewards', 'trust', 'onchain', 'automation', 'operations')),
  constraint platform_metric_snapshots_unit_check
    check (unit in ('count', 'percent', 'score')),
  constraint platform_metric_snapshots_health_check
    check (health_state in ('healthy', 'watch', 'warning', 'critical'))
);

create unique index if not exists idx_platform_metric_snapshots_key_date
  on public.platform_metric_snapshots (metric_key, snapshot_date);

create index if not exists idx_platform_metric_snapshots_section_date
  on public.platform_metric_snapshots (metric_section, snapshot_date desc);

create table if not exists public.project_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  metric_key text not null,
  metric_section text not null,
  metric_scope text not null default 'project',
  snapshot_date date not null,
  window_start timestamp with time zone,
  window_end timestamp with time zone,
  metric_value numeric(18,4) not null default 0,
  previous_value numeric(18,4),
  unit text not null default 'count',
  health_state text not null default 'healthy',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint project_metric_snapshots_scope_check
    check (metric_scope = 'project'),
  constraint project_metric_snapshots_section_check
    check (metric_section in ('activation', 'readiness', 'community', 'rewards', 'trust', 'onchain', 'automation', 'operations')),
  constraint project_metric_snapshots_unit_check
    check (unit in ('count', 'percent', 'score')),
  constraint project_metric_snapshots_health_check
    check (health_state in ('healthy', 'watch', 'warning', 'critical'))
);

create unique index if not exists idx_project_metric_snapshots_project_key_date
  on public.project_metric_snapshots (project_id, metric_key, snapshot_date);

create index if not exists idx_project_metric_snapshots_project_section_date
  on public.project_metric_snapshots (project_id, metric_section, snapshot_date desc);

create table if not exists public.support_escalations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  source_surface text not null,
  source_type text not null,
  source_id text not null,
  dedupe_key text not null,
  title text not null,
  summary text,
  severity text not null default 'medium',
  status text not null default 'open',
  waiting_on text not null default 'internal',
  owner_auth_user_id uuid,
  opened_by_auth_user_id uuid,
  resolved_by_auth_user_id uuid,
  next_action_summary text,
  resolution_notes text,
  metadata jsonb not null default '{}'::jsonb,
  opened_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  dismissed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint support_escalations_severity_check
    check (severity in ('low', 'medium', 'high', 'critical')),
  constraint support_escalations_status_check
    check (status in ('open', 'triaging', 'waiting_internal', 'waiting_project', 'waiting_provider', 'blocked', 'resolved', 'dismissed')),
  constraint support_escalations_waiting_on_check
    check (waiting_on in ('internal', 'project', 'provider', 'deploy', 'none'))
);

create unique index if not exists idx_support_escalations_dedupe_key
  on public.support_escalations (dedupe_key);

create index if not exists idx_support_escalations_status_severity_updated
  on public.support_escalations (status, severity, updated_at desc);

create index if not exists idx_support_escalations_project_status_updated
  on public.support_escalations (project_id, status, updated_at desc);

commit;
