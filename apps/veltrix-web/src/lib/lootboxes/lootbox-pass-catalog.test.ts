import assert from "node:assert/strict";
import test from "node:test";
import {
  VYNTRO_MEMBER_PASSES,
  getRecommendedVyntroMemberPass,
  getVyntroMemberPass,
} from "./lootbox-pass-catalog";

test("member pass catalog holds the planned five ten and fifteen dollar tiers", () => {
  assert.deepEqual(
    VYNTRO_MEMBER_PASSES.map((pass) => [pass.id, pass.priceUsd, pass.status]),
    [
      ["spark", 5, "planned"],
      ["surge", 10, "planned"],
      ["mythic", 15, "planned"],
    ]
  );
});

test("member passes expose visible perk copy for the blueprint UI", () => {
  for (const pass of VYNTRO_MEMBER_PASSES) {
    assert.equal(pass.perks.length, 3);
    assert.ok(pass.shardLiftLabel.length > 0);
    assert.ok(pass.position.length > 0);
    assert.match(pass.assetPath, /^\/assets\/member-passes\/.+\.webp$/);
  }
});

test("recommended member pass moves toward mythic when season access is already active", () => {
  assert.equal(getRecommendedVyntroMemberPass({ hasSeasonAccess: false }).id, "surge");
  assert.equal(getRecommendedVyntroMemberPass({ hasSeasonAccess: true }).id, "mythic");
  assert.equal(getVyntroMemberPass("spark").label, "Spark Pass");
});
