# Trading Arena Snapshot + Live Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build VYNTRO Trading Arena end-to-end with Snapshot Mode, Live Tracking Mode, live-ish leaderboard, rewards, settlement review, cost metering, and project-facing controls.

**Architecture:** Add a shared database foundation, then implement server-side trading services in `vyntro-community-bot` and expose them through authenticated HTTP endpoints. The webapp consumes those endpoints through Next.js route handlers, while the project/portal surface gets creation, cost, tracking health, and settlement controls.

**Tech Stack:** Supabase/Postgres migrations, TypeScript, Node test runner, Express service routes, Next.js App Router, React 19, Supabase JS, ethers provider adapters.

---

## Scope Check

The approved spec has two modes, but they share the same competition, participant, leaderboard, reward, and cost-ledger foundation. Keep this as one implementation plan with staged commits:

- Foundation and tests first.
- Snapshot Mode end-to-end second.
- Live Tracking Mode third.
- Portal/webapp polish and production rollout last.

Portal source verification is a required early step because the current workspace visibly contains `apps/veltrix-web` and `services/veltrix-community-bot`, while the deployed portal routes are not immediately represented as a separate app folder. Do not ship this feature as webapp-only.

## File Structure

Create:

- `database/migrations/vyntro_trading_arena_v1.sql` - competition tables, constraints, indexes, RLS policies.
- `services/veltrix-community-bot/src/core/trading/types.ts` - server-side domain types.
- `services/veltrix-community-bot/src/core/trading/scoring.ts` - scoring policy and deterministic ranking.
- `services/veltrix-community-bot/src/core/trading/scoring.test.ts` - scoring tests.
- `services/veltrix-community-bot/src/core/trading/cost-ledger.ts` - usage-unit and cost projection helpers.
- `services/veltrix-community-bot/src/core/trading/cost-ledger.test.ts` - cost tests.
- `services/veltrix-community-bot/src/core/trading/repository.ts` - Supabase reads/writes for competitions.
- `services/veltrix-community-bot/src/core/trading/snapshots.ts` - Snapshot Mode jobs.
- `services/veltrix-community-bot/src/core/trading/live-tracking.ts` - Live Tracking Mode orchestration.
- `services/veltrix-community-bot/src/core/trading/settlement.ts` - freeze, review, reward distribution creation.
- `services/veltrix-community-bot/src/http/trading.ts` - Express router for Trading Arena.
- `services/veltrix-community-bot/src/scripts/run-trading-arena-jobs.ts` - cron entrypoint.
- `apps/veltrix-web/src/lib/trading/trading-arena.ts` - client-visible types and formatting helpers.
- `apps/veltrix-web/src/lib/trading/trading-arena.test.ts` - UI-helper tests.
- `apps/veltrix-web/src/app/api/trading/competitions/route.ts` - list/create proxy.
- `apps/veltrix-web/src/app/api/trading/competitions/[id]/route.ts` - detail/update proxy.
- `apps/veltrix-web/src/app/api/trading/competitions/[id]/join/route.ts` - join proxy.
- `apps/veltrix-web/src/app/api/trading/competitions/[id]/leaderboard/route.ts` - leaderboard proxy.
- `apps/veltrix-web/src/app/api/trading/competitions/[id]/settle/route.ts` - settlement proxy.
- `apps/veltrix-web/src/app/trading-arena/page.tsx` - public/member Trading Arena route.
- `apps/veltrix-web/src/app/trading-arena/[id]/page.tsx` - public/member competition detail.
- `apps/veltrix-web/src/components/trading/trading-arena-screen.tsx` - overview UI.
- `apps/veltrix-web/src/components/trading/trading-competition-detail-screen.tsx` - detail and leaderboard UI.
- `apps/veltrix-web/src/components/trading/trading-risk-copy.tsx` - no-custody/risk notices.
- `apps/veltrix-web/src/components/trading/trading-arena-control-panel.tsx` - project-facing control panel when the current app owns the project workspace surface.
- `docs/superpowers/portal-source-map-2026-04-29.md` - written during the portal source gate so we do not confuse the webapp with the production portal target.

Modify:

- `services/veltrix-community-bot/src/index.ts` - mount Trading Arena router.
- `services/veltrix-community-bot/package.json` - add job script.
- `apps/veltrix-web/src/components/layout/app-shell.tsx` - add Trading Arena/DeFi navigation entry.
- `apps/veltrix-web/src/components/defi/defi-landing-screen.tsx` - add Trading Arena card.
- `apps/veltrix-web/src/types/live.ts` - add live trading types if `useLiveUserData` is extended.
- `docs/superpowers/portal-source-map-2026-04-29.md` documents whether `crypto-raid-admin-portal.vercel.app` is served by this workspace or by a separate project source. If it is separate, Task 8 pauses portal UI implementation until that source is opened in the workspace.

---

### Task 1: Database Foundation

**Files:**
- Create: `database/migrations/vyntro_trading_arena_v1.sql`

- [ ] **Step 1: Create the migration**

Add the migration with these tables and constraints:

```sql
create table if not exists public.trading_competitions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  created_by_auth_user_id uuid,
  title text not null,
  description text not null default '',
  banner_url text,
  status text not null default 'draft',
  tracking_mode text not null default 'snapshot',
  scoring_mode text not null default 'hybrid',
  chain text not null default 'base',
  quote_symbol text not null default 'USDC',
  registration_starts_at timestamptz,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  freeze_at timestamptz,
  snapshot_cadence text not null default 'hourly',
  budget_cap_cents integer not null default 0,
  current_cost_cents integer not null default 0,
  cost_status text not null default 'ok',
  rules jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trading_competitions_status_check check (
    status in ('draft', 'scheduled', 'live', 'paused', 'settling', 'settled', 'cancelled')
  ),
  constraint trading_competitions_tracking_mode_check check (
    tracking_mode in ('snapshot', 'live')
  ),
  constraint trading_competitions_scoring_mode_check check (
    scoring_mode in ('volume', 'roi', 'hybrid')
  ),
  constraint trading_competitions_cost_status_check check (
    cost_status in ('ok', 'near_cap', 'capped', 'provider_failure')
  ),
  constraint trading_competitions_window_check check (ends_at > starts_at)
);

create table if not exists public.trading_competition_pairs (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  chain text not null default 'base',
  base_symbol text not null,
  quote_symbol text not null default 'USDC',
  base_token_address text not null,
  quote_token_address text,
  pool_address text,
  router_address text,
  min_trade_usd numeric not null default 5,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trading_competition_rewards (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  reward_asset text not null,
  reward_amount numeric not null default 0,
  rank_from integer,
  rank_to integer,
  reward_type text not null default 'rank',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trading_competition_rewards_type_check check (reward_type in ('rank', 'raffle', 'participation', 'xp'))
);

create table if not exists public.trading_competition_participants (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  auth_user_id uuid not null,
  wallet_address text not null,
  wallet_link_id uuid references public.wallet_links(id) on delete set null,
  status text not null default 'joined',
  joined_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trading_competition_participants_status_check check (
    status in ('joined', 'eligible', 'flagged', 'excluded', 'settled')
  ),
  constraint trading_competition_participants_unique unique (competition_id, auth_user_id)
);

create table if not exists public.trading_competition_snapshots (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  pair_id uuid references public.trading_competition_pairs(id) on delete cascade,
  participant_id uuid references public.trading_competition_participants(id) on delete cascade,
  snapshot_type text not null,
  snapshot_at timestamptz not null default now(),
  price_usd numeric,
  liquidity_usd numeric,
  wallet_balance numeric,
  wallet_value_usd numeric,
  source_provider text not null default 'internal',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint trading_competition_snapshots_type_check check (
    snapshot_type in ('start', 'periodic', 'end', 'manual')
  )
);

create table if not exists public.trading_competition_events (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  pair_id uuid references public.trading_competition_pairs(id) on delete set null,
  participant_id uuid references public.trading_competition_participants(id) on delete set null,
  auth_user_id uuid,
  wallet_address text not null,
  chain text not null default 'base',
  tx_hash text not null,
  log_index integer not null default 0,
  block_number bigint,
  block_time timestamptz not null,
  side text not null,
  base_amount numeric not null default 0,
  quote_amount numeric not null default 0,
  usd_value numeric not null default 0,
  source_provider text not null default 'rpc',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint trading_competition_events_side_check check (side in ('buy', 'sell', 'swap')),
  constraint trading_competition_events_unique unique (competition_id, chain, tx_hash, log_index)
);

create table if not exists public.trading_competition_leaderboard (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  participant_id uuid not null references public.trading_competition_participants(id) on delete cascade,
  auth_user_id uuid not null,
  rank integer not null,
  score numeric not null default 0,
  volume_usd numeric not null default 0,
  roi_percent numeric not null default 0,
  trade_count integer not null default 0,
  flags_count integer not null default 0,
  status text not null default 'active',
  score_breakdown jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trading_competition_leaderboard_status_check check (
    status in ('active', 'flagged', 'excluded', 'final')
  ),
  constraint trading_competition_leaderboard_unique unique (competition_id, participant_id)
);

create table if not exists public.trading_competition_flags (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.trading_competitions(id) on delete cascade,
  participant_id uuid references public.trading_competition_participants(id) on delete set null,
  auth_user_id uuid,
  wallet_address text,
  flag_type text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  summary text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trading_competition_flags_severity_check check (severity in ('low', 'medium', 'high', 'critical')),
  constraint trading_competition_flags_status_check check (status in ('open', 'reviewed', 'dismissed', 'upheld'))
);

create table if not exists public.tracking_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  competition_id uuid references public.trading_competitions(id) on delete cascade,
  provider text not null,
  chain text not null default 'base',
  operation_type text not null,
  unit_count numeric not null default 0,
  estimated_cost_cents integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint tracking_usage_ledger_operation_check check (
    operation_type in ('snapshot', 'rpc_call', 'log_scan', 'event_decode', 'leaderboard_rebuild', 'retry', 'storage_write')
  )
);

create table if not exists public.tracking_provider_runs (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.trading_competitions(id) on delete cascade,
  provider text not null,
  job_type text not null,
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  last_block_number bigint,
  processed_events integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  constraint tracking_provider_runs_status_check check (status in ('running', 'completed', 'failed', 'skipped'))
);
```

- [ ] **Step 2: Add indexes and RLS**

Append:

```sql
create index if not exists idx_trading_competitions_project_status
  on public.trading_competitions (project_id, status, starts_at desc);
create index if not exists idx_trading_competition_pairs_competition
  on public.trading_competition_pairs (competition_id, is_active);
create index if not exists idx_trading_competition_events_competition_time
  on public.trading_competition_events (competition_id, block_time desc);
create index if not exists idx_trading_competition_events_wallet
  on public.trading_competition_events (competition_id, wallet_address);
create index if not exists idx_trading_competition_leaderboard_rank
  on public.trading_competition_leaderboard (competition_id, rank);
create index if not exists idx_tracking_usage_ledger_competition
  on public.tracking_usage_ledger (competition_id, created_at desc);
create index if not exists idx_tracking_provider_runs_competition
  on public.tracking_provider_runs (competition_id, started_at desc);

alter table public.trading_competitions enable row level security;
alter table public.trading_competition_pairs enable row level security;
alter table public.trading_competition_rewards enable row level security;
alter table public.trading_competition_participants enable row level security;
alter table public.trading_competition_snapshots enable row level security;
alter table public.trading_competition_events enable row level security;
alter table public.trading_competition_leaderboard enable row level security;
alter table public.trading_competition_flags enable row level security;
alter table public.tracking_usage_ledger enable row level security;
alter table public.tracking_provider_runs enable row level security;

create policy "authenticated read trading competitions" on public.trading_competitions
for select to authenticated using (true);
create policy "authenticated manage trading competitions" on public.trading_competitions
for all to authenticated using (true) with check (true);

create policy "authenticated read trading pairs" on public.trading_competition_pairs
for select to authenticated using (true);
create policy "authenticated manage trading pairs" on public.trading_competition_pairs
for all to authenticated using (true) with check (true);

create policy "authenticated read trading rewards" on public.trading_competition_rewards
for select to authenticated using (true);
create policy "authenticated manage trading rewards" on public.trading_competition_rewards
for all to authenticated using (true) with check (true);

create policy "authenticated read trading participants" on public.trading_competition_participants
for select to authenticated using (true);
create policy "authenticated manage trading participants" on public.trading_competition_participants
for all to authenticated using (true) with check (true);

create policy "authenticated read trading snapshots" on public.trading_competition_snapshots
for select to authenticated using (true);
create policy "authenticated manage trading snapshots" on public.trading_competition_snapshots
for all to authenticated using (true) with check (true);

create policy "authenticated read trading events" on public.trading_competition_events
for select to authenticated using (true);
create policy "authenticated manage trading events" on public.trading_competition_events
for all to authenticated using (true) with check (true);

create policy "authenticated read trading leaderboard" on public.trading_competition_leaderboard
for select to authenticated using (true);
create policy "authenticated manage trading leaderboard" on public.trading_competition_leaderboard
for all to authenticated using (true) with check (true);

create policy "authenticated read trading flags" on public.trading_competition_flags
for select to authenticated using (true);
create policy "authenticated manage trading flags" on public.trading_competition_flags
for all to authenticated using (true) with check (true);

create policy "authenticated read tracking usage" on public.tracking_usage_ledger
for select to authenticated using (true);
create policy "authenticated manage tracking usage" on public.tracking_usage_ledger
for all to authenticated using (true) with check (true);

create policy "authenticated read tracking runs" on public.tracking_provider_runs
for select to authenticated using (true);
create policy "authenticated manage tracking runs" on public.tracking_provider_runs
for all to authenticated using (true) with check (true);
```

- [ ] **Step 3: Verify migration structure**

Run:

```powershell
Select-String -Path database\migrations\vyntro_trading_arena_v1.sql -Pattern "trading_competitions","tracking_usage_ledger","trading_competition_leaderboard"
```

Expected: each table name appears at least once.

- [ ] **Step 4: Commit database foundation**

```powershell
git add database\migrations\vyntro_trading_arena_v1.sql
git commit -m "Add trading arena database foundation"
```

---

### Task 2: Scoring And Cost Policy

**Files:**
- Create: `services/veltrix-community-bot/src/core/trading/types.ts`
- Create: `services/veltrix-community-bot/src/core/trading/scoring.ts`
- Create: `services/veltrix-community-bot/src/core/trading/scoring.test.ts`
- Create: `services/veltrix-community-bot/src/core/trading/cost-ledger.ts`
- Create: `services/veltrix-community-bot/src/core/trading/cost-ledger.test.ts`

- [ ] **Step 1: Write scoring tests**

Create `services/veltrix-community-bot/src/core/trading/scoring.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { calculateTradingScore, rankTradingParticipants } from "./scoring.js";

test("hybrid score rewards volume and ROI while applying trust and abuse penalties", () => {
  const score = calculateTradingScore({
    scoringMode: "hybrid",
    volumeUsd: 1200,
    roiPercent: 18,
    tradeCount: 9,
    trustScore: 82,
    flagsCount: 1,
  });

  assert.equal(score.score > 0, true);
  assert.equal(score.breakdown.volumePoints, 120);
  assert.equal(score.breakdown.roiPoints, 180);
  assert.equal(score.breakdown.flagsPenalty, 35);
});

test("rankTradingParticipants is deterministic for score ties", () => {
  const ranked = rankTradingParticipants([
    { participantId: "b", authUserId: "user-b", score: 100, volumeUsd: 50, tradeCount: 1, flagsCount: 0 },
    { participantId: "a", authUserId: "user-a", score: 100, volumeUsd: 50, tradeCount: 1, flagsCount: 0 },
  ]);

  assert.deepEqual(ranked.map((entry) => entry.participantId), ["a", "b"]);
  assert.deepEqual(ranked.map((entry) => entry.rank), [1, 2]);
});
```

- [ ] **Step 2: Run scoring test and confirm it fails**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test services/veltrix-community-bot/src/core/trading/scoring.test.ts
```

Expected: FAIL because `./scoring.js` does not exist.

- [ ] **Step 3: Add trading domain types**

Create `services/veltrix-community-bot/src/core/trading/types.ts`:

```ts
export type TradingTrackingMode = "snapshot" | "live";
export type TradingScoringMode = "volume" | "roi" | "hybrid";
export type TradingCompetitionStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "paused"
  | "settling"
  | "settled"
  | "cancelled";

export type TradingScoreInput = {
  scoringMode: TradingScoringMode;
  volumeUsd: number;
  roiPercent: number;
  tradeCount: number;
  trustScore: number;
  flagsCount: number;
};

export type TradingScoreBreakdown = {
  volumePoints: number;
  roiPoints: number;
  consistencyBonus: number;
  trustBonus: number;
  flagsPenalty: number;
};

export type TradingScoreOutput = {
  score: number;
  breakdown: TradingScoreBreakdown;
};

export type TradingRankInput = {
  participantId: string;
  authUserId: string;
  score: number;
  volumeUsd: number;
  tradeCount: number;
  flagsCount: number;
};

export type TradingRankOutput = TradingRankInput & {
  rank: number;
};

export type TrackingOperationType =
  | "snapshot"
  | "rpc_call"
  | "log_scan"
  | "event_decode"
  | "leaderboard_rebuild"
  | "retry"
  | "storage_write";
```

- [ ] **Step 4: Implement scoring policy**

Create `services/veltrix-community-bot/src/core/trading/scoring.ts`:

```ts
import type { TradingRankInput, TradingRankOutput, TradingScoreInput, TradingScoreOutput } from "./types.js";

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function calculateTradingScore(input: TradingScoreInput): TradingScoreOutput {
  const volumeUsd = Math.max(0, safeNumber(input.volumeUsd));
  const roiPercent = safeNumber(input.roiPercent);
  const tradeCount = Math.max(0, Math.floor(safeNumber(input.tradeCount)));
  const trustScore = Math.max(0, Math.min(100, safeNumber(input.trustScore)));
  const flagsCount = Math.max(0, Math.floor(safeNumber(input.flagsCount)));

  const volumePoints = input.scoringMode === "roi" ? 0 : Math.min(250, round(volumeUsd / 10, 4));
  const roiPoints = input.scoringMode === "volume" ? 0 : Math.max(-100, Math.min(300, round(roiPercent * 10, 4)));
  const consistencyBonus = Math.min(60, tradeCount * 4);
  const trustBonus = round((trustScore - 50) * 0.6, 4);
  const flagsPenalty = flagsCount * 35;

  const score = Math.max(0, round(volumePoints + roiPoints + consistencyBonus + trustBonus - flagsPenalty, 4));

  return {
    score,
    breakdown: {
      volumePoints,
      roiPoints,
      consistencyBonus,
      trustBonus,
      flagsPenalty,
    },
  };
}

export function rankTradingParticipants(entries: TradingRankInput[]): TradingRankOutput[] {
  return [...entries]
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.volumeUsd - left.volumeUsd ||
        right.tradeCount - left.tradeCount ||
        left.flagsCount - right.flagsCount ||
        left.participantId.localeCompare(right.participantId)
    )
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}
```

- [ ] **Step 5: Write cost ledger tests**

Create `services/veltrix-community-bot/src/core/trading/cost-ledger.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { calculateTrackingCostCents, summarizeBudgetState } from "./cost-ledger.js";

test("calculateTrackingCostCents converts units into integer cents", () => {
  assert.equal(
    calculateTrackingCostCents({
      unitCount: 2500,
      centsPerThousandUnits: 12,
    }),
    30
  );
});

test("summarizeBudgetState caps live tracking when projected cost exceeds budget", () => {
  const state = summarizeBudgetState({
    budgetCapCents: 1000,
    currentCostCents: 900,
    projectedAdditionalCostCents: 200,
  });

  assert.equal(state.status, "capped");
  assert.equal(state.remainingCents, 100);
});
```

- [ ] **Step 6: Implement cost ledger helpers**

Create `services/veltrix-community-bot/src/core/trading/cost-ledger.ts`:

```ts
export function calculateTrackingCostCents(input: {
  unitCount: number;
  centsPerThousandUnits: number;
}) {
  const units = Math.max(0, Number(input.unitCount) || 0);
  const rate = Math.max(0, Number(input.centsPerThousandUnits) || 0);
  return Math.ceil((units / 1000) * rate);
}

export function summarizeBudgetState(input: {
  budgetCapCents: number;
  currentCostCents: number;
  projectedAdditionalCostCents: number;
}) {
  const budgetCapCents = Math.max(0, Number(input.budgetCapCents) || 0);
  const currentCostCents = Math.max(0, Number(input.currentCostCents) || 0);
  const projectedAdditionalCostCents = Math.max(0, Number(input.projectedAdditionalCostCents) || 0);
  const remainingCents = Math.max(0, budgetCapCents - currentCostCents);

  if (budgetCapCents > 0 && currentCostCents + projectedAdditionalCostCents > budgetCapCents) {
    return { status: "capped" as const, remainingCents };
  }

  if (budgetCapCents > 0 && currentCostCents / budgetCapCents >= 0.8) {
    return { status: "near_cap" as const, remainingCents };
  }

  return { status: "ok" as const, remainingCents };
}
```

- [ ] **Step 7: Verify tests**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test services/veltrix-community-bot/src/core/trading/scoring.test.ts services/veltrix-community-bot/src/core/trading/cost-ledger.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit scoring and cost policy**

```powershell
git add services\veltrix-community-bot\src\core\trading
git commit -m "Add trading arena scoring and cost policy"
```

---

### Task 3: Service Repository And Snapshot Mode

**Files:**
- Create: `services/veltrix-community-bot/src/core/trading/repository.ts`
- Create: `services/veltrix-community-bot/src/core/trading/snapshots.ts`
- Create: `services/veltrix-community-bot/src/core/trading/snapshots.test.ts`

- [ ] **Step 1: Write snapshot selection test**

Create `services/veltrix-community-bot/src/core/trading/snapshots.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { chooseSnapshotType, shouldRunSnapshot } from "./snapshots.js";

test("chooseSnapshotType identifies start and end snapshots", () => {
  const startsAt = new Date("2026-04-29T10:00:00.000Z");
  const endsAt = new Date("2026-04-29T11:00:00.000Z");

  assert.equal(chooseSnapshotType({ now: startsAt, startsAt, endsAt }), "start");
  assert.equal(chooseSnapshotType({ now: endsAt, startsAt, endsAt }), "end");
});

test("shouldRunSnapshot respects hourly cadence", () => {
  assert.equal(
    shouldRunSnapshot({
      cadence: "hourly",
      lastSnapshotAt: new Date("2026-04-29T10:00:00.000Z"),
      now: new Date("2026-04-29T10:59:00.000Z"),
    }),
    false
  );
  assert.equal(
    shouldRunSnapshot({
      cadence: "hourly",
      lastSnapshotAt: new Date("2026-04-29T10:00:00.000Z"),
      now: new Date("2026-04-29T11:00:00.000Z"),
    }),
    true
  );
});
```

- [ ] **Step 2: Implement snapshot pure helpers**

Create `services/veltrix-community-bot/src/core/trading/snapshots.ts`:

```ts
import { supabaseAdmin } from "../../lib/supabase.js";

export type SnapshotCadence = "start_end" | "hourly" | "daily";
export type SnapshotType = "start" | "periodic" | "end" | "manual";

export function chooseSnapshotType(input: {
  now: Date;
  startsAt: Date;
  endsAt: Date;
}): SnapshotType {
  if (input.now.getTime() <= input.startsAt.getTime()) return "start";
  if (input.now.getTime() >= input.endsAt.getTime()) return "end";
  return "periodic";
}

export function shouldRunSnapshot(input: {
  cadence: SnapshotCadence;
  lastSnapshotAt: Date | null;
  now: Date;
}) {
  if (!input.lastSnapshotAt) return true;
  if (input.cadence === "start_end") return false;

  const elapsedMs = input.now.getTime() - input.lastSnapshotAt.getTime();
  const requiredMs = input.cadence === "daily" ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
  return elapsedMs >= requiredMs;
}

export async function runTradingSnapshotBatch(input: { now?: Date } = {}) {
  const now = input.now ?? new Date();
  const { data: competitions, error } = await supabaseAdmin
    .from("trading_competitions")
    .select("id, project_id, status, starts_at, ends_at, snapshot_cadence")
    .in("status", ["scheduled", "live"])
    .lte("starts_at", now.toISOString());

  if (error) throw error;

  let processed = 0;
  for (const competition of competitions ?? []) {
    await supabaseAdmin.from("tracking_provider_runs").insert({
      competition_id: competition.id,
      provider: "internal",
      job_type: "snapshot",
      status: "completed",
      started_at: now.toISOString(),
      finished_at: now.toISOString(),
      metadata: { source: "runTradingSnapshotBatch" },
    });
    processed += 1;
  }

  return { ok: true, processed };
}
```

- [ ] **Step 3: Add repository skeleton**

Create `services/veltrix-community-bot/src/core/trading/repository.ts`:

```ts
import { supabaseAdmin } from "../../lib/supabase.js";
import type { TradingScoringMode, TradingTrackingMode } from "./types.js";

export type CreateTradingCompetitionInput = {
  projectId: string;
  campaignId?: string | null;
  createdByAuthUserId?: string | null;
  title: string;
  description?: string;
  bannerUrl?: string | null;
  trackingMode: TradingTrackingMode;
  scoringMode: TradingScoringMode;
  startsAt: string;
  endsAt: string;
  budgetCapCents?: number;
};

export async function createTradingCompetition(input: CreateTradingCompetitionInput) {
  const { data, error } = await supabaseAdmin
    .from("trading_competitions")
    .insert({
      project_id: input.projectId,
      campaign_id: input.campaignId ?? null,
      created_by_auth_user_id: input.createdByAuthUserId ?? null,
      title: input.title,
      description: input.description ?? "",
      banner_url: input.bannerUrl ?? null,
      tracking_mode: input.trackingMode,
      scoring_mode: input.scoringMode,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      budget_cap_cents: Math.max(0, Math.floor(input.budgetCapCents ?? 0)),
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw error;
  return { ok: true, competitionId: data.id as string };
}

export async function listTradingCompetitions(input: { projectId?: string | null } = {}) {
  let query = supabaseAdmin
    .from("trading_competitions")
    .select("id, project_id, campaign_id, title, description, banner_url, status, tracking_mode, scoring_mode, starts_at, ends_at, budget_cap_cents, current_cost_cents, cost_status, created_at")
    .order("starts_at", { ascending: false });

  if (input.projectId) {
    query = query.eq("project_id", input.projectId);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  return { ok: true, items: data ?? [] };
}
```

- [ ] **Step 4: Verify snapshot tests**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test services/veltrix-community-bot/src/core/trading/snapshots.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit repository and snapshot mode foundation**

```powershell
git add services\veltrix-community-bot\src\core\trading
git commit -m "Add trading arena snapshot foundation"
```

---

### Task 4: Live Tracking And Settlement Core

**Files:**
- Create: `services/veltrix-community-bot/src/core/trading/live-tracking.ts`
- Create: `services/veltrix-community-bot/src/core/trading/live-tracking.test.ts`
- Create: `services/veltrix-community-bot/src/core/trading/settlement.ts`
- Create: `services/veltrix-community-bot/src/core/trading/settlement.test.ts`

- [ ] **Step 1: Write live tracking tests**

Create `services/veltrix-community-bot/src/core/trading/live-tracking.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildEventDedupeKey, normalizeTradeEvent } from "./live-tracking.js";

test("buildEventDedupeKey includes competition, chain, tx hash and log index", () => {
  assert.equal(
    buildEventDedupeKey({
      competitionId: "comp",
      chain: "base",
      txHash: "0xabc",
      logIndex: 4,
    }),
    "comp:base:0xabc:4"
  );
});

test("normalizeTradeEvent rejects non-positive usd value", () => {
  assert.throws(
    () =>
      normalizeTradeEvent({
        competitionId: "comp",
        chain: "base",
        txHash: "0xabc",
        logIndex: 1,
        walletAddress: "0x123",
        side: "buy",
        usdValue: 0,
        blockTime: "2026-04-29T10:00:00.000Z",
      }),
    /positive USD value/
  );
});
```

- [ ] **Step 2: Implement live tracking helpers**

Create `services/veltrix-community-bot/src/core/trading/live-tracking.ts`:

```ts
import { supabaseAdmin } from "../../lib/supabase.js";

export type RawTradeEvent = {
  competitionId: string;
  pairId?: string | null;
  chain: string;
  txHash: string;
  logIndex: number;
  walletAddress: string;
  side: "buy" | "sell" | "swap";
  usdValue: number;
  blockTime: string;
  baseAmount?: number;
  quoteAmount?: number;
};

export function buildEventDedupeKey(input: {
  competitionId: string;
  chain: string;
  txHash: string;
  logIndex: number;
}) {
  return `${input.competitionId}:${input.chain.toLowerCase()}:${input.txHash.toLowerCase()}:${input.logIndex}`;
}

export function normalizeTradeEvent(input: RawTradeEvent) {
  if (!input.walletAddress.trim()) throw new Error("A wallet address is required.");
  if (!input.txHash.trim()) throw new Error("A transaction hash is required.");
  if (!Number.isFinite(input.usdValue) || input.usdValue <= 0) {
    throw new Error("A positive USD value is required for live tracking.");
  }

  return {
    competition_id: input.competitionId,
    pair_id: input.pairId ?? null,
    wallet_address: input.walletAddress.trim().toLowerCase(),
    chain: input.chain.trim().toLowerCase(),
    tx_hash: input.txHash.trim().toLowerCase(),
    log_index: Math.max(0, Math.floor(input.logIndex)),
    side: input.side,
    usd_value: input.usdValue,
    block_time: input.blockTime,
    base_amount: input.baseAmount ?? 0,
    quote_amount: input.quoteAmount ?? 0,
    source_provider: "rpc",
  };
}

export async function ingestTradingEvents(events: RawTradeEvent[]) {
  const rows = events.map(normalizeTradeEvent);
  if (rows.length === 0) return { ok: true, processed: 0 };

  const { error } = await supabaseAdmin.from("trading_competition_events").upsert(rows, {
    onConflict: "competition_id,chain,tx_hash,log_index",
  });
  if (error) throw error;

  return { ok: true, processed: rows.length };
}
```

- [ ] **Step 3: Write settlement tests**

Create `services/veltrix-community-bot/src/core/trading/settlement.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { canSettleCompetition, deriveRewardStatus } from "./settlement.js";

test("canSettleCompetition requires end snapshot for snapshot mode", () => {
  assert.equal(
    canSettleCompetition({
      trackingMode: "snapshot",
      hasStartSnapshot: true,
      hasEndSnapshot: false,
      openFlagCount: 0,
    }).ok,
    false
  );
});

test("deriveRewardStatus keeps flagged winners in review", () => {
  assert.equal(deriveRewardStatus({ flagsCount: 2 }), "review_required");
  assert.equal(deriveRewardStatus({ flagsCount: 0 }), "claimable");
});
```

- [ ] **Step 4: Implement settlement helpers**

Create `services/veltrix-community-bot/src/core/trading/settlement.ts`:

```ts
import type { TradingTrackingMode } from "./types.js";

export function canSettleCompetition(input: {
  trackingMode: TradingTrackingMode;
  hasStartSnapshot: boolean;
  hasEndSnapshot: boolean;
  openFlagCount: number;
}) {
  if (input.trackingMode === "snapshot" && !input.hasStartSnapshot) {
    return { ok: false as const, reason: "Start snapshot is missing." };
  }
  if (input.trackingMode === "snapshot" && !input.hasEndSnapshot) {
    return { ok: false as const, reason: "End snapshot is missing." };
  }
  if (input.openFlagCount > 0) {
    return { ok: false as const, reason: "Open review flags must be resolved before settlement." };
  }
  return { ok: true as const, reason: "Competition can settle." };
}

export function deriveRewardStatus(input: { flagsCount: number }) {
  return input.flagsCount > 0 ? "review_required" : "claimable";
}
```

- [ ] **Step 5: Verify live and settlement tests**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test services/veltrix-community-bot/src/core/trading/live-tracking.test.ts services/veltrix-community-bot/src/core/trading/settlement.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit live tracking and settlement core**

```powershell
git add services\veltrix-community-bot\src\core\trading
git commit -m "Add trading arena live tracking and settlement core"
```

---

### Task 5: Service HTTP API And Jobs

**Files:**
- Create: `services/veltrix-community-bot/src/http/trading.ts`
- Create: `services/veltrix-community-bot/src/scripts/run-trading-arena-jobs.ts`
- Modify: `services/veltrix-community-bot/src/index.ts`
- Modify: `services/veltrix-community-bot/package.json`

- [ ] **Step 1: Add Express router**

Create `services/veltrix-community-bot/src/http/trading.ts`:

```ts
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { createTradingCompetition, listTradingCompetitions } from "../core/trading/repository.js";
import { runTradingSnapshotBatch } from "../core/trading/snapshots.js";

export const tradingRouter = Router();

const createCompetitionSchema = z.object({
  projectId: z.string().uuid(),
  campaignId: z.string().uuid().nullable().optional(),
  createdByAuthUserId: z.string().uuid().nullable().optional(),
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  bannerUrl: z.string().url().nullable().optional(),
  trackingMode: z.enum(["snapshot", "live"]),
  scoringMode: z.enum(["volume", "roi", "hybrid"]),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  budgetCapCents: z.coerce.number().int().min(0).optional(),
});

function hasValidWebhookSecret(secretHeader: string | undefined) {
  if (!env.COMMUNITY_BOT_WEBHOOK_SECRET) return true;
  return secretHeader === env.COMMUNITY_BOT_WEBHOOK_SECRET;
}

tradingRouter.get("/competitions", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : null;
  try {
    return res.status(200).json(await listTradingCompetitions({ projectId }));
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Trading competitions could not load.",
    });
  }
});

tradingRouter.post("/competitions", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = createCompetitionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid trading competition payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    return res.status(200).json(await createTradingCompetition(parsed.data));
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Trading competition could not be created.",
    });
  }
});

tradingRouter.post("/jobs/snapshots", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  try {
    return res.status(200).json(await runTradingSnapshotBatch());
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Trading snapshot job failed.",
    });
  }
});
```

- [ ] **Step 2: Mount router**

Modify `services/veltrix-community-bot/src/index.ts` by importing and mounting:

```ts
import { tradingRouter } from "./http/trading.js";

app.use("/trading", tradingRouter);
```

Place it next to existing router mounts so the service exposes `/trading/competitions`.

- [ ] **Step 3: Add job script**

Create `services/veltrix-community-bot/src/scripts/run-trading-arena-jobs.ts`:

```ts
import "dotenv/config";
import { runTradingSnapshotBatch } from "../core/trading/snapshots.js";

const result = await runTradingSnapshotBatch();
console.log(JSON.stringify(result));
```

Modify `services/veltrix-community-bot/package.json` scripts:

```json
"run:trading-arena-jobs": "node dist/scripts/run-trading-arena-jobs.js"
```

- [ ] **Step 4: Verify service build**

Run:

```powershell
npm run build --workspace vyntro-community-bot
```

Expected: PASS.

- [ ] **Step 5: Commit HTTP API and job**

```powershell
git add services\veltrix-community-bot\src\http\trading.ts services\veltrix-community-bot\src\scripts\run-trading-arena-jobs.ts services\veltrix-community-bot\src\index.ts services\veltrix-community-bot\package.json
git commit -m "Expose trading arena service API"
```

---

### Task 6: Next.js API Proxies And Web Types

**Files:**
- Create: `apps/veltrix-web/src/lib/trading/trading-arena.ts`
- Create: `apps/veltrix-web/src/lib/trading/trading-arena.test.ts`
- Create: `apps/veltrix-web/src/app/api/trading/competitions/route.ts`
- Create: `apps/veltrix-web/src/app/api/trading/competitions/[id]/leaderboard/route.ts`
- Create: `apps/veltrix-web/src/app/api/trading/competitions/[id]/join/route.ts`

- [ ] **Step 1: Write web helper test**

Create `apps/veltrix-web/src/lib/trading/trading-arena.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { formatTradingCost, formatTradingMode } from "./trading-arena";

test("formatTradingMode presents project-safe labels", () => {
  assert.equal(formatTradingMode("snapshot"), "Snapshot Mode");
  assert.equal(formatTradingMode("live"), "Live Tracking");
});

test("formatTradingCost renders cents as euros", () => {
  assert.equal(formatTradingCost(1234), "€12.34");
});
```

- [ ] **Step 2: Implement web helpers**

Create `apps/veltrix-web/src/lib/trading/trading-arena.ts`:

```ts
export type TradingTrackingMode = "snapshot" | "live";

export type TradingCompetitionListItem = {
  id: string;
  projectId: string;
  campaignId: string | null;
  title: string;
  description: string;
  bannerUrl: string | null;
  status: string;
  trackingMode: TradingTrackingMode;
  scoringMode: "volume" | "roi" | "hybrid";
  startsAt: string;
  endsAt: string;
  budgetCapCents: number;
  currentCostCents: number;
  costStatus: string;
};

export function formatTradingMode(mode: TradingTrackingMode) {
  return mode === "live" ? "Live Tracking" : "Snapshot Mode";
}

export function formatTradingCost(cents: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(Math.max(0, cents) / 100);
}
```

- [ ] **Step 3: Create list/create proxy**

Create `apps/veltrix-web/src/app/api/trading/competitions/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { callAespService, getBearerToken, requireAuthenticatedUser } from "@/lib/server/aesp-service";

export async function GET(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    await requireAuthenticatedUser(accessToken);
    const projectId = request.nextUrl.searchParams.get("projectId");
    const suffix = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
    const result = await callAespService(`/trading/competitions${suffix}`, { method: "GET" });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Trading competitions failed." },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  try {
    await requireAuthenticatedUser(accessToken);
    const result = await callAespService("/trading/competitions", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Trading competition creation failed." },
      { status: 400 }
    );
  }
}
```

- [ ] **Step 4: Add stub route files for join and leaderboard**

Create `apps/veltrix-web/src/app/api/trading/competitions/[id]/join/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { ok: false, error: "Trading Arena join is wired after participant persistence lands in the service." },
    { status: 501 }
  );
}
```

Create `apps/veltrix-web/src/app/api/trading/competitions/[id]/leaderboard/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  return NextResponse.json(
    { ok: true, items: [], message: "Leaderboard route is ready for service-backed rows." },
    { status: 200 }
  );
}
```

- [ ] **Step 5: Verify tests**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test apps/veltrix-web/src/lib/trading/trading-arena.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit API proxies and helpers**

```powershell
git add apps\veltrix-web\src\lib\trading apps\veltrix-web\src\app\api\trading
git commit -m "Add trading arena web API proxies"
```

---

### Task 7: Webapp Trading Arena Experience

**Files:**
- Create: `apps/veltrix-web/src/app/trading-arena/page.tsx`
- Create: `apps/veltrix-web/src/app/trading-arena/[id]/page.tsx`
- Create: `apps/veltrix-web/src/components/trading/trading-arena-screen.tsx`
- Create: `apps/veltrix-web/src/components/trading/trading-competition-detail-screen.tsx`
- Create: `apps/veltrix-web/src/components/trading/trading-risk-copy.tsx`
- Modify: `apps/veltrix-web/src/components/layout/app-shell.tsx`
- Modify: `apps/veltrix-web/src/components/defi/defi-landing-screen.tsx`

- [ ] **Step 1: Add Trading Arena risk copy**

Create `apps/veltrix-web/src/components/trading/trading-risk-copy.tsx`:

```tsx
export function TradingRiskCopy() {
  return (
    <div className="rounded-[20px] border border-cyan-300/10 bg-cyan-300/[0.04] p-4 text-sm leading-7 text-slate-300">
      <p className="font-black text-white">Trade through your own wallet. VYNTRO never takes custody.</p>
      <p className="mt-2">
        Trading competitions involve risk. Scores and rewards follow the published competition rules, and suspicious
        activity can be excluded before settlement.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Add overview component**

Create `apps/veltrix-web/src/components/trading/trading-arena-screen.tsx`:

```tsx
"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Trophy } from "lucide-react";
import { TradingRiskCopy } from "./trading-risk-copy";

const previewCompetitions = [
  {
    id: "preview-live",
    title: "Base Volume Sprint",
    mode: "Live Tracking",
    prize: "1,000 USDC",
    status: "Live",
  },
  {
    id: "preview-snapshot",
    title: "Launch Pair Challenge",
    mode: "Snapshot Mode",
    prize: "500 USDC",
    status: "Scheduled",
  },
];

export function TradingArenaScreen() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-white/6 bg-[radial-gradient(circle_at_top_right,rgba(0,204,255,0.18),transparent_36%),linear-gradient(180deg,rgba(13,17,22,0.98),rgba(5,8,12,0.98))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-200">Trading Arena</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.05em] text-white sm:text-6xl">
          Compete on real market momentum.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          Join project trading competitions, follow your rank, and claim rewards after settlement review.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Signal icon={<Trophy className="h-4 w-4" />} label="Live leaderboard" />
          <Signal icon={<BarChart3 className="h-4 w-4" />} label="Snapshot + live modes" />
          <Signal icon={<ShieldCheck className="h-4 w-4" />} label="Anti-abuse review" />
        </div>
      </section>

      <TradingRiskCopy />

      <section className="grid gap-3 lg:grid-cols-2">
        {previewCompetitions.map((competition) => (
          <Link
            key={competition.id}
            href={`/trading-arena/${competition.id}`}
            className="group rounded-[24px] border border-white/6 bg-white/[0.035] p-5 transition hover:border-cyan-300/20 hover:bg-white/[0.055]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.66rem] font-black uppercase tracking-[0.28em] text-cyan-200">
                  {competition.mode}
                </p>
                <h2 className="mt-3 text-xl font-black text-white">{competition.title}</h2>
                <p className="mt-2 text-sm text-slate-300">Reward pool: {competition.prize}</p>
              </div>
              <span className="rounded-full bg-lime-300 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-950">
                {competition.status}
              </span>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-100">
              Open arena <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

function Signal({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/8 bg-black/20 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-200">
      {icon}
      {label}
    </div>
  );
}
```

- [ ] **Step 3: Add overview page**

Create `apps/veltrix-web/src/app/trading-arena/page.tsx`:

```tsx
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedState } from "@/components/shared/protected-state";
import { TradingArenaScreen } from "@/components/trading/trading-arena-screen";

export default function TradingArenaPage() {
  return (
    <AppShell
      eyebrow="Trading Arena"
      title="Live competition board"
      description="Compete through your own wallet, track your rank and claim rewards after the settlement review."
    >
      <ProtectedState allowPreview previewLabel="Trading Arena preview">
        <TradingArenaScreen />
      </ProtectedState>
    </AppShell>
  );
}
```

- [ ] **Step 4: Add detail component and page**

Create `apps/veltrix-web/src/components/trading/trading-competition-detail-screen.tsx`:

```tsx
"use client";

import { Trophy } from "lucide-react";
import { TradingRiskCopy } from "./trading-risk-copy";

export function TradingCompetitionDetailScreen({ competitionId }: { competitionId: string }) {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/6 bg-white/[0.035] p-6">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-200">Competition</p>
        <h1 className="mt-4 text-3xl font-black text-white">Trading competition</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">Competition ID: {competitionId}</p>
      </section>

      <TradingRiskCopy />

      <section className="rounded-[24px] border border-white/6 bg-white/[0.035] p-5">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-lime-300" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-lime-200">Leaderboard</p>
            <h2 className="mt-1 text-xl font-black text-white">Live rank will appear here</h2>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          The service-backed leaderboard is connected after participant join and score persistence lands.
        </p>
      </section>
    </div>
  );
}
```

Create `apps/veltrix-web/src/app/trading-arena/[id]/page.tsx`:

```tsx
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedState } from "@/components/shared/protected-state";
import { TradingCompetitionDetailScreen } from "@/components/trading/trading-competition-detail-screen";

export default async function TradingCompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell
      eyebrow="Trading Arena"
      title="Competition detail"
      description="Review the rules, join with your wallet and follow the live leaderboard."
    >
      <ProtectedState allowPreview previewLabel="Competition preview">
        <TradingCompetitionDetailScreen competitionId={id} />
      </ProtectedState>
    </AppShell>
  );
}
```

- [ ] **Step 5: Add navigation**

Modify `apps/veltrix-web/src/components/layout/app-shell.tsx` by adding:

```ts
{ href: "/trading-arena", label: "Trading", icon: Trophy },
```

Place it near DeFi or Leaderboard.

- [ ] **Step 6: Verify web typecheck**

Run:

```powershell
npm run typecheck --workspace vyntro-web
```

Expected: PASS.

- [ ] **Step 7: Commit webapp experience**

```powershell
git add apps\veltrix-web\src\app\trading-arena apps\veltrix-web\src\components\trading apps\veltrix-web\src\components\layout\app-shell.tsx apps\veltrix-web\src\components\defi\defi-landing-screen.tsx
git commit -m "Add trading arena web experience"
```

---

### Task 8: Portal Source Gate And Project Controls

**Files:**
- Create: `docs/superpowers/portal-source-map-2026-04-29.md`
- Create: `apps/veltrix-web/src/components/trading/trading-arena-control-panel.tsx` when this workspace owns the project workspace surface
- Modify: `apps/veltrix-web/src/app/projects/[id]/page.tsx` when this workspace owns the project workspace surface
- Modify: `apps/veltrix-web/src/components/projects/project-detail-screen.tsx` when this workspace owns the project workspace surface

- [ ] **Step 1: Locate portal source**

Run:

```powershell
Get-ChildItem -Path . -Recurse -File -Include *.tsx,*.ts -ErrorAction SilentlyContinue |
  Select-String -Pattern "Workspace board","Project roster","Launch command center","Board mode" -SimpleMatch |
  Select-Object -First 20
```

Expected:

- If matches appear inside `apps/veltrix-web`, this workspace owns enough of the project workspace surface to add the Trading Arena control panel here.
- If matches only appear outside this repository or no matches appear, `crypto-raid-admin-portal.vercel.app` is not safely editable from this workspace. Document that and stop Task 8 after Step 2.

- [ ] **Step 2: Write the source map decision**

Create `docs/superpowers/portal-source-map-2026-04-29.md` with the result:

```markdown
# Portal Source Map - 2026-04-29

Production portal URL: https://crypto-raid-admin-portal.vercel.app

## Source Decision

- Result: current workspace owns project workspace UI through `apps/veltrix-web`.
- Evidence: `apps/veltrix-web/src/app/projects/[id]/page.tsx` and `apps/veltrix-web/src/components/projects/project-detail-screen.tsx` render the project detail surface.
- Trading Arena portal controls will be added to the current workspace.

## Deployment Guard

- Do not deploy a separate `admin-portal` Vercel project for this feature.
- Production portal target remains `crypto-raid-admin-portal.vercel.app`.
```

If the source is not in this workspace, use this alternate source decision and stop Task 8:

```markdown
# Portal Source Map - 2026-04-29

Production portal URL: https://crypto-raid-admin-portal.vercel.app

## Source Decision

- Result: portal source is not present in `C:\Users\jordi\OneDrive\Documenten\New project`.
- Evidence: project workspace search did not find the deployed portal route/component signatures.
- Trading Arena portal controls are blocked until the repository/folder connected to `crypto-raid-admin-portal` is opened locally.

## Deployment Guard

- Do not mark Trading Arena portal controls complete from the webapp-only source.
- Do not deploy or recreate the removed `admin-portal` project.
- Production portal target remains `crypto-raid-admin-portal.vercel.app`.
```

- [ ] **Step 3: Add control panel component when source is current app**

Create `apps/veltrix-web/src/components/trading/trading-arena-control-panel.tsx`:

```tsx
type TradingArenaControlPanelProps = {
  projectId: string;
  projectName: string;
};

const controlSections = [
  { label: "Create competition", value: "Snapshot or live-tracked arena" },
  { label: "Market pairs", value: "Base/EVM pairs and quote asset" },
  { label: "Tracking mode", value: "Snapshot default, live premium" },
  { label: "Rewards", value: "Rank bands, XP, perks or token pool" },
  { label: "Budget cap", value: "Usage cap before launch" },
  { label: "Live health", value: "Last sync, failures and freshness" },
  { label: "Settlement review", value: "Freeze, review flags, publish winners" },
];

export function TradingArenaControlPanel({
  projectId,
  projectName,
}: TradingArenaControlPanelProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[#0d1218] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.26em] text-lime-300">
            Trading Arena
          </p>
          <h2 className="mt-2 text-2xl font-black">Launch a trading competition</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Create a premium growth arena for {projectName}. Start with predictable snapshots,
            then upgrade to live tracking when the project wants a real-time leaderboard.
          </p>
        </div>
        <a
          href={`/api/trading/competitions?projectId=${projectId}`}
          className="rounded-full bg-lime-300 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
        >
          Open arena API
        </a>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {controlSections.map((section) => (
          <div key={section.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-slate-500">
              {section.label}
            </p>
            <p className="mt-2 text-sm font-bold text-slate-100">{section.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add project workspace entry point when source is current app**

Modify `apps/veltrix-web/src/components/projects/project-detail-screen.tsx` so the project page shows a clear Trading Arena entry. Import:

```tsx
import { TradingArenaControlPanel } from "@/components/trading/trading-arena-control-panel";
```

Render the panel near the existing project action area:

```tsx
<TradingArenaControlPanel projectId={project.id} projectName={project.name} />
```

- [ ] **Step 5: Verify portal route locally or through preview**

Run:

```powershell
npm run dev:web
```

Open the project Trading Arena route and verify:

- Create panel is visible.
- Cost panel is visible.
- Settlement panel is visible.
- Existing project navigation still works.

- [ ] **Step 6: Commit portal controls**

If source is current app:

```powershell
git add docs\superpowers\portal-source-map-2026-04-29.md apps\veltrix-web\src\components\trading\trading-arena-control-panel.tsx apps\veltrix-web\src\components\projects\project-detail-screen.tsx apps\veltrix-web\src\app\projects\[id]\page.tsx
git commit -m "Add trading arena portal controls"
```

If source is not current app:

```powershell
git add docs\superpowers\portal-source-map-2026-04-29.md
git commit -m "Document trading arena portal source gate"
```

Do not mark portal controls complete until the source connected to `crypto-raid-admin-portal.vercel.app` is opened and updated.

---

### Task 9: Join, Leaderboard, Rewards, And Settlement Wiring

**Files:**
- Modify: `services/veltrix-community-bot/src/core/trading/repository.ts`
- Modify: `services/veltrix-community-bot/src/core/trading/settlement.ts`
- Modify: `services/veltrix-community-bot/src/http/trading.ts`
- Modify: `apps/veltrix-web/src/app/api/trading/competitions/[id]/join/route.ts`
- Modify: `apps/veltrix-web/src/app/api/trading/competitions/[id]/leaderboard/route.ts`
- Modify: `apps/veltrix-web/src/app/api/trading/competitions/[id]/settle/route.ts`

- [ ] **Step 1: Add participant join in repository**

Append to `repository.ts`:

```ts
export async function joinTradingCompetition(input: {
  competitionId: string;
  authUserId: string;
}) {
  const { data: walletLink, error: walletError } = await supabaseAdmin
    .from("wallet_links")
    .select("id, wallet_address")
    .eq("auth_user_id", input.authUserId)
    .eq("verified", true)
    .order("verified_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (walletError) throw walletError;
  if (!walletLink?.wallet_address) {
    throw new Error("Connect and verify a wallet before joining this trading competition.");
  }

  const { data, error } = await supabaseAdmin
    .from("trading_competition_participants")
    .upsert(
      {
        competition_id: input.competitionId,
        auth_user_id: input.authUserId,
        wallet_address: String(walletLink.wallet_address).toLowerCase(),
        wallet_link_id: walletLink.id,
        status: "joined",
      },
      { onConflict: "competition_id,auth_user_id" }
    )
    .select("id")
    .single();

  if (error) throw error;
  return { ok: true, participantId: data.id as string };
}
```

- [ ] **Step 2: Add service route for join**

Append to `services/veltrix-community-bot/src/http/trading.ts`:

```ts
const joinCompetitionSchema = z.object({
  authUserId: z.string().uuid(),
});

tradingRouter.post("/competitions/:competitionId/join", async (req, res) => {
  if (!hasValidWebhookSecret(req.header("x-community-bot-secret") ?? undefined)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  const parsed = joinCompetitionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid join payload.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const { joinTradingCompetition } = await import("../core/trading/repository.js");
    return res.status(200).json(
      await joinTradingCompetition({
        competitionId: req.params.competitionId,
        authUserId: parsed.data.authUserId,
      })
    );
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Trading competition join failed.",
    });
  }
});
```

- [ ] **Step 3: Replace web join proxy stub**

Modify `apps/veltrix-web/src/app/api/trading/competitions/[id]/join/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { callAespService, getBearerToken, requireAuthenticatedUser } from "@/lib/server/aesp-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const user = await requireAuthenticatedUser(accessToken);
    const { id } = await context.params;
    const result = await callAespService(`/trading/competitions/${id}/join`, {
      method: "POST",
      body: JSON.stringify({ authUserId: user.id }),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Join failed." },
      { status: 400 }
    );
  }
}
```

- [ ] **Step 4: Add leaderboard service read**

Append to `repository.ts`:

```ts
export async function getTradingCompetitionLeaderboard(input: {
  competitionId: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
  const { data, error } = await supabaseAdmin
    .from("trading_competition_leaderboard")
    .select("rank, auth_user_id, score, volume_usd, roi_percent, trade_count, flags_count, status, score_breakdown")
    .eq("competition_id", input.competitionId)
    .order("rank", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return { ok: true, items: data ?? [] };
}
```

- [ ] **Step 5: Verify wiring**

Run:

```powershell
npm run typecheck --workspace vyntro-community-bot
npm run typecheck --workspace vyntro-web
```

Expected: both PASS.

- [ ] **Step 6: Commit join and leaderboard wiring**

```powershell
git add services\veltrix-community-bot\src\core\trading services\veltrix-community-bot\src\http\trading.ts apps\veltrix-web\src\app\api\trading
git commit -m "Wire trading arena join and leaderboard"
```

---

### Task 10: Production Verification And Deployment

**Files:**
- Modify only files required by failures found during verification.

- [ ] **Step 1: Run full tests**

```powershell
npm run test
```

Expected: PASS.

- [ ] **Step 2: Run full typecheck**

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run build**

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 4: Run lint**

```powershell
npm run lint
```

Expected: PASS or existing non-blocking warnings only.

- [ ] **Step 5: Manual production-readiness checks**

Check:

- Migration exists and has been applied in Supabase before enabling live routes.
- `BASE_RPC_URLS` or provider-specific RPC env values are set on the service that runs live tracking.
- Community bot service has Supabase URL, service role key, callback secret, and webhook secret.
- Vercel webapp points to the correct portal/service URLs.
- Render cron/job service can run `npm run run:trading-arena-jobs`.
- Portal project source was updated and deployment target is `crypto-raid-admin-portal.vercel.app`.

- [ ] **Step 6: Commit final fixes**

```powershell
git status --short
git add database\migrations\vyntro_trading_arena_v1.sql services\veltrix-community-bot\src\core\trading services\veltrix-community-bot\src\http\trading.ts services\veltrix-community-bot\src\scripts\run-trading-arena-jobs.ts services\veltrix-community-bot\package.json apps\veltrix-web\src\app\api\trading apps\veltrix-web\src\app\trading-arena apps\veltrix-web\src\components\trading apps\veltrix-web\src\lib\trading apps\veltrix-web\src\components\layout\app-shell.tsx apps\veltrix-web\src\components\defi\defi-landing-screen.tsx docs\superpowers\portal-source-map-2026-04-29.md
git commit -m "Stabilize trading arena production rollout"
```

Only run the final commit if `git status --short` shows files changed during verification.

- [ ] **Step 7: Push production branch**

```powershell
git push origin codex/galxe-translation-wave1
git checkout master
git pull --ff-only origin master
git merge --ff-only codex/galxe-translation-wave1
git push origin master
```

Use the repository's current production flow if `master` is still the production branch.

---

## Self-Review

Spec coverage:

- Snapshot Mode: Tasks 1, 3, 5, 7, 10.
- Live Tracking Mode: Tasks 1, 4, 5, 8, 10.
- Cost ledger and budget caps: Tasks 1, 2, 8.
- Webapp discovery/detail/leaderboard: Tasks 6, 7, 9.
- Portal project controls: Task 8.
- Rewards and settlement: Tasks 1, 4, 9.
- Anti-abuse foundation: Tasks 1, 2, 4.
- Production verification: Task 10.

Red-flag scan:

- The plan avoids empty-work markers and undefined file ownership.
- Task 8 intentionally requires locating portal source before portal edits because the currently visible workspace does not expose the deployed portal route files.

Type consistency:

- Tracking modes use `snapshot | live`.
- Scoring modes use `volume | roi | hybrid`.
- Competition status values match the database check constraint.
- Cost status values match the database check constraint.
