import type { LiveQuest } from "@/types/live";

export type QuestJourneyLaneId =
  | "onboarding"
  | "daily"
  | "weekly"
  | "defi"
  | "social"
  | "lootbox"
  | "project";

export type QuestJourneyQuest = LiveQuest & {
  campaignTitle?: string;
  projectName?: string;
  rewardCount?: number;
  shardPool?: unknown;
};

export type QuestJourneyLane = {
  id: QuestJourneyLaneId;
  title: string;
  eyebrow: string;
  description: string;
  quests: QuestJourneyQuest[];
  totalCount: number;
  openCount: number;
  pendingCount: number;
  completedCount: number;
  xpAvailable: number;
  shardsAvailable: number;
  progressPercent: number;
  nextQuest: QuestJourneyQuest | null;
};

export type QuestJourneyMap = {
  lanes: QuestJourneyLane[];
  nextQuest: QuestJourneyQuest | null;
  totalCount: number;
  openCount: number;
  completedCount: number;
  xpAvailable: number;
  shardsAvailable: number;
  progressPercent: number;
};

const LANE_META: Record<
  QuestJourneyLaneId,
  { title: string; eyebrow: string; description: string }
> = {
  onboarding: {
    title: "Onboarding route",
    eyebrow: "Start",
    description: "First actions that teach members where the platform lives.",
  },
  daily: {
    title: "Daily loop",
    eyebrow: "Today",
    description: "Repeatable checks that keep shards and XP moving.",
  },
  weekly: {
    title: "Weekly streak",
    eyebrow: "Momentum",
    description: "Bigger rhythm quests for sustained activity.",
  },
  defi: {
    title: "DeFi actions",
    eyebrow: "Onchain",
    description: "Swap, market and portfolio actions across the app.",
  },
  social: {
    title: "Social proof",
    eyebrow: "Community",
    description: "Community joins, follows and invite-driven proof.",
  },
  lootbox: {
    title: "Shard rewards",
    eyebrow: "Rewards",
    description: "Shard-bearing quests and lootbox unlock pressure.",
  },
  project: {
    title: "Project missions",
    eyebrow: "Campaigns",
    description: "Project-specific quests that do not fit a platform lane yet.",
  },
};

const LANE_ORDER: QuestJourneyLaneId[] = [
  "onboarding",
  "daily",
  "weekly",
  "defi",
  "social",
  "lootbox",
  "project",
];

export function buildQuestJourneyMap(quests: QuestJourneyQuest[]): QuestJourneyMap {
  const buckets = new Map<QuestJourneyLaneId, QuestJourneyQuest[]>(
    LANE_ORDER.map((laneId) => [laneId, []])
  );

  for (const quest of quests) {
    buckets.get(resolveQuestJourneyLane(quest))?.push(quest);
  }

  const lanes = LANE_ORDER.map((laneId) => buildQuestJourneyLane(laneId, buckets.get(laneId) ?? []));
  const rankedQuests = quests.filter((quest) => quest.status !== "approved").sort(compareQuestPriority);
  const totalCount = quests.length;
  const completedCount = quests.filter((quest) => quest.status === "approved").length;
  const openQuests = quests.filter((quest) => quest.status !== "approved");

  return {
    lanes,
    nextQuest: rankedQuests[0] ?? null,
    totalCount,
    openCount: openQuests.length,
    completedCount,
    xpAvailable: openQuests.reduce((total, quest) => total + Math.max(0, quest.xp), 0),
    shardsAvailable: openQuests.reduce((total, quest) => total + toShardAmount(quest), 0),
    progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
  };
}

export function resolveQuestJourneyLane(quest: QuestJourneyQuest): QuestJourneyLaneId {
  const cadence = normalizeValue(quest.platformQuestCadence);
  const shardWindow = normalizeValue(quest.shardRewardWindow);
  const provider = normalizeValue(quest.verificationProvider);
  const haystack = normalizeValue(
    [
      quest.title,
      quest.description,
      quest.type,
      quest.questType,
      quest.actionLabel,
      quest.actionUrl,
      quest.completionMode,
      quest.platformQuestSlug,
      quest.campaignTitle,
      quest.projectName,
    ].join(" ")
  );

  if (quest.isPlatformQuest && /onboarding|first|profile|wallet|connect|intro/.test(`${cadence} ${haystack}`)) {
    return "onboarding";
  }

  if (cadence === "daily" || shardWindow === "daily") {
    return "daily";
  }

  if (cadence === "weekly" || shardWindow === "weekly" || /weekly|streak/.test(haystack)) {
    return "weekly";
  }

  if (/swap|defi|vault|stake|staking|borrow|lend|lending|market|portfolio|bridge|pool/.test(haystack)) {
    return "defi";
  }

  if (
    /discord|telegram|twitter|invite|social|community|follow|raid|share|refer/.test(`${provider} ${haystack}`)
  ) {
    return "social";
  }

  if (
    toShardAmount(quest) > 0 ||
    Number(quest.rewardCount ?? 0) > 0 ||
    quest.shardPool ||
    /lootbox|shard|reward|claim|chest|box/.test(haystack)
  ) {
    return "lootbox";
  }

  return "project";
}

function buildQuestJourneyLane(laneId: QuestJourneyLaneId, quests: QuestJourneyQuest[]): QuestJourneyLane {
  const sortedQuests = [...quests].sort(compareQuestPriority);
  const totalCount = sortedQuests.length;
  const completedCount = sortedQuests.filter((quest) => quest.status === "approved").length;
  const openQuests = sortedQuests.filter((quest) => quest.status !== "approved");
  const meta = LANE_META[laneId];

  return {
    id: laneId,
    title: meta.title,
    eyebrow: meta.eyebrow,
    description: meta.description,
    quests: sortedQuests,
    totalCount,
    openCount: openQuests.length,
    pendingCount: sortedQuests.filter((quest) => quest.status === "pending").length,
    completedCount,
    xpAvailable: openQuests.reduce((total, quest) => total + Math.max(0, quest.xp), 0),
    shardsAvailable: openQuests.reduce((total, quest) => total + toShardAmount(quest), 0),
    progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    nextQuest: openQuests[0] ?? null,
  };
}

function compareQuestPriority(left: QuestJourneyQuest, right: QuestJourneyQuest) {
  return (
    statusRank(left.status) - statusRank(right.status) ||
    Number(right.isPlatformQuest) - Number(left.isPlatformQuest) ||
    toShardAmount(right) - toShardAmount(left) ||
    Number(right.shardPool ? 1 : 0) - Number(left.shardPool ? 1 : 0) ||
    Number(right.rewardCount ?? 0) - Number(left.rewardCount ?? 0) ||
    Math.max(0, right.xp) - Math.max(0, left.xp) ||
    left.title.localeCompare(right.title)
  );
}

function statusRank(status: LiveQuest["status"]) {
  if (status === "open") return 0;
  if (status === "rejected") return 1;
  if (status === "pending") return 2;
  return 3;
}

function toShardAmount(quest: QuestJourneyQuest) {
  return Math.max(0, Math.floor(Number(quest.shardRewardAmount ?? 0)));
}

function normalizeValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}
