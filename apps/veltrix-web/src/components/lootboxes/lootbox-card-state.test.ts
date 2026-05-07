import assert from "node:assert/strict";
import test from "node:test";
import { getLootboxOpenAvailability } from "./lootbox-card-state";

test("getLootboxOpenAvailability keeps locked tiers unavailable with the lock reason", () => {
  assert.deepEqual(
    getLootboxOpenAvailability({
      busy: false,
      priceShards: 750,
      shardBalance: 5000,
      eligibility: { unlocked: false, reason: "Reach level 3 first." },
    }),
    {
      canOpen: false,
      cta: "Locked",
      helperText: "Reach level 3 first.",
      shortfall: 0,
    }
  );
});

test("getLootboxOpenAvailability blocks tiers when the shard balance is short", () => {
  assert.deepEqual(
    getLootboxOpenAvailability({
      busy: false,
      priceShards: 750,
      shardBalance: 625,
      eligibility: { unlocked: true, reason: null },
    }),
    {
      canOpen: false,
      cta: "Need shards",
      helperText: "Need 125 more shards.",
      shortfall: 125,
    }
  );
});

test("getLootboxOpenAvailability allows unlocked affordable tiers", () => {
  assert.deepEqual(
    getLootboxOpenAvailability({
      busy: false,
      priceShards: 750,
      shardBalance: 750,
      eligibility: { unlocked: true, reason: null },
    }),
    {
      canOpen: true,
      cta: "Open box",
      helperText: "Ready to open.",
      shortfall: 0,
    }
  );
});

test("getLootboxOpenAvailability shows opening state while a tier is busy", () => {
  assert.deepEqual(
    getLootboxOpenAvailability({
      busy: true,
      priceShards: 750,
      shardBalance: 1000,
      eligibility: { unlocked: true, reason: null },
    }),
    {
      canOpen: false,
      cta: "Opening...",
      helperText: "Ready to open.",
      shortfall: 0,
    }
  );
});
