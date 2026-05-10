# Platform Quest Pack v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship first-party VYNTRO platform quests under project `c0951cfd-b434-41d5-977d-813156934493`, with fixed shard rewards for verified actions and no separate platform hub.

**Architecture:** Keep platform quests as normal `quests` rows and add focused server-side helpers for platform quest catalog, eligibility, and shard awards. Reuse existing `xp_events`, `user_global_reputation`, `quest_submissions`, `defi_swap_intents`, `shard_ledger`, and project detail surfaces.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Node test runner with `tsx`, SQL migrations.

---

## File Structure

- Create `apps/veltrix-web/src/lib/platform-quests/platform-quest-catalog.ts`: constants, quest slugs, VYNTRO project id, fixed shard amounts, seed rows, cadence metadata, and helper lookup functions.
- Create `apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.ts`: pure eligibility rules for onboarding, swap, daily real action, weekly streak, invite, and lootbox milestone.
- Create `apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts`: pure unit tests for reward amounts, caps, Discord/Telegram exclusion, daily/weekly windows, and source dedupe refs.
- Create `apps/veltrix-web/src/lib/platform-quests/platform-quest-awards.ts`: server helper that grants shards through existing `grantShards` after checking eligibility and trust posture.
- Create `apps/veltrix-web/src/lib/platform-quests/platform-quest-awards.test.ts`: unit tests around award request construction and blocked states using injected test doubles.
- Create `apps/veltrix-web/src/app/api/platform-quests/claim/route.ts`: authenticated endpoint to claim shard-bearing platform quest rewards after the normal quest/action proof exists.
- Create `database/migrations/vyntro_platform_quest_pack_v1.sql`: idempotently seed VYNTRO platform quest rows under the existing project id, excluding Discord and Telegram joins.
- Modify `apps/veltrix-web/src/types/live.ts`: add optional platform quest metadata fields to `LiveQuest`.
- Modify `apps/veltrix-web/src/hooks/use-live-user-data.ts`: expose platform quest metadata from `verification_config`.
- Modify `apps/veltrix-web/src/components/quests/quests-screen.tsx`: add small platform/shard labels only when metadata exists.
- Modify `apps/veltrix-web/src/components/projects/project-detail-screen.tsx`: keep normal project layout, but show shard metadata in the existing Daily quests column.

## Task 1: Platform Quest Catalog

**Files:**
- Create: `apps/veltrix-web/src/lib/platform-quests/platform-quest-catalog.ts`
- Test: `apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts`

- [ ] **Step 1: Write catalog tests**

Add this to `apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  PLATFORM_QUEST_PROJECT_ID,
  PLATFORM_QUESTS,
  getPlatformQuestBySlug,
  getShardBearingPlatformQuests,
} from "./platform-quest-catalog";

test("platform quest catalog uses the existing VYNTRO project and excludes duplicate social joins", () => {
  assert.equal(PLATFORM_QUEST_PROJECT_ID, "c0951cfd-b434-41d5-977d-813156934493");
  assert.equal(PLATFORM_QUESTS.some((quest) => quest.questType === "discord_join"), false);
  assert.equal(PLATFORM_QUESTS.some((quest) => quest.questType === "telegram_join"), false);
  assert.equal(getPlatformQuestBySlug("first-verified-swap")?.shardRewardAmount, 25);
});

test("platform quest catalog exposes only shard-bearing quests for shard claim routes", () => {
  const shardQuests = getShardBearingPlatformQuests();
  assert.deepEqual(
    shardQuests.map((quest) => [quest.slug, quest.shardRewardAmount]),
    [
      ["first-verified-swap", 25],
      ["daily-real-action", 3],
      ["weekly-activity-streak", 40],
      ["verified-invite", 20],
      ["first-lootbox-open", 15],
    ]
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts`

Expected: FAIL with a module-not-found error for `./platform-quest-catalog`.

- [ ] **Step 3: Create catalog implementation**

Create `apps/veltrix-web/src/lib/platform-quests/platform-quest-catalog.ts`:

```ts
export const PLATFORM_QUEST_PROJECT_ID = "c0951cfd-b434-41d5-977d-813156934493";

export type PlatformQuestCadence = "onboarding" | "daily" | "weekly" | "lifetime";
export type PlatformQuestSlug =
  | "connect-wallet"
  | "complete-profile"
  | "join-vyntro-community"
  | "first-safe-swap-review"
  | "first-verified-swap"
  | "daily-check-in"
  | "daily-real-action"
  | "weekly-activity-streak"
  | "verified-invite"
  | "first-lootbox-open";

export type PlatformQuestDefinition = {
  slug: PlatformQuestSlug;
  title: string;
  description: string;
  questType: string;
  cadence: PlatformQuestCadence;
  projectPoints: number;
  proofRequired: boolean;
  proofType: "none" | "tx_hash" | "url" | "wallet";
  verificationType: "rule_auto" | "event_check" | "wallet_check" | "manual_review";
  completionMode: "rule_auto" | "integration_auto" | "manual";
  actionLabel: string;
  actionUrl: string | null;
  shardRewardAmount: number;
  shardRewardWindow: "none" | "daily" | "weekly" | "lifetime";
};

export const PLATFORM_QUESTS: PlatformQuestDefinition[] = [
  {
    slug: "connect-wallet",
    title: "Connect your wallet",
    description: "Verify the wallet that will anchor swaps, DeFi reads, XP and future shard claims.",
    questType: "wallet_connect",
    cadence: "onboarding",
    projectPoints: 50,
    proofRequired: false,
    proofType: "wallet",
    verificationType: "wallet_check",
    completionMode: "integration_auto",
    actionLabel: "Connect wallet",
    actionUrl: "/profile/edit",
    shardRewardAmount: 0,
    shardRewardWindow: "none",
  },
  {
    slug: "complete-profile",
    title: "Complete your profile",
    description: "Add the profile basics VYNTRO uses for reputation, rewards and visible standing.",
    questType: "profile_complete",
    cadence: "onboarding",
    projectPoints: 40,
    proofRequired: false,
    proofType: "none",
    verificationType: "rule_auto",
    completionMode: "rule_auto",
    actionLabel: "Edit profile",
    actionUrl: "/profile/edit",
    shardRewardAmount: 0,
    shardRewardWindow: "none",
  },
  {
    slug: "join-vyntro-community",
    title: "Join VYNTRO community",
    description: "Join the VYNTRO project context so platform quests roll into one standing surface.",
    questType: "community_join",
    cadence: "onboarding",
    projectPoints: 35,
    proofRequired: false,
    proofType: "none",
    verificationType: "rule_auto",
    completionMode: "rule_auto",
    actionLabel: "Join community",
    actionUrl: `/communities/${PLATFORM_QUEST_PROJECT_ID}`,
    shardRewardAmount: 0,
    shardRewardWindow: "none",
  },
  {
    slug: "first-safe-swap-review",
    title: "Review your first safe swap route",
    description: "Open VYNTRO Swap and review route, fee, slippage and custody notes before signing anything.",
    questType: "swap_review",
    cadence: "lifetime",
    projectPoints: 45,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Review swap",
    actionUrl: "/defi/swap",
    shardRewardAmount: 0,
    shardRewardWindow: "none",
  },
  {
    slug: "first-verified-swap",
    title: "Complete your first verified swap",
    description: "Confirm a non-custodial VYNTRO swap from your verified wallet.",
    questType: "defi_swap",
    cadence: "lifetime",
    projectPoints: 120,
    proofRequired: true,
    proofType: "tx_hash",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Open swap",
    actionUrl: "/defi/swap",
    shardRewardAmount: 25,
    shardRewardWindow: "lifetime",
  },
  {
    slug: "daily-check-in",
    title: "Daily check-in",
    description: "Open your VYNTRO command surface and keep the daily XP loop alive.",
    questType: "daily_check_in",
    cadence: "daily",
    projectPoints: 20,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Open home",
    actionUrl: "/home",
    shardRewardAmount: 0,
    shardRewardWindow: "none",
  },
  {
    slug: "daily-real-action",
    title: "Complete a real daily action",
    description: "Complete one verified quest, raid, swap, DeFi claim or lootbox action today.",
    questType: "daily_platform_action",
    cadence: "daily",
    projectPoints: 35,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Find action",
    actionUrl: "/quests",
    shardRewardAmount: 3,
    shardRewardWindow: "daily",
  },
  {
    slug: "weekly-activity-streak",
    title: "Weekly activity streak",
    description: "Complete at least three real platform actions in the weekly window.",
    questType: "weekly_activity_streak",
    cadence: "weekly",
    projectPoints: 100,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Build streak",
    actionUrl: "/xp",
    shardRewardAmount: 40,
    shardRewardWindow: "weekly",
  },
  {
    slug: "verified-invite",
    title: "Invite an activated friend",
    description: "Invite a friend and earn only after they activate with a real VYNTRO action.",
    questType: "referral",
    cadence: "weekly",
    projectPoints: 60,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Invite friend",
    actionUrl: "/profile/invites",
    shardRewardAmount: 20,
    shardRewardWindow: "weekly",
  },
  {
    slug: "first-lootbox-open",
    title: "Open your first lootbox",
    description: "Spend shards on your first lootbox and record the milestone.",
    questType: "lootbox_open",
    cadence: "lifetime",
    projectPoints: 45,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Open lootboxes",
    actionUrl: "/lootboxes",
    shardRewardAmount: 15,
    shardRewardWindow: "lifetime",
  },
];

export function getPlatformQuestBySlug(slug: string) {
  return PLATFORM_QUESTS.find((quest) => quest.slug === slug) ?? null;
}

export function getShardBearingPlatformQuests() {
  return PLATFORM_QUESTS.filter((quest) => quest.shardRewardAmount > 0);
}
```

- [ ] **Step 4: Run catalog tests**

Run: `npm test -- apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts`

Expected: PASS for the two catalog tests.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/veltrix-web/src/lib/platform-quests/platform-quest-catalog.ts apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts
git commit -m "feat: add platform quest catalog"
```

## Task 2: Eligibility Rules

**Files:**
- Modify: `apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts`
- Create: `apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.ts`

- [ ] **Step 1: Add failing eligibility tests**

Append to `platform-quest-eligibility.test.ts`:

```ts
import {
  buildPlatformQuestEligibility,
  buildPlatformQuestShardSource,
  getUtcDayKey,
  getUtcWeekKey,
} from "./platform-quest-eligibility";

test("platform quest eligibility unlocks only verified swap and blocks repeated lifetime claim", () => {
  const eligible = buildPlatformQuestEligibility({
    slug: "first-verified-swap",
    now: "2026-05-10T12:00:00.000Z",
    trustStatus: "active",
    sybilScore: 0,
    events: {
      confirmedSwapCount: 1,
      realActionsToday: 0,
      realActionsThisWeek: 0,
      activatedInvitesThisWeek: 0,
      openedLootboxCount: 0,
    },
    claimedSourceRefs: [],
  });
  assert.deepEqual(eligible, { ok: true, shardAmount: 25, windowKey: "lifetime" });

  const repeated = buildPlatformQuestEligibility({
    slug: "first-verified-swap",
    now: "2026-05-10T12:00:00.000Z",
    trustStatus: "active",
    sybilScore: 0,
    events: {
      confirmedSwapCount: 1,
      realActionsToday: 0,
      realActionsThisWeek: 0,
      activatedInvitesThisWeek: 0,
      openedLootboxCount: 0,
    },
    claimedSourceRefs: ["platform_quest:first-verified-swap:lifetime"],
  });
  assert.equal(repeated.ok, false);
  assert.equal(repeated.reason, "already-claimed");
});

test("platform quest eligibility applies daily and weekly windows", () => {
  assert.equal(getUtcDayKey("2026-05-10T23:59:00.000Z"), "2026-05-10");
  assert.equal(getUtcWeekKey("2026-05-10T12:00:00.000Z"), "2026-W19");

  const daily = buildPlatformQuestEligibility({
    slug: "daily-real-action",
    now: "2026-05-10T12:00:00.000Z",
    trustStatus: "active",
    sybilScore: 0,
    events: {
      confirmedSwapCount: 0,
      realActionsToday: 1,
      realActionsThisWeek: 1,
      activatedInvitesThisWeek: 0,
      openedLootboxCount: 0,
    },
    claimedSourceRefs: [],
  });
  assert.deepEqual(daily, { ok: true, shardAmount: 3, windowKey: "2026-05-10" });

  const weekly = buildPlatformQuestEligibility({
    slug: "weekly-activity-streak",
    now: "2026-05-10T12:00:00.000Z",
    trustStatus: "active",
    sybilScore: 0,
    events: {
      confirmedSwapCount: 0,
      realActionsToday: 1,
      realActionsThisWeek: 3,
      activatedInvitesThisWeek: 0,
      openedLootboxCount: 0,
    },
    claimedSourceRefs: [],
  });
  assert.deepEqual(weekly, { ok: true, shardAmount: 40, windowKey: "2026-W19" });
});

test("platform quest eligibility blocks review and high sybil accounts", () => {
  const result = buildPlatformQuestEligibility({
    slug: "weekly-activity-streak",
    now: "2026-05-10T12:00:00.000Z",
    trustStatus: "review",
    sybilScore: 91,
    events: {
      confirmedSwapCount: 0,
      realActionsToday: 1,
      realActionsThisWeek: 3,
      activatedInvitesThisWeek: 0,
      openedLootboxCount: 0,
    },
    claimedSourceRefs: [],
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "trust-blocked");
});

test("platform quest shard source is stable for dedupe", () => {
  assert.deepEqual(buildPlatformQuestShardSource("weekly-activity-streak", "2026-W19"), {
    sourceType: "platform_quest",
    sourceRef: "platform_quest:weekly-activity-streak:2026-W19",
    action: "claim",
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts`

Expected: FAIL with missing exports from `platform-quest-eligibility`.

- [ ] **Step 3: Create eligibility implementation**

Create `apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.ts`:

```ts
import { getPlatformQuestBySlug, type PlatformQuestSlug } from "./platform-quest-catalog";

export type PlatformQuestEligibilityEvents = {
  confirmedSwapCount: number;
  realActionsToday: number;
  realActionsThisWeek: number;
  activatedInvitesThisWeek: number;
  openedLootboxCount: number;
};

export type PlatformQuestEligibilityInput = {
  slug: PlatformQuestSlug;
  now?: string;
  trustStatus?: string | null;
  sybilScore?: number | null;
  events: PlatformQuestEligibilityEvents;
  claimedSourceRefs?: string[];
};

export type PlatformQuestEligibilityResult =
  | { ok: true; shardAmount: number; windowKey: string }
  | {
      ok: false;
      reason:
        | "unknown-quest"
        | "not-shard-bearing"
        | "trust-blocked"
        | "not-eligible"
        | "already-claimed";
      message: string;
    };

export function getUtcDayKey(now = new Date().toISOString()) {
  return new Date(now).toISOString().slice(0, 10);
}

export function getUtcWeekKey(now = new Date().toISOString()) {
  const date = new Date(now);
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function buildPlatformQuestShardSource(slug: PlatformQuestSlug, windowKey: string) {
  return {
    sourceType: "platform_quest",
    sourceRef: `platform_quest:${slug}:${windowKey}`,
    action: "claim",
  };
}

export function buildPlatformQuestEligibility(
  input: PlatformQuestEligibilityInput
): PlatformQuestEligibilityResult {
  const quest = getPlatformQuestBySlug(input.slug);
  if (!quest) {
    return { ok: false, reason: "unknown-quest", message: "Unknown platform quest." };
  }

  if (quest.shardRewardAmount <= 0) {
    return {
      ok: false,
      reason: "not-shard-bearing",
      message: "This platform quest does not award shards.",
    };
  }

  if ((input.trustStatus && input.trustStatus !== "active") || Number(input.sybilScore ?? 0) >= 90) {
    return {
      ok: false,
      reason: "trust-blocked",
      message: "This account needs trust review before shard rewards can be claimed.",
    };
  }

  const now = input.now ?? new Date().toISOString();
  const windowKey =
    quest.shardRewardWindow === "daily"
      ? getUtcDayKey(now)
      : quest.shardRewardWindow === "weekly"
        ? getUtcWeekKey(now)
        : "lifetime";
  const sourceRef = buildPlatformQuestShardSource(input.slug, windowKey).sourceRef;

  if ((input.claimedSourceRefs ?? []).includes(sourceRef)) {
    return {
      ok: false,
      reason: "already-claimed",
      message: "This platform shard reward was already claimed.",
    };
  }

  const eligible =
    input.slug === "first-verified-swap"
      ? input.events.confirmedSwapCount > 0
      : input.slug === "daily-real-action"
        ? input.events.realActionsToday > 0
        : input.slug === "weekly-activity-streak"
          ? input.events.realActionsThisWeek >= 3
          : input.slug === "verified-invite"
            ? input.events.activatedInvitesThisWeek > 0
            : input.slug === "first-lootbox-open"
              ? input.events.openedLootboxCount > 0
              : false;

  if (!eligible) {
    return {
      ok: false,
      reason: "not-eligible",
      message: "This platform shard reward is not eligible yet.",
    };
  }

  return { ok: true, shardAmount: quest.shardRewardAmount, windowKey };
}
```

- [ ] **Step 4: Run eligibility tests**

Run: `npm test -- apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.ts apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts
git commit -m "feat: add platform quest eligibility"
```

## Task 3: Shard Award Helper

**Files:**
- Create: `apps/veltrix-web/src/lib/platform-quests/platform-quest-awards.ts`
- Create: `apps/veltrix-web/src/lib/platform-quests/platform-quest-awards.test.ts`

- [ ] **Step 1: Write award helper tests**

Create `apps/veltrix-web/src/lib/platform-quests/platform-quest-awards.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { buildPlatformQuestShardAwardRequest } from "./platform-quest-awards";

test("platform quest award request maps eligibility to shard ledger input", () => {
  const request = buildPlatformQuestShardAwardRequest({
    authUserId: "user-1",
    slug: "weekly-activity-streak",
    now: "2026-05-10T12:00:00.000Z",
    eligibility: { ok: true, shardAmount: 40, windowKey: "2026-W19" },
  });

  assert.deepEqual(request, {
    authUserId: "user-1",
    amount: 40,
    sourceType: "platform_quest",
    sourceRef: "platform_quest:weekly-activity-streak:2026-W19",
    action: "claim",
    reason: "Platform quest reward: weekly-activity-streak",
    metadata: {
      source: "vyntro_platform_quest",
      slug: "weekly-activity-streak",
      windowKey: "2026-W19",
    },
  });
});

test("platform quest award request returns null for blocked eligibility", () => {
  const request = buildPlatformQuestShardAwardRequest({
    authUserId: "user-1",
    slug: "weekly-activity-streak",
    now: "2026-05-10T12:00:00.000Z",
    eligibility: {
      ok: false,
      reason: "not-eligible",
      message: "This platform shard reward is not eligible yet.",
    },
  });

  assert.equal(request, null);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- apps/veltrix-web/src/lib/platform-quests/platform-quest-awards.test.ts`

Expected: FAIL with module-not-found for `platform-quest-awards`.

- [ ] **Step 3: Create award helper**

Create `apps/veltrix-web/src/lib/platform-quests/platform-quest-awards.ts`:

```ts
import { grantShards, type ServiceSupabase } from "@/lib/lootboxes/shard-server";
import {
  buildPlatformQuestShardSource,
  type PlatformQuestEligibilityResult,
} from "./platform-quest-eligibility";
import type { PlatformQuestSlug } from "./platform-quest-catalog";

export function buildPlatformQuestShardAwardRequest(input: {
  authUserId: string;
  slug: PlatformQuestSlug;
  now?: string;
  eligibility: PlatformQuestEligibilityResult;
}) {
  if (!input.eligibility.ok) {
    return null;
  }

  const source = buildPlatformQuestShardSource(input.slug, input.eligibility.windowKey);

  return {
    authUserId: input.authUserId,
    amount: input.eligibility.shardAmount,
    sourceType: source.sourceType,
    sourceRef: source.sourceRef,
    action: source.action,
    reason: `Platform quest reward: ${input.slug}`,
    metadata: {
      source: "vyntro_platform_quest",
      slug: input.slug,
      windowKey: input.eligibility.windowKey,
    },
  };
}

export async function grantPlatformQuestShards(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  slug: PlatformQuestSlug;
  eligibility: PlatformQuestEligibilityResult;
}) {
  const request = buildPlatformQuestShardAwardRequest({
    authUserId: params.authUserId,
    slug: params.slug,
    eligibility: params.eligibility,
  });

  if (!request) {
    return {
      ok: false as const,
      error: params.eligibility.ok ? "Shard award request could not be built." : params.eligibility.message,
      reason: params.eligibility.ok ? "invalid-award" : params.eligibility.reason,
    };
  }

  const result = await grantShards({
    serviceSupabase: params.serviceSupabase,
    ...request,
  });

  return {
    ok: true as const,
    ...result,
  };
}
```

- [ ] **Step 4: Run award helper tests**

Run: `npm test -- apps/veltrix-web/src/lib/platform-quests/platform-quest-awards.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/veltrix-web/src/lib/platform-quests/platform-quest-awards.ts apps/veltrix-web/src/lib/platform-quests/platform-quest-awards.test.ts
git commit -m "feat: add platform quest shard awards"
```

## Task 4: Seed Migration

**Files:**
- Create: `database/migrations/vyntro_platform_quest_pack_v1.sql`
- Test: add assertions to `apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts`

- [ ] **Step 1: Add seed consistency test**

Append to `platform-quest-eligibility.test.ts`:

```ts
import { readFileSync } from "node:fs";

test("platform quest seed migration includes all catalog slugs and no discord telegram duplicates", () => {
  const migration = readFileSync(
    new URL("../../../../database/migrations/vyntro_platform_quest_pack_v1.sql", import.meta.url),
    "utf8"
  );

  for (const quest of PLATFORM_QUESTS) {
    assert.match(migration, new RegExp(`"platformQuestSlug"\\\\s*,\\\\s*'${quest.slug}'`));
  }

  assert.doesNotMatch(migration, /discord_join/i);
  assert.doesNotMatch(migration, /telegram_join/i);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts`

Expected: FAIL because `database/migrations/vyntro_platform_quest_pack_v1.sql` does not exist.

- [ ] **Step 3: Create idempotent SQL migration**

Create `database/migrations/vyntro_platform_quest_pack_v1.sql`:

```sql
-- VYNTRO Platform Quest Pack v1
-- Seeds first-party platform quests under the existing VYNTRO project.

do $$
declare
  v_project_id uuid := 'c0951cfd-b434-41d5-977d-813156934493'::uuid;
begin
  insert into public.quests (
    project_id,
    campaign_id,
    title,
    description,
    type,
    quest_type,
    xp,
    status,
    action_label,
    action_url,
    proof_required,
    proof_type,
    verification_type,
    verification_provider,
    completion_mode,
    verification_config,
    auto_approve
  )
  values
    (v_project_id, null, 'Connect your wallet', 'Verify the wallet that will anchor swaps, DeFi reads, XP and future shard claims.', 'Platform', 'wallet_connect', 50, 'active', 'Connect wallet', '/profile/edit', false, 'wallet', 'wallet_check', 'wallet', 'integration_auto', jsonb_build_object('platformQuest', true, 'platformQuestSlug', 'connect-wallet', 'cadence', 'onboarding', 'shardRewardAmount', 0, 'shardRewardWindow', 'none', 'vyntroProjectId', v_project_id::text), true),
    (v_project_id, null, 'Complete your profile', 'Add the profile basics VYNTRO uses for reputation, rewards and visible standing.', 'Platform', 'profile_complete', 40, 'active', 'Edit profile', '/profile/edit', false, 'none', 'rule_auto', null, 'rule_auto', jsonb_build_object('platformQuest', true, 'platformQuestSlug', 'complete-profile', 'cadence', 'onboarding', 'shardRewardAmount', 0, 'shardRewardWindow', 'none', 'vyntroProjectId', v_project_id::text), true),
    (v_project_id, null, 'Join VYNTRO community', 'Join the VYNTRO project context so platform quests roll into one standing surface.', 'Platform', 'community_join', 35, 'active', 'Join community', '/communities/c0951cfd-b434-41d5-977d-813156934493', false, 'none', 'rule_auto', null, 'rule_auto', jsonb_build_object('platformQuest', true, 'platformQuestSlug', 'join-vyntro-community', 'cadence', 'onboarding', 'shardRewardAmount', 0, 'shardRewardWindow', 'none', 'vyntroProjectId', v_project_id::text), true),
    (v_project_id, null, 'Review your first safe swap route', 'Open VYNTRO Swap and review route, fee, slippage and custody notes before signing anything.', 'Platform', 'swap_review', 45, 'active', 'Review swap', '/defi/swap', false, 'none', 'event_check', 'swap', 'integration_auto', jsonb_build_object('platformQuest', true, 'platformQuestSlug', 'first-safe-swap-review', 'cadence', 'lifetime', 'shardRewardAmount', 0, 'shardRewardWindow', 'none', 'vyntroProjectId', v_project_id::text), true),
    (v_project_id, null, 'Complete your first verified swap', 'Confirm a non-custodial VYNTRO swap from your verified wallet.', 'Platform', 'defi_swap', 120, 'active', 'Open swap', '/defi/swap', true, 'tx_hash', 'event_check', 'swap', 'integration_auto', jsonb_build_object('platformQuest', true, 'platformQuestSlug', 'first-verified-swap', 'cadence', 'lifetime', 'shardRewardAmount', 25, 'shardRewardWindow', 'lifetime', 'vyntroProjectId', v_project_id::text), true),
    (v_project_id, null, 'Daily check-in', 'Open your VYNTRO command surface and keep the daily XP loop alive.', 'Platform', 'daily_check_in', 20, 'active', 'Open home', '/home', false, 'none', 'event_check', 'platform', 'integration_auto', jsonb_build_object('platformQuest', true, 'platformQuestSlug', 'daily-check-in', 'cadence', 'daily', 'shardRewardAmount', 0, 'shardRewardWindow', 'none', 'vyntroProjectId', v_project_id::text), true),
    (v_project_id, null, 'Complete a real daily action', 'Complete one verified quest, raid, swap, DeFi claim or lootbox action today.', 'Platform', 'daily_platform_action', 35, 'active', 'Find action', '/quests', false, 'none', 'event_check', 'platform', 'integration_auto', jsonb_build_object('platformQuest', true, 'platformQuestSlug', 'daily-real-action', 'cadence', 'daily', 'shardRewardAmount', 3, 'shardRewardWindow', 'daily', 'vyntroProjectId', v_project_id::text), true),
    (v_project_id, null, 'Weekly activity streak', 'Complete at least three real platform actions in the weekly window.', 'Platform', 'weekly_activity_streak', 100, 'active', 'Build streak', '/xp', false, 'none', 'event_check', 'platform', 'integration_auto', jsonb_build_object('platformQuest', true, 'platformQuestSlug', 'weekly-activity-streak', 'cadence', 'weekly', 'shardRewardAmount', 40, 'shardRewardWindow', 'weekly', 'vyntroProjectId', v_project_id::text), true),
    (v_project_id, null, 'Invite an activated friend', 'Invite a friend and earn only after they activate with a real VYNTRO action.', 'Platform', 'referral', 60, 'active', 'Invite friend', '/profile/invites', false, 'none', 'event_check', 'referral', 'integration_auto', jsonb_build_object('platformQuest', true, 'platformQuestSlug', 'verified-invite', 'cadence', 'weekly', 'shardRewardAmount', 20, 'shardRewardWindow', 'weekly', 'activationRequirement', 'signup_profile_or_wallet_and_real_action', 'vyntroProjectId', v_project_id::text), true),
    (v_project_id, null, 'Open your first lootbox', 'Spend shards on your first lootbox and record the milestone.', 'Platform', 'lootbox_open', 45, 'active', 'Open lootboxes', '/lootboxes', false, 'none', 'event_check', 'lootbox', 'integration_auto', jsonb_build_object('platformQuest', true, 'platformQuestSlug', 'first-lootbox-open', 'cadence', 'lifetime', 'shardRewardAmount', 15, 'shardRewardWindow', 'lifetime', 'vyntroProjectId', v_project_id::text), true)
  on conflict do nothing;
end $$;
```

If the live `quests` table has no unique constraint that makes `on conflict do nothing` useful, replace it during implementation with a `where not exists` insert keyed by `project_id` plus `verification_config->>'platformQuestSlug'`.

- [ ] **Step 4: Run seed consistency tests**

Run: `npm test -- apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add database/migrations/vyntro_platform_quest_pack_v1.sql apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts
git commit -m "feat: seed platform quest pack"
```

## Task 5: Claim API

**Files:**
- Create: `apps/veltrix-web/src/app/api/platform-quests/claim/route.ts`

- [ ] **Step 1: Implement route using existing auth patterns**

Create `apps/veltrix-web/src/app/api/platform-quests/claim/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient, createSupabaseUserServerClient } from "@/lib/supabase/server";
import { getPlatformQuestBySlug, type PlatformQuestSlug } from "@/lib/platform-quests/platform-quest-catalog";
import { buildPlatformQuestEligibility } from "@/lib/platform-quests/platform-quest-eligibility";
import { grantPlatformQuestShards } from "@/lib/platform-quests/platform-quest-awards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
}

function readSlug(value: unknown): PlatformQuestSlug | null {
  return typeof value === "string" && getPlatformQuestBySlug(value) ? (value as PlatformQuestSlug) : null;
}

function countRows(rows: unknown[] | null | undefined) {
  return Array.isArray(rows) ? rows.length : 0;
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { slug?: unknown } | null;
  const slug = readSlug(body?.slug);
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Unknown platform quest." }, { status: 400 });
  }

  const userSupabase = createSupabaseUserServerClient(accessToken);
  const serviceSupabase = createSupabaseServiceClient();
  const {
    data: { user },
    error: userError,
  } = await userSupabase.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
  }

  const now = new Date().toISOString();
  const dayStart = `${now.slice(0, 10)}T00:00:00.000Z`;
  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - (weekStart.getUTCDay() || 7) + 1);
  weekStart.setUTCHours(0, 0, 0, 0);

  const [reputation, swapRows, dailyXpRows, weeklyXpRows, inviteRows, lootboxRows, shardRows] =
    await Promise.all([
      serviceSupabase
        .from("user_global_reputation")
        .select("status, sybil_score")
        .eq("auth_user_id", user.id)
        .maybeSingle(),
      serviceSupabase
        .from("defi_swap_intents")
        .select("id")
        .eq("auth_user_id", user.id)
        .eq("status", "confirmed")
        .limit(1),
      serviceSupabase
        .from("xp_events")
        .select("id")
        .eq("auth_user_id", user.id)
        .gte("created_at", dayStart)
        .in("source_type", ["quest_completion", "raid_completion", "defi_mission", "streak_bonus"]),
      serviceSupabase
        .from("xp_events")
        .select("id")
        .eq("auth_user_id", user.id)
        .gte("created_at", weekStart.toISOString())
        .in("source_type", ["quest_completion", "raid_completion", "defi_mission", "streak_bonus"]),
      serviceSupabase
        .from("app_notifications")
        .select("id")
        .eq("auth_user_id", user.id)
        .eq("type", "invite_activated")
        .gte("created_at", weekStart.toISOString()),
      serviceSupabase
        .from("lootbox_opens")
        .select("id")
        .eq("auth_user_id", user.id)
        .eq("status", "granted")
        .limit(1),
      serviceSupabase
        .from("shard_ledger")
        .select("source_ref")
        .eq("auth_user_id", user.id)
        .eq("source_type", "platform_quest")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  const firstError =
    reputation.error ??
    swapRows.error ??
    dailyXpRows.error ??
    weeklyXpRows.error ??
    inviteRows.error ??
    lootboxRows.error ??
    shardRows.error;

  if (firstError) {
    return NextResponse.json({ ok: false, error: firstError.message }, { status: 500 });
  }

  const eligibility = buildPlatformQuestEligibility({
    slug,
    now,
    trustStatus: reputation.data?.status ?? "active",
    sybilScore: Number(reputation.data?.sybil_score ?? 0),
    events: {
      confirmedSwapCount: countRows(swapRows.data),
      realActionsToday: countRows(dailyXpRows.data),
      realActionsThisWeek: countRows(weeklyXpRows.data),
      activatedInvitesThisWeek: countRows(inviteRows.data),
      openedLootboxCount: countRows(lootboxRows.data),
    },
    claimedSourceRefs: (shardRows.data ?? [])
      .map((row) => (typeof row.source_ref === "string" ? row.source_ref : ""))
      .filter(Boolean),
  });

  if (!eligibility.ok) {
    return NextResponse.json(
      { ok: false, error: eligibility.message, reason: eligibility.reason },
      { status: eligibility.reason === "already-claimed" ? 409 : 400 }
    );
  }

  const award = await grantPlatformQuestShards({
    serviceSupabase,
    authUserId: user.id,
    slug,
    eligibility,
  });

  if (!award.ok) {
    return NextResponse.json({ ok: false, error: award.error, reason: award.reason }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    slug,
    amount: award.amount,
    balance: award.balance,
    alreadyGranted: award.alreadyGranted,
    ledgerId: award.ledgerId,
  });
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck --workspace vyntro-web`

Expected: PASS.

- [ ] **Step 3: Commit**

Run:

```bash
git add apps/veltrix-web/src/app/api/platform-quests/claim/route.ts
git commit -m "feat: add platform quest shard claim api"
```

## Task 6: Surface Platform Metadata

**Files:**
- Modify: `apps/veltrix-web/src/types/live.ts`
- Modify: `apps/veltrix-web/src/hooks/use-live-user-data.ts`
- Modify: `apps/veltrix-web/src/components/quests/quests-screen.tsx`
- Modify: `apps/veltrix-web/src/components/projects/project-detail-screen.tsx`

- [ ] **Step 1: Extend LiveQuest type**

In `apps/veltrix-web/src/types/live.ts`, add these optional properties to `LiveQuest`:

```ts
  platformQuest?: boolean;
  platformQuestSlug?: string | null;
  cadence?: string | null;
  shardRewardAmount?: number;
  shardRewardWindow?: string | null;
```

- [ ] **Step 2: Map metadata in live data hook**

In `apps/veltrix-web/src/hooks/use-live-user-data.ts`, inside the `nextQuests` map after `globalXpPlan`, add:

```ts
        const platformQuest = verificationConfig?.platformQuest === true;
        const platformQuestSlug =
          typeof verificationConfig?.platformQuestSlug === "string"
            ? verificationConfig.platformQuestSlug
            : null;
        const cadence =
          typeof verificationConfig?.cadence === "string" ? verificationConfig.cadence : null;
        const shardRewardAmount = Number(verificationConfig?.shardRewardAmount ?? 0);
        const shardRewardWindow =
          typeof verificationConfig?.shardRewardWindow === "string"
            ? verificationConfig.shardRewardWindow
            : null;
```

Then add these fields to the returned quest object:

```ts
          platformQuest,
          platformQuestSlug,
          cadence,
          shardRewardAmount: Number.isFinite(shardRewardAmount) ? shardRewardAmount : 0,
          shardRewardWindow,
```

- [ ] **Step 3: Add small UI labels without changing layout**

In quest cards in `apps/veltrix-web/src/components/quests/quests-screen.tsx` and activation rows in `apps/veltrix-web/src/components/projects/project-detail-screen.tsx`, render labels only when present:

```tsx
{quest.platformQuest ? <StatusChip label="VYNTRO" tone="info" /> : null}
{quest.shardRewardAmount && quest.shardRewardAmount > 0 ? (
  <StatusChip label={`${quest.shardRewardAmount} shards`} tone="positive" />
) : null}
```

Keep the existing page structure. Do not create a new VYNTRO hub or route.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck --workspace vyntro-web`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/veltrix-web/src/types/live.ts apps/veltrix-web/src/hooks/use-live-user-data.ts apps/veltrix-web/src/components/quests/quests-screen.tsx apps/veltrix-web/src/components/projects/project-detail-screen.tsx
git commit -m "feat: surface platform quest metadata"
```

## Task 7: Verification

**Files:**
- No new files.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- apps/veltrix-web/src/lib/platform-quests/platform-quest-eligibility.test.ts apps/veltrix-web/src/lib/platform-quests/platform-quest-awards.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run web typecheck**

Run:

```bash
npm run typecheck --workspace vyntro-web
```

Expected: PASS.

- [ ] **Step 3: Run web build**

Run:

```bash
npm run build --workspace vyntro-web
```

Expected: PASS.

- [ ] **Step 4: Browser smoke test**

Run dev server:

```bash
npm run dev --workspace vyntro-web
```

Open the local app and verify:

- `/projects/c0951cfd-b434-41d5-977d-813156934493` still renders as a normal project page.
- VYNTRO platform quests appear in the existing mission lane after the migration is applied.
- `/quests` shows VYNTRO platform quests with `VYNTRO` and shard labels.
- No duplicate Discord or Telegram quest appears from this seed pack.

- [ ] **Step 5: Final commit if verification changes files**

If verification required edits, inspect the working tree and commit only the files changed for this feature:

```bash
git status --short
git add apps/veltrix-web/src/lib/platform-quests apps/veltrix-web/src/app/api/platform-quests apps/veltrix-web/src/types/live.ts apps/veltrix-web/src/hooks/use-live-user-data.ts apps/veltrix-web/src/components/quests/quests-screen.tsx apps/veltrix-web/src/components/projects/project-detail-screen.tsx database/migrations/vyntro_platform_quest_pack_v1.sql
git commit -m "fix: verify platform quest pack"
```

## Self-Review

Spec coverage:

- Existing VYNTRO project context: Task 1 and Task 4.
- No special platform hub: Task 6 explicitly keeps current surfaces.
- Discord and Telegram excluded: Task 1 and Task 4 tests.
- Fixed shard defaults: Task 1 catalog and Task 2 eligibility.
- Shard ledger with dedupe: Task 2 source ref and Task 3 award helper.
- Daily/weekly/lifetime caps: Task 2.
- Trust and sybil blocking: Task 2 and Task 5.
- Project detail and quest board surfaces: Task 6 and Task 7.

Placeholder scan: the plan uses explicit files, commands, expected results, and code blocks for implementation steps. The schema caveat in Task 4 has a concrete replacement strategy if the live table has no matching unique conflict target.

Type consistency: `PlatformQuestSlug`, source refs, metadata keys, and shard amounts are defined in Task 1 and reused consistently in later tasks.
