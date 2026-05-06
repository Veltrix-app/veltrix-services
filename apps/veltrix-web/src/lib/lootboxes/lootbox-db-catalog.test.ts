import assert from "node:assert/strict";
import test from "node:test";
import { getLootboxTier } from "./lootbox-catalog";
import { normalizeLootboxTierRows, type DbLootboxTierRow } from "./lootbox-db-catalog";

test("normalizes active lootbox tier rows from the database", () => {
  const rows: DbLootboxTierRow[] = [
    {
      id: "rare",
      label: "Rare Prime Box",
      price_shards: 900,
      asset_path: "/assets/lootboxes/rare-lootbox.webp",
      min_level: 4,
      featured_completions_required: null,
      requires_clean_trust: true,
      requires_season_window: false,
      odds: {
        common: "20",
        rare: 55,
        epic: 18,
        legendary: 6.5,
        mythic: 0.5,
      },
      active: true,
      sort_order: 20,
    },
  ];

  assert.deepEqual(normalizeLootboxTierRows(rows), [
    {
      id: "rare",
      label: "Rare Prime Box",
      priceShards: 900,
      assetPath: "/assets/lootboxes/rare-lootbox.webp",
      minLevel: 4,
      requiresCleanTrust: true,
      requiresSeasonWindow: false,
      odds: {
        common: 20,
        rare: 55,
        epic: 18,
        legendary: 6.5,
        mythic: 0.5,
      },
    },
  ]);
});

test("falls back to static tiers when database rows are empty or invalid", () => {
  const fallbackRare = getLootboxTier("rare");

  assert.equal(normalizeLootboxTierRows([]).find((tier) => tier.id === "rare"), fallbackRare);
  assert.equal(
    normalizeLootboxTierRows([
      {
        id: "rare",
        label: "",
        price_shards: -1,
        asset_path: "",
        min_level: null,
        featured_completions_required: null,
        requires_clean_trust: null,
        requires_season_window: null,
        odds: {},
        active: true,
        sort_order: 20,
      },
    ]).find((tier) => tier.id === "rare"),
    fallbackRare
  );
});
