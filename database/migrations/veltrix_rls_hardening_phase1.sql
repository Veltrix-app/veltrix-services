begin;

create or replace function public.is_super_admin(check_auth_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.auth_user_id = check_auth_user_id
      and au.status = 'active'
      and au.role = 'super_admin'
  );
$$;

create or replace function public.has_project_membership(
  check_auth_user_id uuid,
  check_project_id uuid
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.auth_user_id = check_auth_user_id
      and tm.project_id = check_project_id
      and tm.status in ('active', 'invited')
  )
  or exists (
    select 1
    from public.projects p
    where p.id = check_project_id
      and p.owner_user_id = check_auth_user_id
  );
$$;

create or replace function public.has_project_role(
  check_auth_user_id uuid,
  check_project_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.auth_user_id = check_auth_user_id
      and tm.project_id = check_project_id
      and tm.status = 'active'
      and tm.role = any(allowed_roles)
  )
  or exists (
    select 1
    from public.projects p
    where p.id = check_project_id
      and p.owner_user_id = check_auth_user_id
      and 'owner' = any(allowed_roles)
  );
$$;

drop policy if exists "authenticated read projects" on public.projects;
drop policy if exists "authenticated write projects" on public.projects;
create policy "project access select"
on public.projects
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), id)
);
create policy "project access mutate"
on public.projects
for all
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), id, array['owner','admin'])
)
with check (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), id, array['owner','admin'])
);

drop policy if exists "authenticated read campaigns" on public.campaigns;
drop policy if exists "authenticated write campaigns" on public.campaigns;
create policy "campaign access select"
on public.campaigns
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);
create policy "campaign access mutate"
on public.campaigns
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

drop policy if exists "authenticated read quests" on public.quests;
drop policy if exists "authenticated write quests" on public.quests;
create policy "quest access select"
on public.quests
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);
create policy "quest access mutate"
on public.quests
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

drop policy if exists "authenticated read raids" on public.raids;
drop policy if exists "authenticated write raids" on public.raids;
drop policy if exists "public read raids" on public.raids;
create policy "raid access select"
on public.raids
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);
create policy "raid access mutate"
on public.raids
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

drop policy if exists "authenticated read rewards" on public.rewards;
drop policy if exists "authenticated write rewards" on public.rewards;
create policy "reward access select"
on public.rewards
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);
create policy "reward access mutate"
on public.rewards
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

drop policy if exists "authenticated read all quest_submissions" on public.quest_submissions;
drop policy if exists "authenticated update all quest_submissions" on public.quest_submissions;
drop policy if exists "authenticated read own quest_submissions" on public.quest_submissions;
drop policy if exists "authenticated insert own quest_submissions" on public.quest_submissions;
create policy "quest submissions own insert"
on public.quest_submissions
for insert
to authenticated
with check (auth.uid() = auth_user_id);
create policy "quest submissions own select"
on public.quest_submissions
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or exists (
    select 1
    from public.quests q
    where q.id::text = quest_submissions.quest_id
      and public.has_project_membership(auth.uid(), q.project_id)
  )
);
create policy "quest submissions reviewer mutate"
on public.quest_submissions
for update
to authenticated
using (
  public.is_super_admin(auth.uid())
  or exists (
    select 1
    from public.quests q
    where q.id::text = quest_submissions.quest_id
      and public.has_project_role(auth.uid(), q.project_id, array['owner','admin','reviewer'])
  )
)
with check (
  public.is_super_admin(auth.uid())
  or exists (
    select 1
    from public.quests q
    where q.id::text = quest_submissions.quest_id
      and public.has_project_role(auth.uid(), q.project_id, array['owner','admin','reviewer'])
  )
);

drop policy if exists "authenticated manage onboarding requests" on public.project_onboarding_requests;
drop policy if exists "authenticated read own onboarding requests" on public.project_onboarding_requests;
drop policy if exists "authenticated insert own onboarding requests" on public.project_onboarding_requests;
create policy "onboarding request insert own"
on public.project_onboarding_requests
for insert
to authenticated
with check (auth.uid() = requested_by_auth_user_id);
create policy "onboarding request read"
on public.project_onboarding_requests
for select
to authenticated
using (
  auth.uid() = requested_by_auth_user_id
  or public.is_super_admin(auth.uid())
);
create policy "onboarding request super admin mutate"
on public.project_onboarding_requests
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "authenticated manage team members" on public.team_members;
drop policy if exists "authenticated read own team memberships" on public.team_members;
create policy "team membership read"
on public.team_members
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);
create policy "team membership mutate"
on public.team_members
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

drop policy if exists "authenticated read own app notifications" on public.app_notifications;
drop policy if exists "authenticated insert own app notifications" on public.app_notifications;
drop policy if exists "authenticated update own app notifications" on public.app_notifications;
create policy "app notification access"
on public.app_notifications
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
);
create policy "app notification insert own"
on public.app_notifications
for insert
to authenticated
with check (auth.uid() = auth_user_id);
create policy "app notification update own"
on public.app_notifications
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

commit;
