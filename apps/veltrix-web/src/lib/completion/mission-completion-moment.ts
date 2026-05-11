export type MissionCompletionKind = "quest" | "raid" | "defi" | "reward";
export type MissionCompletionTone = "lime" | "rose" | "cyan" | "amber";

export type MissionCompletionReward = {
  label: string;
  value: string;
  detail: string;
};

export type MissionCompletionMoment = {
  kind: MissionCompletionKind;
  eyebrow: string;
  title: string;
  subtitle: string;
  tone: MissionCompletionTone;
  rewards: MissionCompletionReward[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  shareText: string;
};

export function buildMissionCompletionMoment(input: {
  kind: MissionCompletionKind;
  title: string;
  xpAwarded?: number | null;
  shardsAwarded?: number | null;
  streakDays?: number | null;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}): MissionCompletionMoment {
  const title = clean(input.title) ?? "Mission cleared";
  const xpAwarded = Math.max(0, Math.floor(Number(input.xpAwarded ?? 0)));
  const shardsAwarded = Math.max(0, Math.floor(Number(input.shardsAwarded ?? 0)));
  const streakDays = Math.max(0, Math.floor(Number(input.streakDays ?? 0)));
  const rewards: MissionCompletionReward[] = [];

  if (xpAwarded > 0) {
    rewards.push({ label: "XP", value: `+${xpAwarded}`, detail: "Progress added" });
  }

  if (shardsAwarded > 0) {
    rewards.push({ label: "Shards", value: `+${shardsAwarded}`, detail: "Currency earned" });
  }

  if (streakDays > 0) {
    rewards.push({ label: "Streak", value: `${streakDays}d`, detail: "Rhythm protected" });
  }

  if (rewards.length === 0) {
    rewards.push({ label: "Progress", value: "Logged", detail: "Completion recorded" });
  }

  const copy = getKindCopy(input.kind);
  const rewardText = rewards.map((reward) => `${reward.value} ${reward.label}`).join(", ");

  return {
    kind: input.kind,
    eyebrow: copy.eyebrow,
    title,
    subtitle: copy.subtitle,
    tone: copy.tone,
    rewards,
    primaryHref: input.primaryHref ?? copy.primaryHref,
    primaryLabel: input.primaryLabel ?? copy.primaryLabel,
    secondaryHref: input.secondaryHref ?? "/home",
    secondaryLabel: input.secondaryLabel ?? "Back to cockpit",
    shareText: `${title} cleared on VYNTRO. ${rewardText}.`,
  };
}

function getKindCopy(kind: MissionCompletionKind) {
  switch (kind) {
    case "raid":
      return {
        eyebrow: "Raid confirmed",
        subtitle: "The push is written into your live reputation layer.",
        tone: "rose" as const,
        primaryHref: "/raids",
        primaryLabel: "Open raids",
      };
    case "defi":
      return {
        eyebrow: "DeFi XP claimed",
        subtitle: "Verified onchain progress moved into the XP economy.",
        tone: "cyan" as const,
        primaryHref: "/defi",
        primaryLabel: "Open DeFi",
      };
    case "reward":
      return {
        eyebrow: "Reward claimed",
        subtitle: "The reward route moved forward in your vault.",
        tone: "amber" as const,
        primaryHref: "/rewards",
        primaryLabel: "Open rewards",
      };
    case "quest":
    default:
      return {
        eyebrow: "Mission complete",
        subtitle: "XP, shards and badge progress are now part of your trail.",
        tone: "lime" as const,
        primaryHref: "/quests",
        primaryLabel: "Open quests",
      };
  }
}

function clean(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
