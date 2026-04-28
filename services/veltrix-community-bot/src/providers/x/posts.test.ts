import test from "node:test";
import assert from "node:assert/strict";

import {
  formatXApiRequestError,
  mapXSingleTweetResponseToRaidPost,
  mapXTimelineResponseToRaidPosts,
} from "./posts.js";

test("maps X timeline responses into tweet-to-raid posts with media and source URLs", () => {
  const posts = mapXTimelineResponseToRaidPosts(
    {
      data: [
        {
          id: "181",
          author_id: "42",
          text: "Boss raid is live. Join the push. #VYNTRO",
          created_at: "2026-04-27T10:00:00.000Z",
          attachments: {
            media_keys: ["3_abc", "3_def"],
          },
        },
      ],
      includes: {
        media: [
          { media_key: "3_abc", type: "photo", url: "https://cdn.example/raid.png" },
          {
            media_key: "3_def",
            type: "video",
            preview_image_url: "https://cdn.example/raid-preview.png",
          },
        ],
      },
    },
    "ChainwarsHQ"
  );

  assert.deepEqual(posts, [
    {
      id: "181",
      authorId: "42",
      username: "chainwarshq",
      text: "Boss raid is live. Join the push. #VYNTRO",
      url: "https://x.com/chainwarshq/status/181",
      mediaUrls: ["https://cdn.example/raid.png", "https://cdn.example/raid-preview.png"],
      createdAt: "2026-04-27T10:00:00.000Z",
      isReply: false,
      isRepost: false,
      replyToPostId: null,
    },
  ]);
});

test("marks replies and reposts from X referenced tweets", () => {
  const posts = mapXTimelineResponseToRaidPosts(
    {
      data: [
        {
          id: "182",
          text: "Reply with your squad.",
          referenced_tweets: [{ type: "replied_to", id: "180" }],
        },
        {
          id: "183",
          text: "Reposting partner raid.",
          referenced_tweets: [{ type: "retweeted", id: "179" }],
        },
      ],
    },
    "@ChainwarsHQ"
  );

  assert.equal(posts[0]?.isReply, true);
  assert.equal(posts[0]?.replyToPostId, "180");
  assert.equal(posts[0]?.isRepost, false);
  assert.equal(posts[1]?.isReply, false);
  assert.equal(posts[1]?.replyToPostId, null);
  assert.equal(posts[1]?.isRepost, true);
});

test("formats X API payment errors into an operator action", () => {
  assert.equal(
    formatXApiRequestError({
      status: 402,
      payload: null,
      fallback: "X API request failed.",
    }),
    "X API request failed with 402. Add X API credits or enable pay-per-use billing for the app that owns X_API_BEARER_TOKEN."
  );
});

test("maps a single X tweet response into a raid post", () => {
  const post = mapXSingleTweetResponseToRaidPost(
    {
      data: {
        id: "123",
        author_id: "42",
        text: "Raid this launch #vyntro",
        created_at: "2026-04-28T10:00:00.000Z",
        attachments: { media_keys: ["3_abc"] },
      },
      includes: {
        users: [{ id: "42", username: "VYNTRO_" }],
        media: [{ media_key: "3_abc", type: "photo", url: "https://cdn.example/raid.png" }],
      },
    },
    "fallback"
  );

  assert.deepEqual(post, {
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
  });
});
