export type TradingTrackingMode = "snapshot" | "live";
export type TradingScoringMode = "volume" | "roi" | "hybrid";
export type TradingCompetitionStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "paused"
  | "settling"
  | "settled"
  | "cancelled";
export type TradingCostStatus = "ok" | "near_cap" | "capped" | "provider_failure";
export type TradingSnapshotCadence = "start_end" | "hourly" | "daily";

export type TradingCompetitionPairInput = {
  chain?: string;
  baseSymbol: string;
  quoteSymbol?: string;
  baseTokenAddress: string;
  quoteTokenAddress?: string | null;
  poolAddress?: string | null;
  routerAddress?: string | null;
  minTradeUsd?: number;
  metadata?: Record<string, unknown>;
};

export type TradingCompetitionRewardInput = {
  rewardAsset: string;
  rewardAmount: number;
  rankFrom?: number | null;
  rankTo?: number | null;
  rewardType?: "rank" | "raffle" | "participation" | "xp";
  metadata?: Record<string, unknown>;
};

export type TradingCompetitionCreateInput = {
  projectId: string;
  campaignId?: string | null;
  createdByAuthUserId?: string | null;
  title: string;
  description?: string;
  bannerUrl?: string | null;
  status?: TradingCompetitionStatus;
  trackingMode?: TradingTrackingMode;
  scoringMode?: TradingScoringMode;
  chain?: string;
  quoteSymbol?: string;
  registrationStartsAt?: string | null;
  startsAt: string;
  endsAt: string;
  freezeAt?: string | null;
  snapshotCadence?: TradingSnapshotCadence;
  budgetCapCents?: number;
  rules?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  pairs?: TradingCompetitionPairInput[];
  rewards?: TradingCompetitionRewardInput[];
};

export type TradingCompetitionRead = {
  id: string;
  projectId: string;
  campaignId: string | null;
  title: string;
  description: string;
  bannerUrl: string | null;
  status: TradingCompetitionStatus;
  trackingMode: TradingTrackingMode;
  scoringMode: TradingScoringMode;
  chain: string;
  quoteSymbol: string;
  startsAt: string;
  endsAt: string;
  freezeAt: string | null;
  snapshotCadence: TradingSnapshotCadence;
  budgetCapCents: number;
  currentCostCents: number;
  costStatus: TradingCostStatus;
  rules: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  pairs: TradingCompetitionPairRead[];
  rewards: TradingCompetitionRewardRead[];
};

export type TradingCompetitionPairRead = {
  id: string;
  chain: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseTokenAddress: string;
  quoteTokenAddress: string | null;
  poolAddress: string | null;
  routerAddress: string | null;
  minTradeUsd: number;
  isActive: boolean;
  metadata: Record<string, unknown>;
};

export type TradingCompetitionRewardRead = {
  id: string;
  rewardAsset: string;
  rewardAmount: number;
  rankFrom: number | null;
  rankTo: number | null;
  rewardType: "rank" | "raffle" | "participation" | "xp";
  metadata: Record<string, unknown>;
};

export type TradingLeaderboardInput = {
  participantId: string;
  authUserId: string;
  score: number;
  volumeUsd: number;
  roiPercent: number;
  tradeCount: number;
  flagsCount: number;
  scoreBreakdown: Record<string, unknown>;
};

export type TradingLeaderboardRow = TradingLeaderboardInput & {
  rank: number;
};
