export type TweetToRaidSourceMode = "review" | "auto_live";
export type TweetToRaidSourceStatus = "active" | "paused" | "blocked";
export type TweetToRaidAction = "create_candidate" | "create_raid" | "skip";

export type TweetToRaidSource = {
  id: string;
  projectId: string;
  projectName: string;
  projectSlug: string | null;
  xAccountId: string | null;
  xUsername: string;
  mode: TweetToRaidSourceMode;
  status: TweetToRaidSourceStatus;
  requiredHashtags: string[];
  excludeReplies: boolean;
  excludeReposts: boolean;
  cooldownMinutes: number;
  maxRaidsPerDay: number;
  defaultRewardXp: number;
  defaultDurationMinutes: number;
  defaultCampaignId: string | null;
  defaultButtonLabel: string;
  defaultArtworkUrl: string | null;
};

export type TweetToRaidPost = {
  id: string;
  authorId: string | null;
  username: string;
  text: string;
  url: string | null;
  mediaUrls: string[];
  createdAt: string | null;
  isReply: boolean;
  isRepost: boolean;
};

export type TweetToRaidDraft = {
  title: string;
  shortDescription: string;
  target: string;
  instructions: string[];
  sourceUrl: string | null;
  sourceExternalId: string;
  banner: string | null;
  rewardXp: number;
  startsAt: string;
  endsAt: string;
  campaignId: string | null;
  buttonLabel: string;
};

export type TweetToRaidDecision =
  | {
      action: "skip";
      reason:
        | "source_inactive"
        | "duplicate_post"
        | "author_mismatch"
        | "reply_filtered"
        | "repost_filtered"
        | "missing_required_hashtag"
        | "cooldown_active"
        | "daily_cap_reached";
      draft: null;
    }
  | {
      action: "create_candidate" | "create_raid";
      reason: "review_mode" | "auto_live";
      draft: TweetToRaidDraft;
    };

export function normalizeXUsername(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function extractHashtags(text: string) {
  return Array.from(text.matchAll(/(^|\s)#([a-zA-Z0-9_]+)/g)).map((match) =>
    match[2].toLowerCase()
  );
}

export function summarizeTweetForRaid(text: string, projectName: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const firstSentence = normalized.split(/[.!?]\s+/)[0]?.trim() || "";
  const withoutHashtags = firstSentence.replace(/#[a-zA-Z0-9_]+/g, "").replace(/\s+/g, " ").trim();
  const fallback = `New raid from ${projectName}`;
  const title = withoutHashtags || fallback;
  return title.length > 74 ? `${title.slice(0, 71).trim()}...` : title;
}

export function clampGeneratedRaidXp(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(10, Math.round(value)));
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function isWithinCooldown(lastCreatedRaidAt: string | null, cooldownMinutes: number, now: Date) {
  if (!lastCreatedRaidAt || cooldownMinutes <= 0) return false;
  const lastCreatedAt = new Date(lastCreatedRaidAt).getTime();
  if (Number.isNaN(lastCreatedAt)) return false;
  return now.getTime() - lastCreatedAt < cooldownMinutes * 60_000;
}

function hasRequiredHashtags(postText: string, requiredHashtags: string[]) {
  if (requiredHashtags.length === 0) return true;
  const found = new Set(extractHashtags(postText));
  return requiredHashtags.every((tag) => found.has(tag.replace(/^#/, "").toLowerCase()));
}

export function buildTweetToRaidDecision(input: {
  source: TweetToRaidSource;
  post: TweetToRaidPost;
  alreadyIngested: boolean;
  dailyCreatedRaidCount: number;
  lastCreatedRaidAt: string | null;
  now: Date;
}): TweetToRaidDecision {
  const { source, post, now } = input;

  if (source.status !== "active") return { action: "skip", reason: "source_inactive", draft: null };
  if (input.alreadyIngested) return { action: "skip", reason: "duplicate_post", draft: null };

  const expectedUsername = normalizeXUsername(source.xUsername);
  const actualUsername = normalizeXUsername(post.username);
  const authorMatchesById = source.xAccountId && post.authorId
    ? source.xAccountId === post.authorId
    : true;

  if (!authorMatchesById || expectedUsername !== actualUsername) {
    return { action: "skip", reason: "author_mismatch", draft: null };
  }

  if (source.excludeReplies && post.isReply) {
    return { action: "skip", reason: "reply_filtered", draft: null };
  }

  if (source.excludeReposts && post.isRepost) {
    return { action: "skip", reason: "repost_filtered", draft: null };
  }

  if (!hasRequiredHashtags(post.text, source.requiredHashtags)) {
    return { action: "skip", reason: "missing_required_hashtag", draft: null };
  }

  if (isWithinCooldown(input.lastCreatedRaidAt, source.cooldownMinutes, now)) {
    return { action: "skip", reason: "cooldown_active", draft: null };
  }

  if (input.dailyCreatedRaidCount >= source.maxRaidsPerDay) {
    return { action: "skip", reason: "daily_cap_reached", draft: null };
  }

  const startsAt = now.toISOString();
  const endsAt = addMinutes(now, source.defaultDurationMinutes).toISOString();
  const title = summarizeTweetForRaid(post.text, source.projectName);
  const sourceUrl = post.url ?? `https://x.com/${source.xUsername}/status/${post.id}`;
  const banner = post.mediaUrls[0] ?? source.defaultArtworkUrl;
  const rewardXp = clampGeneratedRaidXp(source.defaultRewardXp);
  const shortDescription = post.text.replace(/\s+/g, " ").trim();

  const draft: TweetToRaidDraft = {
    title,
    shortDescription,
    target: "Open the source post, engage with it, then confirm the raid in VYNTRO.",
    instructions: [
      "Open the source post.",
      "Like, repost, comment or complete the project action honestly.",
      "Return to VYNTRO and confirm the raid once your action is complete.",
    ],
    sourceUrl,
    sourceExternalId: post.id,
    banner,
    rewardXp,
    startsAt,
    endsAt,
    campaignId: source.defaultCampaignId,
    buttonLabel: source.defaultButtonLabel || "Open raid",
  };

  if (source.mode === "auto_live") {
    return { action: "create_raid", reason: "auto_live", draft };
  }

  return { action: "create_candidate", reason: "review_mode", draft };
}
