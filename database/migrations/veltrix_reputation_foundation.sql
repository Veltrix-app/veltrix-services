begin;

create table if not exists public.user_global_reputation (
  auth_user_id uuid primary key,
  total_xp integer not null default 0,
  level integer not null default 1,
  streak integer not null default 0,
  trust_score integer not null default 50,
  sybil_score integer not null default 0,
  contribution_tier text not null default 'explorer',
  reputation_rank integer not null default 0,
  quests_completed integer not null default 0,
  raids_completed integer not null default 0,
  rewards_claimed integer not null default 0,
  status text not null default 'active',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.user_project_reputation (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 1,
  streak integer not null default 0,
  trust_score integer not null default 50,
  contribution_tier text not null default 'explorer',
  quests_completed integer not null default 0,
  raids_completed integer not null default 0,
  rewards_claimed integer not null default 0,
  last_activity_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_project_reputation_auth_user_id_project_id_key unique (auth_user_id, project_id)
);

create index if not exists idx_user_project_reputation_project_id
  on public.user_project_reputation (project_id);

create index if not exists idx_user_project_reputation_auth_user_id
  on public.user_project_reputation (auth_user_id);

alter table public.user_global_reputation enable row level security;
alter table public.user_project_reputation enable row level security;

create policy "authenticated read user global reputation"
on public.user_global_reputation
for select
to authenticated
using (true);

create policy "authenticated manage user global reputation"
on public.user_global_reputation
for all
to authenticated
using (true)
with check (true);

create policy "authenticated read user project reputation"
on public.user_project_reputation
for select
to authenticated
using (true);

create policy "authenticated manage user project reputation"
on public.user_project_reputation
for all
to authenticated
using (true)
with check (true);

insert into public.user_global_reputation (
  auth_user_id,
  total_xp,
  level,
  streak,
  trust_score,
  sybil_score,
  contribution_tier,
  reputation_rank,
  quests_completed,
  raids_completed,
  rewards_claimed,
  status
)
select
  up.auth_user_id,
  coalesce(up.xp, 0) as total_xp,
  coalesce(up.level, 1) as level,
  coalesce(up.streak, 0) as streak,
  50 as trust_score,
  0 as sybil_score,
  case
    when coalesce(up.xp, 0) >= 10000 then 'legend'
    when coalesce(up.xp, 0) >= 5000 then 'champion'
    when coalesce(up.xp, 0) >= 2000 then 'contender'
    else 'explorer'
  end as contribution_tier,
  row_number() over (order by coalesce(up.xp, 0) desc, coalesce(up.level, 1) desc) as reputation_rank,
  coalesce(quest_counts.quests_completed, 0) as quests_completed,
  coalesce(raid_counts.raids_completed, 0) as raids_completed,
  coalesce(claim_counts.rewards_claimed, 0) as rewards_claimed,
  coalesce(up.status, 'active') as status
from public.user_profiles up
left join (
  select auth_user_id, count(*)::integer as quests_completed
  from public.quest_submissions
  where status = 'approved'
  group by auth_user_id
) quest_counts on quest_counts.auth_user_id = up.auth_user_id
left join (
  select auth_user_id, count(*)::integer as raids_completed
  from public.raid_completions
  group by auth_user_id
) raid_counts on raid_counts.auth_user_id = up.auth_user_id
left join (
  select auth_user_id, count(*)::integer as rewards_claimed
  from public.reward_claims
  group by auth_user_id
) claim_counts on claim_counts.auth_user_id = up.auth_user_id
where up.auth_user_id is not null
on conflict (auth_user_id) do update set
  total_xp = excluded.total_xp,
  level = excluded.level,
  streak = excluded.streak,
  contribution_tier = excluded.contribution_tier,
  reputation_rank = excluded.reputation_rank,
  quests_completed = excluded.quests_completed,
  raids_completed = excluded.raids_completed,
  rewards_claimed = excluded.rewards_claimed,
  status = excluded.status,
  updated_at = now();

insert into public.user_project_reputation (
  auth_user_id,
  project_id,
  xp,
  level,
  streak,
  trust_score,
  contribution_tier,
  quests_completed,
  raids_completed,
  rewards_claimed,
  last_activity_at
)
with approved_quest_progress as (
  select
    qs.auth_user_id,
    q.project_id,
    sum(coalesce(q.xp, 0))::integer as xp,
    count(*)::integer as quests_completed,
    max(qs.created_at) as last_activity_at
  from public.quest_submissions qs
  join public.quests q on q.id::text = qs.quest_id
  where qs.status = 'approved'
    and q.project_id is not null
  group by qs.auth_user_id, q.project_id
),
raid_progress as (
  select
    rc.auth_user_id,
    r.project_id,
    sum(coalesce(r.reward_xp, 0))::integer as xp,
    count(*)::integer as raids_completed,
    max(rc.created_at) as last_activity_at
  from public.raid_completions rc
  join public.raids r on r.id::text = rc.raid_id
  where r.project_id is not null
  group by rc.auth_user_id, r.project_id
),
claim_progress as (
  select
    rc.auth_user_id,
    r.project_id,
    count(*)::integer as rewards_claimed,
    max(rc.created_at) as last_activity_at
  from public.reward_claims rc
  join public.rewards r on r.id::text = rc.reward_id
  where r.project_id is not null
  group by rc.auth_user_id, r.project_id
),
combined as (
  select
    coalesce(q.auth_user_id, rp.auth_user_id, cp.auth_user_id) as auth_user_id,
    coalesce(q.project_id, rp.project_id, cp.project_id) as project_id,
    coalesce(q.xp, 0) + coalesce(rp.xp, 0) as xp,
    coalesce(q.quests_completed, 0) as quests_completed,
    coalesce(rp.raids_completed, 0) as raids_completed,
    coalesce(cp.rewards_claimed, 0) as rewards_claimed,
    greatest(
      coalesce(q.last_activity_at, 'epoch'::timestamp with time zone),
      coalesce(rp.last_activity_at, 'epoch'::timestamp with time zone),
      coalesce(cp.last_activity_at, 'epoch'::timestamp with time zone)
    ) as last_activity_at
  from approved_quest_progress q
  full outer join raid_progress rp
    on rp.auth_user_id = q.auth_user_id
   and rp.project_id = q.project_id
  full outer join claim_progress cp
    on cp.auth_user_id = coalesce(q.auth_user_id, rp.auth_user_id)
   and cp.project_id = coalesce(q.project_id, rp.project_id)
)
select
  auth_user_id,
  project_id,
  xp,
  greatest(1, floor(xp / 1000.0)::integer + 1) as level,
  0 as streak,
  50 as trust_score,
  case
    when xp >= 10000 then 'legend'
    when xp >= 5000 then 'champion'
    when xp >= 2000 then 'contender'
    else 'explorer'
  end as contribution_tier,
  quests_completed,
  raids_completed,
  rewards_claimed,
  nullif(last_activity_at, 'epoch'::timestamp with time zone) as last_activity_at
from combined
where auth_user_id is not null
  and project_id is not null
on conflict (auth_user_id, project_id) do update set
  xp = excluded.xp,
  level = excluded.level,
  contribution_tier = excluded.contribution_tier,
  quests_completed = excluded.quests_completed,
  raids_completed = excluded.raids_completed,
  rewards_claimed = excluded.rewards_claimed,
  last_activity_at = excluded.last_activity_at,
  updated_at = now();

commit;
