-- VYNTRO Lootbox Sponsor Packages Phase 2L: sponsor package persistence foundation.
-- Run manually in Supabase SQL editor before enabling sponsor package write APIs.

begin;

create table if not exists public.lootbox_sponsor_packages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  package_tier text not null,
  status text not null default 'draft',
  sponsor_name text,
  sponsor_contact text,
  sponsor_budget numeric(12,2) not null default 0,
  currency text not null default 'USD',
  owner_auth_user_id uuid references auth.users(id) on delete set null,
  follow_up_at timestamp with time zone,
  last_contacted_at timestamp with time zone,
  package_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by_auth_user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint lootbox_sponsor_packages_tier_check
    check (package_tier in ('starter', 'standard', 'premium')),
  constraint lootbox_sponsor_packages_status_check
    check (status in ('draft', 'ready_to_pitch', 'pitched', 'negotiating', 'won', 'lost', 'blocked', 'archived')),
  constraint lootbox_sponsor_packages_budget_check
    check (sponsor_budget >= 0),
  constraint lootbox_sponsor_packages_currency_check
    check (length(currency) between 3 and 12)
);

create index if not exists idx_lootbox_sponsor_packages_project_status_followup
  on public.lootbox_sponsor_packages (project_id, status, follow_up_at);

create index if not exists idx_lootbox_sponsor_packages_campaign_status
  on public.lootbox_sponsor_packages (campaign_id, status);

create index if not exists idx_lootbox_sponsor_packages_owner_followup
  on public.lootbox_sponsor_packages (owner_auth_user_id, follow_up_at)
  where owner_auth_user_id is not null;

create index if not exists idx_lootbox_sponsor_packages_active_followup
  on public.lootbox_sponsor_packages (status, follow_up_at)
  where status in ('draft', 'ready_to_pitch', 'pitched', 'negotiating', 'blocked');

create table if not exists public.lootbox_sponsor_package_notes (
  id uuid primary key default gen_random_uuid(),
  sponsor_package_id uuid not null references public.lootbox_sponsor_packages(id) on delete cascade,
  note_type text not null default 'operator_note',
  note text not null,
  follow_up_at timestamp with time zone,
  created_by_auth_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint lootbox_sponsor_package_notes_note_type_check
    check (note_type in ('operator_note', 'sponsor_follow_up', 'status_change', 'decision')),
  constraint lootbox_sponsor_package_notes_note_check
    check (length(trim(note)) between 1 and 2000)
);

create index if not exists idx_lootbox_sponsor_package_notes_package_created
  on public.lootbox_sponsor_package_notes (sponsor_package_id, created_at desc);

create index if not exists idx_lootbox_sponsor_package_notes_followup
  on public.lootbox_sponsor_package_notes (follow_up_at)
  where follow_up_at is not null;

alter table public.lootbox_sponsor_packages enable row level security;
alter table public.lootbox_sponsor_package_notes enable row level security;

drop policy if exists "lootbox sponsor packages select" on public.lootbox_sponsor_packages;
create policy "lootbox sponsor packages select"
on public.lootbox_sponsor_packages
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);

drop policy if exists "lootbox sponsor packages mutate" on public.lootbox_sponsor_packages;
create policy "lootbox sponsor packages mutate"
on public.lootbox_sponsor_packages
for all
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner', 'admin'])
)
with check (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner', 'admin'])
);

drop policy if exists "lootbox sponsor package notes select" on public.lootbox_sponsor_package_notes;
create policy "lootbox sponsor package notes select"
on public.lootbox_sponsor_package_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.lootbox_sponsor_packages package
    where package.id = sponsor_package_id
      and (
        public.is_super_admin(auth.uid())
        or public.has_project_membership(auth.uid(), package.project_id)
      )
  )
);

drop policy if exists "lootbox sponsor package notes mutate" on public.lootbox_sponsor_package_notes;
create policy "lootbox sponsor package notes mutate"
on public.lootbox_sponsor_package_notes
for all
to authenticated
using (
  exists (
    select 1
    from public.lootbox_sponsor_packages package
    where package.id = sponsor_package_id
      and (
        public.is_super_admin(auth.uid())
        or public.has_project_role(auth.uid(), package.project_id, array['owner', 'admin'])
      )
  )
)
with check (
  exists (
    select 1
    from public.lootbox_sponsor_packages package
    where package.id = sponsor_package_id
      and (
        public.is_super_admin(auth.uid())
        or public.has_project_role(auth.uid(), package.project_id, array['owner', 'admin'])
      )
  )
);

commit;
