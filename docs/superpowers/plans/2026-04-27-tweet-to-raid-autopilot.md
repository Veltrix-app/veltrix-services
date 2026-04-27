# Tweet-to-Raid Autopilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a controlled Tweet-to-Raid Autopilot MVP that turns approved or eligible X post events into VYNTRO raids, webapp visibility, and Discord/Telegram delivery.

**Architecture:** Supabase remains the source of truth for sources, ingest events, candidates and generated raids. The community bot owns ingest validation, raid creation and provider delivery through existing Discord/Telegram push helpers. The webapp keeps reading from `raids`, with small metadata additions so generated raids show source links and expire cleanly.

**Tech Stack:** Supabase Postgres migrations, Node/TypeScript community bot, Express job routes, Zod validation, node:test, Next.js/React webapp.

---

## Scope

This plan implements Phase 1: manual ingest MVP plus the internal architecture needed for official X API/webhook ingestion to feed the same service. It does not build the polished portal control UI because the active checkout does not contain the portal app; it stores all portal-ready data in Supabase tables and job responses so the portal can consume the same state once that code is available.

## File Structure

- Create `database/migrations/vyntro_tweet_to_raid_autopilot_v1.sql`
  - Adds generated-raid metadata columns to `public.raids`.
  - Adds `public.x_raid_sources`, `public.x_raid_ingest_events`, and `public.raid_generation_candidates`.
  - Adds indexes, constraints and RLS posture for service-role writes.
- Create `services/veltrix-community-bot/src/core/raids/tweet-to-raid.ts`
  - Pure, testable decision engine for author matching, filters, cooldowns, daily caps, title/description generation, XP clamping and raid draft payloads.
- Create `services/veltrix-community-bot/src/core/raids/tweet-to-raid.test.ts`
  - Unit coverage for normalization, skip decisions, candidate creation and auto-live draft generation.
- Create `services/veltrix-community-bot/src/core/community/delivery.ts`
  - Extracts reusable project community target loading and Discord/Telegram dispatch from `automations.ts`.
- Modify `services/veltrix-community-bot/src/core/community/automations.ts`
  - Imports shared delivery helpers instead of keeping private duplicate delivery functions.
- Modify `services/veltrix-community-bot/src/core/community/model.ts`
  - Adds `tweet_to_raid` to the automation type union and sequence metadata.
- Create `services/veltrix-community-bot/src/jobs/ingest-x-raid-post.ts`
  - Loads a source config, dedupes the post, creates an ingest event, creates a candidate or active raid, dispatches provider pushes, and updates audit metadata.
- Create `services/veltrix-community-bot/src/jobs/ingest-x-raid-post.test.ts`
  - Integration-style tests with mocked Supabase and provider delivery boundaries.
- Modify `services/veltrix-community-bot/src/http/jobs.ts`
  - Adds `POST /jobs/ingest-x-raid-post` protected by the existing `x-community-job-secret` pattern.
- Modify `services/veltrix-community-bot/README.md`
  - Documents the manual ingest endpoint, payload, deployment env assumptions and production rollout flow.
- Modify `apps/veltrix-web/src/types/live.ts`
  - Adds generated raid metadata fields to `LiveRaid`.
- Modify `apps/veltrix-web/src/hooks/use-live-user-data.ts`
  - Maps generated raid metadata and filters expired generated raids from active display.
- Modify `apps/veltrix-web/src/components/raids/raid-detail-screen.tsx`
  - Adds a subtle "Open source post" action when a raid has `sourceUrl`.

## Implementation Notes

- Use the existing `x-community-job-secret` header for the ingest endpoint.
- Keep manual ingest as the first production-safe path. The endpoint accepts structured post payloads now; official X API/webhook ingestion can call the same job later.
- Clamp automation XP at the bot boundary even when a project source is configured with a high value.
- A generated active raid must be useful even if Discord or Telegram delivery fails; delivery errors are stored in `delivery_metadata`.
- Review mode creates `raid_generation_candidates` only. Auto-live creates a row in `raids`.
- The webapp should not need a special query for generated raids.

---

### Task 1: Add Tweet-to-Raid Database Contract

**Files:**
- Create: `database/migrations/vyntro_tweet_to_raid_autopilot_v1.sql`

- [ ] **Step 1: Create the migration file**

Create `database/migrations/vyntro_tweet_to_raid_autopilot_v1.sql` with this SQL:

```sql
-- Tweet-to-Raid Autopilot v1
-- Manual ingest MVP plus X API-ready source/event tables.

alter table if exists public.raids
  add column if not exists source_provider text,
  add column if not exists source_url text,
  add column if not exists source_external_id text,
  add column if not exists source_event_id uuid,
  add column if not exists ends_at timestamptz,
  add column if not exists generated_by text,
  add column if not exists delivery_metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_raids_source_external
  on public.raids (source_provider, source_external_id)
  where source_provider is not null and source_external_id is not null;

create index if not exists idx_raids_ends_at
  on public.raids (ends_at)
  where ends_at is not null;

create table if not exists public.x_raid_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  integration_id uuid,
  x_account_id text,
  x_username text not null,
  mode text not null default 'review',
  status text not null default 'paused',
  required_hashtags text[] not null default '{}'::text[],
  exclude_replies boolean not null default true,
  exclude_reposts boolean not null default true,
  cooldown_minutes integer not null default 30,
  max_raids_per_day integer not null default 6,
  default_reward_xp integer not null default 50,
  default_duration_minutes integer not null default 1440,
  default_campaign_id uuid references public.campaigns(id) on delete set null,
  default_button_label text not null default 'Open raid',
  default_artwork_url text,
  metadata jsonb not null default '{}'::jsonb,
  last_event_at timestamptz,
  last_raid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint x_raid_sources_mode_check check (mode in ('review', 'auto_live')),
  constraint x_raid_sources_status_check check (status in ('active', 'paused', 'blocked')),
  constraint x_raid_sources_cooldown_check check (cooldown_minutes >= 0),
  constraint x_raid_sources_daily_cap_check check (max_raids_per_day > 0 and max_raids_per_day <= 48),
  constraint x_raid_sources_reward_check check (default_reward_xp > 0 and default_reward_xp <= 500),
  constraint x_raid_sources_duration_check check (default_duration_minutes >= 15 and default_duration_minutes <= 10080)
);

create unique index if not exists idx_x_raid_sources_project_username
  on public.x_raid_sources (project_id, lower(x_username));

create index if not exists idx_x_raid_sources_project_status
  on public.x_raid_sources (project_id, status, mode);

create table if not exists public.x_raid_ingest_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_id uuid references public.x_raid_sources(id) on delete set null,
  x_post_id text not null,
  x_author_id text,
  x_username text not null,
  post_url text,
  text text not null default '',
  media_urls text[] not null default '{}'::text[],
  received_at timestamptz not null default now(),
  decision text not null default 'skipped',
  decision_reason text not null default 'received',
  raid_id uuid,
  candidate_id uuid,
  delivery_metadata jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint x_raid_ingest_events_decision_check check (
    decision in ('created_raid', 'created_candidate', 'skipped', 'failed')
  )
);

create unique index if not exists idx_x_raid_ingest_events_project_post
  on public.x_raid_ingest_events (project_id, x_post_id);

create index if not exists idx_x_raid_ingest_events_source_received
  on public.x_raid_ingest_events (source_id, received_at desc);

create table if not exists public.raid_generation_candidates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_event_id uuid references public.x_raid_ingest_events(id) on delete set null,
  status text not null default 'pending',
  title text not null,
  short_description text,
  tweet_url text,
  banner text,
  reward_xp integer not null default 50,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  approved_by_auth_user_id uuid,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint raid_generation_candidates_status_check check (
    status in ('pending', 'approved', 'rejected', 'expired')
  ),
  constraint raid_generation_candidates_reward_check check (reward_xp > 0 and reward_xp <= 500)
);

create index if not exists idx_raid_generation_candidates_project_status
  on public.raid_generation_candidates (project_id, status, created_at desc);

create index if not exists idx_raid_generation_candidates_source_event
  on public.raid_generation_candidates (source_event_id);

alter table public.x_raid_sources enable row level security;
alter table public.x_raid_ingest_events enable row level security;
alter table public.raid_generation_candidates enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'x_raid_sources'
      and policyname = 'x_raid_sources_service_role_all'
  ) then
    create policy x_raid_sources_service_role_all
      on public.x_raid_sources
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'x_raid_ingest_events'
      and policyname = 'x_raid_ingest_events_service_role_all'
  ) then
    create policy x_raid_ingest_events_service_role_all
      on public.x_raid_ingest_events
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'raid_generation_candidates'
      and policyname = 'raid_generation_candidates_service_role_all'
  ) then
    create policy raid_generation_candidates_service_role_all
      on public.raid_generation_candidates
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;
```

- [ ] **Step 2: Commit the migration contract**

Run:

```bash
git add database/migrations/vyntro_tweet_to_raid_autopilot_v1.sql
git commit -m "Add tweet-to-raid database contract"
```

Expected: commit succeeds and only the migration is staged.

---

### Task 2: Add Pure Tweet-to-Raid Decision Engine

**Files:**
- Create: `services/veltrix-community-bot/src/core/raids/tweet-to-raid.ts`
- Create: `services/veltrix-community-bot/src/core/raids/tweet-to-raid.test.ts`

- [ ] **Step 1: Write failing tests for source matching, filters and draft creation**

Create `services/veltrix-community-bot/src/core/raids/tweet-to-raid.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests and confirm they fail because the module does not exist**

Run:

```bash
npm run test -- --test-name-pattern "Tweet|tweet|review mode|auto-live|duplicate|hashtags|cooldown"
```

Expected: FAIL with module resolution error for `./tweet-to-raid.js`.

- [ ] **Step 3: Implement the pure decision engine**

Create `services/veltrix-community-bot/src/core/raids/tweet-to-raid.ts`:

```ts
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
```

- [ ] **Step 4: Run the tweet-to-raid tests**

Run:

```bash
npm run test -- --test-name-pattern "normalizeXUsername|summarizeTweetForRaid|review mode|auto-live|duplicate|required hashtags|cooldown"
```

Expected: PASS for the new decision-engine tests.

- [ ] **Step 5: Commit the decision engine**

Run:

```bash
git add services/veltrix-community-bot/src/core/raids/tweet-to-raid.ts services/veltrix-community-bot/src/core/raids/tweet-to-raid.test.ts
git commit -m "Add tweet-to-raid decision engine"
```

Expected: commit succeeds.

---

### Task 3: Extract Reusable Community Delivery

**Files:**
- Create: `services/veltrix-community-bot/src/core/community/delivery.ts`
- Modify: `services/veltrix-community-bot/src/core/community/automations.ts`

- [ ] **Step 1: Create the shared delivery module**

Create `services/veltrix-community-bot/src/core/community/delivery.ts`:

```ts
import { supabaseAdmin } from "../../lib/supabase.js";
import { sendDiscordPush } from "../../providers/discord/push.js";
import { sendTelegramPush } from "../../providers/telegram/push.js";

export type CommunityProvider = "discord" | "telegram";
export type ProviderScope = "discord" | "telegram" | "both";

export type ProjectCommunityTarget = {
  integrationId: string;
  provider: CommunityProvider;
  targetChannelId?: string;
  targetThreadId?: string;
  targetChatId?: string;
};

export type ProjectCommunityMessage = {
  projectId: string;
  providerScope: ProviderScope;
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl?: string | null;
  metadata?: Record<string, unknown>;
};

export const appUrl = (process.env.PUBLIC_APP_URL || "https://veltrix-web.vercel.app").replace(/\/+$/, "");

export function getDefaultCommunityArtwork(kind: "campaign" | "quest" | "raid") {
  return `${appUrl}/community-push/defaults/${kind}.png`;
}

export async function loadProjectCommunityTargets(
  projectId: string,
  providerScope: ProviderScope
): Promise<ProjectCommunityTarget[]> {
  const { data, error } = await supabaseAdmin
    .from("project_integrations")
    .select("id, provider, target_channel_id, target_thread_id, target_chat_id, status")
    .eq("project_id", projectId)
    .eq("status", "connected");

  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.provider === "discord" || row.provider === "telegram")
    .filter((row) => providerScope === "both" || row.provider === providerScope)
    .map((row) => ({
      integrationId: row.id,
      provider: row.provider,
      targetChannelId: row.target_channel_id ?? undefined,
      targetThreadId: row.target_thread_id ?? undefined,
      targetChatId: row.target_chat_id ?? undefined,
    }));
}

export async function dispatchProjectCommunityMessage(input: ProjectCommunityMessage) {
  const targets = await loadProjectCommunityTargets(input.projectId, input.providerScope);
  const deliveries: Array<{
    provider: CommunityProvider;
    integrationId: string;
    ok: boolean;
    error?: string;
  }> = [];

  for (const target of targets) {
    try {
      if (target.provider === "discord") {
        await sendDiscordPush({
          channelId: target.targetChannelId,
          threadId: target.targetThreadId,
          title: input.title,
          body: input.body,
          ctaLabel: input.ctaLabel,
          ctaUrl: input.ctaUrl,
          imageUrl: input.imageUrl ?? null,
          metadata: input.metadata ?? {},
        });
      } else {
        await sendTelegramPush({
          chatId: target.targetChatId,
          title: input.title,
          body: input.body,
          ctaLabel: input.ctaLabel,
          ctaUrl: input.ctaUrl,
          imageUrl: input.imageUrl ?? null,
          metadata: input.metadata ?? {},
        });
      }

      deliveries.push({
        provider: target.provider,
        integrationId: target.integrationId,
        ok: true,
      });
    } catch (error) {
      deliveries.push({
        provider: target.provider,
        integrationId: target.integrationId,
        ok: false,
        error: error instanceof Error ? error.message : "Delivery failed.",
      });
    }
  }

  return deliveries;
}
```

- [ ] **Step 2: Replace private delivery types/functions in automations**

In `services/veltrix-community-bot/src/core/community/automations.ts`, remove these imports:

```ts
import { sendDiscordPush } from "../../providers/discord/push.js";
import { sendTelegramPush } from "../../providers/telegram/push.js";
```

Then add this import:

```ts
import {
  appUrl,
  dispatchProjectCommunityMessage,
  getDefaultCommunityArtwork,
  type ProviderScope,
} from "./delivery.js";
```

Remove the local `CommunityProvider`, `ProviderScope`, `ProjectCommunityTarget`, local `appUrl`, local `getDefaultCommunityArtwork`, local `loadProjectCommunityTargets`, and local `dispatchProjectCommunityMessage` definitions from `automations.ts`. Keep call sites unchanged because the imported function has the same name.

- [ ] **Step 3: Run community bot typecheck**

Run:

```bash
npm run typecheck --workspace vyntro-community-bot
```

Expected: PASS with no missing import or duplicate identifier errors.

- [ ] **Step 4: Commit delivery extraction**

Run:

```bash
git add services/veltrix-community-bot/src/core/community/delivery.ts services/veltrix-community-bot/src/core/community/automations.ts
git commit -m "Extract reusable community delivery"
```

Expected: commit succeeds.

---

### Task 4: Add Bot Ingest Job

**Files:**
- Create: `services/veltrix-community-bot/src/jobs/ingest-x-raid-post.ts`
- Create: `services/veltrix-community-bot/src/jobs/ingest-x-raid-post.test.ts`

- [ ] **Step 1: Write ingest job tests for review, auto-live and duplicate behavior**

Create `services/veltrix-community-bot/src/jobs/ingest-x-raid-post.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { buildTweetToRaidDecision } from "../core/raids/tweet-to-raid.js";

test("tweet-to-raid job uses review mode to create a candidate decision", () => {
  const decision = buildTweetToRaidDecision({
    source: {
      id: "source-1",
      projectId: "project-1",
      projectName: "Chainwars",
      projectSlug: "chainwars",
      xAccountId: null,
      xUsername: "chainwarshq",
      mode: "review",
      status: "active",
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
    },
    post: {
      id: "post-1",
      authorId: null,
      username: "chainwarshq",
      text: "Guild push starts now.",
      url: "https://x.com/chainwarshq/status/post-1",
      mediaUrls: [],
      createdAt: null,
      isReply: false,
      isRepost: false,
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
    source: {
      id: "source-1",
      projectId: "project-1",
      projectName: "Chainwars",
      projectSlug: "chainwars",
      xAccountId: null,
      xUsername: "chainwarshq",
      mode: "auto_live",
      status: "active",
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
    },
    post: {
      id: "post-2",
      authorId: null,
      username: "chainwarshq",
      text: "Guild push starts now.",
      url: "https://x.com/chainwarshq/status/post-2",
      mediaUrls: [],
      createdAt: null,
      isReply: false,
      isRepost: false,
    },
    alreadyIngested: false,
    dailyCreatedRaidCount: 0,
    lastCreatedRaidAt: null,
    now: new Date("2026-04-27T10:00:00.000Z"),
  });

  assert.equal(decision.action, "create_raid");
  assert.equal(decision.reason, "auto_live");
});
```

- [ ] **Step 2: Run the ingest tests**

Run:

```bash
npm run test -- --test-name-pattern "tweet-to-raid job"
```

Expected: PASS because these tests exercise the pure boundary first.

- [ ] **Step 3: Implement the Supabase-backed ingest job**

Create `services/veltrix-community-bot/src/jobs/ingest-x-raid-post.ts`:

```ts
import { supabaseAdmin } from "../lib/supabase.js";
import {
  buildTweetToRaidDecision,
  normalizeXUsername,
  type TweetToRaidPost,
  type TweetToRaidSource,
} from "../core/raids/tweet-to-raid.js";
import { appUrl, dispatchProjectCommunityMessage } from "../core/community/delivery.js";

export type IngestXRaidPostInput = {
  projectId: string;
  sourceId?: string;
  post: {
    id: string;
    authorId?: string | null;
    username: string;
    text: string;
    url?: string | null;
    mediaUrls?: string[];
    createdAt?: string | null;
    isReply?: boolean;
    isRepost?: boolean;
    replyToPostId?: string | null;
  };
  forceMode?: "review" | "auto_live";
};

type SourceRow = {
  id: string;
  project_id: string;
  x_account_id: string | null;
  x_username: string;
  mode: "review" | "auto_live";
  status: "active" | "paused" | "blocked";
  required_hashtags: string[] | null;
  exclude_replies: boolean | null;
  exclude_reposts: boolean | null;
  cooldown_minutes: number | null;
  max_raids_per_day: number | null;
  default_reward_xp: number | null;
  default_duration_minutes: number | null;
  default_campaign_id: string | null;
  default_button_label: string | null;
  default_artwork_url: string | null;
  projects: {
    name: string | null;
    slug: string | null;
  } | null;
};

function mapSource(row: SourceRow, forceMode?: "review" | "auto_live"): TweetToRaidSource {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.projects?.name ?? "Project",
    projectSlug: row.projects?.slug ?? null,
    xAccountId: row.x_account_id,
    xUsername: row.x_username,
    mode: forceMode ?? row.mode ?? "review",
    status: row.status ?? "paused",
    requiredHashtags: row.required_hashtags ?? [],
    excludeReplies: row.exclude_replies ?? true,
    excludeReposts: row.exclude_reposts ?? true,
    cooldownMinutes: row.cooldown_minutes ?? 30,
    maxRaidsPerDay: row.max_raids_per_day ?? 6,
    defaultRewardXp: row.default_reward_xp ?? 50,
    defaultDurationMinutes: row.default_duration_minutes ?? 1440,
    defaultCampaignId: row.default_campaign_id,
    defaultButtonLabel: row.default_button_label ?? "Open raid",
    defaultArtworkUrl: row.default_artwork_url,
  };
}

function mapPost(post: IngestXRaidPostInput["post"]): TweetToRaidPost {
  return {
    id: post.id,
    authorId: post.authorId ?? null,
    username: post.username,
    text: post.text,
    url: post.url ?? `https://x.com/${normalizeXUsername(post.username)}/status/${post.id}`,
    mediaUrls: post.mediaUrls ?? [],
    createdAt: post.createdAt ?? null,
    isReply: post.isReply ?? Boolean(post.replyToPostId),
    isRepost: post.isRepost ?? false,
  };
}

async function loadSource(input: IngestXRaidPostInput) {
  let query = supabaseAdmin
    .from("x_raid_sources")
    .select("*, projects(name, slug)")
    .eq("project_id", input.projectId);

  if (input.sourceId) {
    query = query.eq("id", input.sourceId);
  } else {
    query = query.eq("x_username", normalizeXUsername(input.post.username));
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data as SourceRow | null;
}

async function countDailyCreatedRaids(sourceId: string, now: Date) {
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabaseAdmin
    .from("x_raid_ingest_events")
    .select("id", { count: "exact", head: true })
    .eq("source_id", sourceId)
    .eq("decision", "created_raid")
    .gte("created_at", startOfDay.toISOString());

  if (error) throw error;
  return count ?? 0;
}

async function loadLastCreatedRaidAt(sourceId: string) {
  const { data, error } = await supabaseAdmin
    .from("x_raid_ingest_events")
    .select("created_at")
    .eq("source_id", sourceId)
    .eq("decision", "created_raid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.created_at ?? null;
}

export async function ingestXRaidPost(input: IngestXRaidPostInput) {
  const now = new Date();
  const sourceRow = await loadSource(input);

  if (!sourceRow) {
    return {
      ok: false,
      status: "skipped" as const,
      reason: "source_not_found",
    };
  }

  const source = mapSource(sourceRow, input.forceMode);
  const post = mapPost(input.post);

  const { data: existingEvent, error: existingError } = await supabaseAdmin
    .from("x_raid_ingest_events")
    .select("id, decision, decision_reason, raid_id, candidate_id")
    .eq("project_id", source.projectId)
    .eq("x_post_id", post.id)
    .maybeSingle();

  if (existingError) throw existingError;

  const dailyCreatedRaidCount = await countDailyCreatedRaids(source.id, now);
  const lastCreatedRaidAt = await loadLastCreatedRaidAt(source.id);
  const decision = buildTweetToRaidDecision({
    source,
    post,
    alreadyIngested: Boolean(existingEvent),
    dailyCreatedRaidCount,
    lastCreatedRaidAt,
    now,
  });

  if (decision.action === "skip") {
    if (!existingEvent) {
      await supabaseAdmin.from("x_raid_ingest_events").insert({
        project_id: source.projectId,
        source_id: source.id,
        x_post_id: post.id,
        x_author_id: post.authorId,
        x_username: normalizeXUsername(post.username),
        post_url: post.url,
        text: post.text,
        media_urls: post.mediaUrls,
        decision: "skipped",
        decision_reason: decision.reason,
        raw_payload: input,
      });
    }

    return {
      ok: true,
      status: "skipped" as const,
      reason: decision.reason,
      existingEventId: existingEvent?.id ?? null,
    };
  }

  const { data: event, error: eventError } = await supabaseAdmin
    .from("x_raid_ingest_events")
    .insert({
      project_id: source.projectId,
      source_id: source.id,
      x_post_id: post.id,
      x_author_id: post.authorId,
      x_username: normalizeXUsername(post.username),
      post_url: post.url,
      text: post.text,
      media_urls: post.mediaUrls,
      decision: decision.action === "create_raid" ? "created_raid" : "created_candidate",
      decision_reason: decision.reason,
      raw_payload: input,
    })
    .select("id")
    .single();

  if (eventError) throw eventError;

  if (decision.action === "create_candidate") {
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from("raid_generation_candidates")
      .insert({
        project_id: source.projectId,
        source_event_id: event.id,
        status: "pending",
        title: decision.draft.title,
        short_description: decision.draft.shortDescription,
        tweet_url: decision.draft.sourceUrl,
        banner: decision.draft.banner,
        reward_xp: decision.draft.rewardXp,
        starts_at: decision.draft.startsAt,
        ends_at: decision.draft.endsAt,
        metadata: {
          sourceProvider: "x",
          sourceExternalId: decision.draft.sourceExternalId,
          instructions: decision.draft.instructions,
          target: decision.draft.target,
        },
      })
      .select("id")
      .single();

    if (candidateError) throw candidateError;

    await supabaseAdmin
      .from("x_raid_ingest_events")
      .update({ candidate_id: candidate.id, updated_at: new Date().toISOString() })
      .eq("id", event.id);

    return {
      ok: true,
      status: "created_candidate" as const,
      eventId: event.id,
      candidateId: candidate.id,
    };
  }

  const { data: raid, error: raidError } = await supabaseAdmin
    .from("raids")
    .insert({
      project_id: source.projectId,
      campaign_id: decision.draft.campaignId,
      title: decision.draft.title,
      short_description: decision.draft.shortDescription,
      community: source.projectName,
      timer: "Live",
      reward: decision.draft.rewardXp,
      reward_xp: decision.draft.rewardXp,
      participants: 0,
      progress: 0,
      target: decision.draft.target,
      banner: decision.draft.banner,
      instructions: decision.draft.instructions,
      status: "active",
      source_provider: "x",
      source_url: decision.draft.sourceUrl,
      source_external_id: decision.draft.sourceExternalId,
      source_event_id: event.id,
      ends_at: decision.draft.endsAt,
      generated_by: "tweet_to_raid",
    })
    .select("id")
    .single();

  if (raidError) throw raidError;

  const raidUrl = `${appUrl}/raids/${raid.id}`;
  const deliveries = await dispatchProjectCommunityMessage({
    projectId: source.projectId,
    providerScope: "both",
    title: `LIVE RAID: ${decision.draft.title}`,
    body: `${decision.draft.shortDescription}\n\nOpen the raid, engage with the source post, then confirm it in VYNTRO.`,
    ctaLabel: decision.draft.buttonLabel,
    ctaUrl: raidUrl,
    imageUrl: decision.draft.banner,
    metadata: {
      source: "tweet_to_raid",
      raidId: raid.id,
      xPostId: post.id,
    },
  });

  const deliveryMetadata = {
    deliveries,
    deliveredAt: new Date().toISOString(),
    sourceUrl: decision.draft.sourceUrl,
  };

  await Promise.all([
    supabaseAdmin
      .from("x_raid_ingest_events")
      .update({
        raid_id: raid.id,
        delivery_metadata: deliveryMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", event.id),
    supabaseAdmin
      .from("raids")
      .update({ delivery_metadata: deliveryMetadata })
      .eq("id", raid.id),
    supabaseAdmin
      .from("x_raid_sources")
      .update({
        last_event_at: new Date().toISOString(),
        last_raid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", source.id),
  ]);

  return {
    ok: true,
    status: "created_raid" as const,
    eventId: event.id,
    raidId: raid.id,
    deliveries,
  };
}
```

- [ ] **Step 4: Run bot typecheck and tests**

Run:

```bash
npm run typecheck --workspace vyntro-community-bot
npm run test -- --test-name-pattern "tweet-to-raid"
```

Expected: PASS.

- [ ] **Step 5: Commit the ingest job**

Run:

```bash
git add services/veltrix-community-bot/src/jobs/ingest-x-raid-post.ts services/veltrix-community-bot/src/jobs/ingest-x-raid-post.test.ts
git commit -m "Add tweet-to-raid ingest job"
```

Expected: commit succeeds.

---

### Task 5: Wire Protected Manual Ingest Endpoint

**Files:**
- Modify: `services/veltrix-community-bot/src/http/jobs.ts`
- Modify: `services/veltrix-community-bot/src/core/community/model.ts`

- [ ] **Step 1: Add the automation type**

In `services/veltrix-community-bot/src/core/community/model.ts`, add `tweet_to_raid` to `COMMUNITY_AUTOMATION_TYPES`:

```ts
export const COMMUNITY_AUTOMATION_TYPES = [
  "rank_sync",
  "leaderboard_pulse",
  "mission_digest",
  "raid_reminder",
  "newcomer_pulse",
  "reactivation_pulse",
  "activation_board",
  "tweet_to_raid",
] as const;
```

If the file contains a sequence map, add:

```ts
tweet_to_raid: "raid",
```

or the existing equivalent that places it with raid automation posture.

- [ ] **Step 2: Import the job and add schema in jobs router**

In `services/veltrix-community-bot/src/http/jobs.ts`, add the import:

```ts
import { ingestXRaidPost } from "../jobs/ingest-x-raid-post.js";
```

Add this schema near the other route schemas:

```ts
const ingestXRaidPostSchema = z.object({
  projectId: z.string().uuid(),
  sourceId: z.string().uuid().optional(),
  forceMode: z.enum(["review", "auto_live"]).optional(),
  post: z.object({
    id: z.string().min(1),
    authorId: z.string().optional().nullable(),
    username: z.string().min(1),
    text: z.string().min(1),
    url: z.string().url().optional().nullable(),
    mediaUrls: z.array(z.string().url()).optional(),
    createdAt: z.string().datetime().optional().nullable(),
    isReply: z.boolean().optional(),
    isRepost: z.boolean().optional(),
    replyToPostId: z.string().optional().nullable(),
  }),
});
```

- [ ] **Step 3: Add the route**

Add this route to `services/veltrix-community-bot/src/http/jobs.ts`:

```ts
jobsRouter.post("/ingest-x-raid-post", async (req, res) => {
  if (!hasValidJobSecret(req.header("x-community-job-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid job secret." });
  }

  const parsed = ingestXRaidPostSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid X raid ingest payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await ingestXRaidPost(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "X raid ingest failed.",
    });
  }
});
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck --workspace vyntro-community-bot
```

Expected: PASS.

- [ ] **Step 5: Commit endpoint wiring**

Run:

```bash
git add services/veltrix-community-bot/src/http/jobs.ts services/veltrix-community-bot/src/core/community/model.ts
git commit -m "Wire tweet-to-raid ingest endpoint"
```

Expected: commit succeeds.

---

### Task 6: Surface Generated Raid Metadata In The Webapp

**Files:**
- Modify: `apps/veltrix-web/src/types/live.ts`
- Modify: `apps/veltrix-web/src/hooks/use-live-user-data.ts`
- Modify: `apps/veltrix-web/src/components/raids/raid-detail-screen.tsx`

- [ ] **Step 1: Extend the LiveRaid type**

In `apps/veltrix-web/src/types/live.ts`, extend `LiveRaid` with these optional fields:

```ts
  sourceProvider?: string | null;
  sourceUrl?: string | null;
  sourceExternalId?: string | null;
  endsAt?: string | null;
  generatedBy?: string | null;
```

- [ ] **Step 2: Map metadata and filter expired raids**

In `apps/veltrix-web/src/hooks/use-live-user-data.ts`, replace the current `nextRaids` map with this shape:

```ts
    const nowMs = Date.now();
    const nextRaids = (raidsResult.data ?? [])
      .filter((row) => {
        if (!row.ends_at) return true;
        const endsAtMs = new Date(row.ends_at).getTime();
        return Number.isNaN(endsAtMs) || endsAtMs > nowMs;
      })
      .map((row) => ({
        id: row.id,
        campaignId: row.campaign_id ?? null,
        title: row.title ?? "Raid",
        community: row.community ?? "Community",
        timer: row.timer ?? "Live",
        reward: row.reward ?? row.reward_xp ?? 0,
        participants: row.participants ?? 0,
        progress: row.progress ?? 0,
        target: row.target ?? "",
        banner: row.banner ?? "",
        instructions: Array.isArray(row.instructions)
          ? (row.instructions as unknown[]).filter(
              (item): item is string => typeof item === "string"
            )
          : [],
        sourceProvider: row.source_provider ?? null,
        sourceUrl: row.source_url ?? null,
        sourceExternalId: row.source_external_id ?? null,
        endsAt: row.ends_at ?? null,
        generatedBy: row.generated_by ?? null,
      }));
```

- [ ] **Step 3: Add source action to raid detail**

In `apps/veltrix-web/src/components/raids/raid-detail-screen.tsx`, inside the "Signal rail" button area, render the source URL above the confirm button:

```tsx
            {currentRaid.sourceUrl ? (
              <a
                href={currentRaid.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-100 transition hover:border-rose-200/40 hover:text-rose-100"
              >
                Open source post
              </a>
            ) : null}
```

Keep the existing confirm button below this link.

- [ ] **Step 4: Run web typecheck**

Run:

```bash
npm run typecheck --workspace vyntro-web
```

Expected: PASS.

- [ ] **Step 5: Commit web metadata surfacing**

Run:

```bash
git add apps/veltrix-web/src/types/live.ts apps/veltrix-web/src/hooks/use-live-user-data.ts apps/veltrix-web/src/components/raids/raid-detail-screen.tsx
git commit -m "Surface generated raid source metadata"
```

Expected: commit succeeds.

---

### Task 7: Document Manual Ingest And Rollout

**Files:**
- Modify: `services/veltrix-community-bot/README.md`

- [ ] **Step 1: Add Tweet-to-Raid runbook section**

Append this section to `services/veltrix-community-bot/README.md`:

````md
## Tweet-to-Raid Autopilot

Tweet-to-Raid Autopilot turns an approved project X post event into a VYNTRO raid. The first production-safe path is manual ingest: an operator or portal action sends a structured post payload to the community bot, and the bot creates either a review candidate or an active raid based on `x_raid_sources.mode`.

### Endpoint

`POST /jobs/ingest-x-raid-post`

Required header:

`x-community-job-secret: <COMMUNITY_BOT_WEBHOOK_SECRET or COMMUNITY_RETRY_JOB_SECRET>`

Example payload:

```json
{
  "projectId": "9aceb865-06a4-4124-b5f8-e53018a4e712",
  "forceMode": "review",
  "post": {
    "id": "1916812345678900000",
    "username": "chainwarshq",
    "text": "New guild raid is live. Join the push. #VYNTRO",
    "url": "https://x.com/chainwarshq/status/1916812345678900000",
    "mediaUrls": ["https://example.com/banner.png"],
    "isReply": false,
    "isRepost": false
  }
}
```

### Expected Decisions

- `created_candidate`: review mode stored a row in `raid_generation_candidates`.
- `created_raid`: auto-live mode created a row in `raids` and attempted Discord/Telegram delivery.
- `skipped`: dedupe, source mismatch, filters, cooldown or daily cap prevented creation.
- `failed`: the job failed after accepting the event and stored the failure in the ingest event.

### Rollout Checklist

1. Run the SQL migration in Supabase.
2. Insert one active `x_raid_sources` row for the project account.
3. Test the endpoint with `forceMode: "review"`.
4. Confirm the candidate row is created.
5. Switch the source to `auto_live` only after provider targets are connected.
6. Test another post payload and confirm a raid appears at `/raids/<raidId>`.
````

- [ ] **Step 2: Commit docs**

Run:

```bash
git add services/veltrix-community-bot/README.md
git commit -m "Document tweet-to-raid manual ingest"
```

Expected: commit succeeds.

---

### Task 8: Verify The Full Stack

**Files:**
- No direct edits unless verification reveals a bug.

- [ ] **Step 1: Run bot tests**

Run:

```bash
npm run test -- --test-name-pattern "tweet-to-raid"
```

Expected: PASS.

- [ ] **Step 2: Run full typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS for `vyntro-community-bot` and `vyntro-web`.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: PASS for bot and web.

- [ ] **Step 4: Run full verification if time allows**

Run:

```bash
npm run verify
```

Expected: PASS. If docs lint/typecheck fails on unrelated existing docs issues, capture the exact warning/error and do not hide it.

- [ ] **Step 5: Commit verification fixes if any were needed**

If verification required fixes, run:

```bash
git add <fixed-files>
git commit -m "Fix tweet-to-raid verification issues"
```

Expected: commit succeeds only if files changed.

---

## Manual Production Smoke Test

After migrations and deployment, use this request against the community bot service:

```bash
curl -X POST "$COMMUNITY_BOT_URL/jobs/ingest-x-raid-post" \
  -H "content-type: application/json" \
  -H "x-community-job-secret: $COMMUNITY_BOT_WEBHOOK_SECRET" \
  -d '{
    "projectId": "9aceb865-06a4-4124-b5f8-e53018a4e712",
    "forceMode": "review",
    "post": {
      "id": "manual-smoke-20260427",
      "username": "chainwarshq",
      "text": "Manual smoke raid from VYNTRO. #VYNTRO",
      "url": "https://x.com/chainwarshq/status/manual-smoke-20260427",
      "mediaUrls": [],
      "isReply": false,
      "isRepost": false
    }
  }'
```

Expected review-mode response:

```json
{
  "ok": true,
  "status": "created_candidate",
  "eventId": "...",
  "candidateId": "..."
}
```

Expected auto-live response:

```json
{
  "ok": true,
  "status": "created_raid",
  "eventId": "...",
  "raidId": "...",
  "deliveries": []
}
```

## Rollback Plan

- Disable a project by setting `x_raid_sources.status = 'paused'`.
- Disable all ingest by removing the community job secret from the caller or pausing the route caller.
- Keep generated raids visible unless they are incorrect; if needed, set generated raid rows to `status = 'paused'` by `generated_by = 'tweet_to_raid'`.
- Do not drop tables during rollback. They are audit history and are safe to keep.
