begin;

create table if not exists public.growth_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (
    event_type = any (
      array[
        'anonymous_visit',
        'pricing_view',
        'signup_started',
        'signup_completed',
        'workspace_created',
        'first_project_created',
        'provider_connected',
        'first_campaign_live',
        'checkout_started',
        'paid_converted',
        'renewal_succeeded',
        'renewal_failed',
        'expanded',
        'downgraded',
        'churned',
        'member_joined',
        'member_completed_first_quest',
        'member_returned',
        'reward_claimed'
      ]
    )
  ),
  event_source text not null default 'system' check (
    event_source = any (
      array['webapp', 'portal', 'billing', 'customer', 'system', 'support', 'success']
    )
  ),
  occurred_at timestamptz not null default now(),
  auth_user_id uuid,
  customer_account_id uuid references public.customer_accounts(id),
  project_id uuid references public.projects(id),
  campaign_id uuid references public.campaigns(id),
  session_id text,
  anonymous_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  landing_path text,
  first_touch_source text,
  first_touch_medium text,
  first_touch_campaign text,
  first_touch_term text,
  first_touch_content text,
  first_touch_referrer text,
  first_touch_landing_path text,
  first_touch_captured_at timestamptz,
  latest_touch_source text,
  latest_touch_medium text,
  latest_touch_campaign text,
  latest_touch_term text,
  latest_touch_content text,
  latest_touch_referrer text,
  latest_touch_landing_path text,
  latest_touch_captured_at timestamptz,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists growth_analytics_events_occurred_at_idx
  on public.growth_analytics_events (occurred_at desc);
create index if not exists growth_analytics_events_event_type_idx
  on public.growth_analytics_events (event_type, occurred_at desc);
create index if not exists growth_analytics_events_account_idx
  on public.growth_analytics_events (customer_account_id, occurred_at desc);
create index if not exists growth_analytics_events_project_idx
  on public.growth_analytics_events (project_id, occurred_at desc);
create index if not exists growth_analytics_events_auth_user_idx
  on public.growth_analytics_events (auth_user_id, occurred_at desc);

create table if not exists public.growth_funnel_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  funnel_stage text not null check (
    funnel_stage = any (
      array[
        'anonymous_visit',
        'pricing_view',
        'signup_started',
        'signup_completed',
        'workspace_created',
        'first_project_created',
        'first_provider_connected',
        'first_campaign_live',
        'checkout_started',
        'paid_converted',
        'retained_30d',
        'expanded',
        'downgraded',
        'churned'
      ]
    )
  ),
  metric_value integer not null default 0,
  conversion_rate numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (snapshot_date, funnel_stage)
);

create table if not exists public.customer_account_growth_snapshots (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id),
  snapshot_date date not null,
  billing_plan_id text,
  billing_status text not null default 'free',
  activation_stage text not null default 'workspace_created',
  workspace_health_state text not null default 'not_started',
  success_health_state text not null default 'watching',
  project_count integer not null default 0,
  active_campaign_count integer not null default 0,
  provider_count integer not null default 0,
  billable_seat_count integer not null default 0,
  current_mrr integer not null default 0,
  is_paid_account boolean not null default false,
  is_retained_30d boolean not null default false,
  is_expansion_ready boolean not null default false,
  is_churn_risk boolean not null default false,
  first_touch_source text,
  latest_touch_source text,
  conversion_touch_source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_account_id, snapshot_date)
);

create index if not exists customer_account_growth_snapshots_date_idx
  on public.customer_account_growth_snapshots (snapshot_date desc);
create index if not exists customer_account_growth_snapshots_plan_idx
  on public.customer_account_growth_snapshots (billing_plan_id, snapshot_date desc);

create table if not exists public.project_growth_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  customer_account_id uuid references public.customer_accounts(id),
  snapshot_date date not null,
  project_status text not null default 'draft',
  campaign_count integer not null default 0,
  active_campaign_count integer not null default 0,
  live_quest_count integer not null default 0,
  live_raid_count integer not null default 0,
  visible_reward_count integer not null default 0,
  provider_count integer not null default 0,
  team_member_count integer not null default 0,
  member_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, snapshot_date)
);

create index if not exists project_growth_snapshots_date_idx
  on public.project_growth_snapshots (snapshot_date desc);
create index if not exists project_growth_snapshots_account_idx
  on public.project_growth_snapshots (customer_account_id, snapshot_date desc);

create table if not exists public.retention_cohort_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  cohort_type text not null check (cohort_type = any (array['signup', 'paid'])),
  cohort_key text not null,
  cohort_start date not null,
  period_day integer not null default 0,
  account_count integer not null default 0,
  retained_count integer not null default 0,
  retained_rate numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (snapshot_date, cohort_type, cohort_key, cohort_start, period_day)
);

create table if not exists public.benchmark_cohort_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  cohort_key text not null,
  benchmark_key text not null,
  minimum_cohort_size integer not null default 25,
  cohort_size integer not null default 0,
  lower_bound numeric,
  median_value numeric,
  upper_bound numeric,
  top_band_threshold numeric,
  unit text not null default 'count',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (snapshot_date, cohort_key, benchmark_key)
);

with current_subscription as (
  select distinct on (subscription.customer_account_id)
    subscription.customer_account_id,
    subscription.billing_plan_id,
    subscription.status
  from public.customer_account_subscriptions as subscription
  order by
    subscription.customer_account_id,
    subscription.is_current desc,
    subscription.created_at desc
),
project_counts as (
  select
    project.customer_account_id,
    count(*)::integer as project_count,
    count(*) filter (where project.status = 'active')::integer as active_project_count
  from public.projects as project
  where project.customer_account_id is not null
  group by project.customer_account_id
),
active_campaign_counts as (
  select
    project.customer_account_id,
    count(*) filter (where campaign.status = 'active')::integer as active_campaign_count
  from public.campaigns as campaign
  join public.projects as project on project.id = campaign.project_id
  where project.customer_account_id is not null
  group by project.customer_account_id
),
provider_counts as (
  select
    project.customer_account_id,
    count(*) filter (where integration.status in ('connected', 'needs_attention'))::integer as provider_count
  from public.project_integrations as integration
  join public.projects as project on project.id = integration.project_id
  where project.customer_account_id is not null
  group by project.customer_account_id
),
seat_counts as (
  select
    membership.customer_account_id,
    count(*) filter (
      where membership.status = 'active' and membership.role in ('owner', 'admin', 'member')
    )::integer as billable_seat_count
  from public.customer_account_memberships as membership
  group by membership.customer_account_id
)
insert into public.customer_account_growth_snapshots (
  customer_account_id,
  snapshot_date,
  billing_plan_id,
  billing_status,
  activation_stage,
  workspace_health_state,
  success_health_state,
  project_count,
  active_campaign_count,
  provider_count,
  billable_seat_count,
  current_mrr,
  is_paid_account,
  is_retained_30d,
  is_expansion_ready,
  is_churn_risk,
  metadata
)
select
  account.id,
  current_date,
  subscription.billing_plan_id,
  coalesce(subscription.status, 'free'),
  case
    when coalesce(active_campaign.active_campaign_count, 0) > 0 then 'campaign_live'
    when coalesce(provider.provider_count, 0) > 0 then 'provider_connected'
    when coalesce(projects.project_count, 0) > 0 then 'first_project_created'
    else 'workspace_created'
  end,
  case
    when coalesce(active_campaign.active_campaign_count, 0) > 0 then 'live'
    when coalesce(projects.project_count, 0) > 0 or coalesce(provider.provider_count, 0) > 0 then 'activating'
    else 'not_started'
  end,
  case
    when coalesce(active_campaign.active_campaign_count, 0) > 0 and coalesce(projects.project_count, 0) >= 2 then 'expansion_ready'
    when coalesce(subscription.status, 'free') in ('past_due', 'grace') then 'churn_risk'
    when coalesce(projects.project_count, 0) > 0 or coalesce(provider.provider_count, 0) > 0 then 'healthy'
    else 'watching'
  end,
  coalesce(projects.project_count, 0),
  coalesce(active_campaign.active_campaign_count, 0),
  coalesce(provider.provider_count, 0),
  coalesce(seats.billable_seat_count, 0),
  case
    when plan.id is not null and plan.id <> 'free' and not coalesce(plan.is_enterprise, false)
      then coalesce(plan.price_monthly, 0)
    else 0
  end,
  coalesce(plan.id, 'free') <> 'free',
  account.created_at <= (now() - interval '30 days'),
  coalesce(projects.project_count, 0) >= 2 or coalesce(seats.billable_seat_count, 0) >= 4,
  coalesce(subscription.status, 'free') in ('past_due', 'grace'),
  jsonb_build_object(
    'source', 'phase13_backfill',
    'activeProjectCount', coalesce(projects.active_project_count, 0)
  )
from public.customer_accounts as account
left join current_subscription as subscription
  on subscription.customer_account_id = account.id
left join public.billing_plans as plan
  on plan.id = subscription.billing_plan_id
left join project_counts as projects
  on projects.customer_account_id = account.id
left join active_campaign_counts as active_campaign
  on active_campaign.customer_account_id = account.id
left join provider_counts as provider
  on provider.customer_account_id = account.id
left join seat_counts as seats
  on seats.customer_account_id = account.id
on conflict (customer_account_id, snapshot_date) do update
set
  billing_plan_id = excluded.billing_plan_id,
  billing_status = excluded.billing_status,
  activation_stage = excluded.activation_stage,
  workspace_health_state = excluded.workspace_health_state,
  success_health_state = excluded.success_health_state,
  project_count = excluded.project_count,
  active_campaign_count = excluded.active_campaign_count,
  provider_count = excluded.provider_count,
  billable_seat_count = excluded.billable_seat_count,
  current_mrr = excluded.current_mrr,
  is_paid_account = excluded.is_paid_account,
  is_retained_30d = excluded.is_retained_30d,
  is_expansion_ready = excluded.is_expansion_ready,
  is_churn_risk = excluded.is_churn_risk,
  metadata = excluded.metadata,
  updated_at = now();

with campaign_counts as (
  select
    campaign.project_id,
    count(*)::integer as campaign_count,
    count(*) filter (where campaign.status = 'active')::integer as active_campaign_count
  from public.campaigns as campaign
  group by campaign.project_id
),
quest_counts as (
  select
    quest.project_id,
    count(*) filter (where quest.status = 'active')::integer as live_quest_count
  from public.quests as quest
  where quest.project_id is not null
  group by quest.project_id
),
raid_counts as (
  select
    raid.project_id,
    count(*) filter (where raid.status = 'active')::integer as live_raid_count
  from public.raids as raid
  where raid.project_id is not null
  group by raid.project_id
),
reward_counts as (
  select
    reward.project_id,
    count(*) filter (where reward.visible = true)::integer as visible_reward_count
  from public.rewards as reward
  where reward.project_id is not null
  group by reward.project_id
),
project_provider_counts as (
  select
    integration.project_id,
    count(*) filter (where integration.status in ('connected', 'needs_attention'))::integer as provider_count
  from public.project_integrations as integration
  group by integration.project_id
),
project_team_counts as (
  select
    member.project_id,
    count(*) filter (where member.status in ('active', 'invited'))::integer as team_member_count
  from public.team_members as member
  where member.project_id is not null
  group by member.project_id
)
insert into public.project_growth_snapshots (
  project_id,
  customer_account_id,
  snapshot_date,
  project_status,
  campaign_count,
  active_campaign_count,
  live_quest_count,
  live_raid_count,
  visible_reward_count,
  provider_count,
  team_member_count,
  member_count,
  metadata
)
select
  project.id,
  project.customer_account_id,
  current_date,
  coalesce(project.status, 'draft'),
  coalesce(campaign.campaign_count, 0),
  coalesce(campaign.active_campaign_count, 0),
  coalesce(quest.live_quest_count, 0),
  coalesce(raid.live_raid_count, 0),
  coalesce(reward.visible_reward_count, 0),
  coalesce(provider.provider_count, 0),
  coalesce(team.team_member_count, 0),
  coalesce(project.members, 0),
  jsonb_build_object('source', 'phase13_backfill')
from public.projects as project
left join campaign_counts as campaign on campaign.project_id = project.id
left join quest_counts as quest on quest.project_id = project.id
left join raid_counts as raid on raid.project_id = project.id
left join reward_counts as reward on reward.project_id = project.id
left join project_provider_counts as provider on provider.project_id = project.id
left join project_team_counts as team on team.project_id = project.id
on conflict (project_id, snapshot_date) do update
set
  customer_account_id = excluded.customer_account_id,
  project_status = excluded.project_status,
  campaign_count = excluded.campaign_count,
  active_campaign_count = excluded.active_campaign_count,
  live_quest_count = excluded.live_quest_count,
  live_raid_count = excluded.live_raid_count,
  visible_reward_count = excluded.visible_reward_count,
  provider_count = excluded.provider_count,
  team_member_count = excluded.team_member_count,
  member_count = excluded.member_count,
  metadata = excluded.metadata,
  updated_at = now();

with stage_counts as (
  select 'workspace_created'::text as funnel_stage, count(*)::integer as metric_value
  from public.customer_accounts
  union all
  select 'first_project_created'::text as funnel_stage, count(distinct project.customer_account_id)::integer
  from public.projects as project
  where project.customer_account_id is not null
  union all
  select 'first_provider_connected'::text as funnel_stage, count(distinct project.customer_account_id)::integer
  from public.project_integrations as integration
  join public.projects as project on project.id = integration.project_id
  where
    project.customer_account_id is not null
    and integration.status in ('connected', 'needs_attention')
  union all
  select 'first_campaign_live'::text as funnel_stage, count(distinct project.customer_account_id)::integer
  from public.campaigns as campaign
  join public.projects as project on project.id = campaign.project_id
  where
    project.customer_account_id is not null
    and campaign.status = 'active'
  union all
  select 'paid_converted'::text as funnel_stage, count(distinct subscription.customer_account_id)::integer
  from public.customer_account_subscriptions as subscription
  where
    subscription.is_current = true
    and subscription.status in ('trialing', 'active', 'past_due', 'grace', 'enterprise_managed')
    and subscription.billing_plan_id <> 'free'
)
insert into public.growth_funnel_snapshots (
  snapshot_date,
  funnel_stage,
  metric_value,
  conversion_rate,
  metadata
)
select
  current_date,
  stage.funnel_stage,
  stage.metric_value,
  null,
  jsonb_build_object('source', 'phase13_backfill')
from stage_counts as stage
on conflict (snapshot_date, funnel_stage) do update
set
  metric_value = excluded.metric_value,
  conversion_rate = excluded.conversion_rate,
  metadata = excluded.metadata,
  updated_at = now();

commit;
