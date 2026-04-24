begin;

create table if not exists public.commercial_leads (
  id uuid primary key default gen_random_uuid(),
  lead_state text not null default 'new',
  source text not null default 'manual',
  contact_name text not null default ''::text,
  contact_email text not null default ''::text,
  company_name text not null default ''::text,
  company_domain text,
  owner_auth_user_id uuid,
  linked_customer_account_id uuid references public.customer_accounts(id) on delete set null,
  qualification_summary text not null default ''::text,
  intent_summary text not null default ''::text,
  last_signal_at timestamptz,
  last_contact_at timestamptz,
  converted_at timestamptz,
  lost_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_leads_state_check
    check (
      lead_state in (
        'new',
        'qualified',
        'watching',
        'engaged',
        'evaluation',
        'converted',
        'cooling_off',
        'lost'
      )
    ),
  constraint commercial_leads_source_check
    check (
      source in (
        'manual',
        'pricing',
        'start',
        'homepage',
        'trust',
        'docs',
        'demo_request',
        'enterprise_intake',
        'support',
        'billing',
        'success',
        'analytics',
        'converted_account'
      )
    )
);

create index if not exists idx_commercial_leads_state
  on public.commercial_leads (lead_state, updated_at desc);

create index if not exists idx_commercial_leads_owner
  on public.commercial_leads (owner_auth_user_id, updated_at desc);

create index if not exists idx_commercial_leads_source
  on public.commercial_leads (source, created_at desc);

create index if not exists idx_commercial_leads_linked_customer_account
  on public.commercial_leads (linked_customer_account_id);

create index if not exists idx_commercial_leads_created_at
  on public.commercial_leads (created_at desc);

create table if not exists public.commercial_lead_events (
  id uuid primary key default gen_random_uuid(),
  commercial_lead_id uuid not null references public.commercial_leads(id) on delete cascade,
  event_type text not null,
  actor_auth_user_id uuid,
  summary text not null default ''::text,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint commercial_lead_events_type_check
    check (
      event_type in (
        'lead_created',
        'signal_captured',
        'qualified',
        'state_changed',
        'note_added',
        'task_added',
        'task_resolved',
        'request_linked',
        'account_linked',
        'converted',
        'cooling_off',
        'lost'
      )
    )
);

create index if not exists idx_commercial_lead_events_lead_created_at
  on public.commercial_lead_events (commercial_lead_id, created_at desc);

create table if not exists public.commercial_lead_notes (
  id uuid primary key default gen_random_uuid(),
  commercial_lead_id uuid not null references public.commercial_leads(id) on delete cascade,
  author_auth_user_id uuid,
  owner_auth_user_id uuid,
  note_type text not null default 'general',
  status text not null default 'open',
  title text not null default ''::text,
  body text not null default ''::text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint commercial_lead_notes_type_check
    check (
      note_type in (
        'general',
        'qualification',
        'buyer_concern',
        'enterprise_requirement',
        'follow_up'
      )
    ),
  constraint commercial_lead_notes_status_check
    check (status in ('open', 'resolved', 'archived'))
);

create index if not exists idx_commercial_lead_notes_lead_created_at
  on public.commercial_lead_notes (commercial_lead_id, created_at desc);

create table if not exists public.commercial_follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  commercial_lead_id uuid not null references public.commercial_leads(id) on delete cascade,
  owner_auth_user_id uuid,
  task_type text not null default 'follow_up',
  status text not null default 'open',
  due_state text not null default 'upcoming',
  title text not null default ''::text,
  summary text not null default ''::text,
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_follow_up_tasks_type_check
    check (
      task_type in (
        'follow_up',
        'qualification',
        'demo_follow_up',
        'enterprise_review',
        'expansion_follow_up'
      )
    ),
  constraint commercial_follow_up_tasks_status_check
    check (status in ('open', 'in_progress', 'waiting', 'resolved', 'canceled')),
  constraint commercial_follow_up_tasks_due_state_check
    check (due_state in ('upcoming', 'due_now', 'overdue', 'resolved'))
);

create index if not exists idx_commercial_follow_up_tasks_lead_status
  on public.commercial_follow_up_tasks (commercial_lead_id, status, due_at asc);

create index if not exists idx_commercial_follow_up_tasks_due_state
  on public.commercial_follow_up_tasks (due_state, due_at asc);

create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  commercial_lead_id uuid references public.commercial_leads(id) on delete set null,
  requester_name text not null default ''::text,
  requester_email text not null default ''::text,
  company_name text not null default ''::text,
  company_domain text,
  team_size text not null default ''::text,
  use_case text not null default ''::text,
  urgency text not null default ''::text,
  request_source text not null default 'talk_to_sales',
  status text not null default 'new',
  source_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_requests_status_check
    check (status in ('new', 'qualified', 'converted', 'closed'))
);

create index if not exists idx_demo_requests_created_at
  on public.demo_requests (created_at desc);

create index if not exists idx_demo_requests_status
  on public.demo_requests (status, created_at desc);

create table if not exists public.enterprise_intake_requests (
  id uuid primary key default gen_random_uuid(),
  commercial_lead_id uuid references public.commercial_leads(id) on delete set null,
  requester_name text not null default ''::text,
  requester_email text not null default ''::text,
  company_name text not null default ''::text,
  company_domain text,
  team_size text not null default ''::text,
  use_case text not null default ''::text,
  requirement_summary text not null default ''::text,
  security_requirements text not null default ''::text,
  billing_requirements text not null default ''::text,
  onboarding_requirements text not null default ''::text,
  urgency text not null default ''::text,
  request_source text not null default 'talk_to_sales',
  status text not null default 'new',
  source_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enterprise_intake_requests_status_check
    check (status in ('new', 'qualified', 'converted', 'closed'))
);

create index if not exists idx_enterprise_intake_requests_created_at
  on public.enterprise_intake_requests (created_at desc);

create index if not exists idx_enterprise_intake_requests_status
  on public.enterprise_intake_requests (status, created_at desc);

commit;
