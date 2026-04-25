-- VYNTRO billing and business control panel v1 foundation
-- Run this migration manually in the Supabase SQL editor before deploying the first Phase 10 tranche.

begin;

alter table public.billing_plans
  add column if not exists quests_limit integer not null default 0,
  add column if not exists raids_limit integer not null default 0,
  add column if not exists providers_limit integer not null default 0,
  add column if not exists included_billable_seats integer not null default 0,
  add column if not exists sort_order integer not null default 0,
  add column if not exists trial_days integer not null default 0,
  add column if not exists currency text not null default 'eur',
  add column if not exists billing_interval text not null default 'month',
  add column if not exists is_public boolean not null default true,
  add column if not exists is_self_serve boolean not null default false,
  add column if not exists is_checkout_enabled boolean not null default false,
  add column if not exists is_free_tier boolean not null default false,
  add column if not exists is_enterprise boolean not null default false,
  add column if not exists feature_flags jsonb not null default '{}'::jsonb,
  add column if not exists entitlement_metadata jsonb not null default '{}'::jsonb,
  add column if not exists stripe_product_id text,
  add column if not exists stripe_monthly_price_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'billing_plans_currency_check'
  ) then
    alter table public.billing_plans
      add constraint billing_plans_currency_check
      check (currency in ('eur'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'billing_plans_billing_interval_check'
  ) then
    alter table public.billing_plans
      add constraint billing_plans_billing_interval_check
      check (billing_interval in ('month'));
  end if;
end $$;

create unique index if not exists idx_billing_plans_stripe_product_id
  on public.billing_plans (stripe_product_id)
  where stripe_product_id is not null;

create unique index if not exists idx_billing_plans_stripe_monthly_price_id
  on public.billing_plans (stripe_monthly_price_id)
  where stripe_monthly_price_id is not null;

insert into public.billing_plans (
  id,
  name,
  price_monthly,
  projects_limit,
  campaigns_limit,
  quests_limit,
  raids_limit,
  providers_limit,
  included_billable_seats,
  features,
  current,
  sort_order,
  trial_days,
  currency,
  billing_interval,
  is_public,
  is_self_serve,
  is_checkout_enabled,
  is_free_tier,
  is_enterprise,
  feature_flags,
  entitlement_metadata
)
values
  (
    'free',
    'Free',
    0,
    1,
    1,
    10,
    1,
    1,
    2,
    array[
      '1 project',
      '1 active campaign',
      '10 live quests',
      '1 live raid',
      '1 provider',
      '2 billable seats'
    ]::text[],
    false,
    0,
    0,
    'eur',
    'month',
    true,
    true,
    false,
    true,
    false,
    '{}'::jsonb,
    jsonb_build_object(
      'max_projects', 1,
      'max_active_campaigns', 1,
      'max_live_quests', 10,
      'max_live_raids', 1,
      'max_providers', 1,
      'included_billable_seats', 2
    )
  ),
  (
    'starter',
    'Starter',
    99,
    2,
    5,
    50,
    5,
    2,
    5,
    array[
      '2 projects',
      '5 active campaigns',
      '50 live quests',
      '5 live raids',
      '2 providers',
      '5 billable seats'
    ]::text[],
    false,
    10,
    14,
    'eur',
    'month',
    true,
    true,
    true,
    false,
    false,
    '{}'::jsonb,
    jsonb_build_object(
      'max_projects', 2,
      'max_active_campaigns', 5,
      'max_live_quests', 50,
      'max_live_raids', 5,
      'max_providers', 2,
      'included_billable_seats', 5
    )
  ),
  (
    'growth',
    'Growth',
    299,
    5,
    25,
    250,
    20,
    2,
    15,
    array[
      '5 projects',
      '25 active campaigns',
      '250 live quests',
      '20 live raids',
      '2 providers',
      '15 billable seats'
    ]::text[],
    false,
    20,
    14,
    'eur',
    'month',
    true,
    true,
    true,
    false,
    false,
    '{}'::jsonb,
    jsonb_build_object(
      'max_projects', 5,
      'max_active_campaigns', 25,
      'max_live_quests', 250,
      'max_live_raids', 20,
      'max_providers', 2,
      'included_billable_seats', 15
    )
  ),
  (
    'enterprise',
    'Enterprise',
    0,
    999,
    999,
    9999,
    999,
    99,
    999,
    array[
      'Custom limits',
      'High-touch onboarding',
      'Enterprise-managed billing'
    ]::text[],
    false,
    30,
    0,
    'eur',
    'month',
    true,
    false,
    false,
    false,
    true,
    '{}'::jsonb,
    jsonb_build_object(
      'max_projects', 999,
      'max_active_campaigns', 999,
      'max_live_quests', 9999,
      'max_live_raids', 999,
      'max_providers', 99,
      'included_billable_seats', 999
    )
  )
on conflict (id) do update
set
  name = excluded.name,
  price_monthly = excluded.price_monthly,
  projects_limit = excluded.projects_limit,
  campaigns_limit = excluded.campaigns_limit,
  quests_limit = excluded.quests_limit,
  raids_limit = excluded.raids_limit,
  providers_limit = excluded.providers_limit,
  included_billable_seats = excluded.included_billable_seats,
  features = excluded.features,
  sort_order = excluded.sort_order,
  trial_days = excluded.trial_days,
  currency = excluded.currency,
  billing_interval = excluded.billing_interval,
  is_public = excluded.is_public,
  is_self_serve = excluded.is_self_serve,
  is_checkout_enabled = excluded.is_checkout_enabled,
  is_free_tier = excluded.is_free_tier,
  is_enterprise = excluded.is_enterprise,
  feature_flags = excluded.feature_flags,
  entitlement_metadata = excluded.entitlement_metadata;

create table if not exists public.customer_account_billing_profiles (
  customer_account_id uuid primary key references public.customer_accounts(id) on delete cascade,
  billing_email text not null default ''::text,
  stripe_customer_id text,
  stripe_default_payment_method_id text,
  currency text not null default 'eur',
  country_code text,
  payment_method_status text not null default 'missing',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customer_account_billing_profiles_currency_check
    check (currency in ('eur')),
  constraint customer_account_billing_profiles_payment_method_status_check
    check (payment_method_status in ('missing', 'ready', 'requires_attention'))
);

create unique index if not exists idx_customer_account_billing_profiles_stripe_customer_id
  on public.customer_account_billing_profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create table if not exists public.customer_account_subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  billing_plan_id text not null references public.billing_plans(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'free',
  is_current boolean not null default true,
  started_at timestamp with time zone not null default now(),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  trial_started_at timestamp with time zone,
  trial_ends_at timestamp with time zone,
  cancel_at timestamp with time zone,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamp with time zone,
  ended_at timestamp with time zone,
  grace_until timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customer_account_subscriptions_status_check
    check (status in ('free', 'trialing', 'active', 'past_due', 'grace', 'canceled', 'enterprise_managed'))
);

create unique index if not exists idx_customer_account_subscriptions_current_account
  on public.customer_account_subscriptions (customer_account_id)
  where is_current = true;

create unique index if not exists idx_customer_account_subscriptions_stripe_subscription_id
  on public.customer_account_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists idx_customer_account_subscriptions_status_period_end
  on public.customer_account_subscriptions (status, current_period_end asc);

create table if not exists public.customer_account_invoices (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  customer_account_subscription_id uuid references public.customer_account_subscriptions(id) on delete set null,
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  invoice_number text,
  status text not null default 'draft',
  collection_status text not null default 'clear',
  currency text not null default 'eur',
  subtotal_amount numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  amount_paid numeric(18,2) not null default 0,
  amount_remaining numeric(18,2) not null default 0,
  refunded_amount numeric(18,2) not null default 0,
  due_at timestamp with time zone,
  paid_at timestamp with time zone,
  hosted_invoice_url text,
  invoice_pdf_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customer_account_invoices_status_check
    check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  constraint customer_account_invoices_collection_status_check
    check (collection_status in ('clear', 'renewing_soon', 'payment_failed', 'action_required', 'refunded')),
  constraint customer_account_invoices_currency_check
    check (currency in ('eur'))
);

create unique index if not exists idx_customer_account_invoices_stripe_invoice_id
  on public.customer_account_invoices (stripe_invoice_id)
  where stripe_invoice_id is not null;

create index if not exists idx_customer_account_invoices_account_status_due
  on public.customer_account_invoices (customer_account_id, status, due_at desc);

create table if not exists public.customer_account_billing_events (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  customer_account_subscription_id uuid references public.customer_account_subscriptions(id) on delete set null,
  customer_account_invoice_id uuid references public.customer_account_invoices(id) on delete set null,
  event_source text not null default 'system',
  event_type text not null,
  stripe_event_id text,
  actor_auth_user_id uuid,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint customer_account_billing_events_event_source_check
    check (event_source in ('stripe_webhook', 'portal_admin', 'system', 'customer')),
  constraint customer_account_billing_events_event_type_check
    check (
      event_type in (
        'profile_created',
        'subscription_started',
        'subscription_updated',
        'subscription_canceled',
        'invoice_created',
        'invoice_paid',
        'invoice_payment_failed',
        'trial_extended',
        'grace_extended',
        'plan_changed',
        'enterprise_managed_set',
        'billing_synced',
        'business_note_added'
      )
    )
);

create unique index if not exists idx_customer_account_billing_events_stripe_event_id
  on public.customer_account_billing_events (stripe_event_id)
  where stripe_event_id is not null;

create index if not exists idx_customer_account_billing_events_account_created_at
  on public.customer_account_billing_events (customer_account_id, created_at desc);

create table if not exists public.customer_account_entitlements (
  customer_account_id uuid primary key references public.customer_accounts(id) on delete cascade,
  billing_plan_id text not null references public.billing_plans(id),
  customer_account_subscription_id uuid references public.customer_account_subscriptions(id) on delete set null,
  max_projects integer not null default 1,
  max_active_campaigns integer not null default 1,
  max_live_quests integer not null default 10,
  max_live_raids integer not null default 1,
  max_providers integer not null default 1,
  included_billable_seats integer not null default 2,
  current_projects integer not null default 0,
  current_active_campaigns integer not null default 0,
  current_live_quests integer not null default 0,
  current_live_raids integer not null default 0,
  current_providers integer not null default 0,
  current_billable_seats integer not null default 0,
  warning_threshold_info integer not null default 70,
  warning_threshold_upgrade integer not null default 85,
  block_threshold integer not null default 100,
  self_serve_allowed boolean not null default true,
  enterprise_managed boolean not null default false,
  grace_until timestamp with time zone,
  last_computed_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_customer_account_entitlements_plan
  on public.customer_account_entitlements (billing_plan_id);

create table if not exists public.customer_account_business_notes (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
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
  constraint customer_account_business_notes_note_type_check
    check (note_type in ('general', 'upgrade_candidate', 'churn_risk', 'follow_up', 'billing_exception')),
  constraint customer_account_business_notes_status_check
    check (status in ('open', 'resolved', 'archived'))
);

create index if not exists idx_customer_account_business_notes_account_created_at
  on public.customer_account_business_notes (customer_account_id, created_at desc);

insert into public.customer_account_billing_profiles (
  customer_account_id,
  billing_email,
  currency,
  payment_method_status,
  metadata
)
select
  ca.id,
  coalesce(ca.contact_email, ''::text),
  'eur',
  'missing',
  jsonb_build_object('legacy_backfill', true)
from public.customer_accounts ca
where not exists (
  select 1
  from public.customer_account_billing_profiles cabp
  where cabp.customer_account_id = ca.id
);

insert into public.customer_account_subscriptions (
  customer_account_id,
  billing_plan_id,
  status,
  is_current,
  started_at,
  metadata
)
select
  ca.id,
  case
    when ca.status = 'trial' then 'starter'
    else 'free'
  end,
  case
    when ca.status = 'trial' then 'trialing'
    else 'free'
  end,
  true,
  coalesce(ca.created_at, now()),
  jsonb_build_object(
    'legacy_backfill', true,
    'customer_account_status', ca.status
  )
from public.customer_accounts ca
where not exists (
  select 1
  from public.customer_account_subscriptions cas
  where cas.customer_account_id = ca.id
    and cas.is_current = true
);

insert into public.customer_account_entitlements (
  customer_account_id,
  billing_plan_id,
  customer_account_subscription_id,
  max_projects,
  max_active_campaigns,
  max_live_quests,
  max_live_raids,
  max_providers,
  included_billable_seats,
  current_projects,
  current_active_campaigns,
  current_live_quests,
  current_live_raids,
  current_providers,
  current_billable_seats,
  self_serve_allowed,
  enterprise_managed,
  last_computed_at,
  metadata
)
select
  ca.id,
  cas.billing_plan_id,
  cas.id,
  bp.projects_limit,
  bp.campaigns_limit,
  bp.quests_limit,
  bp.raids_limit,
  bp.providers_limit,
  bp.included_billable_seats,
  coalesce((
    select count(*)
    from public.projects p
    where p.customer_account_id = ca.id
  ), 0),
  coalesce((
    select count(*)
    from public.campaigns c
    join public.projects p
      on p.id = c.project_id
    where p.customer_account_id = ca.id
      and c.status = 'active'
  ), 0),
  coalesce((
    select count(*)
    from public.quests q
    join public.projects p
      on p.id = q.project_id
    where p.customer_account_id = ca.id
      and q.status = 'active'
  ), 0),
  coalesce((
    select count(*)
    from public.raids r
    join public.projects p
      on p.id = r.project_id
    where p.customer_account_id = ca.id
      and r.status = 'active'
  ), 0),
  coalesce((
    select count(distinct pi.provider)
    from public.project_integrations pi
    join public.projects p
      on p.id = pi.project_id
    where p.customer_account_id = ca.id
      and pi.status = 'connected'
  ), 0),
  coalesce((
    select count(*)
    from public.customer_account_memberships cam
    where cam.customer_account_id = ca.id
      and cam.status = 'active'
      and cam.role in ('owner', 'admin', 'member')
  ), 0),
  bp.is_self_serve,
  bp.is_enterprise,
  now(),
  jsonb_build_object('legacy_backfill', true)
from public.customer_accounts ca
join public.customer_account_subscriptions cas
  on cas.customer_account_id = ca.id
 and cas.is_current = true
join public.billing_plans bp
  on bp.id = cas.billing_plan_id
where not exists (
  select 1
  from public.customer_account_entitlements cae
  where cae.customer_account_id = ca.id
);

insert into public.customer_account_billing_events (
  customer_account_id,
  customer_account_subscription_id,
  event_source,
  event_type,
  summary,
  metadata,
  created_at
)
select
  cas.customer_account_id,
  cas.id,
  'system',
  'billing_synced',
  'Billing foundation backfilled for existing account.',
  jsonb_build_object('legacy_backfill', true),
  now()
from public.customer_account_subscriptions cas
where cas.is_current = true
  and not exists (
    select 1
    from public.customer_account_billing_events cabe
    where cabe.customer_account_id = cas.customer_account_id
      and cabe.event_type = 'billing_synced'
  );

create or replace function public.veltrix_assert_account_entitlement_capacity(
  target_account_id uuid,
  usage_key text,
  proposed_total integer
)
returns void
language plpgsql
as $$
declare
  configured_limit integer;
begin
  if target_account_id is null then
    return;
  end if;

  select case usage_key
    when 'projects' then max_projects
    when 'campaigns' then max_active_campaigns
    when 'quests' then max_live_quests
    when 'raids' then max_live_raids
    when 'providers' then max_providers
    when 'seats' then included_billable_seats
    else null
  end
  into configured_limit
  from public.customer_account_entitlements
  where customer_account_id = target_account_id;

  if configured_limit is null then
    return;
  end if;

  if proposed_total > configured_limit then
    raise exception 'Billing limit reached for %.', usage_key
      using errcode = 'P0001',
            detail = jsonb_build_object(
              'code', 'billing_limit_reached',
              'usageKey', usage_key,
              'limit', configured_limit,
              'projectedTotal', proposed_total,
              'customerAccountId', target_account_id
            )::text;
  end if;
end;
$$;

create or replace function public.veltrix_customer_account_id_for_project(target_project_id uuid)
returns uuid
language sql
stable
as $$
  select p.customer_account_id
  from public.projects p
  where p.id = target_project_id
  limit 1
$$;

create or replace function public.veltrix_projects_capacity_guard()
returns trigger
language plpgsql
as $$
declare
  proposed_total integer;
begin
  if new.customer_account_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and new.customer_account_id is not distinct from old.customer_account_id then
    return new;
  end if;

  select count(*)
  into proposed_total
  from public.projects p
  where p.customer_account_id = new.customer_account_id
    and p.id <> new.id;

  perform public.veltrix_assert_account_entitlement_capacity(
    new.customer_account_id,
    'projects',
    proposed_total + 1
  );

  return new;
end;
$$;

create or replace function public.veltrix_campaigns_capacity_guard()
returns trigger
language plpgsql
as $$
declare
  target_account_id uuid;
  proposed_total integer;
begin
  if new.status <> 'active' then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and new.status = old.status
    and new.project_id is not distinct from old.project_id then
    return new;
  end if;

  target_account_id := public.veltrix_customer_account_id_for_project(new.project_id);
  if target_account_id is null then
    return new;
  end if;

  select count(*)
  into proposed_total
  from public.campaigns c
  join public.projects p
    on p.id = c.project_id
  where p.customer_account_id = target_account_id
    and c.status = 'active'
    and c.id <> new.id;

  perform public.veltrix_assert_account_entitlement_capacity(
    target_account_id,
    'campaigns',
    proposed_total + 1
  );

  return new;
end;
$$;

create or replace function public.veltrix_quests_capacity_guard()
returns trigger
language plpgsql
as $$
declare
  target_account_id uuid;
  proposed_total integer;
begin
  if new.status <> 'active' then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and new.status = old.status
    and new.project_id is not distinct from old.project_id then
    return new;
  end if;

  target_account_id := public.veltrix_customer_account_id_for_project(new.project_id);
  if target_account_id is null then
    return new;
  end if;

  select count(*)
  into proposed_total
  from public.quests q
  join public.projects p
    on p.id = q.project_id
  where p.customer_account_id = target_account_id
    and q.status = 'active'
    and q.id <> new.id;

  perform public.veltrix_assert_account_entitlement_capacity(
    target_account_id,
    'quests',
    proposed_total + 1
  );

  return new;
end;
$$;

create or replace function public.veltrix_raids_capacity_guard()
returns trigger
language plpgsql
as $$
declare
  target_account_id uuid;
  proposed_total integer;
begin
  if new.status <> 'active' then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and new.status = old.status
    and new.project_id is not distinct from old.project_id then
    return new;
  end if;

  target_account_id := public.veltrix_customer_account_id_for_project(new.project_id);
  if target_account_id is null then
    return new;
  end if;

  select count(*)
  into proposed_total
  from public.raids r
  join public.projects p
    on p.id = r.project_id
  where p.customer_account_id = target_account_id
    and r.status = 'active'
    and r.id <> new.id;

  perform public.veltrix_assert_account_entitlement_capacity(
    target_account_id,
    'raids',
    proposed_total + 1
  );

  return new;
end;
$$;

create or replace function public.veltrix_project_integrations_capacity_guard()
returns trigger
language plpgsql
as $$
declare
  target_account_id uuid;
  proposed_total integer;
begin
  if new.status <> 'connected' then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and new.status = old.status
    and new.provider is not distinct from old.provider
    and new.project_id is not distinct from old.project_id then
    return new;
  end if;

  target_account_id := public.veltrix_customer_account_id_for_project(new.project_id);
  if target_account_id is null then
    return new;
  end if;

  select count(distinct provider)
  into proposed_total
  from (
    select pi.provider
    from public.project_integrations pi
    join public.projects p
      on p.id = pi.project_id
    where p.customer_account_id = target_account_id
      and pi.status = 'connected'
      and pi.id <> new.id
    union all
    select new.provider
  ) provider_rows;

  perform public.veltrix_assert_account_entitlement_capacity(
    target_account_id,
    'providers',
    proposed_total
  );

  return new;
end;
$$;

create or replace function public.veltrix_account_memberships_capacity_guard()
returns trigger
language plpgsql
as $$
declare
  proposed_total integer;
begin
  if new.status <> 'active' or new.role not in ('owner', 'admin', 'member') then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and new.status = old.status
    and new.role = old.role
    and new.customer_account_id is not distinct from old.customer_account_id then
    return new;
  end if;

  select count(*)
  into proposed_total
  from public.customer_account_memberships cam
  where cam.customer_account_id = new.customer_account_id
    and cam.status = 'active'
    and cam.role in ('owner', 'admin', 'member')
    and cam.id <> new.id;

  perform public.veltrix_assert_account_entitlement_capacity(
    new.customer_account_id,
    'seats',
    proposed_total + 1
  );

  return new;
end;
$$;

drop trigger if exists trg_veltrix_projects_capacity_guard on public.projects;
create trigger trg_veltrix_projects_capacity_guard
before insert or update of customer_account_id
on public.projects
for each row
execute function public.veltrix_projects_capacity_guard();

drop trigger if exists trg_veltrix_campaigns_capacity_guard on public.campaigns;
create trigger trg_veltrix_campaigns_capacity_guard
before insert or update of status, project_id
on public.campaigns
for each row
execute function public.veltrix_campaigns_capacity_guard();

drop trigger if exists trg_veltrix_quests_capacity_guard on public.quests;
create trigger trg_veltrix_quests_capacity_guard
before insert or update of status, project_id
on public.quests
for each row
execute function public.veltrix_quests_capacity_guard();

drop trigger if exists trg_veltrix_raids_capacity_guard on public.raids;
create trigger trg_veltrix_raids_capacity_guard
before insert or update of status, project_id
on public.raids
for each row
execute function public.veltrix_raids_capacity_guard();

drop trigger if exists trg_veltrix_project_integrations_capacity_guard on public.project_integrations;
create trigger trg_veltrix_project_integrations_capacity_guard
before insert or update of status, provider, project_id
on public.project_integrations
for each row
execute function public.veltrix_project_integrations_capacity_guard();

drop trigger if exists trg_veltrix_account_memberships_capacity_guard on public.customer_account_memberships;
create trigger trg_veltrix_account_memberships_capacity_guard
before insert or update of status, role, customer_account_id
on public.customer_account_memberships
for each row
execute function public.veltrix_account_memberships_capacity_guard();

commit;
