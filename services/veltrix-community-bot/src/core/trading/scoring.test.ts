import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateTradingScore,
  rankTradingParticipants,
} from "./scoring.js";

test("calculateTradingScore combines capped volume, ROI, consistency, trust and penalties", () => {
  const result = calculateTradingScore({
    scoringMode: "hybrid",
    volumeUsd: 12_500,
    roiPercent: 18.4,
    tradeCount: 7,
    activeDays: 3,
    trustScore: 82,
    flagsCount: 1,
    maxVolumeUsdForScore: 10_000,
  });

  assert.equal(result.score, 1984);
  assert.deepEqual(result.breakdown, {
    volumePoints: 1000,
    roiPoints: 552,
    consistencyBonus: 105,
    trustBonus: 387,
    abusePenalty: 60,
  });
});

test("calculateTradingScore supports volume-only and ROI-only presets", () => {
  assert.equal(
    calculateTradingScore({
      scoringMode: "volume",
      volumeUsd: 5_000,
      roiPercent: 99,
      tradeCount: 2,
      activeDays: 1,
      trustScore: 50,
      flagsCount: 0,
      maxVolumeUsdForScore: 10_000,
    }).score,
    500
  );

  assert.equal(
    calculateTradingScore({
      scoringMode: "roi",
      volumeUsd: 5_000,
      roiPercent: 12.5,
      tradeCount: 2,
      activeDays: 1,
      trustScore: 50,
      flagsCount: 0,
      maxVolumeUsdForScore: 10_000,
    }).score,
    375
  );
});

test("rankTradingParticipants uses deterministic tie breakers", () => {
  const ranked = rankTradingParticipants([
    {
      participantId: "p2",
      authUserId: "u2",
      score: 900,
      volumeUsd: 800,
      roiPercent: 12,
      tradeCount: 4,
      flagsCount: 0,
      scoreBreakdown: {},
    },
    {
      participantId: "p1",
      authUserId: "u1",
      score: 900,
      volumeUsd: 900,
      roiPercent: 10,
      tradeCount: 2,
      flagsCount: 0,
      scoreBreakdown: {},
    },
    {
      participantId: "p3",
      authUserId: "u3",
      score: 900,
      volumeUsd: 900,
      roiPercent: 10,
      tradeCount: 5,
      flagsCount: 0,
      scoreBreakdown: {},
    },
  ]);

  assert.deepEqual(
    ranked.map((row) => ({ participantId: row.participantId, rank: row.rank })),
    [
      { participantId: "p3", rank: 1 },
      { participantId: "p1", rank: 2 },
      { participantId: "p2", rank: 3 },
    ]
  );
});
