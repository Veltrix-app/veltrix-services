import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const liveDataPath = join(process.cwd(), "apps/veltrix-web/src/hooks/use-live-user-data.ts");
const raidsScreenPath = join(process.cwd(), "apps/veltrix-web/src/components/raids/raids-screen.tsx");

test("raid board loads user progress so completed raids can be highlighted", () => {
  const source = readFileSync(liveDataPath, "utf8");

  assert.match(
    source,
    /const shouldLoadUserProgress\s*=\s*[\s\S]*?shouldLoadRewards\s*\|\|\s*shouldLoadRaids\s*;/i
  );
  assert.match(source, /confirmedRaidIds\.has\(row\.id\)/i);
});

test("raid screen requests the raids dataset that carries completion state", () => {
  const source = readFileSync(raidsScreenPath, "utf8");

  assert.match(source, /datasets:\s*\[\s*"raids"\s*\]/i);
  assert.match(source, /getRaidCardToneClass\(raid\.completed\)/i);
});

test("raid screen applies completed styling to both spotlight and grid raid cards", () => {
  const source = readFileSync(raidsScreenPath, "utf8");

  const toneUsages = source.match(/getRaidCardToneClass\(raid\.completed\)/gi) ?? [];
  const statusUsages = source.match(/getRaidCardStatus\(\{\s*completed:\s*raid\.completed/gi) ?? [];
  const ctaUsages = source.match(/getRaidCardCtaLabel\(raid\.completed\)/gi) ?? [];

  assert.equal(toneUsages.length, 2);
  assert.equal(statusUsages.length, 2);
  assert.equal(ctaUsages.length, 2);
});
