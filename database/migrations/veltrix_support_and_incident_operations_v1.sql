-- VYNTRO support, incident communications, and status operations v1
-- Run this migration manually in the Supabase SQL editor before deploying the first Phase 11 tranche.

begin;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_ref text not null,
  auth_user_id uuid,
  customer_account_id uuid references public.customer_accounts(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  linked_incident_id uuid,
  source_origin text not null default 'web_public',
  ticket_type text not null,
  priority text not null default 'normal',
  status text not null default 'new',
  waiting_state text not null default 'none',
  escalation_state text not null default 'none',
  subject text not null,
  message text not null,
  requester_name text not null default ''::text,
  requester_email text not null default ''::text,
  assigned_admin_auth_user_id uuid,
  latest_customer_update_at timestamp with time zone,
  latest_internal_update_at timestamp with time zone,
  first_response_at timestamp with time zone,
  resolved_at timestamp with time zone,
  closed_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint support_tickets_ticket_ref_key unique (ticket_ref),
  constraint support_tickets_source_origin_check
    check (source_origin in ('web_public', 'web_authenticated', 'portal_internal', 'system')),
  constraint support_tickets_ticket_type_check
    check (
      ticket_type in (
        'product_question',
        'technical_issue',
        'billing_issue',
        'account_access',
        'reward_or_claim_issue',
        'trust_or_abuse_report',
        'provider_or_integration_issue',
        'general_request'
      )
    ),
  constraint support_tickets_priority_check
    check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint support_tickets_status_check
    check (status in ('new', 'triaging', 'waiting_on_customer', 'waiting_on_internal', 'escalated', 'resolved', 'closed')),
  constraint support_tickets_waiting_state_check
    check (waiting_state in ('none', 'customer', 'internal', 'provider')),
  constraint support_tickets_escalation_state_check
    check (escalation_state in ('none', 'watching', 'escalated', 'handoff_open'))
);

create index if not exists idx_support_tickets_status_created_at
  on public.support_tickets (status, created_at desc);

create index if not exists idx_support_tickets_ticket_type_created_at
  on public.support_tickets (ticket_type, created_at desc);

create index if not exists idx_support_tickets_customer_account_id
  on public.support_tickets (customer_account_id, created_at desc);

create index if not exists idx_support_tickets_project_id
  on public.support_tickets (project_id, created_at desc);

create index if not exists idx_support_tickets_assigned_admin_auth_user_id
  on public.support_tickets (assigned_admin_auth_user_id, updated_at desc);

create table if not exists public.support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  support_ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  event_type text not null,
  visibility_scope text not null default 'internal',
  actor_auth_user_id uuid,
  title text,
  body text not null default ''::text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint support_ticket_events_event_type_check
    check (
      event_type in (
        'ticket_created',
        'status_changed',
        'claimed',
        'internal_note',
        'customer_update',
        'handoff_created',
        'incident_linked',
        'resolved',
        'closed',
        'reopened'
      )
    ),
  constraint support_ticket_events_visibility_scope_check
    check (visibility_scope in ('internal', 'customer', 'both'))
);

create index if not exists idx_support_ticket_events_ticket_created_at
  on public.support_ticket_events (support_ticket_id, created_at desc);

create index if not exists idx_support_ticket_events_visibility_created_at
  on public.support_ticket_events (visibility_scope, created_at desc);

create table if not exists public.support_ticket_handoffs (
  id uuid primary key default gen_random_uuid(),
  support_ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  customer_account_id uuid references public.customer_accounts(id) on delete set null,
  target_project_id uuid references public.projects(id) on delete set null,
  handoff_type text not null,
  status text not null default 'open',
  target_record_id text,
  target_route text,
  summary text not null default ''::text,
  owner_auth_user_id uuid,
  created_by_auth_user_id uuid,
  accepted_at timestamp with time zone,
  resolved_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint support_ticket_handoffs_type_check
    check (handoff_type in ('billing', 'trust', 'payout', 'onchain', 'product_ops', 'general_support')),
  constraint support_ticket_handoffs_status_check
    check (status in ('open', 'accepted', 'resolved', 'canceled'))
);

create index if not exists idx_support_ticket_handoffs_ticket_created_at
  on public.support_ticket_handoffs (support_ticket_id, created_at desc);

create index if not exists idx_support_ticket_handoffs_type_status
  on public.support_ticket_handoffs (handoff_type, status, created_at desc);

create index if not exists idx_support_ticket_handoffs_project_type
  on public.support_ticket_handoffs (target_project_id, handoff_type, created_at desc);

create index if not exists idx_support_ticket_handoffs_customer_account_type
  on public.support_ticket_handoffs (customer_account_id, handoff_type, created_at desc);

create table if not exists public.service_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_ref text not null,
  title text not null,
  component_key text not null,
  severity text not null default 'minor',
  impact_scope text not null default 'degraded',
  state text not null default 'investigating',
  public_summary text not null default ''::text,
  internal_summary text not null default ''::text,
  public_visible boolean not null default true,
  declared_by_auth_user_id uuid,
  owner_auth_user_id uuid,
  opened_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint service_incidents_incident_ref_key unique (incident_ref),
  constraint service_incidents_severity_check
    check (severity in ('minor', 'major', 'critical')),
  constraint service_incidents_impact_scope_check
    check (impact_scope in ('degraded', 'partial_outage', 'major_outage', 'maintenance')),
  constraint service_incidents_state_check
    check (state in ('investigating', 'identified', 'monitoring', 'resolved'))
);

create index if not exists idx_service_incidents_state_updated_at
  on public.service_incidents (state, updated_at desc);

create index if not exists idx_service_incidents_public_visible_updated_at
  on public.service_incidents (public_visible, updated_at desc);

create index if not exists idx_service_incidents_component_key_updated_at
  on public.service_incidents (component_key, updated_at desc);

create table if not exists public.service_incident_updates (
  id uuid primary key default gen_random_uuid(),
  service_incident_id uuid not null references public.service_incidents(id) on delete cascade,
  update_type text not null,
  visibility_scope text not null default 'internal',
  incident_state text,
  component_status text,
  title text,
  message text not null default ''::text,
  actor_auth_user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint service_incident_updates_update_type_check
    check (update_type in ('state_change', 'public_update', 'internal_note')),
  constraint service_incident_updates_visibility_scope_check
    check (visibility_scope in ('internal', 'public', 'both')),
  constraint service_incident_updates_incident_state_check
    check (incident_state is null or incident_state in ('investigating', 'identified', 'monitoring', 'resolved')),
  constraint service_incident_updates_component_status_check
    check (component_status is null or component_status in ('operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance'))
);

create index if not exists idx_service_incident_updates_incident_created_at
  on public.service_incident_updates (service_incident_id, created_at desc);

create index if not exists idx_service_incident_updates_visibility_created_at
  on public.service_incident_updates (visibility_scope, created_at desc);

create table if not exists public.service_status_snapshots (
  id uuid primary key default gen_random_uuid(),
  component_key text not null,
  component_label text not null,
  status text not null default 'operational',
  summary text not null default ''::text,
  public_message text not null default ''::text,
  service_incident_id uuid references public.service_incidents(id) on delete set null,
  snapshot_source text not null default 'system',
  is_public boolean not null default true,
  created_by_auth_user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint service_status_snapshots_status_check
    check (status in ('operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance')),
  constraint service_status_snapshots_snapshot_source_check
    check (snapshot_source in ('system', 'incident_command', 'manual'))
);

create index if not exists idx_service_status_snapshots_component_key_created_at
  on public.service_status_snapshots (component_key, created_at desc);

create index if not exists idx_service_status_snapshots_public_created_at
  on public.service_status_snapshots (is_public, created_at desc);

insert into public.service_status_snapshots (
  component_key,
  component_label,
  status,
  summary,
  public_message,
  snapshot_source,
  is_public,
  metadata
)
select *
from (
  values
    ('platform', 'Platform', 'operational', 'Core platform services are operating normally.', 'All systems are operating normally.', 'system', true, jsonb_build_object('seed', true)),
    ('auth', 'Authentication', 'operational', 'Authentication and session services are operating normally.', 'Authentication is operating normally.', 'system', true, jsonb_build_object('seed', true)),
    ('portal', 'Admin portal', 'operational', 'The admin portal is operating normally.', 'Admin portal is operating normally.', 'system', true, jsonb_build_object('seed', true)),
    ('member_app', 'Member app', 'operational', 'The member webapp is operating normally.', 'Member app is operating normally.', 'system', true, jsonb_build_object('seed', true)),
    ('billing', 'Billing', 'operational', 'Billing, checkout and invoice sync are operating normally.', 'Billing is operating normally.', 'system', true, jsonb_build_object('seed', true)),
    ('community', 'Community delivery', 'operational', 'Community delivery rails are operating normally.', 'Community delivery is operating normally.', 'system', true, jsonb_build_object('seed', true)),
    ('verification', 'Verification', 'operational', 'Verification and proof processing are operating normally.', 'Verification is operating normally.', 'system', true, jsonb_build_object('seed', true)),
    ('trust', 'Trust operations', 'operational', 'Trust operations are operating normally.', 'Trust operations are operating normally.', 'system', true, jsonb_build_object('seed', true)),
    ('payouts', 'Payouts', 'operational', 'Reward claims and payout rails are operating normally.', 'Payouts are operating normally.', 'system', true, jsonb_build_object('seed', true)),
    ('onchain', 'On-chain', 'operational', 'On-chain ingest and recovery rails are operating normally.', 'On-chain services are operating normally.', 'system', true, jsonb_build_object('seed', true))
) as seed(component_key, component_label, status, summary, public_message, snapshot_source, is_public, metadata)
where not exists (
  select 1
  from public.service_status_snapshots existing
  where existing.component_key = seed.component_key
);

alter table public.support_tickets
  add constraint support_tickets_linked_incident_id_fkey
  foreign key (linked_incident_id) references public.service_incidents(id) on delete set null;

commit;
