# VYNTRO Trust Engine v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-grade VYNTRO anti-fraud moat: risk events, Trust Engine v2 scoring, and reward/XP enforcement.

**Architecture:** Add a normalized risk data model in Supabase, pure TypeScript scoring helpers for the webapp and bot, and enforcement gates at XP awards plus reward distribution finalization. The first implementation prioritizes deterministic, explainable rules over opaque provider scoring.

**Tech Stack:** Supabase/Postgres RLS migrations, TypeScript, Next.js app utilities, Node service jobs, built-in `node:test`.

---

### Task 1: Data Foundation

**Files:**
- Create: `database/migrations/vyntro_trust_engine_v2_foundation.sql`

- [ ] **Step 1: Create risk-event tables and policies**

Add SQL for `risk_events`, `risk_event_rollups`, `trust_decisions`, `session_risk_events`, and `wallet_graph_edges`. All tables enable RLS. Users only read their own summarized rows where appropriate, project members read project-scoped summaries, and only super admins or service-role backend jobs mutate.

- [ ] **Step 2: Add indexes for trust reads**

Add indexes on project/user/status/severity/dedupe fields so review and enforcement checks stay cheap.

- [ ] **Step 3: Confirm migration is idempotent**

Every create/index/policy block must use `if not exists` or `drop policy if exists` before create.

### Task 2: Trust Engine v2 Pure Rules

**Files:**
- Create: `apps/veltrix-web/src/lib/trust/trust-engine.ts`
- Create: `apps/veltrix-web/src/lib/trust/trust-engine.test.ts`
- Modify: `services/veltrix-community-bot/src/core/trust/risk-score.ts`
- Modify: `services/veltrix-community-bot/src/core/trust/risk-score.test.ts`

- [ ] **Step 1: Write failing web tests**

Cover: high sybil produces `review_required`, reward-hold threshold produces `reward_hold`, terminal statuses do not downgrade, public labels stay calm.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- apps/veltrix-web/src/lib/trust/trust-engine.test.ts`

- [ ] **Step 3: Implement web Trust Engine v2**

Export `deriveTrustDecision`, `isXpBlockedByTrust`, `isRewardHeldByTrust`, and `getPublicTrustState`.

- [ ] **Step 4: Upgrade bot risk-score contract**

Keep existing API compatible while adding `riskLevel`, `recommendedAction`, `rewardHoldRequired`, and `reasonCodes`.

- [ ] **Step 5: Run targeted tests**

Run: `npm test -- apps/veltrix-web/src/lib/trust/trust-engine.test.ts services/veltrix-community-bot/src/core/trust/risk-score.test.ts`

### Task 3: XP Enforcement

**Files:**
- Modify: `apps/veltrix-web/src/lib/xp/xp-awards.ts`
- Modify: `apps/veltrix-web/src/lib/xp/xp-awards.test.ts`

- [ ] **Step 1: Write failing XP tests**

Cover: `sybil_score >= 70` blocks XP as `account-review`, `reward_hold` blocks XP, and `watch` still allows XP with trust multiplier.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- apps/veltrix-web/src/lib/xp/xp-awards.test.ts`

- [ ] **Step 3: Wire XP awards into Trust Engine v2**

Use `deriveTrustDecision` before calling `buildXpAwardPlan`. Return `account-review` when the decision blocks XP.

- [ ] **Step 4: Run targeted tests**

Run: `npm test -- apps/veltrix-web/src/lib/xp/xp-awards.test.ts apps/veltrix-web/src/lib/trust/trust-engine.test.ts`

### Task 4: Reward Hold Enforcement

**Files:**
- Create: `services/veltrix-community-bot/src/core/trust/reward-eligibility.ts`
- Create: `services/veltrix-community-bot/src/core/trust/reward-eligibility.test.ts`
- Modify: `services/veltrix-community-bot/src/core/aesp/rewards.ts`
- Modify: `services/veltrix-community-bot/src/core/trading/settlement.ts`

- [ ] **Step 1: Write failing reward eligibility tests**

Cover: active/watch users become `claimable`, review/reward-hold users become `held_for_review`, suspended/banned users become `blocked`.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- services/veltrix-community-bot/src/core/trust/reward-eligibility.test.ts`

- [ ] **Step 3: Implement reward eligibility helper**

Export pure functions that map reputation snapshots to distribution status and metadata.

- [ ] **Step 4: Apply helper to campaign finalization**

Before upserting `reward_distributions`, fetch reputation for recipient IDs and set status plus calculation snapshot trust metadata.

- [ ] **Step 5: Apply helper to trading settlement**

Apply the same status mapping for trading arena reward distributions.

- [ ] **Step 6: Run targeted tests**

Run: `npm test -- services/veltrix-community-bot/src/core/trust/reward-eligibility.test.ts`

### Task 5: Risk Event Writer

**Files:**
- Create: `services/veltrix-community-bot/src/core/trust/risk-events.ts`
- Create: `services/veltrix-community-bot/src/core/trust/risk-events.test.ts`
- Modify: `services/veltrix-community-bot/src/core/trust/trust-cases.ts`

- [ ] **Step 1: Write failing risk event tests**

Cover: dedupe key construction, severity normalization, and risk event row shape.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- services/veltrix-community-bot/src/core/trust/risk-events.test.ts`

- [ ] **Step 3: Implement risk event row builder and writer**

Add `buildRiskEventRowsFromSignals` and `recordRiskEventsFromSignals`.

- [ ] **Step 4: Call writer from trust-case ingestion**

Trust cases should write normalized risk events before reputation scoring.

- [ ] **Step 5: Run targeted tests**

Run: `npm test -- services/veltrix-community-bot/src/core/trust/risk-events.test.ts services/veltrix-community-bot/src/core/trust/risk-score.test.ts`

### Task 6: Verification

**Files:**
- No new files.

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`

- [ ] **Step 2: Run tests**

Run: `npm test`

- [ ] **Step 3: Run build**

Run: `npm run build`

- [ ] **Step 4: Review git diff**

Run: `git status --short` and `git diff --stat`.

