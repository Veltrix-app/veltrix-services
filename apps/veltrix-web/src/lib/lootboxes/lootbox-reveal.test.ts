import assert from "node:assert/strict";
import test from "node:test";
import {
  getLootboxRevealAction,
  getLootboxRevealTone,
  normalizeLootboxRevealRarity,
} from "./lootbox-reveal";

test("normalizeLootboxRevealRarity falls back safely", () => {
  assert.equal(normalizeLootboxRevealRarity("MYTHIC"), "mythic");
  assert.equal(normalizeLootboxRevealRarity("unknown"), "common");
});

test("getLootboxRevealTone exposes rarity-specific reveal copy and classes", () => {
  const legendary = getLootboxRevealTone("legendary");

  assert.equal(legendary.rarity, "legendary");
  assert.match(legendary.headline, /Legendary/i);
  assert.match(legendary.badgeClass, /amber/);
  assert.match(legendary.buttonClass, /amber/);
});

test("getLootboxRevealAction routes utility and reward items to the vault", () => {
  assert.deepEqual(getLootboxRevealAction("profile_title"), {
    label: "Equip from vault",
    href: "#reward-vault",
    mode: "equip",
  });
  assert.deepEqual(getLootboxRevealAction("token_reward"), {
    label: "Request claim",
    href: "#reward-vault",
    mode: "claim",
  });
});
