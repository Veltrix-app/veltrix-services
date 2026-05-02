begin;

create table if not exists public.trust_signal_summaries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  auth_user_id uuid not null,
  wallet_address text,
  event_type text not null,
  risk_category text not null check (
    risk_category in (
      'wallet_graph',
      'session_velocity',
      'quest_abuse',
      'raid_abuse',
      'reward_abuse',
      'defi_abuse',
      'social_abuse',
      'manual_review'
    )
  ),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  recommended_action text not null check (
    recommended_action in ('allow', 'watch', 'review_required', 'reward_hold', 'xp_suspended', 'suspend', 'ban')
  ),
  source_type text not null check (
    source_type in ('review_flag', 'trust_snapshot', 'onchain_signal', 'manual', 'project_escalation')
  ),
  source_id text not null,
  risk_event_id uuid references public.risk_events(id) on delete set null,
  dedupe_key text not null unique,
  reason text not null,
  visible_evidence jsonb not null default '{}'::jsonb,
  private_evidence_ref text,
  status text not null default 'active' check (status in ('active', 'superseded', 'dismissed')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_trust_signal_summaries_project_created
  on public.trust_signal_summaries (project_id, created_at desc);

create index if not exists idx_trust_signal_summaries_auth_user_created
  on public.trust_signal_summaries (auth_user_id, created_at desc);

create index if not exists idx_trust_signal_summaries_wallet_created
  on public.trust_signal_summaries (wallet_address, created_at desc)
  where wallet_address is not null;

create index if not exists idx_trust_signal_summaries_category_severity
  on public.trust_signal_summaries (risk_category, severity, created_at desc);

create table if not exists public.trust_review_cases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  auth_user_id uuid not null,
  wallet_address text,
  case_type text not null check (
    case_type in (
      'trust_signal_review',
      'reward_hold_review',
      'xp_suspension_review',
      'suspension_review',
      'ban_review'
    )
  ),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (
    status in ('open', 'in_review', 'waiting_on_user', 'resolved', 'dismissed')
  ),
  reason text not null,
  public_summary jsonb not null default '{}'::jsonb,
  private_evidence_refs text[] not null default array[]::text[],
  assigned_admin_auth_user_id uuid,
  opened_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  resolution text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_trust_review_cases_project_status_priority
  on public.trust_review_cases (project_id, status, priority, created_at desc);

create index if not exists idx_trust_review_cases_auth_user_status
  on public.trust_review_cases (auth_user_id, status, created_at desc);

create index if not exists idx_trust_review_cases_wallet_created
  on public.trust_review_cases (wallet_address, created_at desc)
  where wallet_address is not null;

create unique index if not exists idx_trust_review_cases_open_unique
  on public.trust_review_cases (
    coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid),
    auth_user_id,
    case_type
  )
  where status in ('open', 'in_review', 'waiting_on_user');

create table if not exists public.trust_appeals (
  id uuid primary key default gen_random_uuid(),
  review_case_id uuid references public.trust_review_cases(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  auth_user_id uuid not null,
  wallet_address text,
  status text not null default 'submitted' check (
    status in ('submitted', 'in_review', 'approved', 'rejected', 'withdrawn')
  ),
  message text not null,
  public_context jsonb not null default '{}'::jsonb,
  reviewer_auth_user_id uuid,
  resolution text,
  submitted_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_trust_appeals_project_status
  on public.trust_appeals (project_id, status, created_at desc);

create index if not exists idx_trust_appeals_auth_user_status
  on public.trust_appeals (auth_user_id, status, created_at desc);

create index if not exists idx_trust_appeals_review_case
  on public.trust_appeals (review_case_id, created_at desc)
  where review_case_id is not null;

alter table public.trust_signal_summaries enable row level security;
alter table public.trust_review_cases enable row level security;
alter table public.trust_appeals enable row level security;

drop policy if exists "trust signal summaries scoped read" on public.trust_signal_summaries;
drop policy if exists "trust signal summaries super admin mutate" on public.trust_signal_summaries;

create policy "trust signal summaries scoped read"
on public.trust_signal_summaries
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or (
    project_id is not null
    and public.has_project_role(auth.uid(), project_id, array['owner','admin','reviewer'])
  )
);

create policy "trust signal summaries super admin mutate"
on public.trust_signal_summaries
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "trust review cases scoped read" on public.trust_review_cases;
drop policy if exists "trust review cases super admin mutate" on public.trust_review_cases;

create policy "trust review cases scoped read"
on public.trust_review_cases
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or (
    project_id is not null
    and public.has_project_role(auth.uid(), project_id, array['owner','admin','reviewer'])
  )
);

create policy "trust review cases super admin mutate"
on public.trust_review_cases
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "trust appeals scoped read" on public.trust_appeals;
drop policy if exists "trust appeals own insert" on public.trust_appeals;
drop policy if exists "trust appeals super admin mutate" on public.trust_appeals;

create policy "trust appeals scoped read"
on public.trust_appeals
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or (
    project_id is not null
    and public.has_project_role(auth.uid(), project_id, array['owner','admin','reviewer'])
  )
);

create policy "trust appeals own insert"
on public.trust_appeals
for insert
to authenticated
with check (auth.uid() = auth_user_id);

create policy "trust appeals super admin mutate"
on public.trust_appeals
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

comment on table public.trust_signal_summaries is
  'Project-safe Trust Anti-Fraud v3 summaries. Raw fingerprints and graph evidence stay outside project-visible reads.';

comment on table public.trust_review_cases is
  'Manual review workflow for reward holds, XP suspensions, suspicious claim patterns and severe fraud signals.';

comment on table public.trust_appeals is
  'Member-submitted appeal context for trust reviews. Appeals are user-scoped and project-readable only through sanitized context.';

commit;
