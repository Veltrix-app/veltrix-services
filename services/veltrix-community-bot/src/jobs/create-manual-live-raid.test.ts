import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFallbackXPostForManualRaid,
  buildManualLiveRaidDraft,
  isManualRaidDuplicateReason,
  shouldUseManualXPostFallback,
} from "./create-manual-live-raid.js";

test("builds a manual live raid draft from a fetched X post", () => {
  const draft = buildManualLiveRaidDraft({
    projectName: "Chainwars",
    post: {
      id: "123",
      authorId: "42",
      username: "vyntro_",
      text: "Raid this launch #vyntro",
      url: "https://x.com/vyntro_/status/123",
      mediaUrls: ["https://cdn.example/raid.png"],
      createdAt: "2026-04-28T10:00:00.000Z",
      isReply: false,
      isRepost: false,
      replyToPostId: null,
    },
    defaults: {
      rewardXp: 50,
      durationMinutes: 1440,
      campaignId: "campaign-1",
      buttonLabel: "Open raid",
      artworkUrl: null,
    },
    overrides: {
      rewardXp: 80,
      durationMinutes: 120,
    },
    now: new Date("2026-04-28T10:00:00.000Z"),
  });

  assert.equal(draft.rewardXp, 80);
  assert.equal(draft.endsAt, "2026-04-28T12:00:00.000Z");
  assert.equal(draft.campaignId, "campaign-1");
  assert.equal(draft.banner, "https://cdn.example/raid.png");
});

test("marks duplicate reasons as safe command replies", () => {
  assert.equal(isManualRaidDuplicateReason("duplicate_post"), true);
  assert.equal(isManualRaidDuplicateReason("x_api_failed"), false);
});

test("builds a fallback X post for manual raids when API reads are unavailable", () => {
  assert.deepEqual(
    buildFallbackXPostForManualRaid({ username: "vyntro_", postId: "2049196117066215893" }),
    {
      id: "2049196117066215893",
      authorId: null,
      username: "vyntro_",
      text: "Raid @vyntro_'s X post.",
      url: "https://x.com/vyntro_/status/2049196117066215893",
      mediaUrls: [],
      createdAt: null,
      isReply: false,
      isRepost: false,
      replyToPostId: null,
    }
  );
});

test("manual raids can fall back on X API billing or permission failures", () => {
  assert.equal(shouldUseManualXPostFallback(new Error("X API request failed with 402.")), true);
  assert.equal(shouldUseManualXPostFallback(new Error("X post could not be found.")), false);
});
