import assert from "node:assert/strict";
import test from "node:test";
import {
  formatTradingCost,
  formatTradingWindow,
  getTradingCompetitionPosture,
} from "./trading-arena";

test("formatTradingCost renders cents as a commercial budget read", () => {
  assert.equal(formatTradingCost(0), "Included");
  assert.equal(formatTradingCost(724), "$7.24");
  assert.equal(formatTradingCost(12_500), "$125.00");
});

test("formatTradingWindow gives a compact duration label", () => {
  assert.equal(
    formatTradingWindow("2026-05-01T00:00:00.000Z", "2026-05-03T12:00:00.000Z"),
    "2d 12h"
  );
});

test("getTradingCompetitionPosture prioritizes the next safe action", () => {
  assert.deepEqual(
    getTradingCompetitionPosture({
      status: "live",
      trackingMode: "live",
      costStatus: "near_cap",
      leaderboardCount: 14,
      flagsCount: 2,
    }),
    {
      tone: "warning",
      label: "Budget watch",
      nextAction: "Review usage before increasing live tracking pressure",
    }
  );
});
