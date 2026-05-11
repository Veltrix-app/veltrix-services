import { env } from "../../config/env.js";
import { parseXStatusUrl } from "../../core/raids/x-post-url.js";
import { supabaseAdmin } from "../../lib/supabase.js";
import {
  fetchRecentPostsForXUsername,
  type XRaidPost,
} from "./posts.js";

type RaidRow = {
  id: string;
  title: string | null;
  project_id: string | null;
  source_provider: string | null;
  source_url: string | null;
  source_external_id: string | null;
};

type ConnectedXAccountRow = {
  provider_user_id: string | null;
  username: string | null;
  status: string | null;
};

export function resolveXRaidSourcePost(raid: {
  source_external_id: string | null;
  source_url: string | null;
}) {
  const externalId = raid.source_external_id?.trim();
  if (externalId && /^[0-9]+$/.test(externalId)) {
    return {
      postId: externalId,
      canonicalUrl: `https://x.com/i/status/${externalId}`,
    };
  }

  if (raid.source_url) {
    const parsed = parseXStatusUrl(raid.source_url);
    if (parsed.ok) {
      return {
        postId: parsed.postId,
        canonicalUrl: parsed.canonicalUrl,
      };
    }
  }

  return null;
}

function normalizeUrlForText(value: string) {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return value.trim().replace(/\/$/, "").toLowerCase();
  }
}

export function doesXPostProveRaidEngagement(params: {
  post: XRaidPost;
  sourcePostId: string;
  sourceUrl: string;
}) {
  const text = params.post.text.toLowerCase();
  const sourceUrl = normalizeUrlForText(params.sourceUrl);
  const twitterSourceUrl = sourceUrl.replace("https://x.com/", "https://twitter.com/");

  return (
    params.post.replyToPostId === params.sourcePostId ||
    (params.post.isRepost && params.post.text.includes(params.sourcePostId)) ||
    text.includes(params.sourcePostId) ||
    normalizeUrlForText(text).includes(sourceUrl) ||
    normalizeUrlForText(text).includes(twitterSourceUrl)
  );
}

async function insertRaidVerificationEvent(params: {
  authUserId: string;
  raid: RaidRow;
  eventType: string;
  externalRef: string | null;
  metadata: Record<string, unknown>;
}) {
  await supabaseAdmin.from("verification_events").insert({
    auth_user_id: params.authUserId,
    project_id: params.raid.project_id ?? null,
    quest_id: null,
    provider: "x",
    event_type: params.eventType,
    external_ref: params.externalRef,
    metadata: {
      ...params.metadata,
      raidId: params.raid.id,
      source: "raid_runtime_x_recheck",
    },
  });
}

export async function verifyXRaidEngagement(params: {
  authUserId: string;
  raidId: string;
}) {
  const { data: raid, error: raidError } = await supabaseAdmin
    .from("raids")
    .select("id, title, project_id, source_provider, source_url, source_external_id")
    .eq("id", params.raidId)
    .maybeSingle();

  if (raidError) {
    throw new Error(raidError.message || "Failed to load raid.");
  }

  if (!raid) {
    throw new Error("Raid not found.");
  }

  const resolvedRaid = raid as RaidRow;
  const source = resolveXRaidSourcePost(resolvedRaid);
  if (!source) {
    throw new Error("Raid is missing a verifiable X source post.");
  }

  const [{ data: connectedAccount, error: accountError }, { data: projectIntegration, error: integrationError }] =
    await Promise.all([
      supabaseAdmin
        .from("user_connected_accounts")
        .select("provider_user_id, username, status")
        .eq("auth_user_id", params.authUserId)
        .eq("provider", "x")
        .eq("status", "connected")
        .maybeSingle(),
      resolvedRaid.project_id
        ? supabaseAdmin
            .from("project_integrations")
            .select("status")
            .eq("project_id", resolvedRaid.project_id)
            .eq("provider", "x")
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (accountError) {
    throw new Error(accountError.message || "Failed to load connected X account.");
  }

  if (integrationError) {
    throw new Error(integrationError.message || "Failed to load X integration.");
  }

  const account = connectedAccount as ConnectedXAccountRow | null;
  if (!account?.username) {
    throw new Error("User has no linked X username.");
  }

  if (resolvedRaid.project_id && (!projectIntegration || projectIntegration.status !== "connected")) {
    throw new Error("Project has no active X integration.");
  }

  if (!env.X_API_BEARER_TOKEN) {
    throw new Error("X_API_BEARER_TOKEN is missing for raid verification.");
  }

  const recent = await fetchRecentPostsForXUsername({
    username: account.username,
    bearerToken: env.X_API_BEARER_TOKEN,
    limit: 25,
    excludeRetweets: false,
  });
  const matchingPost = recent.posts.find((post) =>
    doesXPostProveRaidEngagement({
      post,
      sourcePostId: source.postId,
      sourceUrl: resolvedRaid.source_url ?? source.canonicalUrl,
    })
  );

  if (!matchingPost) {
    await insertRaidVerificationEvent({
      authUserId: params.authUserId,
      raid: resolvedRaid,
      eventType: "x_raid_verification_pending",
      externalRef: source.canonicalUrl,
      metadata: {
        accountUsername: recent.user.username,
        sourcePostId: source.postId,
      },
    });

    return {
      ok: true,
      status: "pending" as const,
      raidId: resolvedRaid.id,
      message:
        "VYNTRO could not find a reply, quote or source-post share from your connected X account yet.",
    };
  }

  await insertRaidVerificationEvent({
    authUserId: params.authUserId,
    raid: resolvedRaid,
    eventType: "x_raid_engagement_confirmed",
    externalRef: matchingPost.url,
    metadata: {
      accountUsername: recent.user.username,
      sourcePostId: source.postId,
      evidencePostId: matchingPost.id,
      evidencePostUrl: matchingPost.url,
      isReply: matchingPost.isReply,
      isRepost: matchingPost.isRepost,
    },
  });

  return {
    ok: true,
    status: "approved" as const,
    raidId: resolvedRaid.id,
    evidencePostId: matchingPost.id,
    evidencePostUrl: matchingPost.url,
    message: "Raid engagement matched against the connected X account.",
  };
}
