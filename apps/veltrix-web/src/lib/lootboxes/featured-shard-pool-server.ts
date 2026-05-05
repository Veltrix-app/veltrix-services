import { LOOTBOX_EARNING_RULES } from "./lootbox-catalog";
import {
  calculateFeaturedShardAward,
  resolveBestFeaturedShardPool,
  type FeaturedShardPool,
} from "./featured-shard-pools";
import {
  getShardBalance,
  grantShards,
  type ServiceSupabase,
  type ShardGrantResult,
} from "./shard-server";

type PoolRow = {
  id: string;
  project_id: string;
  campaign_id: string | null;
  quest_id: string | null;
  raid_id: string | null;
  label: string | null;
  pool_size: number | null;
  remaining_shards: number | null;
  bonus_min: number | null;
  bonus_max: number | null;
  per_user_cap: number | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string | null;
};

type FeaturedPoolRpcRow = {
  granted?: boolean | null;
  already_granted?: boolean | null;
  amount?: number | null;
  base_amount?: number | null;
  bonus_amount?: number | null;
  pool_id?: string | null;
  remaining_shards?: number | null;
  ledger_id?: string | null;
};

export type FeaturedShardGrantResult = ShardGrantResult & {
  baseAmount: number;
  bonusAmount: number;
  poolId: string | null;
  poolRemainingShards: number | null;
};

export async function grantQuestShardsWithFeaturedPool(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  questId: string;
  questTitle: string;
  projectId: string | null;
  campaignId: string | null;
  featured: boolean;
  submissionId: string;
}) {
  const baseRange = params.featured
    ? LOOTBOX_EARNING_RULES.featuredQuest.range
    : LOOTBOX_EARNING_RULES.normalQuest.range;
  const sourceType = params.featured ? "featured_quest" : "normal_quest";
  const pool = await resolvePoolForAction({
    serviceSupabase: params.serviceSupabase,
    projectId: params.projectId,
    campaignId: params.campaignId,
    questId: params.questId,
  });

  return grantShardsWithFeaturedPool({
    serviceSupabase: params.serviceSupabase,
    authUserId: params.authUserId,
    sourceType,
    sourceRef: params.questId,
    action: "approved",
    reason: params.featured ? "Featured quest approved" : "Quest approved",
    baseAmount: baseRange[0],
    pool,
    metadata: {
      questId: params.questId,
      questTitle: params.questTitle,
      submissionId: params.submissionId,
      projectId: params.projectId,
      campaignId: params.campaignId,
    },
  });
}

export async function grantRaidShardsWithFeaturedPool(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  raidId: string;
  raidTitle: string;
  projectId: string | null;
  campaignId: string | null;
  featured: boolean;
  community: string | null;
  timer: string | null;
}) {
  const baseRange = params.featured
    ? LOOTBOX_EARNING_RULES.featuredRaid.range
    : LOOTBOX_EARNING_RULES.normalRaid.range;
  const sourceType = params.featured ? "featured_raid" : "normal_raid";
  const pool = await resolvePoolForAction({
    serviceSupabase: params.serviceSupabase,
    projectId: params.projectId,
    campaignId: params.campaignId,
    raidId: params.raidId,
  });

  return grantShardsWithFeaturedPool({
    serviceSupabase: params.serviceSupabase,
    authUserId: params.authUserId,
    sourceType,
    sourceRef: params.raidId,
    action: "confirmed",
    reason: params.featured ? "Featured raid confirmed" : "Raid confirmed",
    baseAmount: baseRange[0],
    pool,
    metadata: {
      raidId: params.raidId,
      raidTitle: params.raidTitle,
      projectId: params.projectId,
      campaignId: params.campaignId,
      community: params.community,
      timer: params.timer,
    },
  });
}

async function resolvePoolForAction(params: {
  serviceSupabase: ServiceSupabase;
  projectId: string | null;
  campaignId: string | null;
  questId?: string | null;
  raidId?: string | null;
}) {
  if (!params.projectId) {
    return null;
  }

  const { data, error } = await params.serviceSupabase
    .from("featured_shard_pools")
    .select(
      "id, project_id, campaign_id, quest_id, raid_id, label, pool_size, remaining_shards, bonus_min, bonus_max, per_user_cap, starts_at, ends_at, status"
    )
    .eq("project_id", params.projectId)
    .eq("status", "active")
    .gt("remaining_shards", 0);

  if (error) {
    return null;
  }

  return resolveBestFeaturedShardPool({
    pools: ((data ?? []) as PoolRow[]).map(mapPoolRow),
    campaignId: params.campaignId,
    questId: params.questId,
    raidId: params.raidId,
  });
}

async function grantShardsWithFeaturedPool(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  sourceType: string;
  sourceRef: string;
  action: string;
  reason: string;
  baseAmount: number;
  pool: FeaturedShardPool | null;
  metadata: Record<string, unknown>;
}): Promise<FeaturedShardGrantResult> {
  const award = calculateFeaturedShardAward({
    baseAmount: params.baseAmount,
    pool: params.pool,
    authUserId: params.authUserId,
    sourceRef: params.sourceRef,
  });

  const { data, error } = await params.serviceSupabase.rpc(
    "grant_shards_with_featured_pool",
    {
      p_auth_user_id: params.authUserId,
      p_base_amount: award.baseAmount,
      p_pool_id: award.pool?.id ?? null,
      p_requested_bonus: award.bonusAmount,
      p_source_type: params.sourceType,
      p_source_ref: params.sourceRef,
      p_action: params.action,
      p_reason: params.reason,
      p_metadata: {
        ...params.metadata,
        featuredShardPoolId: award.pool?.id ?? null,
        baseShardAmount: award.baseAmount,
        requestedBonusShardAmount: award.bonusAmount,
      },
    }
  );

  if (error) {
    const fallback = await grantShards({
      serviceSupabase: params.serviceSupabase,
      authUserId: params.authUserId,
      amount: award.baseAmount,
      sourceType: params.sourceType,
      sourceRef: params.sourceRef,
      action: params.action,
      reason: params.reason,
      metadata: params.metadata,
    });

    return {
      ...fallback,
      baseAmount: fallback.granted ? award.baseAmount : 0,
      bonusAmount: 0,
      poolId: null,
      poolRemainingShards: null,
    };
  }

  const row = (Array.isArray(data) ? data[0] : data) as FeaturedPoolRpcRow | null;
  const balance = await getShardBalance({
    serviceSupabase: params.serviceSupabase,
    authUserId: params.authUserId,
  });

  return {
    granted: Boolean(row?.granted),
    alreadyGranted: Boolean(row?.already_granted),
    amount: Number(row?.amount ?? 0),
    balance,
    ledgerId: typeof row?.ledger_id === "string" ? row.ledger_id : null,
    baseAmount: Number(row?.base_amount ?? 0),
    bonusAmount: Number(row?.bonus_amount ?? 0),
    poolId: typeof row?.pool_id === "string" ? row.pool_id : null,
    poolRemainingShards:
      typeof row?.remaining_shards === "number" ? Number(row.remaining_shards) : null,
  };
}

function mapPoolRow(row: PoolRow): FeaturedShardPool {
  return {
    id: row.id,
    projectId: row.project_id,
    campaignId: row.campaign_id,
    questId: row.quest_id,
    raidId: row.raid_id,
    label: row.label ?? "Shard Boost",
    poolSize: Number(row.pool_size ?? 0),
    remainingShards: Number(row.remaining_shards ?? 0),
    bonusMin: Number(row.bonus_min ?? 0),
    bonusMax: Number(row.bonus_max ?? 0),
    perUserCap: row.per_user_cap === null ? null : Number(row.per_user_cap),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status:
      row.status === "draft" ||
      row.status === "scheduled" ||
      row.status === "active" ||
      row.status === "paused" ||
      row.status === "ended"
        ? row.status
        : "draft",
  };
}
