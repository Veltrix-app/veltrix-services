import assert from "node:assert/strict";
import test from "node:test";
import {
  PLATFORM_QUEST_PROJECT_ID,
  PLATFORM_QUESTS,
  getPlatformQuestBySlug,
  getShardBearingPlatformQuests,
} from "./platform-quest-catalog";
import {
  buildPlatformQuestEligibility,
  buildPlatformQuestShardSource,
  getUtcDayKey,
  getUtcWeekKey,
} from "./platform-quest-eligibility";

test("platform quest catalog uses the existing VYNTRO project and excludes duplicate social joins", () => {
  assert.equal(PLATFORM_QUEST_PROJECT_ID, "c0951cfd-b434-41d5-977d-813156934493");
  assert.equal(PLATFORM_QUESTS.some((quest) => quest.questType === "discord_join"), false);
  assert.equal(PLATFORM_QUESTS.some((quest) => quest.questType === "telegram_join"), false);
  assert.equal(getPlatformQuestBySlug("first-verified-swap")?.shardRewardAmount, 25);
});

test("platform quest catalog exposes only shard-bearing quests for shard claim routes", () => {
  const shardQuests = getShardBearingPlatformQuests();
  assert.deepEqual(
    shardQuests.map((quest) => [quest.slug, quest.shardRewardAmount]),
    [
      ["first-verified-swap", 25],
      ["daily-real-action", 3],
      ["weekly-activity-streak", 40],
      ["verified-invite", 20],
      ["first-lootbox-open", 15],
    ]
  );
});

test("platform quest eligibility unlocks only verified swap and blocks repeated lifetime claim", () => {
  const eligible = buildPlatformQuestEligibility({
    slug: "first-verified-swap",
    now: "2026-05-10T12:00:00.000Z",
    trustStatus: "active",
    sybilScore: 0,
    events: {
      confirmedSwapCount: 1,
      realActionsToday: 0,
      realActionsThisWeek: 0,
      activatedInvitesThisWeek: 0,
      openedLootboxCount: 0,
    },
    claimedSourceRefs: [],
  });
  assert.deepEqual(eligible, { ok: true, shardAmount: 25, windowKey: "lifetime" });

  const repeated = buildPlatformQuestEligibility({
    slug: "first-verified-swap",
    now: "2026-05-10T12:00:00.000Z",
    trustStatus: "active",
    sybilScore: 0,
    events: {
      confirmedSwapCount: 1,
      realActionsToday: 0,
      realActionsThisWeek: 0,
      activatedInvitesThisWeek: 0,
      openedLootboxCount: 0,
    },
    claimedSourceRefs: ["platform_quest:first-verified-swap:lifetime"],
  });
  assert.equal(repeated.ok, false);
  assert.equal(repeated.reason, "already-claimed");
});

test("platform quest eligibility applies daily and weekly windows", () => {
  assert.equal(getUtcDayKey("2026-05-10T23:59:00.000Z"), "2026-05-10");
  assert.equal(getUtcWeekKey("2026-05-10T12:00:00.000Z"), "2026-W19");

  const daily = buildPlatformQuestEligibility({
    slug: "daily-real-action",
    now: "2026-05-10T12:00:00.000Z",
    trustStatus: "active",
    sybilScore: 0,
    events: {
      confirmedSwapCount: 0,
      realActionsToday: 1,
      realActionsThisWeek: 1,
      activatedInvitesThisWeek: 0,
      openedLootboxCount: 0,
    },
    claimedSourceRefs: [],
  });
  assert.deepEqual(daily, { ok: true, shardAmount: 3, windowKey: "2026-05-10" });

  const weekly = buildPlatformQuestEligibility({
    slug: "weekly-activity-streak",
    now: "2026-05-10T12:00:00.000Z",
    trustStatus: "active",
    sybilScore: 0,
    events: {
      confirmedSwapCount: 0,
      realActionsToday: 1,
      realActionsThisWeek: 3,
      activatedInvitesThisWeek: 0,
      openedLootboxCount: 0,
    },
    claimedSourceRefs: [],
  });
  assert.deepEqual(weekly, { ok: true, shardAmount: 40, windowKey: "2026-W19" });
});

test("platform quest eligibility blocks review and high sybil accounts", () => {
  const result = buildPlatformQuestEligibility({
    slug: "weekly-activity-streak",
    now: "2026-05-10T12:00:00.000Z",
    trustStatus: "review",
    sybilScore: 91,
    events: {
      confirmedSwapCount: 0,
      realActionsToday: 1,
      realActionsThisWeek: 3,
      activatedInvitesThisWeek: 0,
      openedLootboxCount: 0,
    },
    claimedSourceRefs: [],
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "trust-blocked");
});

test("platform quest shard source is stable for dedupe", () => {
  assert.deepEqual(buildPlatformQuestShardSource("weekly-activity-streak", "2026-W19"), {
    sourceType: "platform_quest",
    sourceRef: "platform_quest:weekly-activity-streak:2026-W19",
    action: "claim",
  });
});
