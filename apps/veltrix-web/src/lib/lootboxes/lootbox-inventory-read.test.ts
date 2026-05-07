import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxInventoryClaimAuditPayload,
  buildLootboxInventoryRead,
  canRequestLootboxInventoryClaim,
} from "./lootbox-inventory-read";

const inventoryRows = [
  {
    id: "claimed-1",
    item_type: "profile_cosmetic",
    rarity: "rare",
    label: "Profile Glow",
    payload: { cosmetic: "profile-glow" },
    status: "claimed",
    created_at: "2026-01-01T10:00:00.000Z",
    updated_at: "2026-01-02T10:00:00.000Z",
  },
  {
    id: "owned-1",
    item_type: "season_access",
    rarity: "mythic",
    label: "Mythic Preview Key",
    payload: { window: "mythic-preview" },
    status: "owned",
    created_at: "2026-01-03T10:00:00.000Z",
    updated_at: null,
  },
  {
    id: "refund-1",
    item_type: "shard_refund_percent",
    rarity: "rare",
    label: "25 Percent Shard Refund",
    payload: { refundPercent: 25 },
    status: "owned",
    created_at: "2026-01-04T10:00:00.000Z",
    updated_at: null,
  },
  {
    id: "review-1",
    item_type: "title",
    rarity: "legendary",
    label: "Raid Catalyst Title",
    payload: { title: "Raid Catalyst" },
    status: "pending_review",
    created_at: "2026-01-02T10:00:00.000Z",
    updated_at: "2026-01-02T11:00:00.000Z",
  },
];

test("buildLootboxInventoryRead prioritizes claim flow rows before passive rewards", () => {
  const read = buildLootboxInventoryRead(inventoryRows);

  assert.deepEqual(
    read.items.map((item) => item.id),
    ["review-1", "owned-1", "refund-1", "claimed-1"]
  );
  assert.deepEqual(read.summary, {
    total: 4,
    claimable: 1,
    pendingReview: 1,
    claimed: 1,
    highRarity: 2,
    autoApplied: 1,
  });
  assert.equal(read.items[1].statusLabel, "Ready to claim");
  assert.equal(read.items[1].primaryActionLabel, "Request fulfillment");
  assert.equal(read.items[1].canRequestClaim, true);
  assert.equal(read.items[2].statusLabel, "Applied");
  assert.equal(read.items[2].primaryActionLabel, "Refund applied");
  assert.equal(read.items[2].canRequestClaim, false);
  assert.equal(read.items[3].fulfillment.nextStep, "Reward has been fulfilled.");
});

test("buildLootboxInventoryRead explains the member fulfillment timeline per status", () => {
  const read = buildLootboxInventoryRead(inventoryRows);
  const ready = read.items.find((item) => item.id === "owned-1");
  const review = read.items.find((item) => item.id === "review-1");
  const claimed = read.items.find((item) => item.id === "claimed-1");
  const refund = read.items.find((item) => item.id === "refund-1");

  assert.deepEqual(
    ready?.fulfillment.timeline.map((step) => [step.label, step.state]),
    [
      ["Unlocked", "complete"],
      ["Ready", "current"],
      ["Fulfilled", "pending"],
    ]
  );
  assert.deepEqual(
    review?.fulfillment.timeline.map((step) => [step.label, step.state]),
    [
      ["Unlocked", "complete"],
      ["Queued", "current"],
      ["Fulfilled", "pending"],
    ]
  );
  assert.deepEqual(
    claimed?.fulfillment.timeline.map((step) => [step.label, step.state]),
    [
      ["Unlocked", "complete"],
      ["Queued", "complete"],
      ["Fulfilled", "complete"],
    ]
  );
  assert.deepEqual(
    refund?.fulfillment.timeline.map((step) => [step.label, step.state]),
    [
      ["Unlocked", "complete"],
      ["Applied", "complete"],
    ]
  );
});

test("canRequestLootboxInventoryClaim only allows owned manual rewards", () => {
  assert.equal(canRequestLootboxInventoryClaim({ status: "owned", item_type: "title" }), true);
  assert.equal(
    canRequestLootboxInventoryClaim({ status: "owned", item_type: "shard_refund_percent" }),
    false
  );
  assert.equal(
    canRequestLootboxInventoryClaim({ status: "pending_review", item_type: "title" }),
    false
  );
});

test("buildLootboxInventoryClaimAuditPayload records a member claim request for portal operators", () => {
  assert.deepEqual(
    buildLootboxInventoryClaimAuditPayload({
      authUserId: "member-123",
      inventoryItem: {
        id: "owned-1",
        auth_user_id: "member-123",
        label: "Mythic Preview Key",
        status: "owned",
      },
    }),
    {
      auth_user_id: "member-123",
      project_id: null,
      source_table: "user_inventory",
      source_id: "owned-1",
      action: "lootbox_inventory_claim_requested",
      summary: "Member requested fulfillment for Mythic Preview Key.",
      metadata: {
        inventoryItemId: "owned-1",
        targetAuthUserId: "member-123",
        previousStatus: "owned",
        nextStatus: "pending_review",
        origin: "webapp",
      },
    }
  );
});
