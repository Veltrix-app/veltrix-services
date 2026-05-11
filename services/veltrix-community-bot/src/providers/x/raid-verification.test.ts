import test from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service-role-key";
process.env.VERIFICATION_CALLBACK_URL ??= "https://example.com/callback";
process.env.VERIFICATION_CALLBACK_SECRET ??= "callback-secret";

const {
  doesXPostProveRaidEngagement,
  resolveXRaidSourcePost,
} = await import("./raid-verification.js");

test("resolves an X raid source post from external id before URL", () => {
  assert.deepEqual(
    resolveXRaidSourcePost({
      source_external_id: "123",
      source_url: "https://x.com/vyntro_/status/999",
    }),
    {
      postId: "123",
      canonicalUrl: "https://x.com/i/status/123",
    }
  );
});

test("approves a connected user's reply to the source post", () => {
  assert.equal(
    doesXPostProveRaidEngagement({
      sourcePostId: "123",
      sourceUrl: "https://x.com/vyntro_/status/123",
      post: {
        id: "456",
        authorId: "user-1",
        username: "jordi",
        text: "done",
        url: "https://x.com/jordi/status/456",
        mediaUrls: [],
        createdAt: null,
        isReply: true,
        isRepost: false,
        replyToPostId: "123",
      },
    }),
    true
  );
});

test("approves a quote or source-link mention to the source post", () => {
  assert.equal(
    doesXPostProveRaidEngagement({
      sourcePostId: "123",
      sourceUrl: "https://x.com/vyntro_/status/123",
      post: {
        id: "789",
        authorId: "user-1",
        username: "jordi",
        text: "Check this https://x.com/vyntro_/status/123",
        url: "https://x.com/jordi/status/789",
        mediaUrls: [],
        createdAt: null,
        isReply: false,
        isRepost: false,
        replyToPostId: null,
      },
    }),
    true
  );
});

test("rejects unrelated recent X activity", () => {
  assert.equal(
    doesXPostProveRaidEngagement({
      sourcePostId: "123",
      sourceUrl: "https://x.com/vyntro_/status/123",
      post: {
        id: "999",
        authorId: "user-1",
        username: "jordi",
        text: "unrelated",
        url: "https://x.com/jordi/status/999",
        mediaUrls: [],
        createdAt: null,
        isReply: false,
        isRepost: false,
        replyToPostId: null,
      },
    }),
    false
  );
});
