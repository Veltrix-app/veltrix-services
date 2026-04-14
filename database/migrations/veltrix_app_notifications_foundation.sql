begin;

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  title text not null,
  body text not null default '',
  type text not null default 'system',
  read boolean not null default false,
  read_at timestamp with time zone,
  source_table text,
  source_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_app_notifications_auth_user_id
  on public.app_notifications (auth_user_id, created_at desc);

create index if not exists idx_app_notifications_unread
  on public.app_notifications (auth_user_id, read, created_at desc);

alter table public.app_notifications enable row level security;

create policy "authenticated read own app notifications"
on public.app_notifications
for select
to authenticated
using (auth.uid() = auth_user_id);

create policy "authenticated insert own app notifications"
on public.app_notifications
for insert
to authenticated
with check (auth.uid() = auth_user_id);

create policy "authenticated update own app notifications"
on public.app_notifications
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

commit;
