export type LootboxTierId = "common" | "rare" | "epic" | "legendary" | "mythic";
export type LootboxRarity = LootboxTierId;

export type LootboxTier = {
  id: LootboxTierId;
  label: string;
  priceShards: number;
  assetPath: string;
  minLevel: number;
  featuredCompletionsRequired?: number;
  requiresCleanTrust: boolean;
  requiresSeasonWindow: boolean;
  odds: Record<LootboxRarity, number>;
};

export type ShardEarningRule = {
  range: readonly [number, number];
  weeklyCap: number;
};

export const LOOTBOX_TIERS: LootboxTier[] = [
  {
    id: "common",
    label: "Common Lootbox",
    priceShards: 250,
    assetPath: "/assets/lootboxes/common-lootbox.webp",
    minLevel: 0,
    requiresCleanTrust: false,
    requiresSeasonWindow: false,
    odds: { common: 70, rare: 22, epic: 6, legendary: 1.8, mythic: 0.2 },
  },
  {
    id: "rare",
    label: "Rare Lootbox",
    priceShards: 750,
    assetPath: "/assets/lootboxes/rare-lootbox.webp",
    minLevel: 3,
    requiresCleanTrust: false,
    requiresSeasonWindow: false,
    odds: { common: 35, rare: 45, epic: 15, legendary: 4.5, mythic: 0.5 },
  },
  {
    id: "epic",
    label: "Epic Lootbox",
    priceShards: 2000,
    assetPath: "/assets/lootboxes/epic-lootbox.webp",
    minLevel: 8,
    featuredCompletionsRequired: 3,
    requiresCleanTrust: false,
    requiresSeasonWindow: false,
    odds: { common: 0, rare: 35, epic: 45, legendary: 17, mythic: 3 },
  },
  {
    id: "legendary",
    label: "Legendary Lootbox",
    priceShards: 6000,
    assetPath: "/assets/lootboxes/legendary-lootbox.webp",
    minLevel: 15,
    requiresCleanTrust: true,
    requiresSeasonWindow: false,
    odds: { common: 0, rare: 0, epic: 45, legendary: 48, mythic: 7 },
  },
  {
    id: "mythic",
    label: "Mythic Lootbox",
    priceShards: 18000,
    assetPath: "/assets/lootboxes/mythic-lootbox.webp",
    minLevel: 25,
    requiresCleanTrust: true,
    requiresSeasonWindow: true,
    odds: { common: 0, rare: 0, epic: 0, legendary: 55, mythic: 45 },
  },
];

export const SHARD_ASSET_PATH = "/assets/lootboxes/shard.webp";

export const LOOTBOX_EARNING_RULES = {
  normalQuest: { range: [10, 20], weeklyCap: 250 },
  normalRaid: { range: [15, 30], weeklyCap: 250 },
  featuredQuest: { range: [50, 90], weeklyCap: 1200 },
  featuredRaid: { range: [75, 140], weeklyCap: 1200 },
  platformEvent: { range: [40, 100], weeklyCap: 600 },
  dailyStreak: { range: [10, 10], weeklyCap: 70 },
  sponsoredBoost: { range: [25, 100], weeklyCap: 1000 },
} as const satisfies Record<string, ShardEarningRule>;

export function getLootboxTier(tierId: LootboxTierId) {
  const tier = LOOTBOX_TIERS.find((item) => item.id === tierId);
  if (!tier) {
    throw new Error(`Unknown lootbox tier: ${tierId}`);
  }
  return tier;
}

export function getTierOddsTotal(tierId: LootboxTierId) {
  const tier = getLootboxTier(tierId);
  return Object.values(tier.odds).reduce((total, value) => total + value, 0);
}
