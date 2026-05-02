import test from "node:test";
import assert from "node:assert/strict";

import { computeAespLevelFromXp } from "./projections.js";

test("aesp reputation projection uses the same level thresholds as the web xp economy", () => {
  assert.equal(computeAespLevelFromXp(0), 1);
  assert.equal(computeAespLevelFromXp(499), 1);
  assert.equal(computeAespLevelFromXp(500), 2);
  assert.equal(computeAespLevelFromXp(1249), 2);
  assert.equal(computeAespLevelFromXp(1250), 3);
  assert.equal(computeAespLevelFromXp(5000), 6);
  assert.equal(computeAespLevelFromXp(16000), 10);
});
