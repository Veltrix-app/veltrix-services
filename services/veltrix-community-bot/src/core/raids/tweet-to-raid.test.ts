import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTweetToRaidDecision,
  normalizeXUsername,
  summarizeTweetForRaid,
} from "./tweet-to-raid.js";

const baseSource = {
  id: "source-1",
  projectId: "project-1",
  projectName: "Chainwars",
  projectSlug: "chainwars",
  xAccountId: "42",
  xUsername: "ChainwarsHQ",
  mode: "review" as const,
  status: "active" as const,
  requiredHashtags: ["VYNTRO"],
  excludeReplies: true,
  excludeReposts: true,
  cooldownMinutes: 30,
  maxRaidsPerDay: 6,
  defaultRewardXp: 50,
  defaultDurationMinutes: 1440,
  defaultCampaignId: "campaign-1",
  defaultButtonLabel: "Open raid",
  defaultArtworkUrl: "https://example.com/banner.png",
};

const basePost = {
  id: "tweet-1",
  authorId: "42",
  username: "chainwarshq",
  text: "New boss raid is live. Join now. #VYNTRO",
  url: "https://x.com/ChainwarsHQ/status/tweet-1",
  mediaUrls: ["https://example.com/tweet.png"],
  createdAt: "2026-04-27T10:00:00.000Z",
  isReply: false,
  isRepost: false,
};

test("normalizeXUsername removes handles and lowercases", () => {
  assert.equal(normalizeXUsername("@ChainwarsHQ "), "chainwarshq");
});

test("summarizeTweetForRaid keeps the first readable sentence", () => {
  assert.equal(
    summarizeTweetForRaid("  New boss raid is live. Join now and bring your guild.  ", "Chainwars"),
    "New boss raid is live"
  );
});

test("review mode creates a candidate decision with a clamped draft", () => {
  const decision = buildTweetToRaidDecision({
    source: { ...baseSource, defaultRewardXp: 999 },
    post: basePost,
    alreadyIngested: false,
    dailyCreatedRaidCount: 0,
    lastCreatedRaidAt: null,
    now: new Date("2026-04-27T10:05:00.000Z"),
  });

  assert.equal(decision.action, "create_candidate");
  assert.equal(decision.reason, "review_mode");
  assert.equal(decision.draft.title, "New boss raid is live");
  assert.equal(decision.draft.rewardXp, 100);
  assert.equal(decision.draft.sourceUrl, basePost.url);
  assert.equal(decision.draft.instructions.length, 3);
});

test("auto-live mode creates an active raid decision", () => {
  const decision = buildTweetToRaidDecision({
    source: { ...baseSource, mode: "auto_live" },
    post: basePost,
    alreadyIngested: false,
    dailyCreatedRaidCount: 0,
    lastCreatedRaidAt: null,
    now: new Date("2026-04-27T10:05:00.000Z"),
  });

  assert.equal(decision.action, "create_raid");
  assert.equal(decision.reason, "auto_live");
  assert.equal(decision.draft.endsAt, "2026-04-28T10:05:00.000Z");
});

test("duplicate posts are skipped", () => {
  const decision = buildTweetToRaidDecision({
    source: baseSource,
    post: basePost,
    alreadyIngested: true,
    dailyCreatedRaidCount: 0,
    lastCreatedRaidAt: null,
    now: new Date("2026-04-27T10:05:00.000Z"),
  });

  assert.equal(decision.action, "skip");
  assert.equal(decision.reason, "duplicate_post");
});

test("required hashtags are enforced case-insensitively", () => {
  const decision = buildTweetToRaidDecision({
    source: baseSource,
    post: { ...basePost, text: "New boss raid is live." },
    alreadyIngested: false,
    dailyCreatedRaidCount: 0,
    lastCreatedRaidAt: null,
    now: new Date("2026-04-27T10:05:00.000Z"),
  });

  assert.equal(decision.action, "skip");
  assert.equal(decision.reason, "missing_required_hashtag");
});

test("cooldown and daily cap stop noisy auto creation", () => {
  const cooldownDecision = buildTweetToRaidDecision({
    source: { ...baseSource, mode: "auto_live" },
    post: basePost,
    alreadyIngested: false,
    dailyCreatedRaidCount: 0,
    lastCreatedRaidAt: "2026-04-27T09:45:00.000Z",
    now: new Date("2026-04-27T10:05:00.000Z"),
  });

  assert.equal(cooldownDecision.action, "skip");
  assert.equal(cooldownDecision.reason, "cooldown_active");

  const dailyCapDecision = buildTweetToRaidDecision({
    source: { ...baseSource, mode: "auto_live", maxRaidsPerDay: 2 },
    post: basePost,
    alreadyIngested: false,
    dailyCreatedRaidCount: 2,
    lastCreatedRaidAt: null,
    now: new Date("2026-04-27T10:05:00.000Z"),
  });

  assert.equal(dailyCapDecision.action, "skip");
  assert.equal(dailyCapDecision.reason, "daily_cap_reached");
});
