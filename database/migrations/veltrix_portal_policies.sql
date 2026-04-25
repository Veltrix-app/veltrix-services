-- VYNTRO portal RLS policies
-- Run in Supabase SQL Editor.
--
-- Goal:
-- 1. Let authenticated users submit onboarding requests
-- 2. Let authenticated users read their own onboarding requests
-- 3. Let authenticated users read their own team memberships
-- 4. Keep the current broad admin-portal pattern for now where
--    authenticated users can manage team members and onboarding review
--    until stricter admin-only RLS is introduced

begin;

alter table public.project_onboarding_requests enable row level security;
alter table public.team_members enable row level security;

create policy "authenticated insert own onboarding requests"
on public.project_onboarding_requests
for insert
to authenticated
with check (
  auth.uid() = requested_by_auth_user_id
);

create policy "authenticated read own onboarding requests"
on public.project_onboarding_requests
for select
to authenticated
using (
  auth.uid() = requested_by_auth_user_id
);

create policy "authenticated manage onboarding requests"
on public.project_onboarding_requests
for all
to authenticated
using (true)
with check (true);

create policy "authenticated read own team memberships"
on public.team_members
for select
to authenticated
using (
  auth.uid() = auth_user_id
);

create policy "authenticated manage team members"
on public.team_members
for all
to authenticated
using (true)
with check (true);

commit;

-- Validation:
-- select schemaname, tablename, policyname, cmd
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('project_onboarding_requests', 'team_members')
-- order by tablename, policyname;
