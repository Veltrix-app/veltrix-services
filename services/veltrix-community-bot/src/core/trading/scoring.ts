import type {
  TradingLeaderboardInput,
  TradingLeaderboardRow,
  TradingScoringMode,
} from "./types.js";

export type TradingScoreInput = {
  scoringMode: TradingScoringMode;
  volumeUsd: number;
  roiPercent: number;
  tradeCount: number;
  activeDays: number;
  trustScore: number;
  flagsCount: number;
  maxVolumeUsdForScore?: number;
};

export type TradingScoreBreakdown = {
  volumePoints: number;
  roiPoints: number;
  consistencyBonus: number;
  trustBonus: number;
  abusePenalty: number;
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function round(value: number) {
  return Math.round(value);
}

export function calculateTradingScore(input: TradingScoreInput) {
  const maxVolumeUsdForScore = Math.max(input.maxVolumeUsdForScore ?? 10_000, 1);
  const cappedVolume = clamp(input.volumeUsd, 0, maxVolumeUsdForScore);
  const volumePoints = round((cappedVolume / maxVolumeUsdForScore) * 1000);
  const roiPoints = round(clamp(input.roiPercent, -100, 100) * 30);
  const consistencyBonus = round(Math.min(input.tradeCount, 10) * 12 + Math.min(input.activeDays, 7) * 7);
  const trustBonus = round(clamp(input.trustScore, 0, 100) * 4.72);
  const abusePenalty = round(Math.max(input.flagsCount, 0) * 60);

  const breakdown: TradingScoreBreakdown = {
    volumePoints: input.scoringMode === "roi" ? 0 : volumePoints,
    roiPoints: input.scoringMode === "volume" ? 0 : roiPoints,
    consistencyBonus: input.scoringMode === "hybrid" ? consistencyBonus : 0,
    trustBonus: input.scoringMode === "hybrid" ? trustBonus : 0,
    abusePenalty,
  };

  return {
    score: Math.max(
      0,
      round(
        breakdown.volumePoints +
          breakdown.roiPoints +
          breakdown.consistencyBonus +
          breakdown.trustBonus -
          breakdown.abusePenalty
      )
    ),
    breakdown,
  };
}

export function rankTradingParticipants(
  participants: TradingLeaderboardInput[]
): TradingLeaderboardRow[] {
  return [...participants]
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.volumeUsd !== left.volumeUsd) return right.volumeUsd - left.volumeUsd;
      if (right.roiPercent !== left.roiPercent) return right.roiPercent - left.roiPercent;
      if (right.tradeCount !== left.tradeCount) return right.tradeCount - left.tradeCount;
      return left.authUserId.localeCompare(right.authUserId);
    })
    .map((participant, index) => ({
      ...participant,
      rank: index + 1,
    }));
}
