export type AchievementBadgeTone = "cyan" | "lime" | "amber" | "violet" | "rose";

export type AchievementBadge = {
  id: string;
  label: string;
  description: string;
  status: "unlocked" | "locked";
  progress: number;
  current: number;
  target: number;
  tone: AchievementBadgeTone;
  route: string;
  ctaLabel: string;
};

export type AchievementBadgesRead = {
  badges: AchievementBadge[];
  unlockedCount: number;
  totalCount: number;
  completionPercent: number;
  featuredBadge: AchievementBadge | null;
  nextBadge: AchievementBadge | null;
};

export type AchievementInventoryItem = {
  rarity?: string | null;
  itemType?: string | null;
  status?: string | null;
  utility?: {
    isEquippedTitle?: boolean;
    isEquippedCosmetic?: boolean;
    isActiveSeasonAccess?: boolean;
  };
};

export type BuildAchievementBadgesInput = {
  level: number;
  streak: number;
  questsCompleted: number;
  raidsCompleted: number;
  rewardsClaimed: number;
  shardBalance: number;
  walletConnected: boolean;
  connectedSystemCount: number;
  projectCount: number;
  trustedProjectCount: number;
  completedPlatformQuestCount: number;
  completedDeFiQuestCount: number;
  openShardQuestCount: number;
  inventoryItems: AchievementInventoryItem[];
};

type BadgeDefinition = Omit<AchievementBadge, "status" | "progress">;

export function buildAchievementBadgesRead(
  input: BuildAchievementBadgesInput
): AchievementBadgesRead {
  const inventoryItems = input.inventoryItems ?? [];
  const highRarityItems = inventoryItems.filter((item) =>
    ["legendary", "mythic"].includes(String(item.rarity ?? "").toLowerCase())
  ).length;
  const equippedProfileItems = inventoryItems.filter(
    (item) => item.utility?.isEquippedTitle || item.utility?.isEquippedCosmetic
  ).length;
  const activeSeasonAccessItems = inventoryItems.filter(
    (item) => item.utility?.isActiveSeasonAccess
  ).length;

  const badges = [
    badge({
      id: "first-quest",
      label: "First Quest",
      description: "Clear your first verified quest and start your public trail.",
      current: Math.max(input.questsCompleted, input.completedPlatformQuestCount),
      target: 1,
      tone: "cyan",
      route: "/quests",
      ctaLabel: "Open quests",
    }),
    badge({
      id: "streak-builder",
      label: "Streak Builder",
      description: "Build a three-day rhythm with daily activity.",
      current: input.streak,
      target: 3,
      tone: "lime",
      route: "/",
      ctaLabel: "Open cockpit",
    }),
    badge({
      id: "shard-hunter",
      label: "Shard Hunter",
      description: "Stack 100 shards or keep shard missions in motion.",
      current: Math.max(input.shardBalance, input.openShardQuestCount > 0 ? 35 : 0),
      target: 100,
      tone: "amber",
      route: "/lootboxes",
      ctaLabel: "Open shard hub",
    }),
    badge({
      id: "defi-explorer",
      label: "DeFi Explorer",
      description: "Complete a swap, vault, wallet or onchain mission.",
      current: input.completedDeFiQuestCount,
      target: 1,
      tone: "violet",
      route: "/defi",
      ctaLabel: "Open DeFi",
    }),
    badge({
      id: "raid-confirmed",
      label: "Raid Confirmed",
      description: "Finish your first raid and prove live participation.",
      current: input.raidsCompleted,
      target: 1,
      tone: "rose",
      route: "/raids",
      ctaLabel: "Open raids",
    }),
    badge({
      id: "vault-collector",
      label: "Vault Collector",
      description: "Unlock your first lootbox reward into inventory.",
      current: inventoryItems.length,
      target: 1,
      tone: "amber",
      route: "/rewards",
      ctaLabel: "Open vault",
    }),
    badge({
      id: "profile-flex",
      label: "Profile Flex",
      description: "Equip a title or cosmetic from your inventory.",
      current: equippedProfileItems,
      target: 1,
      tone: "violet",
      route: "/profile",
      ctaLabel: "Tune profile",
    }),
    badge({
      id: "trusted-contributor",
      label: "Trusted Contributor",
      description: "Reach 80+ trust inside at least one project.",
      current: input.trustedProjectCount,
      target: 1,
      tone: "lime",
      route: "/projects",
      ctaLabel: "Build trust",
    }),
    badge({
      id: "early-member",
      label: "Early Member",
      description: "Connect identity, reach level 2, and join the live graph.",
      current: Math.min(
        3,
        Number(input.walletConnected) +
          Number(input.level >= 2) +
          Math.min(input.connectedSystemCount, 1)
      ),
      target: 3,
      tone: "cyan",
      route: "/profile/edit",
      ctaLabel: "Verify identity",
    }),
    badge({
      id: "season-pass",
      label: "Season Pass",
      description: "Hold an active season access reward from the vault.",
      current: activeSeasonAccessItems,
      target: 1,
      tone: "rose",
      route: "/rewards",
      ctaLabel: "Open rewards",
    }),
    badge({
      id: "mythic-signal",
      label: "Mythic Signal",
      description: "Own a legendary or mythic reward item.",
      current: highRarityItems,
      target: 1,
      tone: "violet",
      route: "/rewards",
      ctaLabel: "Open vault",
    }),
    badge({
      id: "reward-claimer",
      label: "Reward Claimer",
      description: "Claim three rewards across campaigns or vault drops.",
      current: input.rewardsClaimed,
      target: 3,
      tone: "amber",
      route: "/rewards",
      ctaLabel: "Open rewards",
    }),
  ];

  const unlocked = badges.filter((item) => item.status === "unlocked");
  const locked = badges.filter((item) => item.status === "locked");
  const nextBadge =
    locked.sort((left, right) => right.progress - left.progress || left.target - right.target)[0] ??
    null;

  return {
    badges,
    unlockedCount: unlocked.length,
    totalCount: badges.length,
    completionPercent: Math.round((unlocked.length / badges.length) * 100),
    featuredBadge: unlocked[0] ?? null,
    nextBadge,
  };
}

function badge(definition: BadgeDefinition): AchievementBadge {
  const current = Math.max(0, Math.floor(Number(definition.current ?? 0)));
  const target = Math.max(1, Math.floor(Number(definition.target ?? 1)));
  const progress = Math.min(100, Math.round((current / target) * 100));

  return {
    ...definition,
    current,
    target,
    progress,
    status: current >= target ? "unlocked" : "locked",
  };
}
