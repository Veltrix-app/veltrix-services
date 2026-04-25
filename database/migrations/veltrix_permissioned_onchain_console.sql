-- VYNTRO Permissioned On-chain Console
-- Run this migration manually in the Supabase SQL editor before deploying the first on-chain observability tranche.

begin;

create table if not exists public.onchain_cases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  auth_user_id uuid,
  wallet_address text,
  asset_id uuid references public.project_assets(id) on delete set null,
  case_type text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  source_type text not null default 'manual',
  source_id text,
  dedupe_key text not null,
  summary text not null,
  evidence_summary text,
  raw_payload jsonb not null default '{}'::jsonb,
  internal_owner_auth_user_id uuid,
  project_owner_auth_user_id uuid,
  resolution_notes text,
  escalation_state text not null default 'none',
  metadata jsonb not null default '{}'::jsonb,
  opened_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  dismissed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint onchain_cases_case_type_check
    check (case_type in (
      'ingress_rejected',
      'ingress_retry_failed',
      'enrichment_failed',
      'provider_sync_failure',
      'unmatched_project_asset',
      'unlinked_wallet_activity',
      'suspicious_onchain_pattern',
      'manual_onchain_review'
    )),
  constraint onchain_cases_severity_check
    check (severity in ('low', 'medium', 'high', 'critical')),
  constraint onchain_cases_status_check
    check (status in ('open', 'triaging', 'needs_project_input', 'blocked', 'retry_queued', 'resolved', 'dismissed')),
  constraint onchain_cases_source_type_check
    check (source_type in ('onchain_ingress', 'onchain_event', 'provider_sync', 'wallet_link', 'tracked_asset', 'manual', 'project_escalation')),
  constraint onchain_cases_escalation_state_check
    check (escalation_state in ('none', 'awaiting_internal', 'awaiting_project', 'escalated'))
);

create unique index if not exists idx_onchain_cases_project_dedupe_key
  on public.onchain_cases (project_id, dedupe_key);

create index if not exists idx_onchain_cases_project_status_severity_created
  on public.onchain_cases (project_id, status, severity, created_at desc);

create index if not exists idx_onchain_cases_project_auth_user
  on public.onchain_cases (project_id, auth_user_id, updated_at desc);

create index if not exists idx_onchain_cases_project_wallet_address
  on public.onchain_cases (project_id, wallet_address, updated_at desc);

create index if not exists idx_onchain_cases_project_asset
  on public.onchain_cases (project_id, asset_id, updated_at desc);

create index if not exists idx_onchain_cases_project_source
  on public.onchain_cases (project_id, source_type, source_id);

create table if not exists public.onchain_case_events (
  id uuid primary key default gen_random_uuid(),
  onchain_case_id uuid not null references public.onchain_cases(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null,
  visibility_scope text not null default 'internal',
  actor_auth_user_id uuid,
  actor_role text,
  summary text,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint onchain_case_events_event_type_check
    check (event_type in (
      'case_opened',
      'case_refreshed',
      'annotated',
      'retry_queued',
      'retry_completed',
      'retry_failed',
      'project_input_requested',
      'asset_rescan_queued',
      'enrichment_rerun_queued',
      'escalated',
      'resolved',
      'dismissed',
      'permission_updated'
    )),
  constraint onchain_case_events_visibility_scope_check
    check (visibility_scope in ('internal', 'project', 'both'))
);

create index if not exists idx_onchain_case_events_case_created
  on public.onchain_case_events (onchain_case_id, created_at desc);

create index if not exists idx_onchain_case_events_project_created
  on public.onchain_case_events (project_id, created_at desc);

create table if not exists public.project_onchain_permissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  subject_auth_user_id uuid not null,
  visibility_permissions text[] not null default '{}'::text[],
  action_permissions text[] not null default '{}'::text[],
  preset_key text,
  status text not null default 'active',
  notes text,
  granted_by_auth_user_id uuid,
  updated_by_auth_user_id uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint project_onchain_permissions_status_check
    check (status in ('active', 'revoked'))
);

create unique index if not exists idx_project_onchain_permissions_project_subject
  on public.project_onchain_permissions (project_id, subject_auth_user_id);

create index if not exists idx_project_onchain_permissions_project_status_updated
  on public.project_onchain_permissions (project_id, status, updated_at desc);

alter table public.onchain_cases enable row level security;
alter table public.onchain_case_events enable row level security;
alter table public.project_onchain_permissions enable row level security;

drop policy if exists "onchain cases select" on public.onchain_cases;
drop policy if exists "onchain cases mutate" on public.onchain_cases;
create policy "onchain cases select"
on public.onchain_cases
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);
create policy "onchain cases mutate"
on public.onchain_cases
for all
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
)
with check (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);

drop policy if exists "onchain case events select" on public.onchain_case_events;
drop policy if exists "onchain case events mutate" on public.onchain_case_events;
create policy "onchain case events select"
on public.onchain_case_events
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);
create policy "onchain case events mutate"
on public.onchain_case_events
for all
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
)
with check (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);

drop policy if exists "project onchain permissions select" on public.project_onchain_permissions;
drop policy if exists "project onchain permissions mutate" on public.project_onchain_permissions;
create policy "project onchain permissions select"
on public.project_onchain_permissions
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);
create policy "project onchain permissions mutate"
on public.project_onchain_permissions
for all
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
)
with check (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);

commit;
