import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDefiMissionOverview,
  getPrimaryVaultMission,
} from "./defi-missions-read-model";

test("defi mission overview keeps VYNTRO branding primary and protocol attribution secondary", () => {
  const overview = buildDefiMissionOverview();

  assert.equal(overview.productName, "VYNTRO DeFi Missions");
  assert.equal(overview.vaults.length, 4);
  assert.ok(overview.vaults.every((vault) => !vault.title.includes("Moonwell")));
  assert.match(overview.disclosure, /Moonwell ERC-4626 vaults/);
  assert.match(overview.disclosure, /VYNTRO does not custody funds/);
});

test("primary vault mission exposes a clear first-run flow before XP economy", () => {
  const mission = getPrimaryVaultMission();

  assert.equal(mission.slug, "usdc-vault");
  assert.deepEqual(
    mission.steps.map((step) => step.label),
    ["Connect wallet", "Review vault", "Open position", "Hold position"]
  );
  assert.equal(mission.rewardPreview.phase, "XP economy next");
});
