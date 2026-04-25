-- VYNTRO Permissioned Payout Console
-- Run this migration manually in the Supabase SQL editor before deploying the first payout safety tranche.

begin;

create table if not exists public.payout_cases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  reward_id uuid references public.rewards(id) on delete set null,
  claim_id uuid references public.reward_claims(id) on delete set null,
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
  constraint payout_cases_case_type_check
    check (case_type in (
      'claim_review',
      'claim_blocked',
      'delivery_failure',
      'reward_inventory_risk',
      'campaign_finalization_failure',
      'payout_dispute',
      'manual_payout_review'
    )),
  constraint payout_cases_severity_check
    check (severity in ('low', 'medium', 'high', 'critical')),
  constraint payout_cases_status_check
    check (status in ('open', 'triaging', 'needs_project_input', 'blocked', 'retry_queued', 'resolved', 'dismissed')),
  constraint payout_cases_source_type_check
    check (source_type in ('reward_claim', 'reward_distribution', 'campaign_finalization', 'reward_inventory', 'manual')),
  constraint payout_cases_escalation_state_check
    check (escalation_state in ('none', 'awaiting_internal', 'awaiting_project', 'escalated'))
);

create unique index if not exists idx_payout_cases_project_dedupe_key
  on public.payout_cases (project_id, dedupe_key);

create index if not exists idx_payout_cases_project_status_severity_created
  on public.payout_cases (project_id, status, severity, created_at desc);

create index if not exists idx_payout_cases_project_claim
  on public.payout_cases (project_id, claim_id, updated_at desc);

create index if not exists idx_payout_cases_project_campaign
  on public.payout_cases (project_id, campaign_id, updated_at desc);

create index if not exists idx_payout_cases_project_reward
  on public.payout_cases (project_id, reward_id, updated_at desc);

create table if not exists public.payout_case_events (
  id uuid primary key default gen_random_uuid(),
  payout_case_id uuid not null references public.payout_cases(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null,
  visibility_scope text not null default 'internal',
  actor_auth_user_id uuid,
  actor_role text,
  summary text,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint payout_case_events_event_type_check
    check (event_type in (
      'case_opened',
      'case_refreshed',
      'annotated',
      'escalated',
      'project_input_requested',
      'retry_queued',
      'dismissed',
      'resolved',
      'reward_frozen',
      'claim_rail_paused',
      'payout_override_applied',
      'permission_updated'
    )),
  constraint payout_case_events_visibility_scope_check
    check (visibility_scope in ('internal', 'project', 'both'))
);

create index if not exists idx_payout_case_events_case_created
  on public.payout_case_events (payout_case_id, created_at desc);

create index if not exists idx_payout_case_events_project_created
  on public.payout_case_events (project_id, created_at desc);

create table if not exists public.project_payout_permissions (
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
  constraint project_payout_permissions_status_check
    check (status in ('active', 'revoked'))
);

create unique index if not exists idx_project_payout_permissions_project_subject
  on public.project_payout_permissions (project_id, subject_auth_user_id);

create index if not exists idx_project_payout_permissions_project_status_updated
  on public.project_payout_permissions (project_id, status, updated_at desc);

alter table public.payout_cases enable row level security;
alter table public.payout_case_events enable row level security;
alter table public.project_payout_permissions enable row level security;

drop policy if exists "payout cases select" on public.payout_cases;
drop policy if exists "payout cases mutate" on public.payout_cases;
create policy "payout cases select"
on public.payout_cases
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);
create policy "payout cases mutate"
on public.payout_cases
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

drop policy if exists "payout case events select" on public.payout_case_events;
drop policy if exists "payout case events mutate" on public.payout_case_events;
create policy "payout case events select"
on public.payout_case_events
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);
create policy "payout case events mutate"
on public.payout_case_events
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

drop policy if exists "project payout permissions select" on public.project_payout_permissions;
drop policy if exists "project payout permissions mutate" on public.project_payout_permissions;
create policy "project payout permissions select"
on public.project_payout_permissions
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);
create policy "project payout permissions mutate"
on public.project_payout_permissions
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
