import assert from "node:assert/strict";
import test from "node:test";

import {
  getRaidCardCtaLabel,
  getRaidCardStatus,
  getRaidCardToneClass,
} from "./raid-card-state";

test("completed raid cards render as done with an emerald glow", () => {
  assert.equal(getRaidCardStatus({ completed: true, progress: 0 }).label, "Done");
  assert.equal(getRaidCardStatus({ completed: true, progress: 80 }).tone, "positive");
  assert.match(getRaidCardToneClass(true), /emerald/);
  assert.equal(getRaidCardCtaLabel(true), "Completed");
});

test("open raid cards keep hot and live status", () => {
  assert.equal(getRaidCardStatus({ completed: false, progress: 70 }).label, "Hot");
  assert.equal(getRaidCardStatus({ completed: false, progress: 20 }).label, "Live");
  assert.equal(getRaidCardCtaLabel(false), "Open raid");
});
