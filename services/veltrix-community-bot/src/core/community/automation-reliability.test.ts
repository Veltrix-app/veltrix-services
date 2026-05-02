import test from "node:test";
import assert from "node:assert/strict";

import {
  AUTOMATION_RETRY_BACKOFF_MINUTES,
  AUTOMATION_RUN_LOCK_MINUTES,
  AUTOMATION_STALE_RUN_MINUTES,
  buildAutomationFailureReliabilityState,
  classifyAutomationError,
  clearAutomationReliabilityState,
  getAutomationReliabilityState,
  getAutomationRunLockDecision,
  isAutomationRetryDue,
  resolveAutomationCompletionStatus,
} from "./automation-reliability.js";

test("classifies X API billing failures as non-retryable configuration work", () => {
  const failure = classifyAutomationError(
    new Error(
      "X API request failed with 402. Add X API credits or enable pay-per-use billing for the app that owns X_API_BEARER_TOKEN."
    )
  );

  assert.equal(failure.code, "x_api_billing");
  assert.equal(failure.retryable, false);
  assert.match(failure.ownerSummary, /credits|billing/i);
});

test("classifies transient provider failures as retryable", () => {
  const failure = classifyAutomationError(new Error("fetch failed: ECONNRESET"));

  assert.equal(failure.code, "transient_provider_error");
  assert.equal(failure.retryable, true);
});

test("builds exponential retry state without losing existing config", () => {
  const nowIso = "2026-05-02T10:00:00.000Z";
  const firstFailure = buildAutomationFailureReliabilityState({
    config: { ownerMode: "safe" },
    failure: classifyAutomationError(new Error("Discord bot is not connected yet.")),
    nowIso,
  });

  assert.equal(firstFailure.lastResult, "failed");
  assert.equal(firstFailure.errorCode, "provider_unavailable");
  assert.equal(firstFailure.nextRunAt, "2026-05-02T10:05:00.000Z");
  assert.deepEqual(firstFailure.config.ownerMode, "safe");
  assert.equal(getAutomationReliabilityState(firstFailure.config).failureCount, 1);

  const secondFailure = buildAutomationFailureReliabilityState({
    config: firstFailure.config,
    failure: classifyAutomationError(new Error("Discord bot is not connected yet.")),
    nowIso,
  });

  assert.equal(secondFailure.nextRunAt, "2026-05-02T10:15:00.000Z");
  assert.equal(getAutomationReliabilityState(secondFailure.config).failureCount, 2);
  assert.deepEqual(AUTOMATION_RETRY_BACKOFF_MINUTES.slice(0, 2), [5, 15]);
});

test("non-retryable failures park the automation for owner attention", () => {
  const state = buildAutomationFailureReliabilityState({
    config: {},
    failure: classifyAutomationError(new Error("column rewards.status does not exist")),
    nowIso: "2026-05-02T10:00:00.000Z",
  });

  assert.equal(state.nextRunAt, null);
  assert.equal(state.errorCode, "schema_mismatch");
  assert.equal(getAutomationReliabilityState(state.config).status, "needs_attention");
});

test("clears reliability state after a healthy run", () => {
  const cleared = clearAutomationReliabilityState({
    reliability: {
      status: "retry_scheduled",
      failureCount: 3,
      nextRetryAt: "2026-05-02T11:00:00.000Z",
    },
    keep: true,
  });

  assert.deepEqual(getAutomationReliabilityState(cleared), {
    status: "healthy",
    failureCount: 0,
    lastFailureCode: null,
    lastFailureAt: null,
    lastFailureSummary: null,
    nextRetryAt: null,
    retryable: false,
  });
  assert.equal(cleared.keep, true);
});

test("detects retry windows and active run locks", () => {
  const retryConfig = {
    reliability: {
      status: "retry_scheduled",
      nextRetryAt: "2026-05-02T10:00:00.000Z",
    },
  };

  assert.equal(
    isAutomationRetryDue({
      config: retryConfig,
      lastResult: "failed",
      nowIso: "2026-05-02T10:00:00.000Z",
    }),
    true
  );

  assert.equal(
    getAutomationRunLockDecision({
      runningStartedAt: "2026-05-02T09:58:00.000Z",
      nowIso: "2026-05-02T10:00:00.000Z",
    }).status,
    "locked"
  );

  assert.equal(
    getAutomationRunLockDecision({
      runningStartedAt: "2026-05-02T09:40:00.000Z",
      nowIso: "2026-05-02T10:00:00.000Z",
    }).status,
    "stale"
  );
  assert.equal(AUTOMATION_RUN_LOCK_MINUTES < AUTOMATION_STALE_RUN_MINUTES, true);
});

test("treats no-content automation outcomes as skipped instead of failed", () => {
  assert.equal(
    resolveAutomationCompletionStatus({
      deliveries: 0,
      summary: "No active campaign is available for an activation board.",
    }),
    "skipped"
  );

  assert.equal(
    resolveAutomationCompletionStatus({
      deliveries: 0,
      summary: "Activation board skipped because no targets were configured.",
    }),
    "skipped"
  );

  assert.equal(
    resolveAutomationCompletionStatus({
      deliveries: 0,
      summary: "Rank sync completed without changes.",
    }),
    "success"
  );
});
