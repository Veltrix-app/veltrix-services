import { normalizeXUsername } from "../../core/raids/tweet-to-raid.js";

export type XRaidPost = {
  id: string;
  authorId: string | null;
  username: string;
  text: string;
  url: string;
  mediaUrls: string[];
  createdAt: string | null;
  isReply: boolean;
  isRepost: boolean;
  replyToPostId: string | null;
};

type XApiUserResponse = {
  data?: {
    id?: string;
    username?: string;
  };
  errors?: Array<{ detail?: string; title?: string }>;
};

type XApiTweet = {
  id?: string;
  author_id?: string;
  text?: string;
  created_at?: string;
  conversation_id?: string;
  referenced_tweets?: Array<{
    type?: "retweeted" | "quoted" | "replied_to" | string;
    id?: string;
  }>;
  attachments?: {
    media_keys?: string[];
  };
};

type XApiMedia = {
  media_key?: string;
  type?: string;
  url?: string;
  preview_image_url?: string;
};

export type XTimelineResponse = {
  data?: XApiTweet[];
  includes?: {
    media?: XApiMedia[];
  };
  errors?: Array<{ detail?: string; title?: string }>;
};

type FetchJsonOptions = {
  bearerToken: string;
  timeoutMs?: number;
};

function buildXHeaders(bearerToken: string) {
  return {
    Authorization: `Bearer ${bearerToken}`,
    "User-Agent": "VYNTRO Tweet-to-Raid Autopilot",
  };
}

function getXApiError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const errors = (payload as { errors?: Array<{ detail?: string; title?: string }> }).errors;
  const firstError = Array.isArray(errors) ? errors[0] : null;
  return firstError?.detail || firstError?.title || fallback;
}

export function formatXApiRequestError(params: {
  status: number;
  payload: unknown;
  fallback?: string;
}) {
  const statusFallbacks: Record<number, string> = {
    401: "X API request failed with 401. Regenerate X_API_BEARER_TOKEN for the connected X app.",
    402:
      "X API request failed with 402. Add X API credits or enable pay-per-use billing for the app that owns X_API_BEARER_TOKEN.",
    403:
      "X API request failed with 403. Enable the required X API read permissions for the app that owns X_API_BEARER_TOKEN.",
  };
  const fallback =
    statusFallbacks[params.status] ?? params.fallback ?? `X API request failed with ${params.status}.`;

  return getXApiError(params.payload, fallback);
}

async function fetchXJson<T>(url: URL, options: FetchJsonOptions): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);

  try {
    const response = await fetch(url, {
      headers: buildXHeaders(options.bearerToken),
      signal: controller.signal,
    });
    const payload = (await response.json().catch(() => null)) as T | null;

    if (!response.ok) {
      throw new Error(formatXApiRequestError({ status: response.status, payload }));
    }

    if (!payload) {
      throw new Error("X API returned an empty response.");
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export function mapXTimelineResponseToRaidPosts(
  response: XTimelineResponse,
  username: string
): XRaidPost[] {
  const normalizedUsername = normalizeXUsername(username);
  const mediaByKey = new Map(
    (response.includes?.media ?? [])
      .filter((media) => typeof media.media_key === "string")
      .map((media) => [media.media_key as string, media])
  );

  return (response.data ?? [])
    .filter((tweet) => typeof tweet.id === "string" && typeof tweet.text === "string")
    .map((tweet) => {
      const references = tweet.referenced_tweets ?? [];
      const replyReference = references.find((reference) => reference.type === "replied_to");
      const isRepost = references.some((reference) => reference.type === "retweeted");
      const mediaUrls = (tweet.attachments?.media_keys ?? [])
        .map((key) => mediaByKey.get(key))
        .map((media) => media?.url || media?.preview_image_url || "")
        .filter((url) => /^https?:\/\//i.test(url));

      return {
        id: tweet.id as string,
        authorId: tweet.author_id ?? null,
        username: normalizedUsername,
        text: tweet.text as string,
        url: `https://x.com/${normalizedUsername}/status/${tweet.id}`,
        mediaUrls: Array.from(new Set(mediaUrls)),
        createdAt: tweet.created_at ?? null,
        isReply: Boolean(replyReference),
        isRepost,
        replyToPostId: replyReference?.id ?? null,
      };
    });
}

export async function fetchXUserByUsername(params: {
  username: string;
  bearerToken: string;
  apiBaseUrl?: string;
}) {
  const username = normalizeXUsername(params.username);
  const url = new URL(
    `/2/users/by/username/${encodeURIComponent(username)}`,
    params.apiBaseUrl ?? "https://api.x.com"
  );
  url.searchParams.set("user.fields", "id,username,name,verified");

  const payload = await fetchXJson<XApiUserResponse>(url, {
    bearerToken: params.bearerToken,
  });

  if (!payload.data?.id || !payload.data.username) {
    throw new Error(getXApiError(payload, `X user @${username} could not be found.`));
  }

  return {
    id: payload.data.id,
    username: normalizeXUsername(payload.data.username),
  };
}

export async function fetchRecentXUserPosts(params: {
  userId: string;
  username: string;
  bearerToken: string;
  limit?: number;
  sinceId?: string | null;
  apiBaseUrl?: string;
}) {
  const limit = Math.min(100, Math.max(5, Math.round(params.limit ?? 10)));
  const url = new URL(
    `/2/users/${encodeURIComponent(params.userId)}/tweets`,
    params.apiBaseUrl ?? "https://api.x.com"
  );
  url.searchParams.set("max_results", String(limit));
  url.searchParams.set("tweet.fields", "attachments,author_id,conversation_id,created_at,referenced_tweets");
  url.searchParams.set("expansions", "attachments.media_keys");
  url.searchParams.set("media.fields", "preview_image_url,type,url");
  url.searchParams.set("exclude", "retweets");
  if (params.sinceId) {
    url.searchParams.set("since_id", params.sinceId);
  }

  const payload = await fetchXJson<XTimelineResponse>(url, {
    bearerToken: params.bearerToken,
  });

  return mapXTimelineResponseToRaidPosts(payload, params.username);
}

export async function fetchRecentPostsForXUsername(params: {
  username: string;
  bearerToken: string;
  limit?: number;
  sinceId?: string | null;
  apiBaseUrl?: string;
}) {
  const user = await fetchXUserByUsername({
    username: params.username,
    bearerToken: params.bearerToken,
    apiBaseUrl: params.apiBaseUrl,
  });

  const posts = await fetchRecentXUserPosts({
    userId: user.id,
    username: user.username,
    bearerToken: params.bearerToken,
    limit: params.limit,
    sinceId: params.sinceId,
    apiBaseUrl: params.apiBaseUrl,
  });

  return {
    user,
    posts,
  };
}
