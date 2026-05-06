import type { LootboxRarity, LootboxTier } from "./lootbox-catalog";

export type ShardLedgerAmount = {
  amount: number | null;
};

export type ShardSourceKeyInput = {
  sourceType: string;
  sourceRef: string;
  action: string;
};

export type LootboxEligibilityContext = {
  level: number;
  featuredCompletions: number;
  cleanTrust: boolean;
  seasonWindowActive: boolean;
};

export type LootboxEligibilityResult = {
  unlocked: boolean;
  reason: string | null;
};

export type LootboxPoolItemLike = {
  id: string;
  active: boolean | null;
  weight: number | string | null;
  stock: number | null;
  unlimited_stock: boolean | null;
};

export function calculateShardBalance(rows: ShardLedgerAmount[]) {
  return rows.reduce((total, row) => total + (Number(row.amount) || 0), 0);
}

export function createShardSourceDedupeKey(input: ShardSourceKeyInput) {
  return `${input.sourceType}:${input.sourceRef}:${input.action}`;
}

export function isLootboxTierUnlocked(
  tier: LootboxTier,
  context: LootboxEligibilityContext
): LootboxEligibilityResult {
  if (context.level < tier.minLevel) {
    const featuredRequirement = tier.featuredCompletionsRequired;
    const unlockedByFeatured =
      typeof featuredRequirement === "number" &&
      context.featuredCompletions >= featuredRequirement;

    if (!unlockedByFeatured) {
      return {
        unlocked: false,
        reason:
          typeof featuredRequirement === "number"
            ? `Reach level ${tier.minLevel} or complete ${featuredRequirement} featured actions.`
            : `Reach level ${tier.minLevel}.`,
      };
    }
  }

  if (tier.requiresCleanTrust && !context.cleanTrust) {
    return { unlocked: false, reason: "Clean trust posture required." };
  }

  if (tier.requiresSeasonWindow && !context.seasonWindowActive) {
    return { unlocked: false, reason: "Active mythic or season window required." };
  }

  return { unlocked: true, reason: null };
}

export function pickLootboxRarity(
  odds: Record<LootboxRarity, number>,
  roll = Math.random()
): LootboxRarity {
  const entries = Object.entries(odds).filter(([, value]) => value > 0) as Array<
    [LootboxRarity, number]
  >;

  if (!entries.length) {
    throw new Error("Lootbox odds must contain at least one positive rarity.");
  }

  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const target = clampRoll(roll) * total;
  let cursor = 0;

  for (const [rarity, value] of entries) {
    cursor += value;
    if (target < cursor) {
      return rarity;
    }
  }

  return entries[entries.length - 1][0];
}

export function pickLootboxPoolItem<TItem extends LootboxPoolItemLike>(
  items: TItem[],
  roll = Math.random()
) {
  const eligibleItems = items.filter((item) => {
    const weight = Number(item.weight);
    const hasStock = item.unlimited_stock || item.stock === null || Number(item.stock) > 0;
    return item.active === true && Number.isFinite(weight) && weight > 0 && hasStock;
  });

  if (!eligibleItems.length) {
    throw new Error("Lootbox pool has no active outcomes.");
  }

  const totalWeight = eligibleItems.reduce((sum, item) => sum + Number(item.weight), 0);
  const target = clampRoll(roll) * totalWeight;
  let cursor = 0;

  for (const item of eligibleItems) {
    cursor += Number(item.weight);
    if (target < cursor) {
      return item;
    }
  }

  return eligibleItems[eligibleItems.length - 1];
}

export function shouldReserveLootboxPoolItemStock(item: LootboxPoolItemLike) {
  return item.unlimited_stock === false && item.stock !== null && Number(item.stock) > 0;
}

function clampRoll(roll: number) {
  if (!Number.isFinite(roll)) {
    return 0;
  }
  return Math.min(Math.max(roll, 0), 0.999999999);
}
