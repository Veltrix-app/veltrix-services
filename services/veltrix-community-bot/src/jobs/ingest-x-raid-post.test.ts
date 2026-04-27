import test from "node:test";
import assert from "node:assert/strict";

import { buildTweetToRaidDecision } from "../core/raids/tweet-to-raid.js";

const baseSource = {
  id: "source-1",
  projectId: "project-1",
  projectName: "Chainwars",
  projectSlug: "chainwars",
  xAccountId: null,
  xUsername: "chainwarshq",
  status: "active" as const,
  requiredHashtags: [],
  excludeReplies: true,
  excludeReposts: true,
  cooldownMinutes: 0,
  maxRaidsPerDay: 6,
  defaultRewardXp: 50,
  defaultDurationMinutes: 60,
  defaultCampaignId: null,
  defaultButtonLabel: "Open raid",
  defaultArtworkUrl: null,
};

const basePost = {
  authorId: null,
  username: "chainwarshq",
  text: "Guild push starts now.",
  mediaUrls: [],
  createdAt: null,
  isReply: false,
  isRepost: false,
};

test("tweet-to-raid job uses review mode to create a candidate decision", () => {
  const decision = buildTweetToRaidDecision({
    source: { ...baseSource, mode: "review" },
    post: {
      ...basePost,
      id: "post-1",
      url: "https://x.com/chainwarshq/status/post-1",
    },
    alreadyIngested: false,
    dailyCreatedRaidCount: 0,
    lastCreatedRaidAt: null,
    now: new Date("2026-04-27T10:00:00.000Z"),
  });

  assert.equal(decision.action, "create_candidate");
  assert.equal(decision.draft.endsAt, "2026-04-27T11:00:00.000Z");
});

test("tweet-to-raid job uses auto-live mode to create an active raid decision", () => {
  const decision = buildTweetToRaidDecision({
    source: { ...baseSource, mode: "auto_live" },
    post: {
      ...basePost,
      id: "post-2",
      url: "https://x.com/chainwarshq/status/post-2",
    },
    alreadyIngested: false,
    dailyCreatedRaidCount: 0,
    lastCreatedRaidAt: null,
    now: new Date("2026-04-27T10:00:00.000Z"),
  });

  assert.equal(decision.action, "create_raid");
  assert.equal(decision.reason, "auto_live");
});
