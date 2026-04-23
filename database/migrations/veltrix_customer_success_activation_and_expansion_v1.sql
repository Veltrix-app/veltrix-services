-- Veltrix customer success, activation, and expansion operations v1 foundation
-- Run this migration manually in the Supabase SQL editor before deploying the first Phase 12 tranche.

begin;

create table if not exists public.customer_account_activation (
  customer_account_id uuid primary key references public.customer_accounts(id) on delete cascade,
  activation_stage text not null default 'workspace_created',
  workspace_health_state text not null default 'activating',
  success_health_state text not null default 'watching',
  completed_milestones jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  next_best_action_key text,
  next_best_action_label text,
  next_best_action_route text,
  first_project_id uuid references public.projects(id) on delete set null,
  first_live_campaign_id uuid references public.campaigns(id) on delete set null,
  first_provider_connected_at timestamp with time zone,
  first_campaign_live_at timestamp with time zone,
  last_member_activity_at timestamp with time zone,
  last_activation_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customer_account_activation_stage_check
    check (
      activation_stage in (
        'workspace_created',
        'first_project_created',
        'provider_connected',
        'campaign_live',
        'member_active',
        'live'
      )
    ),
  constraint customer_account_activation_workspace_health_check
    check (workspace_health_state in ('not_started', 'activating', 'live', 'stalled')),
  constraint customer_account_activation_success_health_check
    check (success_health_state in ('healthy', 'watching', 'expansion_ready', 'churn_risk'))
);

create index if not exists idx_customer_account_activation_stage
  on public.customer_account_activation (activation_stage);

create index if not exists idx_customer_account_activation_workspace_health
  on public.customer_account_activation (workspace_health_state);

create index if not exists idx_customer_account_activation_success_health
  on public.customer_account_activation (success_health_state);

create table if not exists public.customer_account_success_notes (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  author_auth_user_id uuid,
  owner_auth_user_id uuid,
  note_type text not null default 'general',
  status text not null default 'open',
  title text not null default ''::text,
  body text not null default ''::text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  constraint customer_account_success_notes_note_type_check
    check (note_type in ('general', 'activation_blocker', 'expansion', 'churn_risk', 'member_health', 'follow_up')),
  constraint customer_account_success_notes_status_check
    check (status in ('open', 'resolved', 'archived'))
);

create index if not exists idx_customer_account_success_notes_account_created_at
  on public.customer_account_success_notes (customer_account_id, created_at desc);

create table if not exists public.customer_account_success_tasks (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  owner_auth_user_id uuid,
  task_type text not null default 'activation_follow_up',
  status text not null default 'open',
  due_state text not null default 'upcoming',
  title text not null default ''::text,
  summary text not null default ''::text,
  due_at timestamp with time zone,
  completed_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customer_account_success_tasks_task_type_check
    check (task_type in ('activation_follow_up', 'expansion_follow_up', 'risk_review', 'member_reactivation', 'billing_follow_up')),
  constraint customer_account_success_tasks_status_check
    check (status in ('open', 'in_progress', 'waiting', 'resolved', 'canceled')),
  constraint customer_account_success_tasks_due_state_check
    check (due_state in ('upcoming', 'due_now', 'overdue', 'resolved'))
);

create index if not exists idx_customer_account_success_tasks_account_status
  on public.customer_account_success_tasks (customer_account_id, status, due_at asc);

create table if not exists public.customer_account_success_signals (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  dedupe_key text not null,
  signal_type text not null,
  signal_tone text not null default 'default',
  status text not null default 'open',
  summary text not null default ''::text,
  signal_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  constraint customer_account_success_signals_signal_type_check
    check (signal_type in ('activation_stalled', 'first_project_missing', 'first_campaign_missing', 'member_drift', 'expansion_ready', 'paid_low_usage', 'healthy_repeat_usage')),
  constraint customer_account_success_signals_signal_tone_check
    check (signal_tone in ('default', 'success', 'warning', 'danger')),
  constraint customer_account_success_signals_status_check
    check (status in ('open', 'watching', 'resolved', 'dismissed'))
);

create unique index if not exists idx_customer_account_success_signals_dedupe
  on public.customer_account_success_signals (dedupe_key);

create index if not exists idx_customer_account_success_signals_account_status
  on public.customer_account_success_signals (customer_account_id, status, updated_at desc);

create table if not exists public.member_activation_states (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  primary_project_id uuid references public.projects(id) on delete set null,
  activation_lane text not null default 'onboarding',
  member_health_state text not null default 'new',
  completed_milestones jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  next_best_action_key text,
  next_best_action_label text,
  next_best_action_route text,
  linked_provider_count integer not null default 0,
  wallet_verified boolean not null default false,
  joined_project_count integer not null default 0,
  completed_quest_count integer not null default 0,
  claimed_reward_count integer not null default 0,
  streak_days integer not null default 0,
  last_activity_at timestamp with time zone,
  last_nudge_at timestamp with time zone,
  last_reactivation_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint member_activation_states_activation_lane_check
    check (activation_lane in ('onboarding', 'active', 'comeback')),
  constraint member_activation_states_member_health_check
    check (member_health_state in ('new', 'active', 'drifting', 'reactivation_needed'))
);

create unique index if not exists idx_member_activation_states_auth_user_id
  on public.member_activation_states (auth_user_id);

create index if not exists idx_member_activation_states_lane_health
  on public.member_activation_states (activation_lane, member_health_state);

create table if not exists public.member_reactivation_events (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  primary_project_id uuid references public.projects(id) on delete set null,
  event_type text not null,
  reason_key text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint member_reactivation_events_event_type_check
    check (event_type in ('prompt_shown', 'email_sent', 'member_returned', 'dismissed', 'completed'))
);

create index if not exists idx_member_reactivation_events_auth_user_created
  on public.member_reactivation_events (auth_user_id, created_at desc);

create table if not exists public.activation_nudges (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null,
  target_type text not null,
  customer_account_id uuid references public.customer_accounts(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  auth_user_id uuid,
  channel text not null,
  reason_key text not null,
  status text not null default 'pending',
  title text not null default ''::text,
  body text not null default ''::text,
  route text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  constraint activation_nudges_target_type_check
    check (target_type in ('account', 'project', 'member')),
  constraint activation_nudges_channel_check
    check (channel in ('in_product', 'email')),
  constraint activation_nudges_status_check
    check (status in ('pending', 'shown', 'sent', 'dismissed', 'completed'))
);

create unique index if not exists idx_activation_nudges_dedupe
  on public.activation_nudges (dedupe_key);

create index if not exists idx_activation_nudges_target_status
  on public.activation_nudges (target_type, status, updated_at desc);

with account_project_rollups as (
  select
    ca.id as customer_account_id,
    min(p.created_at) as first_project_created_at,
    (
      array_agg(p.id order by p.created_at asc nulls last, p.id asc)
      filter (where p.id is not null)
    )[1] as first_project_id,
    count(distinct p.id) as project_count,
    count(distinct case when pi.status = 'connected' then pi.provider end) as provider_count,
    min(case when pi.status = 'connected' then pi.connected_at end) as first_provider_connected_at,
    count(distinct case when c.status = 'active' then c.id end) as active_campaign_count,
    (
      array_agg(c.id order by c.created_at asc nulls last, c.id asc)
      filter (where c.status = 'active' and c.id is not null)
    )[1] as first_live_campaign_id,
    min(case when c.status = 'active' then c.created_at end) as first_campaign_live_at,
    max(xe.created_at) as last_member_activity_at
  from public.customer_accounts ca
  left join public.projects p
    on p.customer_account_id = ca.id
  left join public.project_integrations pi
    on pi.project_id = p.id
  left join public.campaigns c
    on c.project_id = p.id
  left join public.xp_events xe
    on xe.project_id = p.id
  group by ca.id
),
account_limit_rollups as (
  select
    cae.customer_account_id,
    greatest(
      coalesce(cae.current_projects::numeric / nullif(cae.max_projects, 0), 0),
      coalesce(cae.current_active_campaigns::numeric / nullif(cae.max_active_campaigns, 0), 0),
      coalesce(cae.current_live_quests::numeric / nullif(cae.max_live_quests, 0), 0),
      coalesce(cae.current_live_raids::numeric / nullif(cae.max_live_raids, 0), 0),
      coalesce(cae.current_providers::numeric / nullif(cae.max_providers, 0), 0),
      coalesce(cae.current_billable_seats::numeric / nullif(cae.included_billable_seats, 0), 0)
    ) as max_usage_ratio
  from public.customer_account_entitlements cae
),
account_source as (
  select
    ca.id as customer_account_id,
    ca.created_at,
    ca.updated_at,
    coalesce(cao.first_project_id, apr.first_project_id) as first_project_id,
    bp.id as billing_plan_id,
    cas.status as billing_status,
    apr.project_count,
    apr.provider_count,
    apr.active_campaign_count,
    apr.first_provider_connected_at,
    apr.first_live_campaign_id,
    apr.first_campaign_live_at,
    apr.last_member_activity_at,
    coalesce(alr.max_usage_ratio, 0) as max_usage_ratio
  from public.customer_accounts ca
  left join public.customer_account_onboarding cao
    on cao.customer_account_id = ca.id
  left join account_project_rollups apr
    on apr.customer_account_id = ca.id
  left join public.customer_account_subscriptions cas
    on cas.customer_account_id = ca.id
   and cas.is_current = true
  left join public.billing_plans bp
    on bp.id = cas.billing_plan_id
  left join account_limit_rollups alr
    on alr.customer_account_id = ca.id
)
insert into public.customer_account_activation (
  customer_account_id,
  activation_stage,
  workspace_health_state,
  success_health_state,
  completed_milestones,
  blockers,
  next_best_action_key,
  next_best_action_label,
  next_best_action_route,
  first_project_id,
  first_live_campaign_id,
  first_provider_connected_at,
  first_campaign_live_at,
  last_member_activity_at,
  last_activation_at,
  metadata
)
select
  source.customer_account_id,
  case
    when coalesce(source.project_count, 0) = 0 then 'workspace_created'
    when coalesce(source.provider_count, 0) = 0 then 'first_project_created'
    when coalesce(source.active_campaign_count, 0) = 0 then 'provider_connected'
    when source.last_member_activity_at is null then 'campaign_live'
    when source.last_member_activity_at is not null then 'live'
    else 'workspace_created'
  end as activation_stage,
  case
    when coalesce(source.project_count, 0) = 0 and source.created_at >= now() - interval '3 days' then 'not_started'
    when coalesce(source.active_campaign_count, 0) > 0 and source.last_member_activity_at is not null then 'live'
    when source.created_at <= now() - interval '10 days' then 'stalled'
    else 'activating'
  end as workspace_health_state,
  case
    when source.billing_plan_id is not null
      and source.billing_plan_id <> 'free'
      and (
        (coalesce(source.project_count, 0) = 0 and source.created_at <= now() - interval '14 days')
        or (coalesce(source.active_campaign_count, 0) = 0 and source.created_at <= now() - interval '21 days')
      ) then 'churn_risk'
    when source.max_usage_ratio >= 0.7 then 'expansion_ready'
    when source.created_at <= now() - interval '10 days'
      and (
        coalesce(source.project_count, 0) = 0
        or coalesce(source.provider_count, 0) = 0
        or coalesce(source.active_campaign_count, 0) = 0
      ) then 'watching'
    else 'healthy'
  end as success_health_state,
  (
    case when coalesce(source.project_count, 0) > 0 then jsonb_build_array('first_project_created') else '[]'::jsonb end
    || case when coalesce(source.provider_count, 0) > 0 then jsonb_build_array('provider_connected') else '[]'::jsonb end
    || case when coalesce(source.active_campaign_count, 0) > 0 then jsonb_build_array('first_campaign_live') else '[]'::jsonb end
    || case when source.last_member_activity_at is not null then jsonb_build_array('first_member_activity') else '[]'::jsonb end
  ) as completed_milestones,
  (
    case when coalesce(source.project_count, 0) = 0 then jsonb_build_array('Create the first project workspace.') else '[]'::jsonb end
    || case when coalesce(source.project_count, 0) > 0 and coalesce(source.provider_count, 0) = 0 then jsonb_build_array('Connect the first provider to unlock live delivery rails.') else '[]'::jsonb end
    || case when coalesce(source.provider_count, 0) > 0 and coalesce(source.active_campaign_count, 0) = 0 then jsonb_build_array('Publish the first live campaign to activate the workspace.') else '[]'::jsonb end
    || case when coalesce(source.active_campaign_count, 0) > 0 and source.last_member_activity_at is null then jsonb_build_array('Drive the first member activity through quests, raids, or rewards.') else '[]'::jsonb end
  ) as blockers,
  case
    when coalesce(source.project_count, 0) = 0 then 'create_first_project'
    when coalesce(source.provider_count, 0) = 0 then 'connect_first_provider'
    when coalesce(source.active_campaign_count, 0) = 0 then 'publish_first_campaign'
    when source.last_member_activity_at is null then 'drive_first_member_activity'
    else 'scale_live_workspace'
  end as next_best_action_key,
  case
    when coalesce(source.project_count, 0) = 0 then 'Create first project'
    when coalesce(source.provider_count, 0) = 0 then 'Connect first provider'
    when coalesce(source.active_campaign_count, 0) = 0 then 'Publish first campaign'
    when source.last_member_activity_at is null then 'Drive first member activity'
    else 'Keep the workspace moving'
  end as next_best_action_label,
  case
    when coalesce(source.project_count, 0) = 0 then '/projects'
    when source.first_project_id is not null and coalesce(source.provider_count, 0) = 0 then '/projects/' || source.first_project_id || '/settings'
    when source.first_project_id is not null and coalesce(source.active_campaign_count, 0) = 0 then '/projects/' || source.first_project_id || '/launch'
    when source.first_project_id is not null and source.last_member_activity_at is null then '/projects/' || source.first_project_id || '/community'
    when source.first_project_id is not null then '/projects/' || source.first_project_id
    else '/account'
  end as next_best_action_route,
  source.first_project_id,
  source.first_live_campaign_id,
  source.first_provider_connected_at,
  source.first_campaign_live_at,
  source.last_member_activity_at,
  source.last_member_activity_at,
  jsonb_build_object(
    'projectCount', coalesce(source.project_count, 0),
    'providerCount', coalesce(source.provider_count, 0),
    'activeCampaignCount', coalesce(source.active_campaign_count, 0),
    'billingPlanId', source.billing_plan_id,
    'billingStatus', source.billing_status,
    'maxUsageRatio', source.max_usage_ratio,
    'backfilled', true
  )
from account_source source
on conflict (customer_account_id) do update
set
  activation_stage = excluded.activation_stage,
  workspace_health_state = excluded.workspace_health_state,
  success_health_state = excluded.success_health_state,
  completed_milestones = excluded.completed_milestones,
  blockers = excluded.blockers,
  next_best_action_key = excluded.next_best_action_key,
  next_best_action_label = excluded.next_best_action_label,
  next_best_action_route = excluded.next_best_action_route,
  first_project_id = excluded.first_project_id,
  first_live_campaign_id = excluded.first_live_campaign_id,
  first_provider_connected_at = excluded.first_provider_connected_at,
  first_campaign_live_at = excluded.first_campaign_live_at,
  last_member_activity_at = excluded.last_member_activity_at,
  last_activation_at = excluded.last_activation_at,
  metadata = excluded.metadata,
  updated_at = now();

with member_source as (
  select
    up.auth_user_id,
    null::uuid as primary_project_id,
    coalesce(
      (select count(*) from public.user_connected_accounts uca where uca.auth_user_id = up.auth_user_id and uca.status = 'connected'),
      0
    ) as linked_provider_count,
    exists(
      select 1 from public.wallet_links wl
      where wl.auth_user_id = up.auth_user_id
        and wl.verified = true
    ) as wallet_verified,
    coalesce(array_length(up.joined_communities, 1), 0) as joined_project_count,
    coalesce((select count(*) from public.quest_submissions qs where qs.auth_user_id = up.auth_user_id), 0) as completed_quest_count,
    coalesce((select count(*) from public.reward_claims rc where rc.auth_user_id = up.auth_user_id), 0) as claimed_reward_count,
    coalesce(ugr.streak, 0) as streak_days,
    greatest(
      coalesce((select max(xe.created_at) from public.xp_events xe where xe.auth_user_id = up.auth_user_id), timestamp with time zone 'epoch'),
      coalesce((select max(rc.created_at) from public.reward_claims rc where rc.auth_user_id = up.auth_user_id), timestamp with time zone 'epoch'),
      coalesce((select max(qs.created_at) from public.quest_submissions qs where qs.auth_user_id = up.auth_user_id), timestamp with time zone 'epoch'),
      coalesce(ugr.updated_at, timestamp with time zone 'epoch'),
      coalesce(up.updated_at, timestamp with time zone 'epoch')
    ) as last_activity_at
  from public.user_progress up
  left join public.user_global_reputation ugr
    on ugr.auth_user_id = up.auth_user_id
)
insert into public.member_activation_states (
  auth_user_id,
  primary_project_id,
  activation_lane,
  member_health_state,
  completed_milestones,
  blockers,
  next_best_action_key,
  next_best_action_label,
  next_best_action_route,
  linked_provider_count,
  wallet_verified,
  joined_project_count,
  completed_quest_count,
  claimed_reward_count,
  streak_days,
  last_activity_at,
  metadata
)
select
  source.auth_user_id,
  source.primary_project_id,
  case
    when source.linked_provider_count = 0 or source.wallet_verified = false or source.joined_project_count = 0 then 'onboarding'
    when source.last_activity_at <= now() - interval '14 days' then 'comeback'
    else 'active'
  end as activation_lane,
  case
    when source.linked_provider_count = 0 or source.wallet_verified = false or source.joined_project_count = 0 then 'new'
    when source.last_activity_at <= now() - interval '30 days' then 'reactivation_needed'
    when source.last_activity_at <= now() - interval '14 days' then 'drifting'
    else 'active'
  end as member_health_state,
  (
    case when source.linked_provider_count > 0 then jsonb_build_array('provider_connected') else '[]'::jsonb end
    || case when source.wallet_verified then jsonb_build_array('wallet_verified') else '[]'::jsonb end
    || case when source.joined_project_count > 0 then jsonb_build_array('joined_first_project') else '[]'::jsonb end
    || case when source.completed_quest_count > 0 then jsonb_build_array('first_quest_completed') else '[]'::jsonb end
    || case when source.claimed_reward_count > 0 then jsonb_build_array('first_reward_claimed') else '[]'::jsonb end
  ) as completed_milestones,
  (
    case when source.linked_provider_count = 0 then jsonb_build_array('Link the first provider account.') else '[]'::jsonb end
    || case when source.wallet_verified = false then jsonb_build_array('Verify the first wallet.') else '[]'::jsonb end
    || case when source.joined_project_count = 0 then jsonb_build_array('Join the first project community.') else '[]'::jsonb end
    || case when source.joined_project_count > 0 and source.completed_quest_count = 0 then jsonb_build_array('Complete the first quest to unlock the active lane.') else '[]'::jsonb end
    || case when source.last_activity_at <= now() - interval '14 days' then jsonb_build_array('Return through a comeback path to restore momentum.') else '[]'::jsonb end
  ) as blockers,
  case
    when source.linked_provider_count = 0 then 'link_first_provider'
    when source.wallet_verified = false then 'verify_first_wallet'
    when source.joined_project_count = 0 then 'join_first_project'
    when source.last_activity_at <= now() - interval '14 days' then 'resume_member_momentum'
    else 'open_live_missions'
  end as next_best_action_key,
  case
    when source.linked_provider_count = 0 then 'Link first provider'
    when source.wallet_verified = false then 'Verify first wallet'
    when source.joined_project_count = 0 then 'Join first project'
    when source.last_activity_at <= now() - interval '14 days' then 'Resume momentum'
    else 'Open live missions'
  end as next_best_action_label,
  case
    when source.linked_provider_count = 0 or source.wallet_verified = false or source.joined_project_count = 0 then '/community/onboarding'
    when source.last_activity_at <= now() - interval '14 days' then '/community/comeback'
    else '/home'
  end as next_best_action_route,
  source.linked_provider_count,
  source.wallet_verified,
  source.joined_project_count,
  source.completed_quest_count,
  source.claimed_reward_count,
  source.streak_days,
  nullif(source.last_activity_at, timestamp with time zone 'epoch'),
  jsonb_build_object(
    'backfilled', true,
    'joinedProjectCount', source.joined_project_count,
    'completedQuestCount', source.completed_quest_count,
    'claimedRewardCount', source.claimed_reward_count
  )
from member_source source
on conflict (auth_user_id) do update
set
  primary_project_id = excluded.primary_project_id,
  activation_lane = excluded.activation_lane,
  member_health_state = excluded.member_health_state,
  completed_milestones = excluded.completed_milestones,
  blockers = excluded.blockers,
  next_best_action_key = excluded.next_best_action_key,
  next_best_action_label = excluded.next_best_action_label,
  next_best_action_route = excluded.next_best_action_route,
  linked_provider_count = excluded.linked_provider_count,
  wallet_verified = excluded.wallet_verified,
  joined_project_count = excluded.joined_project_count,
  completed_quest_count = excluded.completed_quest_count,
  claimed_reward_count = excluded.claimed_reward_count,
  streak_days = excluded.streak_days,
  last_activity_at = excluded.last_activity_at,
  metadata = excluded.metadata,
  updated_at = now();

commit;
