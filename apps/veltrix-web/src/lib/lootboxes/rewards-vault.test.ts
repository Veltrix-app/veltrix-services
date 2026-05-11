import assert from "node:assert/strict";
import test from "node:test";
import { buildLootboxInventoryRead } from "./lootbox-inventory-read";
import { buildRewardsVaultView } from "./rewards-vault";

const rows = [
  {
    id: "claimable-title",
    item_type: "title",
    rarity: "legendary",
    label: "Shard Hunter Title",
    payload: { title: "Shard Hunter" },
    status: "owned",
    created_at: "2026-05-01T10:00:00.000Z",
    updated_at: null,
  },
  {
    id: "equipped-cosmetic",
    item_type: "profile_cosmetic",
    rarity: "epic",
    label: "Violet Aura",
    payload: { cosmetic: "Violet Aura", equipped: true },
    status: "claimed",
    created_at: "2026-05-02T10:00:00.000Z",
    updated_at: null,
  },
  {
    id: "review-pass",
    item_type: "season_access",
    rarity: "mythic",
    label: "Mythic Preview Key",
    payload: { window: "mythic-preview" },
    status: "pending_review",
    created_at: "2026-05-03T10:00:00.000Z",
    updated_at: null,
  },
];

test("buildRewardsVaultView exposes filter counts and prioritizes claimable rewards", () => {
  const view = buildRewardsVaultView(buildLootboxInventoryRead(rows), "all");

  assert.deepEqual(
    view.filters.map((filter) => [filter.id, filter.count]),
    [
      ["all", 3],
      ["claimable", 1],
      ["equipped", 1],
      ["rarity", 3],
      ["review", 1],
    ]
  );
  assert.equal(view.featuredItem?.id, "claimable-title");
  assert.equal(view.nextAction.label, "Claim reward");
  assert.equal(view.nextAction.tone, "claim");
});

test("buildRewardsVaultView filters equipped rare and review vault rows", () => {
  const read = buildLootboxInventoryRead(rows);

  assert.deepEqual(
    buildRewardsVaultView(read, "equipped").items.map((item) => item.id),
    ["equipped-cosmetic"]
  );
  assert.deepEqual(
    buildRewardsVaultView(read, "review").items.map((item) => item.id),
    ["review-pass"]
  );
  assert.deepEqual(
    buildRewardsVaultView(read, "rarity").items.map((item) => item.id),
    ["review-pass", "claimable-title", "equipped-cosmetic"]
  );
});

test("buildRewardsVaultView routes empty vaults back to shard earning", () => {
  const view = buildRewardsVaultView(buildLootboxInventoryRead([]), "all");

  assert.equal(view.featuredItem, null);
  assert.equal(view.nextAction.label, "Earn shards");
  assert.equal(view.nextAction.href, "/quests#quest-board");
  assert.equal(view.nextAction.tone, "earn");
});
