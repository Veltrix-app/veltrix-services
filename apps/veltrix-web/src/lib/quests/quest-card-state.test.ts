import assert from "node:assert/strict";
import test from "node:test";
import {
  getQuestCardCtaLabel,
  getQuestCardStatus,
  getQuestCardToneClass,
} from "./quest-card-state";

test("approved quest cards render as complete with an emerald glow", () => {
  assert.equal(getQuestCardStatus("approved").label, "Complete");
  assert.equal(getQuestCardStatus("approved").tone, "positive");
  assert.match(getQuestCardToneClass("approved"), /emerald/);
  assert.equal(getQuestCardCtaLabel("approved"), "Completed");
});

test("open quest cards keep active cyan styling", () => {
  assert.equal(getQuestCardStatus("open").label, "active");
  assert.equal(getQuestCardStatus("open").tone, "info");
  assert.match(getQuestCardToneClass("open"), /cyan/);
  assert.equal(getQuestCardCtaLabel("open"), "Open mission");
});
