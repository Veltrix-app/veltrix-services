import { env } from "../config/env.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { ingestXRaidPost } from "./ingest-x-raid-post.js";
import { fetchRecentPostsForXUsername, type XRaidPost } from "../providers/x/posts.js";

export type PollXRaidSourcesInput = {
  projectId?: string;
  sourceId?: string;
  limit?: number;
};

type PollMetadataStatus = "success" | "partial_failure" | "failed" | "skipped";

type XRaidSourcePollRow = {
  id: string;
  project_id: string;
  x_username: string;
  x_account_id: string | null;
  status: "active" | "paused" | "blocked";
  metadata: Record<string, unknown> | null;
};

type BuildPollMetadataInput = {
  existingMetadata?: Record<string, unknown> | null;
  status: PollMetadataStatus;
  polledAt: string;
  error?: string | null;
  fetchedPostCount?: number;
  processedPostCount?: number;
  createdRaidCount?: number;
  createdCandidateCount?: number;
  skippedCount?: number;
  newestPostId?: string | null;
};

function asMetadata(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getPostSortValue(post: XRaidPost) {
  if (post.createdAt) {
    const timestamp = Date.parse(post.createdAt);
    if (Number.isFinite(timestamp)) return BigInt(timestamp);
  }

  try {
    return BigInt(post.id);
  } catch {
    return BigInt(0);
  }
}

function getNewestPostId(posts: XRaidPost[]) {
  return posts
    .slice()
    .sort((a, b) => (getPostSortValue(a) > getPostSortValue(b) ? -1 : 1))[0]?.id ?? null;
}

function getReadableError(error: unknown) {
  return error instanceof Error ? error.message : "X raid source poll failed.";
}

export function buildXRaidPollMetadata(input: BuildPollMetadataInput) {
  const existingMetadata = asMetadata(input.existingMetadata);
  const newestPostId = input.newestPostId || readString(existingMetadata.lastSeenPostId);

  return {
    ...existingMetadata,
    lastPollAt: input.polledAt,
    lastPollStatus: input.status,
    lastPollError: input.error || null,
    lastPollFetchedPostCount: input.fetchedPostCount ?? 0,
    lastPollProcessedPostCount: input.processedPostCount ?? 0,
    lastPollCreatedRaidCount: input.createdRaidCount ?? 0,
    lastPollCreatedCandidateCount: input.createdCandidateCount ?? 0,
    lastPollSkippedCount: input.skippedCount ?? 0,
    ...(newestPostId ? { lastSeenPostId: newestPostId } : {}),
  };
}

async function loadPollSources(input: PollXRaidSourcesInput) {
  let query = supabaseAdmin
    .from("x_raid_sources")
    .select("id, project_id, x_username, x_account_id, status, metadata")
    .eq("status", "active")
    .order("updated_at", { ascending: true })
    .limit(Math.min(100, Math.max(1, input.limit ?? 25)));

  if (input.projectId) {
    query = query.eq("project_id", input.projectId);
  }

  if (input.sourceId) {
    query = query.eq("id", input.sourceId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as XRaidSourcePollRow[];
}

async function updateSourcePollState(params: {
  source: XRaidSourcePollRow;
  metadata: Record<string, unknown>;
  xAccountId?: string | null;
}) {
  const { error } = await supabaseAdmin
    .from("x_raid_sources")
    .update({
      metadata: params.metadata,
      ...(params.xAccountId ? { x_account_id: params.xAccountId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.source.id);

  if (error) throw error;
}

export async function pollXRaidSourcesJob(input: PollXRaidSourcesInput = {}) {
  const sources = await loadPollSources(input);
  const polledAt = new Date().toISOString();

  if (sources.length === 0) {
    return {
      ok: true,
      status: "skipped" as const,
      reason: "no_active_sources",
      sourceCount: 0,
      results: [],
    };
  }

  if (!env.X_API_BEARER_TOKEN) {
    const results = await Promise.all(
      sources.map(async (source) => {
        const metadata = buildXRaidPollMetadata({
          existingMetadata: source.metadata,
          status: "failed",
          polledAt,
          error: "X_API_BEARER_TOKEN is missing on the community bot deployment.",
        });
        await updateSourcePollState({ source, metadata });
        return {
          sourceId: source.id,
          username: source.x_username,
          status: "failed" as const,
          error: metadata.lastPollError,
        };
      })
    );

    return {
      ok: false,
      status: "failed" as const,
      reason: "missing_x_api_bearer_token",
      sourceCount: sources.length,
      results,
    };
  }

  const results = [];
  for (const source of sources) {
    try {
      const existingMetadata = asMetadata(source.metadata);
      const sinceId = readString(existingMetadata.lastSeenPostId) || null;
      const fetched = await fetchRecentPostsForXUsername({
        username: source.x_username,
        bearerToken: env.X_API_BEARER_TOKEN,
        sinceId,
        limit: 10,
      });
      const posts = fetched.posts
        .slice()
        .sort((a, b) => (getPostSortValue(a) > getPostSortValue(b) ? 1 : -1));
      let createdRaidCount = 0;
      let createdCandidateCount = 0;
      let skippedCount = 0;
      let failedPostCount = 0;

      for (const post of posts) {
        try {
          const ingestResult = await ingestXRaidPost({
            projectId: source.project_id,
            sourceId: source.id,
            post,
          });

          if (ingestResult.status === "created_raid") createdRaidCount += 1;
          if (ingestResult.status === "created_candidate") createdCandidateCount += 1;
          if (ingestResult.status === "skipped") skippedCount += 1;
        } catch {
          failedPostCount += 1;
        }
      }

      const status: PollMetadataStatus = failedPostCount > 0 ? "partial_failure" : "success";
      const newestPostId = getNewestPostId(posts);
      const metadata = buildXRaidPollMetadata({
        existingMetadata,
        status,
        polledAt,
        error: failedPostCount > 0 ? `${failedPostCount} post(s) failed during ingest.` : null,
        fetchedPostCount: fetched.posts.length,
        processedPostCount: posts.length,
        createdRaidCount,
        createdCandidateCount,
        skippedCount,
        newestPostId,
      });
      await updateSourcePollState({
        source,
        metadata,
        xAccountId: fetched.user.id,
      });

      results.push({
        sourceId: source.id,
        username: fetched.user.username,
        status,
        fetchedPostCount: fetched.posts.length,
        processedPostCount: posts.length,
        createdRaidCount,
        createdCandidateCount,
        skippedCount,
        failedPostCount,
        newestPostId,
      });
    } catch (error) {
      const readableError = getReadableError(error);
      const metadata = buildXRaidPollMetadata({
        existingMetadata: source.metadata,
        status: "failed",
        polledAt,
        error: readableError,
      });
      await updateSourcePollState({ source, metadata });
      results.push({
        sourceId: source.id,
        username: source.x_username,
        status: "failed" as const,
        error: readableError,
      });
    }
  }

  const failedCount = results.filter((result) => result.status === "failed").length;
  const partialCount = results.filter((result) => result.status === "partial_failure").length;

  return {
    ok: failedCount === 0 && partialCount === 0,
    status: failedCount > 0 ? "partial_failure" : partialCount > 0 ? "partial_failure" : "success",
    sourceCount: sources.length,
    failedCount,
    partialCount,
    results,
  };
}
