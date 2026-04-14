begin;

create table if not exists public.project_campaign_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text not null default '',
  base_template_id text not null,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_campaign_templates_project_id
  on public.project_campaign_templates (project_id);

create index if not exists idx_project_campaign_templates_created_at
  on public.project_campaign_templates (created_at desc);

alter table public.project_campaign_templates enable row level security;

create policy "authenticated read project campaign templates"
on public.project_campaign_templates
for select
to authenticated
using (true);

create policy "authenticated write project campaign templates"
on public.project_campaign_templates
for all
to authenticated
using (true)
with check (true);

commit;

select
  id,
  project_id,
  name,
  base_template_id,
  created_at
from public.project_campaign_templates
order by created_at desc
limit 20;
