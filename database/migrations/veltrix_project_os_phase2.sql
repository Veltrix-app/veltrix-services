-- Veltrix Project OS Phase 2
-- Run this migration manually in the Supabase SQL editor before deploying Phase 2 portal changes.

begin;

create table if not exists public.project_builder_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  template_kind text not null,
  name text not null,
  description text,
  base_template_id text,
  legacy_campaign_template_id uuid unique references public.project_campaign_templates(id) on delete set null,
  configuration jsonb not null default '{}'::jsonb,
  created_by_auth_user_id uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint project_builder_templates_kind_check
    check (template_kind in ('campaign', 'quest', 'raid', 'playbook'))
);

create index if not exists idx_project_builder_templates_project_kind_created
  on public.project_builder_templates (project_id, template_kind, created_at desc);

create index if not exists idx_project_builder_templates_project_updated
  on public.project_builder_templates (project_id, updated_at desc);

alter table public.project_builder_templates enable row level security;

drop policy if exists "project builder templates select" on public.project_builder_templates;
create policy "project builder templates select"
on public.project_builder_templates
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);

drop policy if exists "project builder templates mutate" on public.project_builder_templates;
create policy "project builder templates mutate"
on public.project_builder_templates
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

insert into public.project_builder_templates (
  project_id,
  template_kind,
  name,
  description,
  base_template_id,
  legacy_campaign_template_id,
  configuration,
  created_at,
  updated_at
)
select
  pct.project_id,
  'campaign',
  pct.name,
  pct.description,
  pct.base_template_id,
  pct.id,
  coalesce(pct.configuration, '{}'::jsonb),
  coalesce(pct.created_at, now()),
  coalesce(pct.updated_at, now())
from public.project_campaign_templates pct
on conflict (legacy_campaign_template_id) do update
set
  project_id = excluded.project_id,
  name = excluded.name,
  description = excluded.description,
  base_template_id = excluded.base_template_id,
  configuration = excluded.configuration,
  updated_at = excluded.updated_at;

commit;
