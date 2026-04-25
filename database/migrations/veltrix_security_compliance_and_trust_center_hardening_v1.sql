-- VYNTRO security, compliance, and trust-center hardening v1
-- Run this migration manually in the Supabase SQL editor before deploying the first Phase 14 tranche.

begin;

create table if not exists public.customer_account_security_policies (
  customer_account_id uuid primary key references public.customer_accounts(id) on delete cascade,
  policy_status text not null default 'standard',
  sso_required boolean not null default false,
  two_factor_required_for_admins boolean not null default false,
  allowed_auth_methods text[] not null default array['password', 'sso']::text[],
  session_review_required boolean not null default false,
  high_risk_reauth_required boolean not null default false,
  security_contact_email text not null default ''::text,
  notes text not null default ''::text,
  reviewed_by_auth_user_id uuid,
  last_reviewed_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customer_account_security_policies_policy_status_check
    check (policy_status in ('standard', 'enterprise_hardened')),
  constraint customer_account_security_policies_allowed_auth_methods_check
    check (
      allowed_auth_methods <@ array['password', 'sso']::text[]
      and cardinality(allowed_auth_methods) > 0
    )
);

create index if not exists idx_customer_account_security_policies_status
  on public.customer_account_security_policies (policy_status, updated_at desc);

create index if not exists idx_customer_account_security_policies_sso_required
  on public.customer_account_security_policies (sso_required, updated_at desc);

create index if not exists idx_customer_account_security_policies_two_factor_required
  on public.customer_account_security_policies (two_factor_required_for_admins, updated_at desc);

create table if not exists public.customer_account_security_events (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  event_type text not null,
  actor_auth_user_id uuid,
  summary text not null default ''::text,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint customer_account_security_events_event_type_check
    check (
      event_type in (
        'policy_created',
        'policy_updated',
        'sso_required_set',
        'two_factor_enforced',
        'session_review_enabled',
        'data_request_reviewed',
        'security_note_added'
      )
    )
);

create index if not exists idx_customer_account_security_events_account_created
  on public.customer_account_security_events (customer_account_id, created_at desc);

create table if not exists public.user_security_posture (
  auth_user_id uuid primary key,
  primary_customer_account_id uuid references public.customer_accounts(id) on delete set null,
  two_factor_enabled boolean not null default false,
  verified_factor_count integer not null default 0,
  current_aal text not null default 'aal1',
  current_auth_method text not null default 'password',
  sso_managed boolean not null default false,
  recovery_review_state text not null default 'clear',
  risk_posture text not null default 'standard',
  enforcement_state text not null default 'none',
  last_password_recovery_at timestamp with time zone,
  last_reauthentication_at timestamp with time zone,
  last_security_review_at timestamp with time zone,
  last_seen_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_security_posture_current_aal_check
    check (current_aal in ('aal1', 'aal2')),
  constraint user_security_posture_current_auth_method_check
    check (current_auth_method in ('password', 'sso', 'unknown')),
  constraint user_security_posture_recovery_review_state_check
    check (recovery_review_state in ('clear', 'watching', 'review_required')),
  constraint user_security_posture_risk_posture_check
    check (risk_posture in ('standard', 'watching', 'high_risk')),
  constraint user_security_posture_enforcement_state_check
    check (enforcement_state in ('none', 'two_factor_required', 'sso_required', 'blocked'))
);

create index if not exists idx_user_security_posture_primary_account
  on public.user_security_posture (primary_customer_account_id, updated_at desc);

create index if not exists idx_user_security_posture_enforcement_state
  on public.user_security_posture (enforcement_state, updated_at desc);

create table if not exists public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  auth_user_id uuid not null,
  customer_account_id uuid references public.customer_accounts(id) on delete set null,
  email text,
  current_aal text not null default 'aal1',
  primary_auth_method text not null default 'password',
  amr_methods text[] not null default '{}'::text[],
  user_agent text,
  ip_summary text,
  location_summary text,
  status text not null default 'active',
  risk_label text not null default 'normal',
  last_seen_at timestamp with time zone not null default now(),
  revoked_at timestamp with time zone,
  revoked_by_auth_user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint auth_sessions_session_id_key unique (session_id),
  constraint auth_sessions_current_aal_check
    check (current_aal in ('aal1', 'aal2')),
  constraint auth_sessions_primary_auth_method_check
    check (primary_auth_method in ('password', 'sso', 'unknown')),
  constraint auth_sessions_status_check
    check (status in ('active', 'revoked', 'expired', 'challenged')),
  constraint auth_sessions_risk_label_check
    check (risk_label in ('normal', 'watching', 'challenged'))
);

create index if not exists idx_auth_sessions_auth_user_status
  on public.auth_sessions (auth_user_id, status, last_seen_at desc);

create index if not exists idx_auth_sessions_account_status
  on public.auth_sessions (customer_account_id, status, last_seen_at desc);

create table if not exists public.auth_session_events (
  id uuid primary key default gen_random_uuid(),
  auth_session_id uuid not null references public.auth_sessions(id) on delete cascade,
  event_type text not null,
  actor_auth_user_id uuid,
  summary text not null default ''::text,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint auth_session_events_event_type_check
    check (
      event_type in (
        'session_seen',
        'signed_in',
        'revoked',
        'risk_flagged',
        'aal_promoted',
        'signed_out'
      )
    )
);

create index if not exists idx_auth_session_events_session_created
  on public.auth_session_events (auth_session_id, created_at desc);

create table if not exists public.data_access_requests (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid references public.customer_accounts(id) on delete set null,
  auth_user_id uuid,
  request_type text not null,
  status text not null default 'submitted',
  verification_state text not null default 'pending',
  requester_email text not null default ''::text,
  summary text not null default ''::text,
  review_notes text not null default ''::text,
  reviewed_by_auth_user_id uuid,
  approved_by_auth_user_id uuid,
  completed_by_auth_user_id uuid,
  requested_at timestamp with time zone not null default now(),
  reviewed_at timestamp with time zone,
  completed_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint data_access_requests_request_type_check
    check (request_type in ('export', 'delete')),
  constraint data_access_requests_status_check
    check (status in ('submitted', 'in_review', 'awaiting_verification', 'approved', 'rejected', 'completed')),
  constraint data_access_requests_verification_state_check
    check (verification_state in ('pending', 'verified', 'rejected', 'not_needed'))
);

create index if not exists idx_data_access_requests_status_created
  on public.data_access_requests (status, created_at desc);

create index if not exists idx_data_access_requests_account_status
  on public.data_access_requests (customer_account_id, status, created_at desc);

create table if not exists public.data_access_request_events (
  id uuid primary key default gen_random_uuid(),
  data_access_request_id uuid not null references public.data_access_requests(id) on delete cascade,
  event_type text not null,
  actor_auth_user_id uuid,
  summary text not null default ''::text,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint data_access_request_events_event_type_check
    check (
      event_type in (
        'submitted',
        'status_changed',
        'verification_requested',
        'verification_completed',
        'note_added',
        'completed'
      )
    )
);

create index if not exists idx_data_access_request_events_request_created
  on public.data_access_request_events (data_access_request_id, created_at desc);

create table if not exists public.compliance_controls (
  id uuid primary key default gen_random_uuid(),
  control_key text not null,
  title text not null,
  summary text not null default ''::text,
  control_area text not null,
  control_state text not null default 'implemented',
  review_state text not null default 'reviewed',
  owner_label text not null default ''::text,
  cadence text not null default 'quarterly',
  evidence_summary text not null default ''::text,
  last_reviewed_at timestamp with time zone,
  next_review_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint compliance_controls_control_key_key unique (control_key),
  constraint compliance_controls_control_area_check
    check (
      control_area in (
        'identity',
        'session_security',
        'data_lifecycle',
        'vendor_management',
        'incident_response',
        'backup_recovery',
        'policy'
      )
    ),
  constraint compliance_controls_control_state_check
    check (control_state in ('implemented', 'monitoring', 'needs_work', 'planned')),
  constraint compliance_controls_review_state_check
    check (review_state in ('reviewed', 'attention_needed', 'scheduled')),
  constraint compliance_controls_cadence_check
    check (cadence in ('monthly', 'quarterly', 'annual', 'ad_hoc'))
);

create index if not exists idx_compliance_controls_state_review
  on public.compliance_controls (control_state, review_state, next_review_at asc);

create table if not exists public.compliance_evidence_items (
  id uuid primary key default gen_random_uuid(),
  compliance_control_id uuid not null references public.compliance_controls(id) on delete cascade,
  evidence_type text not null,
  title text not null,
  summary text not null default ''::text,
  evidence_url text,
  created_by_auth_user_id uuid,
  verified_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint compliance_evidence_items_evidence_type_check
    check (evidence_type in ('note', 'document', 'link', 'drill', 'audit_log', 'screenshot'))
);

create index if not exists idx_compliance_evidence_items_control_created
  on public.compliance_evidence_items (compliance_control_id, created_at desc);

create table if not exists public.security_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_ref text not null,
  customer_account_id uuid references public.customer_accounts(id) on delete set null,
  title text not null,
  severity text not null default 'medium',
  state text not null default 'open',
  scope_summary text not null default ''::text,
  public_summary text not null default ''::text,
  internal_summary text not null default ''::text,
  owner_auth_user_id uuid,
  declared_by_auth_user_id uuid,
  opened_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  postmortem_due_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint security_incidents_incident_ref_key unique (incident_ref),
  constraint security_incidents_severity_check
    check (severity in ('low', 'medium', 'high', 'critical')),
  constraint security_incidents_state_check
    check (state in ('open', 'triaging', 'contained', 'monitoring', 'resolved', 'postmortem_due'))
);

create index if not exists idx_security_incidents_state_updated
  on public.security_incidents (state, updated_at desc);

create index if not exists idx_security_incidents_account_state
  on public.security_incidents (customer_account_id, state, updated_at desc);

create table if not exists public.security_incident_events (
  id uuid primary key default gen_random_uuid(),
  security_incident_id uuid not null references public.security_incidents(id) on delete cascade,
  event_type text not null,
  visibility_scope text not null default 'internal',
  actor_auth_user_id uuid,
  title text,
  message text not null default ''::text,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint security_incident_events_event_type_check
    check (
      event_type in (
        'incident_opened',
        'state_changed',
        'internal_note',
        'public_note',
        'contained',
        'resolved',
        'postmortem_logged'
      )
    ),
  constraint security_incident_events_visibility_scope_check
    check (visibility_scope in ('internal', 'public', 'both'))
);

create index if not exists idx_security_incident_events_incident_created
  on public.security_incident_events (security_incident_id, created_at desc);

create table if not exists public.customer_account_sso_connections (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  provider_label text not null default ''::text,
  provider_type text not null default 'saml',
  supabase_provider_id text,
  status text not null default 'draft',
  configured_by_auth_user_id uuid,
  enabled_at timestamp with time zone,
  disabled_at timestamp with time zone,
  last_tested_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customer_account_sso_connections_provider_type_check
    check (provider_type in ('saml')),
  constraint customer_account_sso_connections_status_check
    check (status in ('draft', 'active', 'disabled'))
);

create unique index if not exists idx_customer_account_sso_connections_provider_id
  on public.customer_account_sso_connections (supabase_provider_id)
  where supabase_provider_id is not null;

create index if not exists idx_customer_account_sso_connections_account_status
  on public.customer_account_sso_connections (customer_account_id, status, updated_at desc);

create table if not exists public.customer_account_sso_domains (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  customer_account_sso_connection_id uuid not null references public.customer_account_sso_connections(id) on delete cascade,
  domain text not null,
  is_primary boolean not null default false,
  verification_status text not null default 'unverified',
  verified_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customer_account_sso_domains_domain_key unique (domain),
  constraint customer_account_sso_domains_verification_status_check
    check (verification_status in ('unverified', 'verified', 'blocked'))
);

create index if not exists idx_customer_account_sso_domains_account_status
  on public.customer_account_sso_domains (customer_account_id, verification_status, updated_at desc);

create table if not exists public.subprocessors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default ''::text,
  purpose text not null default ''::text,
  data_scope text[] not null default '{}'::text[],
  region_scope text[] not null default '{}'::text[],
  website_url text not null default ''::text,
  status text not null default 'active',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint subprocessors_name_key unique (name),
  constraint subprocessors_status_check
    check (status in ('active', 'planned', 'retired'))
);

create index if not exists idx_subprocessors_status_sort_order
  on public.subprocessors (status, sort_order asc, name asc);

insert into public.customer_account_security_policies (
  customer_account_id,
  policy_status,
  sso_required,
  two_factor_required_for_admins,
  allowed_auth_methods,
  session_review_required,
  high_risk_reauth_required,
  security_contact_email,
  notes,
  last_reviewed_at,
  metadata
)
select
  ca.id,
  case
    when coalesce(bp.is_enterprise, false) or cas.status = 'enterprise_managed'
      then 'enterprise_hardened'
    else 'standard'
  end,
  coalesce(bp.is_enterprise, false) or cas.status = 'enterprise_managed',
  coalesce(bp.is_enterprise, false) or cas.status = 'enterprise_managed',
  array['password', 'sso']::text[],
  coalesce(bp.is_enterprise, false) or cas.status = 'enterprise_managed',
  coalesce(bp.is_enterprise, false) or cas.status = 'enterprise_managed',
  coalesce(nullif(ca.contact_email, ''), ''::text),
  case
    when coalesce(bp.is_enterprise, false) or cas.status = 'enterprise_managed'
      then 'Enterprise hardening baseline enabled during Phase 14 migration.'
    else 'Standard workspace security baseline seeded during Phase 14 migration.'
  end,
  now(),
  jsonb_build_object(
    'seededBy', 'phase14_migration',
    'enterpriseDerived', coalesce(bp.is_enterprise, false) or cas.status = 'enterprise_managed'
  )
from public.customer_accounts ca
left join public.customer_account_subscriptions cas
  on cas.customer_account_id = ca.id
 and cas.is_current = true
left join public.billing_plans bp
  on bp.id = cas.billing_plan_id
on conflict (customer_account_id) do nothing;

with active_security_users as (
  select
    cam.auth_user_id,
    (array_agg(
      cam.customer_account_id
      order by cam.created_at asc, cam.customer_account_id asc
    ))[1] as primary_customer_account_id
  from public.customer_account_memberships cam
  where cam.status = 'active'
    and cam.auth_user_id is not null
  group by cam.auth_user_id

  union

  select
    au.auth_user_id,
    null::uuid as primary_customer_account_id
  from public.admin_users au
  where au.status = 'active'
    and au.auth_user_id is not null
)
insert into public.user_security_posture (
  auth_user_id,
  primary_customer_account_id,
  metadata
)
select
  asu.auth_user_id,
  asu.primary_customer_account_id,
  jsonb_build_object(
    'seededBy', 'phase14_migration'
  )
from active_security_users asu
on conflict (auth_user_id) do nothing;

insert into public.compliance_controls (
  control_key,
  title,
  summary,
  control_area,
  control_state,
  review_state,
  owner_label,
  cadence,
  evidence_summary,
  last_reviewed_at,
  next_review_at,
  metadata
)
values
  (
    'auth_policy_review',
    'Authentication and account policy review',
    'Workspace and enterprise auth policy posture is reviewed on a cadence and reflected in customer account security policies.',
    'identity',
    'implemented',
    'reviewed',
    'VYNTRO Ops',
    'quarterly',
    'Customer account policies and admin auth posture are tracked in-product.',
    now(),
    now() + interval '90 days',
    jsonb_build_object('publicVisible', true)
  ),
  (
    'mfa_enforcement',
    'Two-factor authentication enforcement',
    'Two-factor authentication can be enabled per user and enforced for enterprise owner/admin operators.',
    'identity',
    'implemented',
    'reviewed',
    'VYNTRO Ops',
    'quarterly',
    'Portal security workspace surfaces user 2FA posture and enterprise enforcement state.',
    now(),
    now() + interval '90 days',
    jsonb_build_object('publicVisible', true)
  ),
  (
    'enterprise_sso',
    'Enterprise SSO/SAML posture',
    'Enterprise workspace operators can use SAML-based SSO through account-level connection metadata and policy enforcement.',
    'identity',
    'implemented',
    'reviewed',
    'VYNTRO Ops',
    'quarterly',
    'SSO/SAML status is exposed in the portal security layer and the public trust center.',
    now(),
    now() + interval '90 days',
    jsonb_build_object('publicVisible', true)
  ),
  (
    'session_review',
    'Session review and revocation',
    'Operators can see active sessions, review session posture, and revoke sessions from the portal security workspace.',
    'session_security',
    'implemented',
    'reviewed',
    'VYNTRO Ops',
    'quarterly',
    'Auth session state and revocation trail are stored in auth_sessions and auth_session_events.',
    now(),
    now() + interval '90 days',
    jsonb_build_object('publicVisible', true)
  ),
  (
    'data_request_lifecycle',
    'Data export and delete lifecycle',
    'Export and delete requests move through a reviewed lifecycle with verification, notes, and completion status.',
    'data_lifecycle',
    'implemented',
    'reviewed',
    'VYNTRO Ops',
    'quarterly',
    'Data access requests are tracked in-product with events and reviewed status.',
    now(),
    now() + interval '90 days',
    jsonb_build_object('publicVisible', true)
  ),
  (
    'subprocessor_register',
    'Subprocessor register review',
    'The public subprocessor register is reviewed alongside trust-center disclosures and vendor posture.',
    'vendor_management',
    'implemented',
    'reviewed',
    'VYNTRO Ops',
    'quarterly',
    'Public subprocessor list is backed by product data, not static copy.',
    now(),
    now() + interval '90 days',
    jsonb_build_object('publicVisible', true)
  ),
  (
    'backup_review',
    'Backup and recovery review',
    'Backup and recovery posture is reviewed on a schedule and surfaced in the trust center with bounded public language.',
    'backup_recovery',
    'monitoring',
    'scheduled',
    'VYNTRO Ops',
    'quarterly',
    'Backup and restore posture is tracked through compliance controls and evidence notes.',
    now(),
    now() + interval '90 days',
    jsonb_build_object('publicVisible', true)
  ),
  (
    'restore_drill',
    'Restore drill readiness',
    'Restore drills are tracked as evidence items so recovery posture is not just an undocumented assumption.',
    'backup_recovery',
    'monitoring',
    'scheduled',
    'VYNTRO Ops',
    'quarterly',
    'Evidence trail is ready for restore drill notes and operational review.',
    now(),
    now() + interval '90 days',
    jsonb_build_object('publicVisible', false)
  ),
  (
    'incident_runbook',
    'Security incident readiness',
    'Security incidents and related event trails are tracked in-product with explicit state changes and postmortem posture.',
    'incident_response',
    'implemented',
    'reviewed',
    'VYNTRO Ops',
    'quarterly',
    'Security incidents and incident events provide an internal readiness layer.',
    now(),
    now() + interval '90 days',
    jsonb_build_object('publicVisible', true)
  ),
  (
    'privacy_terms_review',
    'Privacy and terms review',
    'Public privacy, terms, and trust content are reviewed as operational product surfaces rather than static launch placeholders.',
    'policy',
    'implemented',
    'reviewed',
    'VYNTRO Ops',
    'quarterly',
    'Public policy content is linked to concrete controls and support/security routes.',
    now(),
    now() + interval '90 days',
    jsonb_build_object('publicVisible', true)
  )
on conflict (control_key) do update
set
  title = excluded.title,
  summary = excluded.summary,
  control_area = excluded.control_area,
  control_state = excluded.control_state,
  review_state = excluded.review_state,
  owner_label = excluded.owner_label,
  cadence = excluded.cadence,
  evidence_summary = excluded.evidence_summary,
  next_review_at = excluded.next_review_at,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.subprocessors (
  name,
  category,
  purpose,
  data_scope,
  region_scope,
  website_url,
  status,
  sort_order,
  metadata
)
values
  (
    'Supabase',
    'Core data platform',
    'Authentication, Postgres storage, and product data handling for workspace, community, billing, and support workflows.',
    array['account data', 'workspace data', 'operational logs']::text[],
    array['EU', 'US']::text[],
    'https://supabase.com',
    'active',
    10,
    jsonb_build_object('publicVisible', true)
  ),
  (
    'Vercel',
    'Hosting and delivery',
    'Application hosting, edge delivery, and deployment surface for public web and portal experiences.',
    array['request metadata', 'application delivery logs']::text[],
    array['Global']::text[],
    'https://vercel.com',
    'active',
    20,
    jsonb_build_object('publicVisible', true)
  ),
  (
    'Stripe',
    'Payments and billing',
    'Subscription billing, invoices, payment methods, and customer billing portal operations.',
    array['billing identity', 'invoice data', 'payment metadata']::text[],
    array['EU', 'US', 'Global']::text[],
    'https://stripe.com',
    'active',
    30,
    jsonb_build_object('publicVisible', true)
  )
on conflict (name) do update
set
  category = excluded.category,
  purpose = excluded.purpose,
  data_scope = excluded.data_scope,
  region_scope = excluded.region_scope,
  website_url = excluded.website_url,
  status = excluded.status,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata,
  updated_at = now();

commit;
