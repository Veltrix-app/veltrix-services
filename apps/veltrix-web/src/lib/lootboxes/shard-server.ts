import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { buildXpProgressionRead } from "@/lib/xp/xp-economy";
import {
  LOOTBOX_TIERS,
  type LootboxTier,
  type LootboxTierId,
  type LootboxRarity,
} from "./lootbox-catalog";
import { normalizeLootboxTierRows, type DbLootboxTierRow } from "./lootbox-db-catalog";
import {
  calculateShardBalance,
  createShardSourceDedupeKey,
  isLootboxTierUnlocked,
  pickLootboxPoolItem,
  pickLootboxRarity,
  shouldReserveLootboxPoolItemStock,
} from "./lootbox-engine";

export type ServiceSupabase = ReturnType<typeof createSupabaseServiceClient>;

export type ShardGrantResult = {
  granted: boolean;
  alreadyGranted: boolean;
  amount: number;
  balance: number;
  ledgerId: string | null;
};

export type LootboxShopTier = {
  id: LootboxTierId;
  label: string;
  priceShards: number;
  assetPath: string;
  odds: Record<LootboxRarity, number>;
  eligibility: {
    unlocked: boolean;
    reason: string | null;
  };
};

export type LootboxInventoryItem = {
  id: string;
  item_type: string;
  rarity: string;
  label: string;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
};

type ReputationRow = {
  total_xp?: number | null;
  level?: number | null;
  status?: string | null;
  sybil_score?: number | null;
};

type PoolItemRow = {
  id: string;
  tier_id: string;
  rarity: string;
  label: string;
  item_type: string;
  weight: number | string | null;
  stock: number | null;
  unlimited_stock: boolean | null;
  payload: Record<string, unknown> | null;
  active: boolean | null;
};

export async function getShardBalance(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
}) {
  const { data, error } = await params.serviceSupabase
    .from("shard_ledger")
    .select("amount")
    .eq("auth_user_id", params.authUserId);

  if (error) {
    throw new Error(error.message);
  }

  return calculateShardBalance((data ?? []) as Array<{ amount: number | null }>);
}

export async function grantShards(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  amount: number;
  sourceType: string;
  sourceRef: string;
  action: string;
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<ShardGrantResult> {
  const amount = Math.max(0, Math.floor(params.amount));
  if (amount <= 0) {
    return {
      granted: false,
      alreadyGranted: false,
      amount: 0,
      balance: await getShardBalance(params),
      ledgerId: null,
    };
  }

  const sourceDedupeKey = createShardSourceDedupeKey({
    sourceType: params.sourceType,
    sourceRef: params.sourceRef,
    action: params.action,
  });

  const { data, error } = await params.serviceSupabase
    .from("shard_ledger")
    .insert({
      auth_user_id: params.authUserId,
      amount,
      source_type: params.sourceType,
      source_ref: params.sourceRef,
      source_dedupe_key: sourceDedupeKey,
      reason: params.reason,
      metadata: params.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        granted: false,
        alreadyGranted: true,
        amount: 0,
        balance: await getShardBalance(params),
        ledgerId: null,
      };
    }

    throw new Error(error.message);
  }

  return {
    granted: true,
    alreadyGranted: false,
    amount,
    balance: await getShardBalance(params),
    ledgerId: typeof data?.id === "string" ? data.id : null,
  };
}

export async function getLootboxShopState(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
}) {
  const [balance, reputation, featuredCompletions, inventory, tiers] = await Promise.all([
    getShardBalance(params),
    loadReputation(params),
    countFeaturedShardCompletions(params),
    loadInventory(params),
    loadLootboxTiers(params),
  ]);
  const level =
    typeof reputation?.level === "number" && reputation.level > 0
      ? reputation.level
      : buildXpProgressionRead(Number(reputation?.total_xp ?? 0)).level;
  const cleanTrust =
    !reputation?.status ||
    (reputation.status !== "review" && reputation.status !== "suspended" && Number(reputation.sybil_score ?? 0) < 90);

  return {
    balance,
    tiers: tiers.map((tier): LootboxShopTier => ({
      id: tier.id,
      label: tier.label,
      priceShards: tier.priceShards,
      assetPath: tier.assetPath,
      odds: tier.odds,
      eligibility: isLootboxTierUnlocked(tier, {
        level,
        featuredCompletions,
        cleanTrust,
        seasonWindowActive: false,
      }),
    })),
    inventory,
  };
}

export async function openLootbox(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  tierId: LootboxTierId;
}) {
  const tiers = await loadLootboxTiers(params);
  const tier = tiers.find((item) => item.id === params.tierId);
  if (!tier) {
    return {
      ok: false as const,
      status: 404,
      error: "Lootbox tier is not available.",
    };
  }

  const shop = await getLootboxShopState(params);
  const shopTier = shop.tiers.find((item) => item.id === tier.id);

  if (!shopTier?.eligibility.unlocked) {
    return {
      ok: false as const,
      status: 403,
      error: shopTier?.eligibility.reason ?? "Lootbox tier is locked.",
    };
  }

  if (shop.balance < tier.priceShards) {
    return {
      ok: false as const,
      status: 409,
      error: `You need ${tier.priceShards} shards to open this lootbox.`,
    };
  }

  const poolItems = await loadPoolItems({
    serviceSupabase: params.serviceSupabase,
    tierId: tier.id,
  });
  const selectedRarity = pickLootboxRarity(tier.odds);
  const matchingItems = poolItems.filter((item) => item.rarity === selectedRarity);
  const selectedItem = pickLootboxPoolItem(matchingItems.length ? matchingItems : poolItems);
  const openId = crypto.randomUUID();
  const spendDedupeKey = createShardSourceDedupeKey({
    sourceType: "lootbox_open",
    sourceRef: openId,
    action: "spend",
  });
  const stockReservation = await reserveLootboxPoolItemStock({
    serviceSupabase: params.serviceSupabase,
    item: selectedItem,
  });

  if (!stockReservation.available) {
    return {
      ok: false as const,
      status: 409,
      error: stockReservation.setupMissing
        ? "Limited lootbox stock is being activated. Try again soon."
        : "This limited lootbox reward just sold out. Try again.",
    };
  }

  let spendLedgerId: string | null = null;
  try {
    const { data: spendLedger, error: spendError } = await params.serviceSupabase
      .from("shard_ledger")
      .insert({
        auth_user_id: params.authUserId,
        amount: -tier.priceShards,
        source_type: "lootbox_open",
        source_ref: openId,
        source_dedupe_key: spendDedupeKey,
        reason: `${tier.label} opened`,
        metadata: {
          tierId: tier.id,
          priceShards: tier.priceShards,
        },
      })
      .select("id")
      .single();

    if (spendError) {
      throw new Error(spendError.message);
    }
    spendLedgerId = typeof spendLedger?.id === "string" ? spendLedger.id : null;

    const { error: openError } = await params.serviceSupabase.from("lootbox_opens").insert({
      id: openId,
      auth_user_id: params.authUserId,
      tier_id: tier.id,
      pool_item_id: selectedItem.id,
      shard_spend: tier.priceShards,
      odds_snapshot: tier.odds,
      result_snapshot: normalizePoolItemPayload(selectedItem),
      status: "granted",
    });

    if (openError) {
      throw new Error(openError.message);
    }

    const { data: inventoryItem, error: inventoryError } = await params.serviceSupabase
      .from("user_inventory")
      .insert({
        auth_user_id: params.authUserId,
        lootbox_open_id: openId,
        item_type: selectedItem.item_type,
        rarity: selectedItem.rarity,
        label: selectedItem.label,
        payload: selectedItem.payload ?? {},
        status: "owned",
      })
      .select("id, item_type, rarity, label, payload, status, created_at")
      .single();

    if (inventoryError) {
      throw new Error(inventoryError.message);
    }

    const refund = calculateShardRefund(tier.priceShards, selectedItem);
    if (refund > 0) {
      await grantShards({
        serviceSupabase: params.serviceSupabase,
        authUserId: params.authUserId,
        amount: refund,
        sourceType: "lootbox_refund",
        sourceRef: openId,
        action: "refund",
        reason: `${selectedItem.label} shard refund`,
        metadata: {
          tierId: tier.id,
          poolItemId: selectedItem.id,
        },
      });
    }

    return {
      ok: true as const,
      openId,
      shardSpend: tier.priceShards,
      shardRefund: refund,
      balance: await getShardBalance(params),
      inventoryItem: normalizeInventoryItem(inventoryItem),
    };
  } catch (error) {
    await Promise.allSettled([
      params.serviceSupabase.from("lootbox_opens").delete().eq("id", openId),
      spendLedgerId
        ? params.serviceSupabase.from("shard_ledger").delete().eq("id", spendLedgerId)
        : Promise.resolve(),
      stockReservation.reserved
        ? restoreLootboxPoolItemStock({
            serviceSupabase: params.serviceSupabase,
            item: selectedItem,
          })
        : Promise.resolve(),
    ]);
    throw error;
  }
}

export function isLootboxTierId(value: unknown): value is LootboxTierId {
  return typeof value === "string" && LOOTBOX_TIERS.some((tier) => tier.id === value);
}

async function loadReputation(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
}): Promise<ReputationRow | null> {
  const { data, error } = await params.serviceSupabase
    .from("user_global_reputation")
    .select("total_xp, level, status, sybil_score")
    .eq("auth_user_id", params.authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ReputationRow | null) ?? null;
}

async function countFeaturedShardCompletions(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
}) {
  const { count, error } = await params.serviceSupabase
    .from("shard_ledger")
    .select("id", { count: "exact", head: true })
    .eq("auth_user_id", params.authUserId)
    .gt("amount", 0)
    .in("source_type", ["featured_quest", "featured_raid"]);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function loadInventory(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
}): Promise<LootboxInventoryItem[]> {
  const { data, error } = await params.serviceSupabase
    .from("user_inventory")
    .select("id, item_type, rarity, label, payload, status, created_at")
    .eq("auth_user_id", params.authUserId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(normalizeInventoryItem);
}

async function loadLootboxTiers(params: {
  serviceSupabase: ServiceSupabase;
}): Promise<LootboxTier[]> {
  const { data, error } = await params.serviceSupabase
    .from("lootbox_tiers")
    .select(
      [
        "id",
        "label",
        "price_shards",
        "asset_path",
        "min_level",
        "featured_completions_required",
        "requires_clean_trust",
        "requires_season_window",
        "odds",
        "active",
        "sort_order",
      ].join(", ")
    )
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.warn("Falling back to static lootbox tiers.", error.message);
    return LOOTBOX_TIERS;
  }

  return normalizeLootboxTierRows(((data ?? []) as unknown) as DbLootboxTierRow[]);
}

async function loadPoolItems(params: {
  serviceSupabase: ServiceSupabase;
  tierId: LootboxTierId;
}) {
  const { data, error } = await params.serviceSupabase
    .from("lootbox_pool_items")
    .select("id, tier_id, rarity, label, item_type, weight, stock, unlimited_stock, payload, active")
    .eq("tier_id", params.tierId)
    .eq("active", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PoolItemRow[];
}

async function reserveLootboxPoolItemStock(params: {
  serviceSupabase: ServiceSupabase;
  item: PoolItemRow;
}) {
  if (!shouldReserveLootboxPoolItemStock(params.item)) {
    return { available: true, reserved: false, setupMissing: false };
  }

  const { data, error } = await params.serviceSupabase.rpc(
    "reserve_lootbox_pool_item_stock",
    {
      p_pool_item_id: params.item.id,
    }
  );

  if (error) {
    if (isMissingLootboxStockRpcError(error)) {
      console.warn("Lootbox stock reservation RPC is not deployed yet.", error.message);
      return { available: false, reserved: false, setupMissing: true };
    }

    throw new Error(error.message);
  }

  return { available: data === true, reserved: data === true, setupMissing: false };
}

async function restoreLootboxPoolItemStock(params: {
  serviceSupabase: ServiceSupabase;
  item: PoolItemRow;
}) {
  await params.serviceSupabase.rpc("restore_lootbox_pool_item_stock", {
    p_pool_item_id: params.item.id,
  });
}

function isMissingLootboxStockRpcError(error: { code?: string; message?: string }) {
  return (
    error.code === "42883" ||
    error.code === "PGRST202" ||
    /reserve_lootbox_pool_item_stock/i.test(error.message ?? "")
  );
}

function normalizePoolItemPayload(item: PoolItemRow) {
  return {
    id: item.id,
    tierId: item.tier_id,
    rarity: item.rarity,
    label: item.label,
    itemType: item.item_type,
    payload: item.payload ?? {},
  };
}

function normalizeInventoryItem(value: unknown): LootboxInventoryItem {
  const row = (value ?? {}) as Record<string, unknown>;
  const payload = row.payload;
  return {
    id: typeof row.id === "string" ? row.id : "",
    item_type: typeof row.item_type === "string" ? row.item_type : "unknown",
    rarity: typeof row.rarity === "string" ? row.rarity : "common",
    label: typeof row.label === "string" ? row.label : "Lootbox reward",
    payload:
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {},
    status: typeof row.status === "string" ? row.status : "owned",
    created_at:
      typeof row.created_at === "string" ? row.created_at : new Date(0).toISOString(),
  };
}

function calculateShardRefund(priceShards: number, item: PoolItemRow) {
  if (item.item_type !== "shard_refund_percent") {
    return 0;
  }

  const refundPercent =
    item.payload && typeof item.payload.refundPercent === "number"
      ? item.payload.refundPercent
      : 0;
  return Math.max(0, Math.round((priceShards * refundPercent) / 100));
}
