begin;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  email text not null,
  role text not null default 'super_admin',
  status text not null default 'active',
  notes text not null default '',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_admin_users_auth_user_id
  on public.admin_users (auth_user_id);

create index if not exists idx_admin_users_email
  on public.admin_users (email);

alter table public.admin_users enable row level security;

create policy "authenticated read admin users"
on public.admin_users
for select
to authenticated
using (true);

create policy "authenticated manage admin users"
on public.admin_users
for all
to authenticated
using (true)
with check (true);

commit;
