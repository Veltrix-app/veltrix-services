import type { LiveQuest } from "@/types/live";

export type StreakLadderStatus = "claimed" | "next" | "locked";

export type StreakLadderMilestone = {
  day: 1 | 3 | 7;
  label: string;
  reward: string;
  status: StreakLadderStatus;
  progress: number;
};

export type StreakLadderRead = {
  currentStreak: number;
  dailyStatus: "claimed" | "open";
  weeklyStatus: "claimed" | "building" | "open";
  multiplierLabel: string;
  weeklyProgress: {
    current: number;
    target: number;
    percent: number;
  };
  weeklyShardUpside: number;
  milestones: StreakLadderMilestone[];
  nextAction: {
    label: string;
    href: string;
    meta: string;
    questId: string | null;
  } | null;
};

export function buildStreakLadderRead(input: {
  currentStreak: number;
  quests: LiveQuest[];
}): StreakLadderRead {
  const currentStreak = Math.max(0, Math.floor(Number(input.currentStreak ?? 0)));
  const quests = input.quests ?? [];
  const dailyCheckIn = findPlatformQuest(quests, "daily-check-in");
  const dailyRealAction = findPlatformQuest(quests, "daily-real-action");
  const weeklyActivity = findPlatformQuest(quests, "weekly-activity-streak");
  const dailyShardQuests = quests.filter(
    (quest) =>
      quest.status !== "approved" &&
      (quest.platformQuestCadence === "daily" || quest.shardRewardWindow === "daily") &&
      Math.max(0, quest.shardRewardAmount ?? 0) > 0
  );
  const weeklyShardQuests = quests.filter(
    (quest) =>
      quest.status !== "approved" &&
      (quest.platformQuestCadence === "weekly" || quest.shardRewardWindow === "weekly") &&
      Math.max(0, quest.shardRewardAmount ?? 0) > 0
  );
  const approvedDailyActions = quests.filter(
    (quest) =>
      quest.status === "approved" &&
      (quest.platformQuestCadence === "daily" ||
        quest.platformQuestSlug === "daily-check-in" ||
        quest.platformQuestSlug === "daily-real-action" ||
        /daily|check.?in|real action/i.test(`${quest.title} ${quest.questType}`))
  ).length;
  const weeklyClaimed = weeklyActivity?.status === "approved";
  const weeklyCurrent = weeklyClaimed ? 3 : Math.min(3, approvedDailyActions);
  const weeklyStatus = weeklyClaimed ? "claimed" : weeklyCurrent > 0 ? "building" : "open";
  const dailyClaimed =
    dailyCheckIn?.status === "approved" || dailyRealAction?.status === "approved";
  const nextQuest =
    dailyRealAction?.status !== "approved"
      ? dailyRealAction
      : dailyCheckIn?.status !== "approved"
        ? dailyCheckIn
        : weeklyActivity?.status !== "approved"
          ? weeklyActivity
          : dailyShardQuests[0] ?? weeklyShardQuests[0] ?? null;
  const nextAction = nextQuest
    ? {
        label: nextQuest.actionLabel ?? "Keep streak alive",
        href: nextQuest.actionUrl || `/quests/${nextQuest.id}`,
        meta: formatQuestMeta(nextQuest),
        questId: nextQuest.id,
      }
    : {
        label: "Keep streak alive",
        href: "/quests",
        meta: "Open the next live action when it appears.",
        questId: null,
      };

  return {
    currentStreak,
    dailyStatus: dailyClaimed ? "claimed" : "open",
    weeklyStatus,
    multiplierLabel: `${deriveStreakMultiplier(currentStreak).toFixed(1)}x`,
    weeklyProgress: {
      current: weeklyCurrent,
      target: 3,
      percent: Math.round((weeklyCurrent / 3) * 100),
    },
    weeklyShardUpside: [...dailyShardQuests, ...weeklyShardQuests].reduce(
      (total, quest) => total + Math.max(0, quest.shardRewardAmount ?? 0),
      0
    ),
    milestones: buildMilestones(currentStreak),
    nextAction,
  };
}

function findPlatformQuest(quests: LiveQuest[], slug: string) {
  return quests.find((quest) => quest.platformQuestSlug === slug);
}

function buildMilestones(currentStreak: number): StreakLadderMilestone[] {
  const definitions: Array<Omit<StreakLadderMilestone, "status" | "progress">> = [
    { day: 1, label: "Day 1", reward: "+XP loop" },
    { day: 3, label: "Day 3", reward: "Shard boost" },
    { day: 7, label: "Day 7", reward: "Lootbox boost" },
  ];
  const next = definitions.find((milestone) => currentStreak < milestone.day)?.day ?? null;

  return definitions.map((milestone) => ({
    ...milestone,
    status:
      currentStreak >= milestone.day
        ? "claimed"
        : next === milestone.day
          ? "next"
          : "locked",
    progress: Math.min(100, Math.round((currentStreak / milestone.day) * 100)),
  }));
}

function formatQuestMeta(quest: LiveQuest) {
  const shards = Math.max(0, quest.shardRewardAmount ?? 0);
  if (shards > 0) {
    return `+${shards} shards / ${quest.platformQuestCadence ?? "quest"}`;
  }

  return `${Math.max(0, quest.xp)} XP / ${quest.completionMode ?? "action"}`;
}

function deriveStreakMultiplier(streak: number) {
  return Math.min(1.3, 1 + Math.floor(Math.max(0, streak) / 2) * 0.1);
}
