-- VYNTRO Bot Automation Reliability v1
-- Keeps scheduled/manual automation runs idempotent and observable.

begin;

with duplicate_running as (
  select
    id,
    row_number() over (
      partition by automation_id
      order by started_at desc, created_at desc
    ) as run_rank
  from public.community_automation_runs
  where status = 'running'
    and automation_id is not null
)
update public.community_automation_runs run
set
  status = 'failed',
  summary = 'Expired by reliability migration because another run already owned the automation lock.',
  completed_at = coalesce(run.completed_at, now()),
  metadata = coalesce(run.metadata, '{}'::jsonb) || jsonb_build_object(
    'reliability',
    jsonb_build_object('code', 'duplicate_running_run_expired')
  )
from duplicate_running duplicate
where run.id = duplicate.id
  and duplicate.run_rank > 1;

update public.community_automation_runs
set
  status = 'failed',
  summary = 'Expired by reliability migration because the run stayed running beyond the lock window.',
  completed_at = coalesce(completed_at, now()),
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'reliability',
    jsonb_build_object('code', 'stale_running_run_expired')
  )
where status = 'running'
  and automation_id is not null
  and started_at < now() - interval '30 minutes';

create unique index if not exists idx_community_automation_runs_running_lock
  on public.community_automation_runs (automation_id)
  where automation_id is not null and status = 'running';

create index if not exists idx_community_automation_runs_running_started_at
  on public.community_automation_runs (status, started_at)
  where status = 'running';

commit;
