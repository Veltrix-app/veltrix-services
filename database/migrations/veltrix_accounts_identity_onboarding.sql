-- Veltrix accounts, identity, and self-serve onboarding foundation
-- Run in Supabase SQL Editor.
--
-- Goals:
-- 1. Add a workspace/account layer above projects
-- 2. Add account memberships and invites
-- 3. Add onboarding progress and account event history
-- 4. Backfill existing projects into a safe legacy workspace model

begin;

create table if not exists public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  legacy_project_id uuid unique references public.projects(id) on delete set null,
  name text not null,
  status text not null default 'active',
  contact_email text not null default ''::text,
  created_by_auth_user_id uuid,
  primary_owner_auth_user_id uuid,
  source_type text not null default 'self_serve',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customer_accounts_status_check
    check (status in ('pending_verification', 'active', 'trial', 'suspended', 'closed')),
  constraint customer_accounts_source_type_check
    check (source_type in ('self_serve', 'invite', 'internal', 'legacy_backfill'))
);

create table if not exists public.customer_account_memberships (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  auth_user_id uuid not null,
  role text not null default 'member',
  status text not null default 'active',
  invited_by_auth_user_id uuid,
  joined_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customer_account_memberships_role_check
    check (role in ('owner', 'admin', 'member', 'viewer')),
  constraint customer_account_memberships_status_check
    check (status in ('pending', 'active', 'suspended', 'revoked'))
);

create table if not exists public.customer_account_invites (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  status text not null default 'pending',
  invite_token text not null unique,
  invited_by_auth_user_id uuid not null,
  accepted_by_auth_user_id uuid,
  expires_at timestamp with time zone not null default (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  revoked_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customer_account_invites_role_check
    check (role in ('owner', 'admin', 'member', 'viewer')),
  constraint customer_account_invites_status_check
    check (status in ('pending', 'accepted', 'revoked', 'expired'))
);

create table if not exists public.customer_account_onboarding (
  customer_account_id uuid primary key references public.customer_accounts(id) on delete cascade,
  status text not null default 'in_progress',
  current_step text not null default 'create_project',
  completed_steps jsonb not null default '[]'::jsonb,
  first_project_id uuid references public.projects(id) on delete set null,
  first_invite_sent_at timestamp with time zone,
  launch_workspace_opened_at timestamp with time zone,
  completed_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customer_account_onboarding_status_check
    check (status in ('in_progress', 'completed', 'skipped')),
  constraint customer_account_onboarding_current_step_check
    check (current_step in ('create_workspace', 'create_project', 'invite_team', 'open_launch_workspace', 'completed'))
);

create table if not exists public.customer_account_events (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  event_type text not null,
  actor_auth_user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint customer_account_events_event_type_check
    check (
      event_type in (
        'account_created',
        'owner_bootstrapped',
        'invite_sent',
        'invite_accepted',
        'membership_role_changed',
        'first_project_created',
        'launch_workspace_opened',
        'onboarding_completed'
      )
    )
);

create unique index if not exists idx_customer_account_memberships_account_auth_unique
  on public.customer_account_memberships (customer_account_id, auth_user_id);

create unique index if not exists idx_customer_account_invites_pending_email_unique
  on public.customer_account_invites (customer_account_id, lower(email))
  where status = 'pending';

create index if not exists idx_customer_accounts_primary_owner
  on public.customer_accounts (primary_owner_auth_user_id);

create index if not exists idx_customer_accounts_status
  on public.customer_accounts (status, created_at desc);

create index if not exists idx_customer_account_memberships_auth_user_id
  on public.customer_account_memberships (auth_user_id, status);

create index if not exists idx_customer_account_invites_account_status
  on public.customer_account_invites (customer_account_id, status, expires_at desc);

create index if not exists idx_customer_account_events_account_created_at
  on public.customer_account_events (customer_account_id, created_at desc);

alter table public.projects
  add column if not exists customer_account_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_customer_account_id_fkey'
  ) then
    alter table public.projects
      add constraint projects_customer_account_id_fkey
      foreign key (customer_account_id) references public.customer_accounts(id) on delete set null;
  end if;
end $$;

create index if not exists idx_projects_customer_account_id
  on public.projects (customer_account_id);

alter table public.project_onboarding_requests
  add column if not exists customer_account_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_onboarding_requests_customer_account_id_fkey'
  ) then
    alter table public.project_onboarding_requests
      add constraint project_onboarding_requests_customer_account_id_fkey
      foreign key (customer_account_id) references public.customer_accounts(id) on delete set null;
  end if;
end $$;

create index if not exists idx_project_onboarding_requests_customer_account_id
  on public.project_onboarding_requests (customer_account_id);

insert into public.customer_accounts (
  legacy_project_id,
  name,
  status,
  contact_email,
  created_by_auth_user_id,
  primary_owner_auth_user_id,
  source_type,
  metadata
)
select
  p.id,
  p.name,
  'active',
  coalesce(p.contact_email, ''::text),
  p.owner_user_id,
  p.owner_user_id,
  'legacy_backfill',
  jsonb_build_object('legacy_backfill', true)
from public.projects p
where not exists (
  select 1
  from public.customer_accounts ca
  where ca.legacy_project_id = p.id
);

update public.projects p
set customer_account_id = ca.id
from public.customer_accounts ca
where ca.legacy_project_id = p.id
  and p.customer_account_id is null;

update public.project_onboarding_requests por
set customer_account_id = p.customer_account_id
from public.projects p
where por.approved_project_id = p.id
  and por.customer_account_id is null
  and p.customer_account_id is not null;

insert into public.customer_account_memberships (
  customer_account_id,
  auth_user_id,
  role,
  status,
  joined_at,
  metadata
)
select
  p.customer_account_id,
  p.owner_user_id,
  'owner',
  'active',
  now(),
  jsonb_build_object('legacy_backfill', true, 'source', 'project_owner')
from public.projects p
where p.customer_account_id is not null
  and p.owner_user_id is not null
  and not exists (
    select 1
    from public.customer_account_memberships cam
    where cam.customer_account_id = p.customer_account_id
      and cam.auth_user_id = p.owner_user_id
  );

insert into public.customer_account_memberships (
  customer_account_id,
  auth_user_id,
  role,
  status,
  invited_by_auth_user_id,
  joined_at,
  metadata
)
select
  p.customer_account_id,
  tm.auth_user_id,
  case
    when tm.role in ('owner', 'admin') then tm.role
    when tm.role = 'reviewer' then 'member'
    else 'viewer'
  end,
  case
    when tm.status = 'active' then 'active'
    else 'pending'
  end,
  tm.invited_by,
  tm.joined_at,
  jsonb_build_object('legacy_backfill', true, 'source', 'team_member')
from public.team_members tm
join public.projects p
  on p.id = tm.project_id
where p.customer_account_id is not null
  and tm.auth_user_id is not null
  and not exists (
    select 1
    from public.customer_account_memberships cam
    where cam.customer_account_id = p.customer_account_id
      and cam.auth_user_id = tm.auth_user_id
  );

insert into public.customer_account_onboarding (
  customer_account_id,
  status,
  current_step,
  completed_steps,
  first_project_id,
  completed_at,
  metadata
)
select
  p.customer_account_id,
  'completed',
  'completed',
  '["create_workspace","create_project"]'::jsonb,
  p.id,
  now(),
  jsonb_build_object('legacy_backfill', true)
from public.projects p
where p.customer_account_id is not null
  and not exists (
    select 1
    from public.customer_account_onboarding cao
    where cao.customer_account_id = p.customer_account_id
  );

insert into public.customer_account_events (
  customer_account_id,
  event_type,
  actor_auth_user_id,
  metadata,
  created_at
)
select
  p.customer_account_id,
  'account_created',
  p.owner_user_id,
  jsonb_build_object('legacy_backfill', true),
  coalesce(p.created_at, now())
from public.projects p
where p.customer_account_id is not null
  and not exists (
    select 1
    from public.customer_account_events cae
    where cae.customer_account_id = p.customer_account_id
      and cae.event_type = 'account_created'
  );

insert into public.customer_account_events (
  customer_account_id,
  event_type,
  actor_auth_user_id,
  metadata,
  created_at
)
select
  p.customer_account_id,
  'first_project_created',
  p.owner_user_id,
  jsonb_build_object('legacy_backfill', true, 'project_id', p.id),
  coalesce(p.created_at, now())
from public.projects p
where p.customer_account_id is not null
  and not exists (
    select 1
    from public.customer_account_events cae
    where cae.customer_account_id = p.customer_account_id
      and cae.event_type = 'first_project_created'
  );

commit;

-- Optional validation
-- select id, name, status, source_type from public.customer_accounts order by created_at desc;
-- select customer_account_id, auth_user_id, role, status from public.customer_account_memberships order by created_at desc;
-- select id, customer_account_id, status, role, email from public.customer_account_invites order by created_at desc;
-- select customer_account_id, status, current_step from public.customer_account_onboarding order by created_at desc;
