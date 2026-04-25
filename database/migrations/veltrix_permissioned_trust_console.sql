-- VYNTRO Permissioned Trust Console
-- Run this migration manually in the Supabase SQL editor before deploying the first Phase 6 trust console tranche.

begin;

create table if not exists public.trust_cases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  auth_user_id uuid,
  wallet_address text,
  case_type text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  source_type text not null default 'manual',
  source_id text,
  dedupe_key text not null,
  summary text not null,
  evidence_summary text,
  raw_signal_payload jsonb not null default '{}'::jsonb,
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
  constraint trust_cases_case_type_check
    check (case_type in (
      'sybil_suspicion',
      'referral_abuse',
      'fake_engagement',
      'wallet_anomaly',
      'trust_drop',
      'reward_trust_risk',
      'manual_review'
    )),
  constraint trust_cases_severity_check
    check (severity in ('low', 'medium', 'high', 'critical')),
  constraint trust_cases_status_check
    check (status in ('open', 'triaging', 'needs_project_input', 'escalated', 'resolved', 'dismissed')),
  constraint trust_cases_source_type_check
    check (source_type in ('review_flag', 'trust_snapshot', 'onchain_signal', 'manual', 'project_escalation')),
  constraint trust_cases_escalation_state_check
    check (escalation_state in ('none', 'awaiting_internal', 'awaiting_project', 'escalated'))
);

create unique index if not exists idx_trust_cases_project_dedupe_key
  on public.trust_cases (project_id, dedupe_key);

create index if not exists idx_trust_cases_project_status_severity_created
  on public.trust_cases (project_id, status, severity, created_at desc);

create index if not exists idx_trust_cases_project_auth_user
  on public.trust_cases (project_id, auth_user_id, created_at desc);

create index if not exists idx_trust_cases_project_source
  on public.trust_cases (project_id, source_type, source_id);

create table if not exists public.trust_case_events (
  id uuid primary key default gen_random_uuid(),
  trust_case_id uuid not null references public.trust_cases(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null,
  visibility_scope text not null default 'internal',
  actor_auth_user_id uuid,
  actor_role text,
  summary text,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint trust_case_events_event_type_check
    check (event_type in (
      'case_opened',
      'case_refreshed',
      'annotated',
      'escalated',
      'project_input_requested',
      'dismissed',
      'resolved',
      'trust_override_applied',
      'reward_override_applied',
      'permission_updated'
    )),
  constraint trust_case_events_visibility_scope_check
    check (visibility_scope in ('internal', 'project', 'both'))
);

create index if not exists idx_trust_case_events_case_created
  on public.trust_case_events (trust_case_id, created_at desc);

create index if not exists idx_trust_case_events_project_created
  on public.trust_case_events (project_id, created_at desc);

create table if not exists public.project_trust_permissions (
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
  constraint project_trust_permissions_status_check
    check (status in ('active', 'revoked'))
);

create unique index if not exists idx_project_trust_permissions_project_subject
  on public.project_trust_permissions (project_id, subject_auth_user_id);

create index if not exists idx_project_trust_permissions_project_status_updated
  on public.project_trust_permissions (project_id, status, updated_at desc);

alter table public.trust_cases enable row level security;
alter table public.trust_case_events enable row level security;
alter table public.project_trust_permissions enable row level security;

drop policy if exists "trust cases select" on public.trust_cases;
drop policy if exists "trust cases mutate" on public.trust_cases;
create policy "trust cases select"
on public.trust_cases
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);
create policy "trust cases mutate"
on public.trust_cases
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

drop policy if exists "trust case events select" on public.trust_case_events;
drop policy if exists "trust case events mutate" on public.trust_case_events;
create policy "trust case events select"
on public.trust_case_events
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);
create policy "trust case events mutate"
on public.trust_case_events
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

drop policy if exists "project trust permissions select" on public.project_trust_permissions;
drop policy if exists "project trust permissions mutate" on public.project_trust_permissions;
create policy "project trust permissions select"
on public.project_trust_permissions
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);
create policy "project trust permissions mutate"
on public.project_trust_permissions
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
