import type { buildLootboxInventoryRead } from "./lootbox-inventory-read";

export type RewardsVaultFilter = "all" | "claimable" | "equipped" | "rarity" | "review";

type InventoryRead = ReturnType<typeof buildLootboxInventoryRead>;
type InventoryReadItem = InventoryRead["items"][number];

export type RewardsVaultView = {
  filters: Array<{
    id: RewardsVaultFilter;
    label: string;
    count: number;
  }>;
  items: InventoryReadItem[];
  featuredItem: InventoryReadItem | null;
  equippedCount: number;
  claimableCount: number;
  rareCount: number;
  nextAction: {
    label: string;
    href: string;
    tone: "claim" | "earn" | "equip" | "open";
  };
};

export function buildRewardsVaultView(read: InventoryRead, filter: RewardsVaultFilter): RewardsVaultView {
  const claimableItems = read.items.filter((item) => item.canRequestClaim);
  const equippedItems = read.items.filter(
    (item) => item.utility.isEquippedTitle || item.utility.isEquippedCosmetic || item.utility.isActiveSeasonAccess
  );
  const rareItems = read.items.filter((item) => ["epic", "legendary", "mythic"].includes(item.rarity));
  const reviewItems = read.items.filter((item) => item.status === "pending_review");
  const featuredItem =
    claimableItems[0] ??
    equippedItems[0] ??
    rareItems[0] ??
    read.items[0] ??
    null;

  return {
    filters: [
      { id: "all", label: "All", count: read.summary.total },
      { id: "claimable", label: "Claimable", count: claimableItems.length },
      { id: "equipped", label: "Equipped", count: equippedItems.length },
      { id: "rarity", label: "Rare", count: rareItems.length },
      { id: "review", label: "Review", count: reviewItems.length },
    ],
    items: filterRewardsVaultItems({
      items: read.items,
      filter,
      claimableItems,
      equippedItems,
      rareItems,
      reviewItems,
    }),
    featuredItem,
    equippedCount: equippedItems.length,
    claimableCount: claimableItems.length,
    rareCount: rareItems.length,
    nextAction: buildVaultNextAction({
      total: read.summary.total,
      claimableCount: claimableItems.length,
      equippedCount: equippedItems.length,
      rareCount: rareItems.length,
    }),
  };
}

function filterRewardsVaultItems(params: {
  items: InventoryReadItem[];
  filter: RewardsVaultFilter;
  claimableItems: InventoryReadItem[];
  equippedItems: InventoryReadItem[];
  rareItems: InventoryReadItem[];
  reviewItems: InventoryReadItem[];
}) {
  if (params.filter === "claimable") return params.claimableItems;
  if (params.filter === "equipped") return params.equippedItems;
  if (params.filter === "rarity") return params.rareItems;
  if (params.filter === "review") return params.reviewItems;
  return params.items;
}

function buildVaultNextAction(params: {
  total: number;
  claimableCount: number;
  equippedCount: number;
  rareCount: number;
}): RewardsVaultView["nextAction"] {
  if (params.claimableCount > 0) {
    return { label: "Claim reward", href: "#reward-vault", tone: "claim" };
  }

  if (params.equippedCount === 0 && params.rareCount > 0) {
    return { label: "Equip profile flex", href: "#reward-vault", tone: "equip" };
  }

  if (params.total === 0) {
    return { label: "Earn shards", href: "/quests#quest-board", tone: "earn" };
  }

  return { label: "Open more boxes", href: "#lootbox-chambers", tone: "open" };
}
