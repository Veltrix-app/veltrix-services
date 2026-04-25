-- VYNTRO Platform Core Hardening
-- Run this migration manually in the Supabase SQL editor before deploying portal/runtime changes.

begin;

create table if not exists public.project_operation_audits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  object_type text not null,
  object_id text not null,
  action_type text not null,
  actor_auth_user_id uuid,
  actor_role text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint project_operation_audits_object_type_check
    check (
      object_type in (
        'campaign',
        'quest',
        'raid',
        'reward',
        'claim',
        'automation',
        'community_run',
        'provider_sync'
      )
    ),
  constraint project_operation_audits_action_type_check
    check (
      action_type in (
        'created',
        'updated',
        'published',
        'paused',
        'resumed',
        'retried',
        'resolved',
        'dismissed',
        'archived',
        'tested'
      )
    )
);

create index if not exists idx_project_operation_audits_project_created
  on public.project_operation_audits (project_id, created_at desc);

create index if not exists idx_project_operation_audits_object
  on public.project_operation_audits (project_id, object_type, object_id, created_at desc);

create table if not exists public.project_operation_incidents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  object_type text not null,
  object_id text not null,
  source_type text not null,
  severity text not null default 'warning',
  status text not null default 'open',
  title text not null,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  opened_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint project_operation_incidents_object_type_check
    check (
      object_type in (
        'campaign',
        'quest',
        'raid',
        'reward',
        'claim',
        'automation',
        'community_run',
        'provider_sync'
      )
    ),
  constraint project_operation_incidents_source_type_check
    check (source_type in ('provider', 'job', 'manual_test', 'pipeline', 'runtime')),
  constraint project_operation_incidents_severity_check
    check (severity in ('info', 'warning', 'critical')),
  constraint project_operation_incidents_status_check
    check (status in ('open', 'watching', 'resolved', 'dismissed'))
);

create index if not exists idx_project_operation_incidents_project_status
  on public.project_operation_incidents (project_id, status, updated_at desc);

create index if not exists idx_project_operation_incidents_object
  on public.project_operation_incidents (project_id, object_type, object_id, updated_at desc);

create table if not exists public.project_operation_overrides (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  object_type text not null,
  object_id text not null,
  override_type text not null,
  status text not null default 'active',
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_by_auth_user_id uuid,
  resolved_by_auth_user_id uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  constraint project_operation_overrides_object_type_check
    check (
      object_type in (
        'campaign',
        'quest',
        'raid',
        'reward',
        'claim',
        'automation',
        'community_run',
        'provider_sync'
      )
    ),
  constraint project_operation_overrides_override_type_check
    check (override_type in ('pause', 'manual_retry', 'manual_complete', 'skip', 'mute')),
  constraint project_operation_overrides_status_check
    check (status in ('active', 'resolved', 'canceled'))
);

create index if not exists idx_project_operation_overrides_project_status
  on public.project_operation_overrides (project_id, status, updated_at desc);

create index if not exists idx_project_operation_overrides_object
  on public.project_operation_overrides (project_id, object_type, object_id, updated_at desc);

commit;
