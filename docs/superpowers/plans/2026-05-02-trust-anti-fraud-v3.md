# Trust Anti-Fraud v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade VYNTRO trust from a strong v2 foundation to a premium anti-fraud moat: wallet graph, device/session reputation, velocity checks, duplicate social detection, suspicious claim patterns, manual review, appeals, and project-safe trust summaries.

**Architecture:** Build on the existing Trust Engine v2 instead of creating a parallel system. V3 adds normalized signal builders, a decision orchestrator, project-visible sanitized summaries, review/appeal read models, and database persistence for review cases and appeals. XP and reward enforcement continues to read a single trust decision surface.

**Tech Stack:** Next.js app in `apps/veltrix-web`, TypeScript pure domain modules, Node test runner, Supabase/Postgres migrations in `database/migrations`.

---

## Guardrails

- Keep the existing v2 trust statuses and enforcement semantics compatible.
- Never expose raw IP hashes, user agent hashes, session identifiers, raw wallet graph edges, or social-account IDs in project-visible summaries.
- Prefer review-first enforcement. Ban/suspend only for manual decisions or repeated critical patterns.
- Make the core logic testable without Supabase.
- Portal UI source is not present in this checkout; ship backend/read-model foundations here and wire portal UI in the portal repo later.

## Task 1: V3 Signal Contract

- [x] Add failing tests in `apps/veltrix-web/src/lib/trust/trust-signals-v3.test.ts`.
- [x] Cover wallet graph risk, session velocity, duplicate social proof, suspicious claim patterns, and project evidence sanitization.
- [x] Implement `apps/veltrix-web/src/lib/trust/trust-signals-v3.ts`.
- [x] Verify only the trust tests fail before implementation and pass after implementation.

Expected behavior:

- Wallet graph clustering can create `review_required` or `reward_hold` recommendations.
- Session velocity can create `watch`, `review_required`, or `xp_suspended` recommendations.
- Duplicate social proof creates `review_required` or `reward_hold`.
- Suspicious reward claims can hold rewards without immediately banning the user.
- Sanitized evidence keeps counts, labels, thresholds, and categories, but removes private raw identifiers.

## Task 2: V3 Decision Orchestrator

- [x] Add failing tests in `apps/veltrix-web/src/lib/trust/trust-engine-v3.test.ts`.
- [x] Implement `apps/veltrix-web/src/lib/trust/trust-engine-v3.ts`.
- [x] Preserve v2 terminal status behavior.
- [x] Add review-first escalation from signal severity and recommended action.
- [x] Add enforcement output for XP, rewards, DeFi actions, and appeal availability.

Expected behavior:

- Low signal pressure keeps users active or watchlisted.
- Medium/high signal pressure moves to review without leaking project-private evidence.
- Critical repeated pressure can suspend XP or rewards, but does not auto-ban without manual status.
- Existing `reward_hold`, `xp_suspended`, `suspended`, and `banned` statuses are not downgraded.

## Task 3: Project-Safe Trust Summary

- [x] Add failing tests in `apps/veltrix-web/src/lib/trust/project-trust-summary.test.ts`.
- [x] Implement `apps/veltrix-web/src/lib/trust/project-trust-summary.ts`.
- [x] Return compact project-facing labels, next action, reward eligibility, XP eligibility, and visible risk categories.
- [x] Ensure private evidence references are hidden from project-facing objects.

Expected behavior:

- Projects can understand whether a participant is clear, watchlisted, under review, reward-held, XP-suspended, suspended, or banned.
- Projects see actionable categories, not raw fingerprinting data.

## Task 4: Manual Review And Appeal Flow

- [x] Add failing tests in `apps/veltrix-web/src/lib/trust/trust-review-flow.test.ts`.
- [x] Implement `apps/veltrix-web/src/lib/trust/trust-review-flow.ts`.
- [x] Add helpers for opening review cases, priority, SLA labels, and appeal availability.
- [x] Make banned users use a stricter support/manual-review path instead of regular appeal copy.

Expected behavior:

- Review cases open only when a decision requires review, reward hold, XP suspension, suspension, or ban.
- Appeals are available for review and hold states, but not for clear/watch states.
- Ban messaging stays cautious and manual.

## Task 5: Database Migration

- [x] Add `database/migrations/vyntro_trust_anti_fraud_v3.sql`.
- [x] Create `trust_signal_summaries`, `trust_review_cases`, and `trust_appeals`.
- [x] Add indexes for project, auth user, wallet, status, priority, and created time.
- [x] Enable RLS.
- [x] Add policies that keep user appeals user-scoped and project trust summaries project-scoped.
- [x] Avoid weakening existing `risk_events` constraints.

Expected behavior:

- V3 can persist sanitized signal summaries and review/appeal workflow state.
- Project members only read scoped project summaries, not cross-project raw evidence.

## Task 6: API Read Models

- [x] Inspect existing Supabase/server route patterns before writing routes.
- [x] Add a user-facing trust summary endpoint if the app already has compatible auth helpers.
- [x] Add a project-scoped trust summary endpoint if project membership helpers are available.
- [x] If auth helpers are not compatible in this checkout, keep API out of scope and document the integration seam.

Expected behavior:

- No route should expose private evidence.
- No route should bypass existing auth/project-role checks.

## Task 7: Verification And Integration

- [x] Run targeted trust tests.
- [x] Run full `npm test`.
- [x] Run `npm run typecheck`.
- [x] Run `npm run build`.
- [x] Run `npm run lint`.
- [x] Update docs if an integration seam remains for the portal repo.
- [x] Commit and push after verification passes.

## Rollout Notes

- Existing Trust v2 should remain the enforcement foundation until V3 tables are deployed.
- Portal implementation should consume project-safe summaries only.
- The first premium launch version should surface user-level summaries, project participant summaries, manual review queue, and appeals.
