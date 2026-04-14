-- Veltrix multi-tenant foundation
-- Run in Supabase SQL Editor.
--
-- Goals:
-- 1. Make team membership project-scoped
-- 2. Link portal members to auth users
-- 3. Add a self-serve onboarding request table
-- 4. Prepare project ownership and admin querying

begin;

-- 1) Team members become project-scoped and auth-aware
alter table public.team_members
  add column if not exists project_id uuid,
  add column if not exists auth_user_id uuid,
  add column if not exists invited_by uuid,
  add column if not exists joined_at timestamp with time zone,
  add column if not exists updated_at timestamp with time zone not null default now();

alter table public.team_members
  add constraint team_members_project_id_fkey
  foreign key (project_id) references public.projects(id);

create index if not exists idx_team_members_project_id
  on public.team_members (project_id);

create index if not exists idx_team_members_auth_user_id
  on public.team_members (auth_user_id);

create unique index if not exists idx_team_members_project_auth_unique
  on public.team_members (project_id, auth_user_id)
  where auth_user_id is not null;

-- 2) Project onboarding requests for self-serve intake
create table if not exists public.project_onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by_auth_user_id uuid,
  project_name text not null,
  chain text not null default ''::text,
  category text not null default ''::text,
  website text not null default ''::text,
  contact_email text not null default ''::text,
  short_description text not null default ''::text,
  long_description text not null default ''::text,
  logo text not null default '🚀'::text,
  banner_url text not null default ''::text,
  x_url text not null default ''::text,
  telegram_url text not null default ''::text,
  discord_url text not null default ''::text,
  requested_plan_id text,
  status text not null default 'submitted'::text,
  review_notes text not null default ''::text,
  reviewed_by_auth_user_id uuid,
  reviewed_at timestamp with time zone,
  approved_project_id uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint project_onboarding_requests_requested_plan_id_fkey
    foreign key (requested_plan_id) references public.billing_plans(id),
  constraint project_onboarding_requests_approved_project_id_fkey
    foreign key (approved_project_id) references public.projects(id)
);

create index if not exists idx_onboarding_requests_status
  on public.project_onboarding_requests (status);

create index if not exists idx_onboarding_requests_requested_by
  on public.project_onboarding_requests (requested_by_auth_user_id);

-- 3) Helpful project owner lookup index
create index if not exists idx_projects_owner_user_id
  on public.projects (owner_user_id);

-- 4) Backfill existing team members onto projects when owner_user_id exists.
-- This creates an owner membership row if it does not exist yet.
insert into public.team_members (
  name,
  email,
  role,
  status,
  project_id,
  auth_user_id,
  joined_at
)
select
  coalesce(up.username, p.name || ' Owner') as name,
  coalesce(up.username || '@placeholder.local', p.contact_email, 'owner@placeholder.local') as email,
  'owner' as role,
  'active' as status,
  p.id as project_id,
  p.owner_user_id as auth_user_id,
  now() as joined_at
from public.projects p
left join public.user_profiles up
  on up.auth_user_id = p.owner_user_id
where p.owner_user_id is not null
  and not exists (
    select 1
    from public.team_members tm
    where tm.project_id = p.id
      and tm.auth_user_id = p.owner_user_id
  );

commit;

-- Optional validation
-- select id, name, owner_user_id from public.projects order by created_at desc;
-- select project_id, auth_user_id, role, status from public.team_members order by created_at desc;
-- select status, count(*) from public.project_onboarding_requests group by status order by status;

