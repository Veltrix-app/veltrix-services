begin;

alter table public.quest_submissions
  add column if not exists review_notes text not null default '',
  add column if not exists reviewed_by_auth_user_id uuid,
  add column if not exists reviewed_at timestamp with time zone,
  add column if not exists updated_at timestamp with time zone not null default now();

alter table public.reward_claims
  add column if not exists fulfillment_notes text not null default '',
  add column if not exists reviewed_at timestamp with time zone,
  add column if not exists updated_at timestamp with time zone not null default now();

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  project_id uuid references public.projects(id) on delete cascade,
  source_table text not null,
  source_id text not null,
  action text not null,
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_admin_audit_logs_source
  on public.admin_audit_logs (source_table, source_id, created_at desc);

create index if not exists idx_admin_audit_logs_project
  on public.admin_audit_logs (project_id, created_at desc);

alter table public.admin_audit_logs enable row level security;

create policy "authenticated read admin audit logs"
on public.admin_audit_logs
for select
to authenticated
using (true);

create policy "authenticated manage admin audit logs"
on public.admin_audit_logs
for all
to authenticated
using (true)
with check (true);

commit;
