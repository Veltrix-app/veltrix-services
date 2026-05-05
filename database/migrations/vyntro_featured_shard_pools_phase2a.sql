-- VYNTRO Shard Lootbox Phase 2A: featured shard pools.
-- Run manually in Supabase SQL editor before deploying the Phase 2A app changes.

begin;

create table if not exists public.featured_shard_pools (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  quest_id uuid references public.quests(id) on delete cascade,
  raid_id uuid references public.raids(id) on delete cascade,
  label text not null default 'Shard Boost',
  pool_size integer not null,
  remaining_shards integer not null,
  bonus_min integer not null,
  bonus_max integer not null,
  per_user_cap integer,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  status text not null default 'draft',
  created_by_auth_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint featured_shard_pools_budget_check
    check (pool_size >= 0 and remaining_shards >= 0 and remaining_shards <= pool_size),
  constraint featured_shard_pools_bonus_check
    check (bonus_min > 0 and bonus_max >= bonus_min),
  constraint featured_shard_pools_cap_check
    check (per_user_cap is null or per_user_cap >= 0),
  constraint featured_shard_pools_status_check
    check (status in ('draft', 'scheduled', 'active', 'paused', 'ended')),
  constraint featured_shard_pools_target_check
    check (campaign_id is not null or quest_id is not null or raid_id is not null)
);

create index if not exists idx_featured_shard_pools_project_status_created
  on public.featured_shard_pools (project_id, status, created_at desc);

create index if not exists idx_featured_shard_pools_campaign_status
  on public.featured_shard_pools (campaign_id, status)
  where campaign_id is not null;

create index if not exists idx_featured_shard_pools_quest_status
  on public.featured_shard_pools (quest_id, status)
  where quest_id is not null;

create index if not exists idx_featured_shard_pools_raid_status
  on public.featured_shard_pools (raid_id, status)
  where raid_id is not null;

create index if not exists idx_featured_shard_pools_ends_at
  on public.featured_shard_pools (ends_at)
  where ends_at is not null;

alter table public.featured_shard_pools enable row level security;

drop policy if exists "featured shard pools select" on public.featured_shard_pools;
create policy "featured shard pools select"
on public.featured_shard_pools
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
  or status = 'active'
);

drop policy if exists "featured shard pools mutate" on public.featured_shard_pools;
create policy "featured shard pools mutate"
on public.featured_shard_pools
for all
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner', 'admin'])
)
with check (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner', 'admin'])
);

create or replace function public.grant_shards_with_featured_pool(
  p_auth_user_id uuid,
  p_base_amount integer,
  p_pool_id uuid,
  p_requested_bonus integer,
  p_source_type text,
  p_source_ref text,
  p_action text,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  granted boolean,
  already_granted boolean,
  amount integer,
  base_amount integer,
  bonus_amount integer,
  pool_id uuid,
  remaining_shards integer,
  ledger_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_dedupe_key text := p_source_type || ':' || p_source_ref || ':' || p_action;
  v_existing_ledger_id uuid;
  v_pool public.featured_shard_pools%rowtype;
  v_user_pool_bonus integer := 0;
  v_base_amount integer := greatest(coalesce(p_base_amount, 0), 0);
  v_requested_bonus integer := greatest(coalesce(p_requested_bonus, 0), 0);
  v_bonus_amount integer := 0;
  v_total_amount integer := 0;
  v_remaining_shards integer := null;
  v_ledger_id uuid;
begin
  select id
  into v_existing_ledger_id
  from public.shard_ledger
  where auth_user_id = p_auth_user_id
    and source_dedupe_key = v_source_dedupe_key
  limit 1;

  if v_existing_ledger_id is not null then
    return query select false, true, 0, 0, 0, p_pool_id, null::integer, v_existing_ledger_id;
    return;
  end if;

  if p_pool_id is not null and v_requested_bonus > 0 then
    select *
    into v_pool
    from public.featured_shard_pools
    where id = p_pool_id
      and status = 'active'
      and remaining_shards > 0
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at > now())
    for update;

    if found then
      if v_pool.per_user_cap is not null then
        select coalesce(
          sum(
            case
              when metadata->>'bonusShardAmount' ~ '^[0-9]+$'
                then (metadata->>'bonusShardAmount')::integer
              else 0
            end
          ),
          0
        )
        into v_user_pool_bonus
        from public.shard_ledger
        where auth_user_id = p_auth_user_id
          and metadata->>'featuredShardPoolId' = p_pool_id::text;

        v_requested_bonus := least(
          v_requested_bonus,
          greatest(v_pool.per_user_cap - v_user_pool_bonus, 0)
        );
      end if;

      v_bonus_amount := least(v_requested_bonus, v_pool.remaining_shards);

      if v_bonus_amount > 0 then
        update public.featured_shard_pools
        set
          remaining_shards = remaining_shards - v_bonus_amount,
          status = case when remaining_shards - v_bonus_amount <= 0 then 'ended' else status end,
          updated_at = now()
        where id = v_pool.id
        returning remaining_shards into v_remaining_shards;
      else
        v_remaining_shards := v_pool.remaining_shards;
      end if;
    end if;
  end if;

  v_total_amount := v_base_amount + v_bonus_amount;

  if v_total_amount <= 0 then
    return query select false, false, 0, v_base_amount, 0, p_pool_id, v_remaining_shards, null::uuid;
    return;
  end if;

  insert into public.shard_ledger (
    auth_user_id,
    amount,
    source_type,
    source_ref,
    source_dedupe_key,
    reason,
    metadata
  )
  values (
    p_auth_user_id,
    v_total_amount,
    p_source_type,
    p_source_ref,
    v_source_dedupe_key,
    p_reason,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'featuredShardPoolId', p_pool_id,
      'baseShardAmount', v_base_amount,
      'bonusShardAmount', v_bonus_amount,
      'poolRemainingShards', v_remaining_shards
    )
  )
  returning id into v_ledger_id;

  return query select true, false, v_total_amount, v_base_amount, v_bonus_amount, p_pool_id, v_remaining_shards, v_ledger_id;
exception
  when unique_violation then
    select id
    into v_existing_ledger_id
    from public.shard_ledger
    where auth_user_id = p_auth_user_id
      and source_dedupe_key = v_source_dedupe_key
    limit 1;

    return query select false, true, 0, 0, 0, p_pool_id, null::integer, v_existing_ledger_id;
end;
$$;

revoke all on function public.grant_shards_with_featured_pool(
  uuid,
  integer,
  uuid,
  integer,
  text,
  text,
  text,
  text,
  jsonb
) from public, anon, authenticated;

grant execute on function public.grant_shards_with_featured_pool(
  uuid,
  integer,
  uuid,
  integer,
  text,
  text,
  text,
  text,
  jsonb
) to service_role;

commit;
