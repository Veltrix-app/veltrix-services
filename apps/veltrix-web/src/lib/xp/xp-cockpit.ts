import {
  XP_SOURCE_TYPES,
  buildXpProgressionRead,
  buildXpStreakRead,
  getXpSourceConfig,
} from "./xp-economy";

export type XpCockpitStatus =
  | "wallet-needed"
  | "review-watch"
  | "claim-ready"
  | "growth-ready";
export type XpCockpitTone = "default" | "positive" | "warning" | "info";

export type XpCockpitSourceLane = {
  key: "quests" | "raids" | "defi" | "streak";
  title: string;
  value: string;
  copy: string;
  href: string;
  tone: XpCockpitTone;
};

export type XpCockpitGuardrail = {
  key: "duplicate" | "daily-cap" | "sybil" | "borrow-volume";
  title: string;
  copy: string;
  tone: XpCockpitTone;
};

export type XpCockpitRead = {
  status: XpCockpitStatus;
  headline: string;
  description: string;
  nextAction: string;
  nextActionHref: string;
  levelRead: ReturnType<typeof buildXpProgressionRead>;
  streakRead: ReturnType<typeof buildXpStreakRead>;
  metrics: {
    activeXp: number;
    claimableXp: number;
    earnedDefiXp: number;
    trustScore: number;
    sybilScore: number;
  };
  sourceLanes: XpCockpitSourceLane[];
  guardrails: XpCockpitGuardrail[];
};

export function buildXpCockpitRead(input: {
  walletReady: boolean;
  totalXp: number;
  activeXp: number;
  level: number;
  streak: number;
  trustScore: number;
  sybilScore: number;
  contributionTier: string;
  questsCompleted: number;
  raidsCompleted: number;
  rewardsClaimed: number;
  openQuestCount: number;
  pendingQuestCount: number;
  approvedQuestCount: number;
  liveRaidCount: number;
  claimableRewardCount: number;
  claimableDefiXp: number;
  claimedDefiXp: number;
  completedDefiXp: number;
  defiStatus: string;
  nextDefiAction: string;
}): XpCockpitRead {
  const levelRead = buildXpProgressionRead(input.totalXp);
  const streakRead = buildXpStreakRead({
    currentStreak: input.streak,
    lastActivityAt: null,
  });
  const safeClaimableDefiXp = toSafeNumber(input.claimableDefiXp);
  const safeClaimableRewards = toSafeNumber(input.claimableRewardCount);
  const trustScore = toSafeNumber(input.trustScore, 50);
  const sybilScore = toSafeNumber(input.sybilScore);
  const reviewNeeded = sybilScore >= 90;

  const sourceLanes: XpCockpitSourceLane[] = [
    {
      key: "quests",
      title: "Quest proof",
      value: `${toSafeNumber(input.approvedQuestCount)} approved`,
      copy:
        input.pendingQuestCount > 0
          ? `${input.pendingQuestCount} pending proofs still need review before XP settles.`
          : `${input.openQuestCount} open quests can feed the next XP move.`,
      href: "/quests",
      tone: input.pendingQuestCount > 0 ? "warning" : "info",
    },
    {
      key: "raids",
      title: "Raid coordination",
      value: `${toSafeNumber(input.raidsCompleted)} cleared`,
      copy: `${input.liveRaidCount} live raid lanes can add coordinated XP without touching DeFi risk.`,
      href: "/raids",
      tone: input.liveRaidCount > 0 ? "positive" : "default",
    },
    {
      key: "defi",
      title: "DeFi proof",
      value: `${safeClaimableDefiXp} XP`,
      copy:
        safeClaimableDefiXp > 0
          ? "Verified DeFi actions are ready to claim through the protected proof route."
          : input.nextDefiAction || "Complete a safe vault or supply action before claiming DeFi XP.",
      href: "/defi/portfolio",
      tone: safeClaimableDefiXp > 0 ? "positive" : input.defiStatus === "risk-watch" ? "warning" : "info",
    },
    {
      key: "streak",
      title: "Streak loop",
      value: `${toSafeNumber(input.streak)} days`,
      copy: `Current streak posture is ${streakRead.label.toLowerCase()} with a ${streakRead.multiplier}x retention multiplier preview.`,
      href: "/community",
      tone: input.streak > 0 ? "positive" : "default",
    },
  ];

  const guardrails: XpCockpitGuardrail[] = [
    {
      key: "duplicate",
      title: "One source, one claim",
      copy: "Every quest, raid, DeFi mission and streak writes a canonical source_ref to block duplicate XP.",
      tone: "positive",
    },
    {
      key: "daily-cap",
      title: "Daily caps stay active",
      copy: `Quest XP caps at ${getXpSourceConfig(XP_SOURCE_TYPES.quest).maxDailyXp}/day and raid XP caps at ${getXpSourceConfig(XP_SOURCE_TYPES.raid).maxDailyXp}/day.`,
      tone: "info",
    },
    {
      key: "sybil",
      title: "Trust review gate",
      copy:
        reviewNeeded
          ? "This account is in review territory, so new XP should pause until trust is checked."
          : `Trust ${trustScore}/100 and sybil ${sybilScore}/100 keep the account inside normal XP flow.`,
      tone: reviewNeeded ? "warning" : "positive",
    },
    {
      key: "borrow-volume",
      title: "No borrow farming",
      copy: "Borrow volume is never rewarded directly; DeFi XP rewards safe proof, collateral awareness and repay discipline.",
      tone: "warning",
    },
  ];

  if (!input.walletReady) {
    return {
      status: "wallet-needed",
      headline: "Connect wallet before XP compounds.",
      description:
        "The economy can preview quests and raids, but wallet-linked claims need a verified account spine.",
      nextAction: "Connect wallet to unlock DeFi XP and safer reward routing",
      nextActionHref: "/profile/edit",
      levelRead,
      streakRead,
      metrics: buildMetrics(input, safeClaimableRewards, safeClaimableDefiXp),
      sourceLanes,
      guardrails,
    };
  }

  if (reviewNeeded) {
    return {
      status: "review-watch",
      headline: "XP is paused for trust review.",
      description:
        "The account is close to or inside sybil-review pressure, so the safest move is review before more awards.",
      nextAction: "Review account trust before claiming new XP",
      nextActionHref: "/profile",
      levelRead,
      streakRead,
      metrics: buildMetrics(input, safeClaimableRewards, safeClaimableDefiXp),
      sourceLanes,
      guardrails,
    };
  }

  if (safeClaimableDefiXp > 0) {
    return {
      status: "claim-ready",
      headline: "Claimable DeFi XP is ready.",
      description:
        "Verified DeFi proof can now flow into the same central economy as quests, raids and streaks.",
      nextAction: `Claim ${safeClaimableDefiXp} XP before starting the next earning route`,
      nextActionHref: "/defi/portfolio",
      levelRead,
      streakRead,
      metrics: buildMetrics(input, safeClaimableRewards, safeClaimableDefiXp),
      sourceLanes,
      guardrails,
    };
  }

  return {
    status: "growth-ready",
    headline: "XP economy is ready for the next move.",
    description:
      "Quests, raids, DeFi and streaks are readable from one central progression model.",
    nextAction:
      input.pendingQuestCount > 0
        ? "Check pending quest proof before adding more work"
        : "Choose the next quest, raid or DeFi mission from the safest available route",
    nextActionHref: input.pendingQuestCount > 0 ? "/quests" : "/home",
    levelRead,
    streakRead,
    metrics: buildMetrics(input, safeClaimableRewards, safeClaimableDefiXp),
    sourceLanes,
    guardrails,
  };
}

function buildMetrics(
  input: {
    activeXp: number;
    claimableRewardCount: number;
    claimableDefiXp: number;
    completedDefiXp: number;
    trustScore: number;
    sybilScore: number;
  },
  safeClaimableRewards: number,
  safeClaimableDefiXp: number
) {
  return {
    activeXp: toSafeNumber(input.activeXp),
    claimableXp: safeClaimableRewards + safeClaimableDefiXp,
    earnedDefiXp: toSafeNumber(input.completedDefiXp),
    trustScore: toSafeNumber(input.trustScore, 50),
    sybilScore: toSafeNumber(input.sybilScore),
  };
}

function toSafeNumber(value: unknown, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}
