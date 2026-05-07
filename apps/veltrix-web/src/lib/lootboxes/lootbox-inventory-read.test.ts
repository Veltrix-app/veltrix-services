import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxProfileCosmeticEquipPatch,
  buildLootboxInventoryClaimAuditPayload,
  buildLootboxInventoryRead,
  buildLootboxTitleEquipPatch,
  buildLootboxTitleProfilePatch,
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
    claimable: 0,
    pendingReview: 1,
    claimed: 1,
    highRarity: 2,
    autoApplied: 1,
    seasonAccess: 1,
  });
  assert.equal(read.items[1].statusLabel, "Access active");
  assert.equal(read.items[1].primaryActionLabel, "Pass armed");
  assert.equal(read.items[1].canRequestClaim, false);
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
      ["Active", "complete"],
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

test("buildLootboxInventoryRead exposes member-safe fulfillment activity and notes", () => {
  const read = buildLootboxInventoryRead([
    {
      id: "claimed-with-history",
      item_type: "title",
      rarity: "legendary",
      label: "Shard Hunter Title",
      payload: { title: "Shard Hunter" },
      status: "claimed",
      created_at: "2026-01-02T10:00:00.000Z",
      updated_at: "2026-01-02T13:00:00.000Z",
      auditTrail: [
        {
          id: "event-claim",
          action: "lootbox_inventory_claim_requested",
          summary: "Member requested fulfillment for Shard Hunter Title.",
          metadata: {
            previousStatus: "owned",
            nextStatus: "pending_review",
          },
          created_at: "2026-01-02T11:00:00.000Z",
        },
        {
          id: "event-note",
          action: "lootbox_inventory_note_added",
          summary: "Operator note added for Shard Hunter Title.",
          metadata: {
            note: "Wallet verified, preparing Discord role.",
            reference: "DIS-742",
          },
          created_at: "2026-01-02T12:00:00.000Z",
        },
        {
          id: "event-fulfilled",
          action: "lootbox_inventory_status_changed",
          summary: "Marked claimed for Shard Hunter Title.",
          metadata: {
            previousStatus: "pending_review",
            nextStatus: "claimed",
          },
          created_at: "2026-01-02T13:00:00.000Z",
        },
      ],
    },
  ]);
  const item = read.items[0];

  assert.deepEqual(
    item.fulfillment.events.map((event) => [event.label, event.detail]),
    [
      ["Fulfilled", "Marked claimed for Shard Hunter Title."],
      ["Operator note", "Wallet verified, preparing Discord role."],
      ["Claim requested", "Member requested fulfillment for Shard Hunter Title."],
    ]
  );
  assert.equal(item.fulfillment.latestNote?.note, "Wallet verified, preparing Discord role.");
  assert.equal(item.fulfillment.latestNote?.reference, "DIS-742");
});

test("buildLootboxInventoryRead exposes title equip utility state", () => {
  const read = buildLootboxInventoryRead([
    {
      id: "title-ready",
      item_type: "title",
      rarity: "legendary",
      label: "Shard Hunter Title",
      payload: { title: "Shard Hunter" },
      status: "claimed",
      created_at: "2026-01-02T10:00:00.000Z",
      updated_at: null,
    },
    {
      id: "title-equipped",
      item_type: "title",
      rarity: "mythic",
      label: "Vault Legend Title",
      payload: { title: "Vault Legend", equipped: true },
      status: "claimed",
      created_at: "2026-01-03T10:00:00.000Z",
      updated_at: "2026-01-03T11:00:00.000Z",
    },
  ]);
  const ready = read.items.find((item) => item.id === "title-ready");
  const equipped = read.items.find((item) => item.id === "title-equipped");

  assert.equal(ready?.utility.titleLabel, "Shard Hunter");
  assert.equal(ready?.utility.canEquipTitle, true);
  assert.equal(ready?.utility.isEquippedTitle, false);
  assert.equal(ready?.utility.equipActionLabel, "Equip title");
  assert.equal(equipped?.utility.titleLabel, "Vault Legend");
  assert.equal(equipped?.utility.canEquipTitle, false);
  assert.equal(equipped?.utility.isEquippedTitle, true);
  assert.equal(equipped?.utility.equipActionLabel, "Equipped");
});

test("buildLootboxInventoryRead exposes profile cosmetic equip utility state", () => {
  const read = buildLootboxInventoryRead([
    {
      id: "cosmetic-ready",
      item_type: "profile_cosmetic",
      rarity: "epic",
      label: "Violet Profile Aura",
      payload: { cosmetic: "Violet Aura" },
      status: "claimed",
      created_at: "2026-01-02T10:00:00.000Z",
      updated_at: null,
    },
    {
      id: "cosmetic-equipped",
      item_type: "profile_cosmetic",
      rarity: "mythic",
      label: "Shard Crown Frame",
      payload: { cosmetic: "Shard Crown", equipped: true },
      status: "claimed",
      created_at: "2026-01-03T10:00:00.000Z",
      updated_at: "2026-01-03T11:00:00.000Z",
    },
  ]);
  const ready = read.items.find((item) => item.id === "cosmetic-ready");
  const equipped = read.items.find((item) => item.id === "cosmetic-equipped");

  assert.equal(ready?.utility.cosmeticLabel, "Violet Aura");
  assert.equal(ready?.utility.canEquipCosmetic, true);
  assert.equal(ready?.utility.isEquippedCosmetic, false);
  assert.equal(ready?.utility.cosmeticActionLabel, "Equip cosmetic");
  assert.equal(equipped?.utility.cosmeticLabel, "Shard Crown");
  assert.equal(equipped?.utility.canEquipCosmetic, false);
  assert.equal(equipped?.utility.isEquippedCosmetic, true);
  assert.equal(equipped?.utility.cosmeticActionLabel, "Equipped");
});

test("buildLootboxInventoryRead exposes active season access utility state", () => {
  const read = buildLootboxInventoryRead([
    {
      id: "season-access",
      item_type: "season_access",
      rarity: "mythic",
      label: "Mythic Preview Key",
      payload: { window: "mythic-preview" },
      status: "owned",
      created_at: "2026-01-03T10:00:00.000Z",
      updated_at: null,
    },
  ]);
  const item = read.items[0];

  assert.equal(read.summary.seasonAccess, 1);
  assert.equal(item.utility.isSeasonAccess, true);
  assert.equal(item.utility.seasonAccessLabel, "Mythic Preview");
  assert.equal(item.utility.seasonAccessWindow, "mythic-preview");
  assert.equal(item.utility.isActiveSeasonAccess, true);
  assert.equal(item.utility.seasonAccessActionLabel, "Access active");
});

test("buildLootboxTitleEquipPatch preserves title payload while toggling equipped state", () => {
  const now = "2026-01-04T10:00:00.000Z";

  assert.deepEqual(
    buildLootboxTitleEquipPatch({
      payload: { title: "Shard Hunter", cosmetic: "violet-glow" },
      equipped: true,
      now,
    }),
    {
      payload: {
        title: "Shard Hunter",
        cosmetic: "violet-glow",
        equipped: true,
        equippedAt: now,
      },
      updated_at: now,
    }
  );
  assert.deepEqual(buildLootboxTitleProfilePatch("Shard Hunter"), {
    title: "Shard Hunter",
  });
});

test("buildLootboxProfileCosmeticEquipPatch preserves cosmetic payload while toggling equipped state", () => {
  const now = "2026-01-04T10:00:00.000Z";

  assert.deepEqual(
    buildLootboxProfileCosmeticEquipPatch({
      payload: { cosmetic: "Violet Aura", intensity: "high" },
      equipped: true,
      now,
    }),
    {
      payload: {
        cosmetic: "Violet Aura",
        intensity: "high",
        equipped: true,
        equippedAt: now,
      },
      updated_at: now,
    }
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
