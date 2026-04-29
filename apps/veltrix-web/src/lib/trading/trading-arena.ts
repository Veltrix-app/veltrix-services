export type TradingTrackingMode = "snapshot" | "live";
export type TradingCompetitionStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "paused"
  | "settling"
  | "settled"
  | "cancelled";
export type TradingCostStatus = "ok" | "near_cap" | "capped" | "provider_failure";

export type TradingCompetitionRead = {
  id: string;
  projectId: string;
  campaignId: string | null;
  title: string;
  description: string;
  bannerUrl: string | null;
  status: TradingCompetitionStatus;
  trackingMode: TradingTrackingMode;
  scoringMode: "volume" | "roi" | "hybrid";
  chain: string;
  quoteSymbol: string;
  startsAt: string;
  endsAt: string;
  snapshotCadence: "start_end" | "hourly" | "daily";
  budgetCapCents: number;
  currentCostCents: number;
  costStatus: TradingCostStatus;
  rules: Record<string, unknown>;
  metadata: Record<string, unknown>;
  pairs: TradingCompetitionPairRead[];
  rewards: TradingCompetitionRewardRead[];
};

export type TradingCompetitionPairRead = {
  id: string;
  chain: string;
  baseSymbol: string;
  quoteSymbol: string;
  minTradeUsd: number;
};

export type TradingCompetitionRewardRead = {
  id: string;
  rewardAsset: string;
  rewardAmount: number;
  rankFrom: number | null;
  rankTo: number | null;
  rewardType: string;
};

export type TradingLeaderboardRow = {
  rank: number;
  participantId: string;
  authUserId: string;
  score: number;
  volumeUsd: number;
  roiPercent: number;
  tradeCount: number;
  flagsCount: number;
  status: string;
  calculatedAt?: string;
};

export function formatTradingCost(cents: number) {
  if (!Number.isFinite(cents) || cents <= 0) return "Included";
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatTradingWindow(startsAt: string, endsAt: string) {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const durationMs = Math.max(end - start, 0);
  const totalHours = Math.floor(durationMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0 && hours > 0) return `${days}d ${hours}h`;
  if (days > 0) return `${days}d`;
  return `${Math.max(hours, 1)}h`;
}

export function formatTradingReward(rewards: TradingCompetitionRewardRead[]) {
  if (rewards.length === 0) return "Rewards pending";
  const total = rewards.reduce((sum, reward) => sum + Number(reward.rewardAmount || 0), 0);
  const asset = rewards[0]?.rewardAsset || "rewards";
  return `${total.toLocaleString("en-US")} ${asset}`;
}

export function getTradingCompetitionPosture(input: {
  status: TradingCompetitionStatus;
  trackingMode: TradingTrackingMode;
  costStatus: TradingCostStatus;
  leaderboardCount: number;
  flagsCount: number;
}) {
  if (input.costStatus === "capped") {
    return {
      tone: "danger" as const,
      label: "Budget capped",
      nextAction: "Pause tracking or raise the project budget cap",
    };
  }

  if (input.costStatus === "near_cap") {
    return {
      tone: "warning" as const,
      label: "Budget watch",
      nextAction: "Review usage before increasing live tracking pressure",
    };
  }

  if (input.flagsCount > 0) {
    return {
      tone: "warning" as const,
      label: "Review flags",
      nextAction: "Review suspicious wallets before publishing winners",
    };
  }

  if (input.status === "settled") {
    return {
      tone: "positive" as const,
      label: "Settled",
      nextAction: "Members can review their final position and rewards",
    };
  }

  if (input.leaderboardCount > 0) {
    return {
      tone: "positive" as const,
      label: input.trackingMode === "live" ? "Live board" : "Snapshot board",
      nextAction: "Keep the leaderboard visible and watch freshness",
    };
  }

  return {
    tone: "default" as const,
    label: input.status === "scheduled" ? "Scheduled" : "Ready",
    nextAction: "Invite members to join before the arena opens",
  };
}
