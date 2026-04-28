# Manual Live Raid Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Telegram and Discord `/newraid` commands that create active VYNTRO raids from an X post URL and publish them to webapp, Telegram and Discord immediately.

**Architecture:** Add a small manual-command layer above the existing tweet-to-raid pipeline. Keep parsing/defaults/permission checks in focused core files, add a single-X-post fetcher to the X provider, then route both Telegram and Discord commands through one `createManualLiveRaidFromXPost` service that reuses existing `raids`, `x_raid_ingest_events` and community delivery helpers.

**Tech Stack:** TypeScript, Node test runner, Telegraf, discord.js slash commands, Supabase service role, existing VYNTRO community bot delivery helpers.

---

## File Structure

- Create `services/veltrix-community-bot/src/core/raids/x-post-url.ts`: Parse and normalize supported X/Twitter status URLs.
- Create `services/veltrix-community-bot/src/core/raids/manual-raid-command.ts`: Parse Telegram command text, normalize Discord options, clamp XP/duration overrides, format command replies.
- Create `services/veltrix-community-bot/src/jobs/create-manual-live-raid.ts`: Resolve project defaults, verify captain permission, fetch the X post, dedupe, create active raid, record ingest event, dispatch community delivery.
- Modify `services/veltrix-community-bot/src/providers/x/posts.ts`: Add single-post fetch support for manual command URLs.
- Modify `services/veltrix-community-bot/src/core/community/command-scopes.ts`: Add `newraid` command key and keep it gated behind `raidOpsEnabled`.
- Modify `services/veltrix-community-bot/src/providers/telegram/bot.ts`: Register `/newraid`, parse text input and call the shared manual raid job.
- Modify `services/veltrix-community-bot/src/providers/discord/commands.ts`: Register Discord slash `/newraid` with URL and optional override options.
- Modify `services/veltrix-community-bot/README.md`: Document command usage, X API cost posture and required bot settings.
- Test files live next to implementation files with `.test.ts`.

---

### Task 1: X Status URL Parser

**Files:**
- Create: `services/veltrix-community-bot/src/core/raids/x-post-url.ts`
- Test: `services/veltrix-community-bot/src/core/raids/x-post-url.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { parseXStatusUrl } from "./x-post-url.js";

test("parses x.com status URLs", () => {
  assert.deepEqual(parseXStatusUrl("https://x.com/VYNTRO_/status/1789000000000000000"), {
    ok: true,
    username: "vyntro_",
    postId: "1789000000000000000",
    canonicalUrl: "https://x.com/vyntro_/status/1789000000000000000",
  });
});

test("parses twitter.com status URLs with query strings", () => {
  assert.deepEqual(parseXStatusUrl("https://twitter.com/ChainWars/status/12345?s=20"), {
    ok: true,
    username: "chainwars",
    postId: "12345",
    canonicalUrl: "https://x.com/chainwars/status/12345",
  });
});

test("rejects non-status URLs", () => {
  assert.deepEqual(parseXStatusUrl("https://x.com/vyntro_"), {
    ok: false,
    reason: "unsupported_x_status_url",
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import ./scripts/test-env.mjs --import tsx --test "services/veltrix-community-bot/src/core/raids/x-post-url.test.ts"`

Expected: FAIL because `x-post-url.ts` does not exist.

- [ ] **Step 3: Implement parser**

```ts
import { normalizeXUsername } from "./tweet-to-raid.js";

export type ParsedXStatusUrl =
  | {
      ok: true;
      username: string;
      postId: string;
      canonicalUrl: string;
    }
  | {
      ok: false;
      reason: "unsupported_x_status_url";
    };

export function parseXStatusUrl(value: string): ParsedXStatusUrl {
  const trimmed = value.trim();
  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, reason: "unsupported_x_status_url" };
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "x.com" && host !== "twitter.com") {
    return { ok: false, reason: "unsupported_x_status_url" };
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 3 || parts[1] !== "status") {
    return { ok: false, reason: "unsupported_x_status_url" };
  }

  const username = normalizeXUsername(parts[0]);
  const postId = parts[2]?.trim() ?? "";
  if (!username || !/^[0-9]+$/.test(postId)) {
    return { ok: false, reason: "unsupported_x_status_url" };
  }

  return {
    ok: true,
    username,
    postId,
    canonicalUrl: `https://x.com/${username}/status/${postId}`,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import ./scripts/test-env.mjs --import tsx --test "services/veltrix-community-bot/src/core/raids/x-post-url.test.ts"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/veltrix-community-bot/src/core/raids/x-post-url.ts services/veltrix-community-bot/src/core/raids/x-post-url.test.ts
git commit -m "Add X status URL parser"
```

---

### Task 2: Manual Command Parsing And Override Guards

**Files:**
- Create: `services/veltrix-community-bot/src/core/raids/manual-raid-command.ts`
- Test: `services/veltrix-community-bot/src/core/raids/manual-raid-command.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";

import {
  parseTelegramNewRaidCommand,
  normalizeManualRaidOverrides,
  formatManualRaidCommandResult,
} from "./manual-raid-command.js";

test("parses telegram newraid URL and key value overrides", () => {
  assert.deepEqual(
    parseTelegramNewRaidCommand("/newraid https://x.com/vyntro_/status/123 xp=80 duration=2h campaign=starter"),
    {
      ok: true,
      url: "https://x.com/vyntro_/status/123",
      overrides: {
        xp: "80",
        duration: "2h",
        campaign: "starter",
      },
    }
  );
});

test("normalizes safe overrides and clamps XP and duration", () => {
  assert.deepEqual(
    normalizeManualRaidOverrides({
      xp: "999",
      duration: "30d",
      campaign: "starter",
      button: "Join the raid",
    }),
    {
      rewardXp: 100,
      durationMinutes: 10080,
      campaignRef: "starter",
      buttonLabel: "Join the raid",
    }
  );
});

test("formats delivery status for command replies", () => {
  assert.equal(
    formatManualRaidCommandResult({
      raidUrl: "https://veltrix-web.vercel.app/raids/raid-1",
      deliveries: [
        { provider: "telegram", ok: true },
        { provider: "discord", ok: false, error: "Missing channel" },
      ],
    }),
    "Live raid created: https://veltrix-web.vercel.app/raids/raid-1\nDelivery: telegram ok, discord failed (Missing channel)"
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import ./scripts/test-env.mjs --import tsx --test "services/veltrix-community-bot/src/core/raids/manual-raid-command.test.ts"`

Expected: FAIL because `manual-raid-command.ts` does not exist.

- [ ] **Step 3: Implement parser and guards**

```ts
import { clampGeneratedRaidXp } from "./tweet-to-raid.js";

export type ManualRaidCommandOverrides = {
  xp?: string;
  duration?: string;
  campaign?: string;
  button?: string;
};

export type NormalizedManualRaidOverrides = {
  rewardXp?: number;
  durationMinutes?: number;
  campaignRef?: string;
  buttonLabel?: string;
};

function parseDurationMinutes(value: string) {
  const match = value.trim().toLowerCase().match(/^(\d+)(m|h|d)?$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2] ?? "m";
  const multiplier = unit === "d" ? 1440 : unit === "h" ? 60 : 1;
  return amount * multiplier;
}

export function parseTelegramNewRaidCommand(text: string) {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  const url = parts.find((part) => /^https?:\/\/(x|twitter)\.com\//i.test(part)) ?? "";
  if (!url) {
    return { ok: false as const, reason: "missing_x_url" as const };
  }

  const overrides: ManualRaidCommandOverrides = {};
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    const value = rest.join("=").trim();
    if (!value) continue;
    if (key === "xp" || key === "duration" || key === "campaign" || key === "button") {
      overrides[key] = value;
    }
  }

  return { ok: true as const, url, overrides };
}

export function normalizeManualRaidOverrides(
  overrides: ManualRaidCommandOverrides
): NormalizedManualRaidOverrides {
  const rewardXp = overrides.xp ? clampGeneratedRaidXp(Number(overrides.xp)) : undefined;
  const rawDuration = overrides.duration ? parseDurationMinutes(overrides.duration) : null;
  const durationMinutes =
    rawDuration === null ? undefined : Math.min(10080, Math.max(15, Math.round(rawDuration)));
  const campaignRef = overrides.campaign?.trim() || undefined;
  const buttonLabel = overrides.button?.trim().slice(0, 32) || undefined;

  return {
    ...(rewardXp ? { rewardXp } : {}),
    ...(durationMinutes ? { durationMinutes } : {}),
    ...(campaignRef ? { campaignRef } : {}),
    ...(buttonLabel ? { buttonLabel } : {}),
  };
}

export function formatManualRaidCommandResult(params: {
  raidUrl: string;
  deliveries: Array<{ provider: string; ok: boolean; error?: string }>;
}) {
  const deliveryLabel =
    params.deliveries.length === 0
      ? "no configured delivery targets"
      : params.deliveries
          .map((delivery) =>
            delivery.ok
              ? `${delivery.provider} ok`
              : `${delivery.provider} failed (${delivery.error ?? "unknown error"})`
          )
          .join(", ");

  return `Live raid created: ${params.raidUrl}\nDelivery: ${deliveryLabel}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import ./scripts/test-env.mjs --import tsx --test "services/veltrix-community-bot/src/core/raids/manual-raid-command.test.ts"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/veltrix-community-bot/src/core/raids/manual-raid-command.ts services/veltrix-community-bot/src/core/raids/manual-raid-command.test.ts
git commit -m "Add manual raid command parsing"
```

---

### Task 3: X Single-Post Fetch

**Files:**
- Modify: `services/veltrix-community-bot/src/providers/x/posts.ts`
- Modify: `services/veltrix-community-bot/src/providers/x/posts.test.ts`

- [ ] **Step 1: Add failing mapper test**

Append to `posts.test.ts`:

```ts
import { mapXSingleTweetResponseToRaidPost } from "./posts.js";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import ./scripts/test-env.mjs --import tsx --test "services/veltrix-community-bot/src/providers/x/posts.test.ts"`

Expected: FAIL because `mapXSingleTweetResponseToRaidPost` is not exported.

- [ ] **Step 3: Implement single-post mapping and fetch**

Add types and functions to `posts.ts`:

```ts
type XApiUser = {
  id?: string;
  username?: string;
};

export type XSingleTweetResponse = {
  data?: XApiTweet;
  includes?: {
    users?: XApiUser[];
    media?: XApiMedia[];
  };
  errors?: Array<{ detail?: string; title?: string }>;
};

export function mapXSingleTweetResponseToRaidPost(
  response: XSingleTweetResponse,
  fallbackUsername: string
): XRaidPost {
  const tweet = response.data;
  if (!tweet?.id || !tweet.text) {
    throw new Error(getXApiError(response, "X post could not be found."));
  }

  const author = (response.includes?.users ?? []).find((user) => user.id === tweet.author_id);
  const username = normalizeXUsername(author?.username ?? fallbackUsername);
  const mapped = mapXTimelineResponseToRaidPosts(
    {
      data: [tweet],
      includes: {
        media: response.includes?.media ?? [],
      },
    },
    username
  )[0];

  if (!mapped) {
    throw new Error("X post could not be mapped into a raid.");
  }

  return mapped;
}

export async function fetchXPostById(params: {
  postId: string;
  fallbackUsername: string;
  bearerToken: string;
  apiBaseUrl?: string;
}) {
  const url = new URL(
    `/2/tweets/${encodeURIComponent(params.postId)}`,
    params.apiBaseUrl ?? "https://api.x.com"
  );
  url.searchParams.set("tweet.fields", "attachments,author_id,conversation_id,created_at,referenced_tweets");
  url.searchParams.set("expansions", "author_id,attachments.media_keys");
  url.searchParams.set("media.fields", "preview_image_url,type,url");
  url.searchParams.set("user.fields", "id,username,name,verified");

  const payload = await fetchXJson<XSingleTweetResponse>(url, {
    bearerToken: params.bearerToken,
  });

  return mapXSingleTweetResponseToRaidPost(payload, params.fallbackUsername);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import ./scripts/test-env.mjs --import tsx --test "services/veltrix-community-bot/src/providers/x/posts.test.ts"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/veltrix-community-bot/src/providers/x/posts.ts services/veltrix-community-bot/src/providers/x/posts.test.ts
git commit -m "Add X single post fetch support"
```

---

### Task 4: Shared Live Raid Publisher

**Files:**
- Create: `services/veltrix-community-bot/src/jobs/live-raid-publisher.ts`
- Test: `services/veltrix-community-bot/src/jobs/live-raid-publisher.test.ts`
- Modify: `services/veltrix-community-bot/src/jobs/ingest-x-raid-post.ts`

- [ ] **Step 1: Write failing pure payload test**

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { buildLiveRaidInsertPayload, buildLiveRaidDeliveryMessage } from "./live-raid-publisher.js";

test("builds a live raid insert payload from a generated draft", () => {
  assert.deepEqual(
    buildLiveRaidInsertPayload({
      projectId: "project-1",
      projectName: "Chainwars",
      campaignId: "campaign-1",
      draft: {
        title: "Raid this launch",
        shortDescription: "Raid this launch #vyntro",
        target: "Open the source post, engage with it, then confirm the raid in VYNTRO.",
        instructions: ["Open the source post."],
        sourceUrl: "https://x.com/vyntro_/status/123",
        sourceExternalId: "123",
        banner: "https://cdn.example/raid.png",
        rewardXp: 50,
        startsAt: "2026-04-28T10:00:00.000Z",
        endsAt: "2026-04-29T10:00:00.000Z",
        campaignId: "campaign-1",
        buttonLabel: "Open raid",
      },
      sourceEventId: "event-1",
      sourceProvider: "x_manual_command",
      generatedBy: "manual_raid_command",
    }),
    {
      project_id: "project-1",
      campaign_id: "campaign-1",
      title: "Raid this launch",
      short_description: "Raid this launch #vyntro",
      community: "Chainwars",
      timer: "Live",
      reward: 50,
      reward_xp: 50,
      participants: 0,
      progress: 0,
      target: "Open the source post, engage with it, then confirm the raid in VYNTRO.",
      banner: "https://cdn.example/raid.png",
      instructions: ["Open the source post."],
      status: "active",
      source_provider: "x_manual_command",
      source_url: "https://x.com/vyntro_/status/123",
      source_external_id: "123",
      source_event_id: "event-1",
      ends_at: "2026-04-29T10:00:00.000Z",
      generated_by: "manual_raid_command",
    }
  );
});

test("builds a delivery message for a live raid", () => {
  assert.equal(
    buildLiveRaidDeliveryMessage({
      title: "Raid this launch",
      shortDescription: "Raid this launch #vyntro",
      rewardXp: 50,
      sourceLabel: "X command",
    }).body,
    "Raid this launch #vyntro\n\nOpen the raid, engage with the source post, then confirm it in VYNTRO."
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import ./scripts/test-env.mjs --import tsx --test "services/veltrix-community-bot/src/jobs/live-raid-publisher.test.ts"`

Expected: FAIL because the file does not exist.

- [ ] **Step 3: Implement pure helpers and `createLiveRaidAndDeliver`**

```ts
import { supabaseAdmin } from "../lib/supabase.js";
import { type TweetToRaidDraft } from "../core/raids/tweet-to-raid.js";
import {
  appUrl,
  dispatchProjectCommunityMessageWithResults,
  type ProviderScope,
} from "../core/community/delivery.js";

export function buildLiveRaidInsertPayload(params: {
  projectId: string;
  projectName: string;
  campaignId: string | null;
  draft: TweetToRaidDraft;
  sourceEventId: string;
  sourceProvider: string;
  generatedBy: string;
}) {
  return {
    project_id: params.projectId,
    campaign_id: params.campaignId,
    title: params.draft.title,
    short_description: params.draft.shortDescription,
    community: params.projectName,
    timer: "Live",
    reward: params.draft.rewardXp,
    reward_xp: params.draft.rewardXp,
    participants: 0,
    progress: 0,
    target: params.draft.target,
    banner: params.draft.banner,
    instructions: params.draft.instructions,
    status: "active",
    source_provider: params.sourceProvider,
    source_url: params.draft.sourceUrl,
    source_external_id: params.draft.sourceExternalId,
    source_event_id: params.sourceEventId,
    ends_at: params.draft.endsAt,
    generated_by: params.generatedBy,
  };
}

export function buildLiveRaidDeliveryMessage(params: {
  title: string;
  shortDescription: string;
  rewardXp: number;
  sourceLabel: string;
}) {
  return {
    title: `LIVE RAID: ${params.title}`,
    body: `${params.shortDescription}\n\nOpen the raid, engage with the source post, then confirm it in VYNTRO.`,
    meta: [
      { label: "Reward", value: `+${params.rewardXp} XP` },
      { label: "Source", value: params.sourceLabel },
    ],
  };
}

export async function createLiveRaidAndDeliver(params: {
  projectId: string;
  projectName: string;
  draft: TweetToRaidDraft;
  sourceEventId: string;
  sourceProvider: string;
  generatedBy: string;
  providerScope?: ProviderScope;
  sourceLabel: string;
}) {
  const { data: raid, error: raidError } = await supabaseAdmin
    .from("raids")
    .insert(
      buildLiveRaidInsertPayload({
        projectId: params.projectId,
        projectName: params.projectName,
        campaignId: params.draft.campaignId,
        draft: params.draft,
        sourceEventId: params.sourceEventId,
        sourceProvider: params.sourceProvider,
        generatedBy: params.generatedBy,
      })
    )
    .select("id")
    .single();

  if (raidError) throw raidError;

  const raidUrl = `${appUrl}/raids/${raid.id}`;
  const message = buildLiveRaidDeliveryMessage({
    title: params.draft.title,
    shortDescription: params.draft.shortDescription,
    rewardXp: params.draft.rewardXp,
    sourceLabel: params.sourceLabel,
  });
  const deliveries = await dispatchProjectCommunityMessageWithResults({
    projectId: params.projectId,
    providerScope: params.providerScope ?? "both",
    title: message.title,
    body: message.body,
    eyebrow: "LIVE RAID",
    projectName: params.projectName,
    imageUrl: params.draft.banner,
    fallbackImageUrl: params.draft.banner,
    meta: message.meta,
    url: raidUrl,
    buttonLabel: params.draft.buttonLabel,
  });

  const deliveryMetadata = {
    deliveries,
    deliveredAt: new Date().toISOString(),
    sourceUrl: params.draft.sourceUrl,
  };

  await supabaseAdmin
    .from("raids")
    .update({ delivery_metadata: deliveryMetadata })
    .eq("id", raid.id);

  return {
    raidId: raid.id as string,
    raidUrl,
    deliveries,
    deliveryMetadata,
  };
}
```

- [ ] **Step 4: Replace duplicated live insert code in `ingest-x-raid-post.ts`**

Import `createLiveRaidAndDeliver` and replace the `raids.insert` + dispatch block with:

```ts
const liveRaid = await createLiveRaidAndDeliver({
  projectId: source.projectId,
  projectName: source.projectName,
  draft: decision.draft,
  sourceEventId: event.id,
  sourceProvider: "x",
  generatedBy: "tweet_to_raid",
  sourceLabel: "X",
});

await Promise.all([
  supabaseAdmin
    .from("x_raid_ingest_events")
    .update({
      raid_id: liveRaid.raidId,
      delivery_metadata: liveRaid.deliveryMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", event.id),
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
  raidId: liveRaid.raidId,
  deliveries: liveRaid.deliveries,
};
```

- [ ] **Step 5: Run targeted tests**

Run:

```bash
node --import ./scripts/test-env.mjs --import tsx --test "services/veltrix-community-bot/src/jobs/live-raid-publisher.test.ts" "services/veltrix-community-bot/src/jobs/ingest-x-raid-post.test.ts"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add services/veltrix-community-bot/src/jobs/live-raid-publisher.ts services/veltrix-community-bot/src/jobs/live-raid-publisher.test.ts services/veltrix-community-bot/src/jobs/ingest-x-raid-post.ts
git commit -m "Extract live raid publishing"
```

---

### Task 5: Manual Live Raid Job

**Files:**
- Create: `services/veltrix-community-bot/src/jobs/create-manual-live-raid.ts`
- Test: `services/veltrix-community-bot/src/jobs/create-manual-live-raid.test.ts`

- [ ] **Step 1: Write failing pure tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildManualLiveRaidDraft,
  isManualRaidDuplicateReason,
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import ./scripts/test-env.mjs --import tsx --test "services/veltrix-community-bot/src/jobs/create-manual-live-raid.test.ts"`

Expected: FAIL because the file does not exist.

- [ ] **Step 3: Implement pure draft helpers**

```ts
import { env } from "../config/env.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { captainHasPermission, loadCaptainByProviderIdentity } from "../core/community/captains.js";
import { normalizeManualRaidOverrides, type NormalizedManualRaidOverrides } from "../core/raids/manual-raid-command.js";
import { parseXStatusUrl } from "../core/raids/x-post-url.js";
import {
  clampGeneratedRaidXp,
  summarizeTweetForRaid,
  type TweetToRaidDraft,
} from "../core/raids/tweet-to-raid.js";
import { fetchXPostById, type XRaidPost } from "../providers/x/posts.js";
import { createLiveRaidAndDeliver } from "./live-raid-publisher.js";

export type ManualRaidDefaults = {
  rewardXp: number;
  durationMinutes: number;
  campaignId: string | null;
  buttonLabel: string;
  artworkUrl: string | null;
};

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function buildManualLiveRaidDraft(params: {
  projectName: string;
  post: XRaidPost;
  defaults: ManualRaidDefaults;
  overrides: NormalizedManualRaidOverrides;
  now: Date;
}): TweetToRaidDraft {
  const rewardXp = clampGeneratedRaidXp(params.overrides.rewardXp ?? params.defaults.rewardXp);
  const durationMinutes = Math.min(
    10080,
    Math.max(15, params.overrides.durationMinutes ?? params.defaults.durationMinutes)
  );
  const startsAt = params.now.toISOString();
  const endsAt = addMinutes(params.now, durationMinutes).toISOString();

  return {
    title: summarizeTweetForRaid(params.post.text, params.projectName),
    shortDescription: params.post.text.replace(/\s+/g, " ").trim(),
    target: "Open the source post, engage with it, then confirm the raid in VYNTRO.",
    instructions: [
      "Open the source post.",
      "Like, repost, comment or complete the project action honestly.",
      "Return to VYNTRO and confirm the raid once your action is complete.",
    ],
    sourceUrl: params.post.url,
    sourceExternalId: params.post.id,
    banner: params.post.mediaUrls[0] ?? params.defaults.artworkUrl,
    rewardXp,
    startsAt,
    endsAt,
    campaignId: params.defaults.campaignId,
    buttonLabel: params.overrides.buttonLabel ?? params.defaults.buttonLabel,
  };
}

export function isManualRaidDuplicateReason(reason: string) {
  return reason === "duplicate_post";
}
```

- [ ] **Step 4: Implement DB-backed `createManualLiveRaidFromXPost`**

Continue in the same file:

```ts
async function loadProject(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, name, slug")
    .eq("id", projectId)
    .single();
  if (error) throw error;
  return data as { id: string; name: string | null; slug: string | null };
}

async function loadDefaults(projectId: string, username: string): Promise<ManualRaidDefaults> {
  const { data, error } = await supabaseAdmin
    .from("x_raid_sources")
    .select("default_reward_xp, default_duration_minutes, default_campaign_id, default_button_label, default_artwork_url")
    .eq("project_id", projectId)
    .ilike("x_username", username)
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  return {
    rewardXp: data?.default_reward_xp ?? 50,
    durationMinutes: data?.default_duration_minutes ?? 1440,
    campaignId: data?.default_campaign_id ?? null,
    buttonLabel: data?.default_button_label ?? "Open raid",
    artworkUrl: data?.default_artwork_url ?? null,
  };
}

async function assertAuthorizedCaptain(params: {
  projectId: string;
  provider: "telegram" | "discord";
  providerUserId: string;
}) {
  const captain = await loadCaptainByProviderIdentity(params);
  if (!captainHasPermission(captain, "raid_alert", "community_only")) {
    throw new Error("Only project captains with raid alert permission can create live raids.");
  }
}

export async function createManualLiveRaidFromXPost(params: {
  projectId: string;
  xUrl: string;
  actorProvider: "telegram" | "discord";
  actorProviderUserId: string;
  overrides?: Record<string, string | undefined>;
}) {
  await assertAuthorizedCaptain({
    projectId: params.projectId,
    provider: params.actorProvider,
    providerUserId: params.actorProviderUserId,
  });

  if (!env.X_API_BEARER_TOKEN) {
    throw new Error("X_API_BEARER_TOKEN is missing on the community bot deployment.");
  }

  const parsed = parseXStatusUrl(params.xUrl);
  if (!parsed.ok) {
    throw new Error("Paste a valid X status URL, for example https://x.com/project/status/123.");
  }

  const { data: existing } = await supabaseAdmin
    .from("x_raid_ingest_events")
    .select("id, raid_id")
    .eq("project_id", params.projectId)
    .eq("x_post_id", parsed.postId)
    .maybeSingle();
  if (existing?.raid_id) {
    return {
      ok: true as const,
      status: "skipped" as const,
      reason: "duplicate_post" as const,
      raidId: existing.raid_id as string,
    };
  }

  const [project, defaults, post] = await Promise.all([
    loadProject(params.projectId),
    loadDefaults(params.projectId, parsed.username),
    fetchXPostById({
      postId: parsed.postId,
      fallbackUsername: parsed.username,
      bearerToken: env.X_API_BEARER_TOKEN,
    }),
  ]);

  const normalizedOverrides = normalizeManualRaidOverrides(params.overrides ?? {});
  const draft = buildManualLiveRaidDraft({
    projectName: project.name ?? "Project",
    post,
    defaults,
    overrides: normalizedOverrides,
    now: new Date(),
  });

  const { data: event, error: eventError } = await supabaseAdmin
    .from("x_raid_ingest_events")
    .insert({
      project_id: params.projectId,
      source_id: null,
      x_post_id: post.id,
      x_author_id: post.authorId,
      x_username: post.username,
      post_url: post.url,
      text: post.text,
      media_urls: post.mediaUrls,
      decision: "created_raid",
      decision_reason: "manual_command",
      raw_payload: {
        manual: true,
        commandSource: params.actorProvider,
        commandActorProviderUserId: params.actorProviderUserId,
        commandOverrides: normalizedOverrides,
      },
    })
    .select("id")
    .single();
  if (eventError) throw eventError;

  const liveRaid = await createLiveRaidAndDeliver({
    projectId: params.projectId,
    projectName: project.name ?? "Project",
    draft,
    sourceEventId: event.id,
    sourceProvider: "x_manual_command",
    generatedBy: "manual_raid_command",
    sourceLabel: "X command",
  });

  await supabaseAdmin
    .from("x_raid_ingest_events")
    .update({
      raid_id: liveRaid.raidId,
      delivery_metadata: liveRaid.deliveryMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", event.id);

  return {
    ok: true as const,
    status: "created_raid" as const,
    eventId: event.id as string,
    raidId: liveRaid.raidId,
    raidUrl: liveRaid.raidUrl,
    deliveries: liveRaid.deliveries,
  };
}
```

- [ ] **Step 5: Run targeted tests**

Run: `node --import ./scripts/test-env.mjs --import tsx --test "services/veltrix-community-bot/src/jobs/create-manual-live-raid.test.ts"`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add services/veltrix-community-bot/src/jobs/create-manual-live-raid.ts services/veltrix-community-bot/src/jobs/create-manual-live-raid.test.ts
git commit -m "Add manual live raid job"
```

---

### Task 6: Command Scope And Telegram `/newraid`

**Files:**
- Modify: `services/veltrix-community-bot/src/core/community/command-scopes.ts`
- Modify: `services/veltrix-community-bot/src/providers/telegram/bot.ts`

- [ ] **Step 1: Add `newraid` command key**

Modify `CommunityCommandKey`:

```ts
export type CommunityCommandKey =
  | "link"
  | "profile"
  | "rank"
  | "missions"
  | "leaderboard"
  | "raid"
  | "newraid"
  | "captain";
```

Update `isCommunityCommandEnabled`:

```ts
if (params.command === "raid" || params.command === "newraid") {
  return params.settings.raidOpsEnabled === true;
}
```

Update disabled message:

```ts
if (command === "raid" || command === "newraid") {
  return "Raid ops are disabled for this community right now. Enable them in the VYNTRO portal first.";
}
```

- [ ] **Step 2: Add Telegram command to payload and command list**

In `buildTelegramCommandPayload`, replace the raid command block with:

```ts
...(settings.raidOpsEnabled
  ? [
      { command: "raid", description: "Show the live raid rail" },
      { command: "newraid", description: "Create a live raid from an X post URL" },
    ]
  : []),
```

In `listEnabledTelegramCommands`, add:

```ts
if (settings.raidOpsEnabled) {
  commands.push("/raid", "/newraid");
}
```

In `launchTelegramBot().setMyCommands`, add:

```ts
{ command: "newraid", description: "Create a live raid from an X post URL" },
```

- [ ] **Step 3: Add Telegram command handler**

Import:

```ts
import {
  formatManualRaidCommandResult,
  normalizeManualRaidOverrides,
  parseTelegramNewRaidCommand,
} from "../../core/raids/manual-raid-command.js";
import { createManualLiveRaidFromXPost } from "../../jobs/create-manual-live-raid.js";
```

Register before `/captain`:

```ts
bot.command("newraid", async (ctx) => {
  const context = await resolveCommunityContext(ctx, "newraid");
  if (!context) return;

  const parsed = parseTelegramNewRaidCommand(ctx.message?.text ?? "");
  if (!parsed.ok) {
    await ctx.reply("Usage: /newraid https://x.com/project/status/123 xp=50 duration=24h");
    return;
  }

  const providerUserId = String(ctx.from?.id ?? "");
  const result = await createManualLiveRaidFromXPost({
    projectId: context.projectId,
    xUrl: parsed.url,
    actorProvider: "telegram",
    actorProviderUserId: providerUserId,
    overrides: parsed.overrides,
  });

  if (result.status === "skipped") {
    await ctx.reply("That X post is already linked to a VYNTRO raid for this project.");
    return;
  }

  await ctx.reply(
    formatManualRaidCommandResult({
      raidUrl: result.raidUrl,
      deliveries: result.deliveries,
    })
  );
});
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck --workspace vyntro-community-bot`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/veltrix-community-bot/src/core/community/command-scopes.ts services/veltrix-community-bot/src/providers/telegram/bot.ts
git commit -m "Add Telegram newraid command"
```

---

### Task 7: Discord `/newraid`

**Files:**
- Modify: `services/veltrix-community-bot/src/providers/discord/commands.ts`

- [ ] **Step 1: Import shared command helpers**

Add imports:

```ts
import {
  formatManualRaidCommandResult,
  normalizeManualRaidOverrides,
} from "../../core/raids/manual-raid-command.js";
import { createManualLiveRaidFromXPost } from "../../jobs/create-manual-live-raid.js";
```

- [ ] **Step 2: Add handler**

Add after `handleRaidCommand`:

```ts
async function handleNewRaidCommand(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      ephemeral: true,
      content: "This command only works inside a Discord server.",
    });
    return;
  }

  const context = await loadDiscordIntegrationContextByGuildId(guildId);
  if (!context) {
    await interaction.reply({
      ephemeral: true,
      content: "This Discord server is not mapped to a VYNTRO project yet. Connect it in the portal first.",
    });
    return;
  }

  if (!isCommunityCommandEnabled({ command: "newraid", platform: "discord", settings: context.settings })) {
    await replyCommandDisabled(interaction, "newraid");
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  const result = await createManualLiveRaidFromXPost({
    projectId: context.projectId,
    xUrl: interaction.options.getString("url", true),
    actorProvider: "discord",
    actorProviderUserId: interaction.user.id,
    overrides: {
      xp: interaction.options.getInteger("xp")?.toString(),
      duration: interaction.options.getString("duration") ?? undefined,
      campaign: interaction.options.getString("campaign") ?? undefined,
      button: interaction.options.getString("button") ?? undefined,
    },
  });

  if (result.status === "skipped") {
    await interaction.editReply("That X post is already linked to a VYNTRO raid for this project.");
    return;
  }

  await interaction.editReply(
    formatManualRaidCommandResult({
      raidUrl: result.raidUrl,
      deliveries: result.deliveries,
    })
  );
}
```

- [ ] **Step 3: Route command**

In `handleChatCommand`, add before `captain`:

```ts
if (interaction.commandName === "newraid") {
  await handleNewRaidCommand(interaction);
  return;
}
```

- [ ] **Step 4: Register slash command**

Inside the `raidOpsEnabled` command builder array, add after `/raid`:

```ts
new SlashCommandBuilder()
  .setName("newraid")
  .setDescription("Create a live VYNTRO raid from an X post URL.")
  .addStringOption((option) =>
    option
      .setName("url")
      .setDescription("The X post URL to turn into a live raid.")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("xp")
      .setDescription("Optional XP override, capped by VYNTRO policy.")
      .setMinValue(10)
      .setMaxValue(100)
  )
  .addStringOption((option) =>
    option
      .setName("duration")
      .setDescription("Optional duration such as 30m, 2h or 1d.")
  )
  .addStringOption((option) =>
    option
      .setName("campaign")
      .setDescription("Optional campaign slug or id.")
  )
  .addStringOption((option) =>
    option
      .setName("button")
      .setDescription("Optional CTA label.")
  ),
```

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck --workspace vyntro-community-bot`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add services/veltrix-community-bot/src/providers/discord/commands.ts
git commit -m "Add Discord newraid command"
```

---

### Task 8: Docs, Verify And Push

**Files:**
- Modify: `services/veltrix-community-bot/README.md`

- [ ] **Step 1: Add README command docs**

Add this section:

```md
## Manual Live Raid Commands

Project captains with the `raid_alert` permission can create live raids directly from Telegram or Discord.

Telegram:

```text
/newraid https://x.com/project/status/123 xp=50 duration=24h
```

Discord:

```text
/newraid url:https://x.com/project/status/123 xp:50 duration:24h
```

The command uses VYNTRO's configured `X_API_BEARER_TOKEN`, creates an active raid immediately, publishes it on the webapp and pushes the raid card to configured Telegram and Discord targets. XP and duration overrides are capped by VYNTRO policy. Duplicate X posts are skipped per project.
```

- [ ] **Step 2: Run full verification**

Run: `npm run verify`

Expected: PASS for typecheck, builds, lint and tests.

- [ ] **Step 3: Commit docs if changed**

```bash
git add services/veltrix-community-bot/README.md
git commit -m "Document manual live raid commands"
```

- [ ] **Step 4: Push live branches**

```bash
git push origin codex/galxe-translation-wave1
git push origin codex/galxe-translation-wave1:main
git push origin codex/galxe-translation-wave1:master
```

Expected: GitHub receives the new bot command commits, and Render redeploys `vyntro-community-bot` from the connected production branch.

- [ ] **Step 5: Live smoke test**

After Render deploy completes:

```bash
Invoke-WebRequest -UseBasicParsing https://veltrix-community-bot.onrender.com/health
```

Expected: `tweetToRaid.xApiConfigured` is `true`, Discord/Telegram providers remain enabled, and the service is healthy.

Then sync Discord commands if the live bot does not auto-sync on boot, and test:

```text
/newraid https://x.com/vyntro_/status/<real-test-post-id> xp=50 duration=24h
```

Expected: active raid appears at `https://veltrix-web.vercel.app/raids`, command reply includes the live raid URL, and delivery status lists Telegram/Discord.

---

## Self-Review

- Spec coverage: The plan covers live-only command creation, VYNTRO-owned X API, safe overrides, captain permission, Telegram, Discord, webapp visibility through `raids`, delivery through existing helpers, duplicate protection and docs.
- Placeholder scan: The plan does not contain unresolved placeholder markers, vague error-handling instructions or undefined task references.
- Type consistency: `newraid`, `createManualLiveRaidFromXPost`, `parseXStatusUrl`, `fetchXPostById`, `buildManualLiveRaidDraft` and `createLiveRaidAndDeliver` are introduced before downstream tasks use them.
