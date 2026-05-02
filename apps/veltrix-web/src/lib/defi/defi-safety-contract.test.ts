import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFI_SAFETY_ROUTES,
  getDefiGlobalSafetyContract,
  getDefiSafetySurface,
} from "./defi-safety-contract";

test("defi safety contract covers every public defi route", () => {
  assert.deepEqual(DEFI_SAFETY_ROUTES, [
    "overview",
    "portfolio",
    "swap",
    "vaults",
    "borrow-lending",
    "activity",
    "risk-guide",
  ]);

  for (const route of DEFI_SAFETY_ROUTES) {
    const surface = getDefiSafetySurface(route);

    assert.equal(surface.route, route);
    assert.ok(surface.headline);
    assert.ok(surface.copy);
    assert.ok(surface.primaryMove);
    assert.ok(surface.checks.length >= 3);
  }
});

test("global defi contract keeps launch-critical disclaimers explicit", () => {
  const contract = getDefiGlobalSafetyContract();
  const content = `${contract.headline} ${contract.copy} ${contract.invariants.join(" ")}`;

  assert.match(content, /never takes custody/i);
  assert.match(content, /wallet signs/i);
  assert.match(content, /yield is variable/i);
  assert.match(content, /XP/i);
  assert.doesNotMatch(content, /guaranteed yield|risk-free|borrow more for XP/i);
});

test("swap safety surface names the three risky signing checks", () => {
  const surface = getDefiSafetySurface("swap");
  const content = `${surface.copy} ${surface.checks.map((check) => `${check.label} ${check.copy}`).join(" ")}`;

  assert.match(content, /slippage/i);
  assert.match(content, /approval/i);
  assert.match(content, /provider|route/i);
  assert.match(content, /before signing/i);
});

test("borrow lending safety surface prioritizes collateral liquidation and repay", () => {
  const surface = getDefiSafetySurface("borrow-lending");
  const content = `${surface.copy} ${surface.primaryMove} ${surface.checks.map((check) => `${check.label} ${check.copy}`).join(" ")}`;

  assert.match(content, /collateral/i);
  assert.match(content, /liquidation/i);
  assert.match(content, /repay/i);
  assert.match(content, /borrow small/i);
});

test("vault and portfolio surfaces keep proof separate from rewards", () => {
  const vaults = getDefiSafetySurface("vaults");
  const portfolio = getDefiSafetySurface("portfolio");
  const content = `${vaults.copy} ${portfolio.copy} ${vaults.checks
    .concat(portfolio.checks)
    .map((check) => `${check.label} ${check.copy}`)
    .join(" ")}`;

  assert.match(content, /withdraw/i);
  assert.match(content, /proof/i);
  assert.match(content, /yield is variable/i);
  assert.match(content, /next safe action/i);
});
