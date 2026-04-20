import test from "node:test";
import assert from "node:assert/strict";

import { normalizeIncidentSeverity, normalizeIncidentStatus } from "./operation-state.js";

test("normalizeIncidentSeverity falls back to warning", () => {
  assert.equal(normalizeIncidentSeverity("unknown"), "warning");
  assert.equal(normalizeIncidentSeverity("critical"), "critical");
  assert.equal(normalizeIncidentSeverity("info"), "info");
});

test("normalizeIncidentStatus falls back to open", () => {
  assert.equal(normalizeIncidentStatus("unknown"), "open");
  assert.equal(normalizeIncidentStatus("watching"), "watching");
  assert.equal(normalizeIncidentStatus("resolved"), "resolved");
});
