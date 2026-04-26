import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDefiMissionOverview,
  buildMoonwellMarketExpansion,
  getPrimaryVaultMission,
} from "./defi-missions-read-model";
import { buildMoonwellVaultPositionRead, getMoonwellVaultBySlug } from "./moonwell-vaults";

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

test("moonwell market expansion keeps lending markets read-only before borrow flows", () => {
  const expansion = buildMoonwellMarketExpansion({
    walletReady: false,
    vaultPositions: [],
    readStatus: "wallet-missing",
  });

  assert.equal(expansion.title, "Moonwell market cockpit");
  assert.ok(expansion.markets.length >= 4);
  assert.ok(expansion.markets.every((market) => market.mode === "read-only"));
  assert.ok(expansion.markets.every((market) => !market.primaryAction.toLowerCase().includes("borrow")));
  assert.match(expansion.borrowRail.description, /later/i);
  assert.equal(expansion.portfolio.status, "wallet-needed");
});

test("moonwell portfolio posture summarizes detected vault positions into the next safe action", () => {
  const usdcVault = getMoonwellVaultBySlug("usdc-vault");
  assert.ok(usdcVault);

  const expansion = buildMoonwellMarketExpansion({
    walletReady: true,
    readStatus: "ready",
    vaultPositions: [
      buildMoonwellVaultPositionRead({
        vault: usdcVault,
        wallet: "0x1234567890abcdef1234567890abcdef12345678",
        shareBalanceRaw: "2500000000000000000",
        shareDecimals: 18,
        assetAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        assetSymbol: "USDC",
        assetDecimals: 6,
        underlyingRaw: "2510000",
        maxWithdrawRaw: "2510000",
        totalAssetsRaw: "100000000000",
      }),
    ],
  });

  assert.equal(expansion.portfolio.status, "active");
  assert.equal(expansion.portfolio.activeVaults, 1);
  assert.deepEqual(expansion.portfolio.detectedAssets, ["USDC"]);
  assert.match(expansion.portfolio.nextSafeAction, /review/i);
});
