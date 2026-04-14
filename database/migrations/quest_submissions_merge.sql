-- Veltrix submission unification migration
-- Goal:
-- 1. Keep public.quest_submissions as the single source of truth
-- 2. Backfill legacy rows from public.submissions
-- 3. Add indexes that help the admin portal moderation flow
--
-- Run this in Supabase SQL Editor.
-- After validation, you can stop reading/writing public.submissions entirely.

begin;

create index if not exists idx_quest_submissions_created_at
  on public.quest_submissions (created_at desc);

create index if not exists idx_quest_submissions_status
  on public.quest_submissions (status);

create index if not exists idx_quest_submissions_auth_user_id
  on public.quest_submissions (auth_user_id);

create index if not exists idx_quest_submissions_quest_id
  on public.quest_submissions (quest_id);

insert into public.quest_submissions (
  auth_user_id,
  quest_id,
  status,
  proof_text,
  created_at
)
select
  coalesce(s.user_id, up.auth_user_id) as auth_user_id,
  s.quest_id::text as quest_id,
  s.status,
  s.proof as proof_text,
  s.submitted_at as created_at
from public.submissions s
left join public.user_profiles up
  on up.id = s.user_id
where coalesce(s.user_id, up.auth_user_id) is not null
  and not exists (
    select 1
    from public.quest_submissions qs
    where qs.auth_user_id = coalesce(s.user_id, up.auth_user_id)
      and qs.quest_id = s.quest_id::text
      and qs.proof_text = s.proof
      and qs.created_at = s.submitted_at
  );

commit;

-- Validation queries:
-- select count(*) as legacy_submission_count from public.submissions;
-- select count(*) as unified_submission_count from public.quest_submissions;
-- select status, count(*) from public.quest_submissions group by status order by status;

-- Optional cleanup after you verify the admin portal and app are working on quest_submissions:
-- alter table public.submissions rename to submissions_legacy;

-- Optional compatibility view if you still have old dashboards or queries expecting public.submissions:
-- create view public.submissions as
-- select
--   qs.id,
--   qs.auth_user_id as user_id,
--   coalesce(up.username, 'Unknown User') as username,
--   q.id as quest_id,
--   q.title as quest_title,
--   c.id as campaign_id,
--   c.title as campaign_title,
--   qs.proof_text as proof,
--   qs.created_at as submitted_at,
--   qs.status
-- from public.quest_submissions qs
-- left join public.user_profiles up
--   on up.auth_user_id = qs.auth_user_id
-- left join public.quests q
--   on q.id::text = qs.quest_id
-- left join public.campaigns c
--   on c.id = q.campaign_id;
