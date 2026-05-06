import {
  LOOTBOX_TIERS,
  type LootboxRarity,
  type LootboxTier,
  type LootboxTierId,
} from "./lootbox-catalog";

const LOOTBOX_RARITIES: LootboxRarity[] = ["common", "rare", "epic", "legendary", "mythic"];
const LOOTBOX_TIER_IDS = new Set<LootboxTierId>(LOOTBOX_RARITIES);

export type DbLootboxTierRow = {
  id: string | null;
  label: string | null;
  price_shards: number | string | null;
  asset_path: string | null;
  min_level: number | string | null;
  featured_completions_required: number | string | null;
  requires_clean_trust: boolean | null;
  requires_season_window: boolean | null;
  odds: Record<string, unknown> | null;
  active: boolean | null;
  sort_order?: number | string | null;
};

export function normalizeLootboxTierRows(rows: DbLootboxTierRow[]) {
  const tiers = rows
    .filter((row) => row.active !== false)
    .map(normalizeLootboxTierRow)
    .filter((tier): tier is LootboxTier => tier !== null);

  return tiers.length > 0 ? tiers : LOOTBOX_TIERS;
}

function normalizeLootboxTierRow(row: DbLootboxTierRow): LootboxTier | null {
  if (!isLootboxTierId(row.id)) {
    return null;
  }

  const fallback = LOOTBOX_TIERS.find((tier) => tier.id === row.id);
  if (!fallback) {
    return null;
  }

  const label = typeof row.label === "string" ? row.label.trim() : "";
  const priceShards = toNonNegativeInteger(row.price_shards);
  const assetPath = typeof row.asset_path === "string" ? row.asset_path.trim() : "";
  const minLevel = toNonNegativeInteger(row.min_level);
  const odds = normalizeLootboxOdds(row.odds);

  if (!label || !assetPath || priceShards === null || priceShards <= 0 || minLevel === null || !odds) {
    return null;
  }

  const featuredCompletionsRequired = toOptionalNonNegativeInteger(
    row.featured_completions_required
  );

  return {
    id: row.id,
    label,
    priceShards,
    assetPath,
    minLevel,
    ...(featuredCompletionsRequired === undefined
      ? {}
      : { featuredCompletionsRequired }),
    requiresCleanTrust: row.requires_clean_trust ?? fallback.requiresCleanTrust,
    requiresSeasonWindow: row.requires_season_window ?? fallback.requiresSeasonWindow,
    odds,
  };
}

function normalizeLootboxOdds(value: Record<string, unknown> | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const odds = {} as Record<LootboxRarity, number>;
  for (const rarity of LOOTBOX_RARITIES) {
    const odd = toNonNegativeNumber(value[rarity]);
    if (odd === null) {
      return null;
    }

    odds[rarity] = odd;
  }

  if (Object.values(odds).every((odd) => odd <= 0)) {
    return null;
  }

  return odds;
}

function toNonNegativeInteger(value: number | string | null) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }

  return Math.floor(numeric);
}

function toOptionalNonNegativeInteger(value: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return toNonNegativeInteger(value) ?? undefined;
}

function toNonNegativeNumber(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }

  return numeric;
}

function isLootboxTierId(value: unknown): value is LootboxTierId {
  return typeof value === "string" && LOOTBOX_TIER_IDS.has(value as LootboxTierId);
}
