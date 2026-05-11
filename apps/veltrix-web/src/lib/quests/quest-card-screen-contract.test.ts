import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const questsScreenPath = join(process.cwd(), "apps/veltrix-web/src/components/quests/quests-screen.tsx");

test("quest screen applies completed card state to spotlight and grid cards", () => {
  const source = readFileSync(questsScreenPath, "utf8");

  const toneUsages = source.match(/getQuestCardToneClass\(quest\.status\)/gi) ?? [];
  const statusUsages = source.match(/getQuestCardStatus\(quest\.status\)/gi) ?? [];
  const ctaUsages = source.match(/getQuestCardCtaLabel\(quest\.status\)/gi) ?? [];

  assert.equal(toneUsages.length, 2);
  assert.equal(statusUsages.length, 2);
  assert.equal(ctaUsages.length, 2);
});
