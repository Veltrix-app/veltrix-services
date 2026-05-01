import test from "node:test";
import assert from "node:assert/strict";

import { buildRiskEventRollupRowFromRows, buildRiskEventRowsFromSignals } from "./risk-events.js";

test("risk event builder creates deterministic dedupe keys and normalized rows", () => {
  const rows = buildRiskEventRowsFromSignals({
    projectId: "project-1",
    authUserId: "user-1",
    walletAddress: "0xabc",
    sourceType: "onchain_signal",
    sourceId: "tx-1",
    signals: [
      {
        flagType: "fresh_wallet_activity",
        severity: "high",
        reason: "Fresh wallet completed high-value action.",
        metadata: {
          walletAgeDays: 1,
        },
      },
    ],
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].dedupe_key, "project-1:user-1:onchain_signal:tx-1:fresh_wallet_activity");
  assert.equal(rows[0].risk_category, "wallet_graph");
  assert.equal(rows[0].severity, "high");
  assert.equal(rows[0].recommended_action, "review_required");
  assert.deepEqual(rows[0].evidence.signalMetadata, { walletAgeDays: 1 });
});

test("risk event rollups keep the highest pressure signal per member", () => {
  const rows = buildRiskEventRowsFromSignals({
    projectId: "project-1",
    authUserId: "user-1",
    sourceType: "onchain_signal",
    sourceId: "tx-1",
    signals: [
      {
        flagType: "fresh_wallet_activity",
        severity: "medium",
        reason: "Fresh wallet activity.",
      },
      {
        flagType: "reward_trust_risk",
        severity: "critical",
        reason: "Reward farming ring.",
      },
    ],
  });

  const rollup = buildRiskEventRollupRowFromRows(rows);

  assert.equal(rollup.project_id, "project-1");
  assert.equal(rollup.auth_user_id, "user-1");
  assert.equal(rollup.risk_level, "critical");
  assert.equal(rollup.open_event_count, 2);
  assert.equal(rollup.high_event_count, 0);
  assert.equal(rollup.critical_event_count, 1);
  assert.equal(rollup.latest_recommended_action, "reward_hold");
});

test("risk event builder escalates reward abuse to reward hold", () => {
  const rows = buildRiskEventRowsFromSignals({
    projectId: "project-1",
    authUserId: "user-1",
    sourceType: "trust_snapshot",
    sourceId: "snapshot-1",
    signals: [
      {
        flagType: "reward_trust_risk",
        severity: "critical",
        reason: "Reward claim came from critical trust posture.",
      },
    ],
  });

  assert.equal(rows[0].risk_category, "reward_abuse");
  assert.equal(rows[0].severity, "critical");
  assert.equal(rows[0].recommended_action, "reward_hold");
});
