-- Veltrix Community OS Phase 3 schema
-- Run this migration manually in the Supabase SQL editor before Phase 3 code deploys.
-- Keep this aligned with the project-private Community OS RLS posture.

begin;

alter table if exists public.community_automations
  add column if not exists sequencing_key text not null default 'always_on';

alter table if exists public.community_automations
  add column if not exists execution_posture text not null default 'watching';

alter table if exists public.community_automations
  add column if not exists owner_label text;

alter table if exists public.community_automations
  add column if not exists owner_summary text;

alter table if exists public.community_automations
  add column if not exists paused_reason text;

alter table if exists public.community_automations
  add column if not exists last_success_at timestamp with time zone;

alter table if exists public.community_automations
  add column if not exists last_error_code text;

alter table if exists public.community_automations
  add column if not exists last_error_at timestamp with time zone;

create index if not exists idx_community_automations_sequence
  on public.community_automations (project_id, sequencing_key);

create index if not exists idx_community_automations_execution_posture
  on public.community_automations (project_id, execution_posture);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_automations_sequencing_key_check'
  ) then
    alter table public.community_automations
      add constraint community_automations_sequencing_key_check
      check (sequencing_key in ('always_on', 'launch', 'raid', 'comeback', 'campaign_push'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_automations_execution_posture_check'
  ) then
    alter table public.community_automations
      add constraint community_automations_execution_posture_check
      check (execution_posture in ('watching', 'ready', 'running', 'blocked', 'degraded'));
  end if;
end
$$;

alter table if exists public.community_captain_action_queue
  add column if not exists seat_key text;

alter table if exists public.community_captain_action_queue
  add column if not exists priority text not null default 'normal';

alter table if exists public.community_captain_action_queue
  add column if not exists action_type text;

alter table if exists public.community_captain_action_queue
  add column if not exists target_type text;

alter table if exists public.community_captain_action_queue
  add column if not exists target_id text;

alter table if exists public.community_captain_action_queue
  add column if not exists blocked_reason_code text;

alter table if exists public.community_captain_action_queue
  add column if not exists blocked_reason_summary text;

alter table if exists public.community_captain_action_queue
  add column if not exists due_state text not null default 'upcoming';

alter table if exists public.community_captain_action_queue
  add column if not exists resolution_state text not null default 'open';

alter table if exists public.community_captain_action_queue
  add column if not exists escalated_at timestamp with time zone;

alter table if exists public.community_captain_action_queue
  add column if not exists resolved_at timestamp with time zone;

alter table if exists public.community_captain_action_queue
  add column if not exists last_actor_auth_user_id uuid;

create index if not exists idx_community_captain_action_queue_due_state
  on public.community_captain_action_queue (project_id, due_state);

create index if not exists idx_community_captain_action_queue_resolution_state
  on public.community_captain_action_queue (project_id, resolution_state);

create index if not exists idx_community_captain_action_queue_priority
  on public.community_captain_action_queue (project_id, priority);

create index if not exists idx_community_captain_action_queue_last_actor
  on public.community_captain_action_queue (last_actor_auth_user_id, updated_at desc);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'community_captain_action_queue_source_type_check'
  ) then
    alter table public.community_captain_action_queue
      drop constraint community_captain_action_queue_source_type_check;
  end if;

  alter table public.community_captain_action_queue
    add constraint community_captain_action_queue_source_type_check
    check (
      source_type in (
        'owner_assigned',
        'automation_generated',
        'playbook_generated',
        'journey_generated'
      )
    );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_captain_action_queue_priority_check'
  ) then
    alter table public.community_captain_action_queue
      add constraint community_captain_action_queue_priority_check
      check (priority in ('low', 'normal', 'high', 'urgent'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_captain_action_queue_due_state_check'
  ) then
    alter table public.community_captain_action_queue
      add constraint community_captain_action_queue_due_state_check
      check (due_state in ('upcoming', 'due_now', 'overdue', 'resolved'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_captain_action_queue_resolution_state_check'
  ) then
    alter table public.community_captain_action_queue
      add constraint community_captain_action_queue_resolution_state_check
      check (resolution_state in ('open', 'waiting', 'resolved', 'canceled'));
  end if;
end
$$;

alter table if exists public.community_captain_actions
  add column if not exists queue_item_id uuid references public.community_captain_action_queue(id) on delete set null;

alter table if exists public.community_captain_actions
  add column if not exists actor_scope text not null default 'captain';

alter table if exists public.community_captain_actions
  add column if not exists due_state text not null default 'upcoming';

alter table if exists public.community_captain_actions
  add column if not exists resolution_state text not null default 'open';

alter table if exists public.community_captain_actions
  add column if not exists blocked_reason_code text;

alter table if exists public.community_captain_actions
  add column if not exists blocked_reason_summary text;

alter table if exists public.community_captain_actions
  add column if not exists resolved_at timestamp with time zone;

create index if not exists idx_community_captain_actions_queue_item_id
  on public.community_captain_actions (queue_item_id);

create index if not exists idx_community_captain_actions_resolution_state
  on public.community_captain_actions (project_id, resolution_state);

create index if not exists idx_community_captain_actions_due_state
  on public.community_captain_actions (project_id, due_state);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_captain_actions_actor_scope_check'
  ) then
    alter table public.community_captain_actions
      add constraint community_captain_actions_actor_scope_check
      check (actor_scope in ('owner', 'captain', 'system'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_captain_actions_due_state_check'
  ) then
    alter table public.community_captain_actions
      add constraint community_captain_actions_due_state_check
      check (due_state in ('upcoming', 'due_now', 'overdue', 'resolved'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_captain_actions_resolution_state_check'
  ) then
    alter table public.community_captain_actions
      add constraint community_captain_actions_resolution_state_check
      check (resolution_state in ('open', 'waiting', 'resolved', 'canceled'));
  end if;
end
$$;

create table if not exists public.community_cohort_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  cohort_key text not null,
  member_count integer not null default 0,
  ready_count integer not null default 0,
  blocked_count integer not null default 0,
  active_count integer not null default 0,
  average_trust numeric(6,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  computed_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint community_cohort_snapshots_project_cohort_key unique (project_id, cohort_key),
  constraint community_cohort_snapshots_cohort_key_check
    check (cohort_key in ('newcomer', 'active', 'reactivation', 'high_trust', 'watchlist'))
);

create index if not exists idx_community_cohort_snapshots_project_id
  on public.community_cohort_snapshots (project_id);

create index if not exists idx_community_cohort_snapshots_computed_at
  on public.community_cohort_snapshots (computed_at desc);

create table if not exists public.community_health_rollups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  signal_key text not null,
  signal_value text,
  signal_tone text not null default 'default',
  summary text,
  window_key text not null default 'current',
  metadata jsonb not null default '{}'::jsonb,
  computed_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint community_health_rollups_project_signal_window_key
    unique (project_id, signal_key, window_key),
  constraint community_health_rollups_signal_tone_check
    check (signal_tone in ('default', 'success', 'warning', 'danger'))
);

create index if not exists idx_community_health_rollups_project_id
  on public.community_health_rollups (project_id);

create index if not exists idx_community_health_rollups_window_key
  on public.community_health_rollups (project_id, window_key);

create index if not exists idx_community_health_rollups_computed_at
  on public.community_health_rollups (computed_at desc);

alter table public.community_cohort_snapshots enable row level security;
alter table public.community_health_rollups enable row level security;

drop policy if exists "community cohort snapshots select" on public.community_cohort_snapshots;
drop policy if exists "community cohort snapshots mutate" on public.community_cohort_snapshots;
create policy "community cohort snapshots select"
on public.community_cohort_snapshots
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);
create policy "community cohort snapshots mutate"
on public.community_cohort_snapshots
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

drop policy if exists "community health rollups select" on public.community_health_rollups;
drop policy if exists "community health rollups mutate" on public.community_health_rollups;
create policy "community health rollups select"
on public.community_health_rollups
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);
create policy "community health rollups mutate"
on public.community_health_rollups
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
