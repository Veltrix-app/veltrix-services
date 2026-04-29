import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveCostStatus,
  estimateTrackingCostCents,
} from "./cost-ledger.js";

test("estimateTrackingCostCents keeps snapshot mode predictable", () => {
  const estimate = estimateTrackingCostCents({
    mode: "snapshot",
    pairs: 2,
    participants: 120,
    durationHours: 48,
    snapshotCadence: "hourly",
  });

  assert.equal(estimate.estimatedCostCents, 1092);
  assert.equal(estimate.units.snapshots, 49);
  assert.equal(estimate.units.storageWrites, 5880);
});

test("estimateTrackingCostCents prices live mode from scans, events and rebuilds", () => {
  const estimate = estimateTrackingCostCents({
    mode: "live",
    pairs: 3,
    participants: 250,
    durationHours: 24,
    expectedEventsPerHour: 40,
    scanIntervalMinutes: 10,
  });

  assert.equal(estimate.estimatedCostCents, 724);
  assert.equal(estimate.units.logScans, 432);
  assert.equal(estimate.units.eventDecodes, 960);
  assert.equal(estimate.units.leaderboardRebuilds, 24);
});

test("deriveCostStatus warns near cap and caps at the hard limit", () => {
  assert.equal(deriveCostStatus({ currentCostCents: 40, budgetCapCents: 100 }), "ok");
  assert.equal(deriveCostStatus({ currentCostCents: 85, budgetCapCents: 100 }), "near_cap");
  assert.equal(deriveCostStatus({ currentCostCents: 100, budgetCapCents: 100 }), "capped");
  assert.equal(deriveCostStatus({ currentCostCents: 0, budgetCapCents: 0 }), "ok");
});
