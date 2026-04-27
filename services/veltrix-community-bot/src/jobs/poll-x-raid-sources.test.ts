import test from "node:test";
import assert from "node:assert/strict";

import { buildXRaidPollMetadata } from "./poll-x-raid-sources.js";

test("builds successful X raid poll metadata without dropping existing metadata", () => {
  const metadata = buildXRaidPollMetadata({
    existingMetadata: { ownerNote: "keep-me" },
    status: "success",
    polledAt: "2026-04-27T10:00:00.000Z",
    fetchedPostCount: 3,
    processedPostCount: 2,
    createdRaidCount: 1,
    createdCandidateCount: 1,
    skippedCount: 1,
    newestPostId: "200",
  });

  assert.deepEqual(metadata, {
    ownerNote: "keep-me",
    lastPollAt: "2026-04-27T10:00:00.000Z",
    lastPollStatus: "success",
    lastPollError: null,
    lastPollFetchedPostCount: 3,
    lastPollProcessedPostCount: 2,
    lastPollCreatedRaidCount: 1,
    lastPollCreatedCandidateCount: 1,
    lastPollSkippedCount: 1,
    lastSeenPostId: "200",
  });
});

test("builds failed X raid poll metadata with a readable error", () => {
  const metadata = buildXRaidPollMetadata({
    existingMetadata: { lastSeenPostId: "199" },
    status: "failed",
    polledAt: "2026-04-27T10:05:00.000Z",
    error: "X API credentials are missing.",
  });

  assert.equal(metadata.lastPollStatus, "failed");
  assert.equal(metadata.lastPollError, "X API credentials are missing.");
  assert.equal(metadata.lastSeenPostId, "199");
});
