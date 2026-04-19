-- Veltrix Community OS V5 schema
-- Run this migration manually in the Supabase SQL editor before V5 code deploys.
-- Keep this aligned with the project-private Community OS RLS posture.

begin;

create table if not exists public.community_captain_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  auth_user_id uuid not null,
  role_type text not null default 'captain',
  permission_scope text not null default 'project_only',
  status text not null default 'active',
  created_by_auth_user_id uuid,
  updated_by_auth_user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint community_captain_assignments_project_user_role_scope_key
    unique (project_id, auth_user_id, role_type, permission_scope),
  constraint community_captain_assignments_id_project_key
    unique (id, project_id),
  constraint community_captain_assignments_status_check
    check (status in ('active', 'paused', 'inactive')),
  constraint community_captain_assignments_permission_scope_check
    check (permission_scope in ('project_only', 'community_only', 'project_and_community'))
);

create index if not exists idx_community_captain_assignments_project_id
  on public.community_captain_assignments (project_id);

create index if not exists idx_community_captain_assignments_auth_user_id
  on public.community_captain_assignments (auth_user_id);

create index if not exists idx_community_captain_assignments_status
  on public.community_captain_assignments (status);

create index if not exists idx_community_captain_assignments_updated_at
  on public.community_captain_assignments (updated_at desc);

create table if not exists public.community_captain_action_queue (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  captain_assignment_id uuid,
  auth_user_id uuid,
  source_type text not null default 'owner_assigned',
  status text not null default 'queued',
  escalation_state text not null default 'none',
  title text,
  summary text,
  due_at timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint community_captain_action_queue_captain_assignment_project_key
    foreign key (captain_assignment_id, project_id)
      references public.community_captain_assignments (id, project_id)
      on delete cascade,
  constraint community_captain_action_queue_status_check
    check (status in ('queued', 'in_progress', 'blocked', 'done', 'canceled')),
  constraint community_captain_action_queue_source_type_check
    check (source_type in ('owner_assigned', 'automation_generated')),
  constraint community_captain_action_queue_escalation_state_check
    check (escalation_state in ('none', 'watching', 'escalated', 'resolved'))
);

create index if not exists idx_community_captain_action_queue_project_id
  on public.community_captain_action_queue (project_id);

create index if not exists idx_community_captain_action_queue_auth_user_id
  on public.community_captain_action_queue (auth_user_id);

create index if not exists idx_community_captain_action_queue_captain_assignment_id
  on public.community_captain_action_queue (captain_assignment_id);

create index if not exists idx_community_captain_action_queue_captain_assignment_project_id
  on public.community_captain_action_queue (captain_assignment_id, project_id);

create index if not exists idx_community_captain_action_queue_status
  on public.community_captain_action_queue (status);

create index if not exists idx_community_captain_action_queue_due_at
  on public.community_captain_action_queue (due_at);

create index if not exists idx_community_captain_action_queue_updated_at
  on public.community_captain_action_queue (updated_at desc);

create table if not exists public.community_member_journeys (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  auth_user_id uuid not null,
  journey_type text not null,
  status text not null default 'active',
  current_step_key text,
  last_step_key text,
  started_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  last_event_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint community_member_journeys_project_user_type_key
    unique (project_id, auth_user_id, journey_type),
  constraint community_member_journeys_id_project_user_key
    unique (id, project_id, auth_user_id),
  constraint community_member_journeys_journey_type_check
    check (journey_type in ('onboarding', 'active', 'comeback')),
  constraint community_member_journeys_status_check
    check (status in ('active', 'paused', 'completed', 'archived'))
);

create index if not exists idx_community_member_journeys_project_id
  on public.community_member_journeys (project_id);

create index if not exists idx_community_member_journeys_auth_user_id
  on public.community_member_journeys (auth_user_id);

create index if not exists idx_community_member_journeys_status
  on public.community_member_journeys (status);

create index if not exists idx_community_member_journeys_updated_at
  on public.community_member_journeys (updated_at desc);

create table if not exists public.community_member_journey_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  auth_user_id uuid not null,
  member_journey_id uuid not null,
  event_type text not null,
  step_key text,
  milestone_key text,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint community_member_journey_events_member_journey_project_user_key
    foreign key (member_journey_id, project_id, auth_user_id)
      references public.community_member_journeys (id, project_id, auth_user_id)
      on delete cascade,
  constraint community_member_journey_events_event_type_check
    check (event_type in ('step_completed', 'nudge_sent', 'reset', 'return', 'milestone_unlocked'))
);

create index if not exists idx_community_member_journey_events_project_id
  on public.community_member_journey_events (project_id);

create index if not exists idx_community_member_journey_events_auth_user_id
  on public.community_member_journey_events (auth_user_id);

create index if not exists idx_community_member_journey_events_member_journey_id
  on public.community_member_journey_events (member_journey_id);

create index if not exists idx_community_member_journey_events_member_journey_project_user_id
  on public.community_member_journey_events (member_journey_id, project_id, auth_user_id);

create index if not exists idx_community_member_journey_events_updated_at
  on public.community_member_journey_events (updated_at desc);

create table if not exists public.community_member_status_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  auth_user_id uuid not null,
  member_journey_id uuid not null,
  journey_type text not null,
  status text not null default 'active',
  current_step_key text,
  last_event_type text,
  last_event_at timestamp with time zone,
  completed_steps_count integer not null default 0,
  nudges_sent_count integer not null default 0,
  milestones_unlocked_count integer not null default 0,
  streak_days integer not null default 0,
  next_nudge_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint community_member_status_snapshots_project_user_key
    unique (project_id, auth_user_id),
  constraint community_member_status_snapshots_member_journey_project_user_key
    foreign key (member_journey_id, project_id, auth_user_id)
      references public.community_member_journeys (id, project_id, auth_user_id)
      on delete cascade,
  constraint community_member_status_snapshots_journey_type_check
    check (journey_type in ('onboarding', 'active', 'comeback')),
  constraint community_member_status_snapshots_status_check
    check (status in ('active', 'paused', 'completed', 'archived'))
);

create index if not exists idx_community_member_status_snapshots_project_id
  on public.community_member_status_snapshots (project_id);

create index if not exists idx_community_member_status_snapshots_auth_user_id
  on public.community_member_status_snapshots (auth_user_id);

create index if not exists idx_community_member_status_snapshots_member_journey_id
  on public.community_member_status_snapshots (member_journey_id);

create index if not exists idx_community_member_status_snapshots_member_journey_project_user_id
  on public.community_member_status_snapshots (member_journey_id, project_id, auth_user_id);

create index if not exists idx_community_member_status_snapshots_status
  on public.community_member_status_snapshots (status);

create index if not exists idx_community_member_status_snapshots_updated_at
  on public.community_member_status_snapshots (updated_at desc);

alter table public.community_captain_assignments enable row level security;
alter table public.community_captain_action_queue enable row level security;
alter table public.community_member_journeys enable row level security;
alter table public.community_member_journey_events enable row level security;
alter table public.community_member_status_snapshots enable row level security;

drop policy if exists "community captain assignments select" on public.community_captain_assignments;
drop policy if exists "community captain assignments mutate" on public.community_captain_assignments;
create policy "community captain assignments select"
on public.community_captain_assignments
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);
create policy "community captain assignments mutate"
on public.community_captain_assignments
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

drop policy if exists "community captain action queue select" on public.community_captain_action_queue;
drop policy if exists "community captain action queue mutate" on public.community_captain_action_queue;
create policy "community captain action queue select"
on public.community_captain_action_queue
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);
create policy "community captain action queue mutate"
on public.community_captain_action_queue
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

drop policy if exists "community member journeys select" on public.community_member_journeys;
drop policy if exists "community member journeys mutate" on public.community_member_journeys;
create policy "community member journeys select"
on public.community_member_journeys
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
  or auth.uid() = auth_user_id
);
create policy "community member journeys mutate"
on public.community_member_journeys
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

drop policy if exists "community member journey events select" on public.community_member_journey_events;
drop policy if exists "community member journey events mutate" on public.community_member_journey_events;
drop policy if exists "community member journey events insert" on public.community_member_journey_events;
create policy "community member journey events select"
on public.community_member_journey_events
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
  or auth.uid() = auth_user_id
);
create policy "community member journey events insert"
on public.community_member_journey_events
for insert
to authenticated
with check (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);

drop policy if exists "community member status snapshots select" on public.community_member_status_snapshots;
drop policy if exists "community member status snapshots mutate" on public.community_member_status_snapshots;
create policy "community member status snapshots select"
on public.community_member_status_snapshots
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
  or auth.uid() = auth_user_id
);
create policy "community member status snapshots mutate"
on public.community_member_status_snapshots
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
