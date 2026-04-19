begin;

create table if not exists public.community_automations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  integration_id uuid references public.project_integrations(id) on delete set null,
  automation_type text not null,
  status text not null default 'paused',
  cadence text not null default 'manual',
  provider_scope text not null default 'both',
  target_provider text,
  title text,
  config jsonb not null default '{}'::jsonb,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  last_result text,
  last_result_summary text,
  created_by_auth_user_id uuid,
  updated_by_auth_user_id uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint community_automations_unique unique (project_id, automation_type),
  constraint community_automations_status_check check (status in ('active', 'paused')),
  constraint community_automations_cadence_check check (cadence in ('manual', 'daily', 'weekly')),
  constraint community_automations_provider_scope_check check (provider_scope in ('discord', 'telegram', 'both'))
);

create index if not exists idx_community_automations_project_id
  on public.community_automations (project_id);

create index if not exists idx_community_automations_status_next_run
  on public.community_automations (status, next_run_at);

create index if not exists idx_community_automations_integration_id
  on public.community_automations (integration_id);

create table if not exists public.community_automation_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  automation_id uuid references public.community_automations(id) on delete set null,
  automation_type text not null,
  status text not null default 'pending',
  trigger_source text not null default 'manual',
  triggered_by_auth_user_id uuid,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint community_automation_runs_status_check check (status in ('pending', 'running', 'success', 'failed', 'skipped')),
  constraint community_automation_runs_trigger_source_check check (trigger_source in ('manual', 'schedule', 'playbook', 'captain'))
);

create index if not exists idx_community_automation_runs_project_id
  on public.community_automation_runs (project_id, created_at desc);

create index if not exists idx_community_automation_runs_automation_id
  on public.community_automation_runs (automation_id);

create table if not exists public.community_playbook_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  playbook_key text not null,
  status text not null default 'pending',
  trigger_source text not null default 'manual',
  triggered_by_auth_user_id uuid,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint community_playbook_runs_status_check check (status in ('pending', 'running', 'success', 'failed', 'skipped')),
  constraint community_playbook_runs_trigger_source_check check (trigger_source in ('manual', 'schedule', 'captain'))
);

create index if not exists idx_community_playbook_runs_project_id
  on public.community_playbook_runs (project_id, created_at desc);

create table if not exists public.community_captain_actions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  auth_user_id uuid,
  captain_role text,
  action_type text not null,
  target_type text,
  target_id text,
  status text not null default 'success',
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint community_captain_actions_status_check check (status in ('success', 'failed', 'skipped'))
);

create index if not exists idx_community_captain_actions_project_id
  on public.community_captain_actions (project_id, created_at desc);

create index if not exists idx_community_captain_actions_actor
  on public.community_captain_actions (auth_user_id, created_at desc);

alter table public.community_automations enable row level security;
alter table public.community_automation_runs enable row level security;
alter table public.community_playbook_runs enable row level security;
alter table public.community_captain_actions enable row level security;

drop policy if exists "community automations select" on public.community_automations;
drop policy if exists "community automations mutate" on public.community_automations;
create policy "community automations select"
on public.community_automations
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);
create policy "community automations mutate"
on public.community_automations
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

drop policy if exists "community automation runs select" on public.community_automation_runs;
drop policy if exists "community automation runs mutate" on public.community_automation_runs;
create policy "community automation runs select"
on public.community_automation_runs
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);
create policy "community automation runs mutate"
on public.community_automation_runs
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

drop policy if exists "community playbook runs select" on public.community_playbook_runs;
drop policy if exists "community playbook runs mutate" on public.community_playbook_runs;
create policy "community playbook runs select"
on public.community_playbook_runs
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);
create policy "community playbook runs mutate"
on public.community_playbook_runs
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

drop policy if exists "community captain actions select" on public.community_captain_actions;
drop policy if exists "community captain actions mutate" on public.community_captain_actions;
create policy "community captain actions select"
on public.community_captain_actions
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);
create policy "community captain actions mutate"
on public.community_captain_actions
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
