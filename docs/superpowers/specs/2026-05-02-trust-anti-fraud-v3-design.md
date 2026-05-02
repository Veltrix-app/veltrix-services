# Trust / Anti-Fraud v3 Design

## Context

VYNTRO already has a strong Trust Engine v2 foundation:

- `risk_events` stores evidence for wallet, session, social, reward, raid, quest, DeFi and manual review signals.
- `risk_event_rollups` stores per-project user risk summaries.
- `trust_decisions` stores operator and engine decisions.
- `session_risk_events` stores privacy-preserving session evidence.
- `wallet_graph_edges` stores wallet relationship evidence.
- XP and reward enforcement already understand review, reward hold, XP suspension, suspension and ban states.

Trust / Anti-Fraud v3 should build on that foundation instead of creating a parallel system.

## Product Goal

Reach a premium anti-fraud posture comparable to top Web3 growth platforms while staying careful about false positives.

The system should be strict on XP and reward abuse, but conservative with permanent exclusion. Most high-risk cases should first go to review or reward hold, not immediate ban.

## Core Principle

Every fraud decision should be evidence-led, appealable where appropriate, and safe to summarize for projects without exposing private user data.

## Scope

Trust / Anti-Fraud v3 includes:

- Wallet graph signals.
- Device/session reputation and velocity signals.
- Duplicate social detection.
- Suspicious claim pattern detection.
- Manual review workflows.
- Appeal workflows.
- Project-visible trust summaries.
- Centralized decision policy that turns evidence into safe enforcement actions.

Out of scope for this v3 core pass:

- Browser fingerprinting through invasive third-party identity providers.
- Fully automated permanent bans for non-critical signals.
- Portal UI implementation in this checkout, because this workspace currently contains `veltrix-web` and `veltrix-docs`, not the separate portal source.

## Recommended Enforcement Model

Use review-first enforcement:

- Clear users continue normally.
- Watch users can participate, with reduced trust posture and extra monitoring.
- Review-required users keep progress, but XP/reward issuance pauses.
- Reward-hold users can continue activity, but rewards do not release until reviewed.
- XP-suspended users cannot earn or claim XP until reviewed.
- Suspended users cannot participate.
- Banned users are terminal unless a super-admin restore decision is made.

Only critical, repeated, or clearly malicious evidence should recommend suspension or ban.

## Signal Categories

### Wallet Graph

Detects relationships between wallets that may indicate coordinated farming.

Signals:

- Shared funding wallet.
- Shared withdrawal wallet.
- Transfer cluster.
- Same session linked to multiple wallets.
- Operator or manual link.

Expected action:

- Low confidence creates watch.
- Medium confidence creates review.
- High confidence plus reward pressure creates reward hold.
- Critical clusters can create XP suspension.

### Device / Session Reputation

Uses hashed, privacy-preserving session evidence.

Signals:

- Too many accounts from the same session hash.
- Too many claim attempts from one session in a short window.
- Repeated failed verification attempts.
- Account switching around high-value rewards.

Expected action:

- Velocity spikes create watch or review.
- Session clusters with reward claims create reward hold.

### Duplicate Social Detection

Detects reused or suspicious social identities across accounts.

Signals:

- Same X/Discord/Telegram identity linked to multiple auth users.
- Same proof URL submitted across multiple users.
- Repeated social proof text or screenshots.
- New accounts claiming rewards through the same social identity pattern.

Expected action:

- Duplicate social identity creates review.
- Duplicate proof connected to reward claims creates reward hold.

### Suspicious Claim Patterns

Detects reward and XP farming behavior.

Signals:

- Claim velocity above project or source policy.
- Repeated claims immediately after account creation.
- Same campaign completed by linked wallets/sessions.
- Reward-heavy actions without normal participation history.
- High-value claims from low-trust accounts.

Expected action:

- Mild velocity creates watch.
- Repeated or high-value suspicious claims create reward hold.
- Critical repeat abuse can suspend XP.

## Decision Engine

Trust v3 should introduce a central decision builder that accepts:

- Current v2 trust decision.
- Active risk events.
- Risk rollup.
- Wallet graph summary.
- Session velocity summary.
- Duplicate social summary.
- Claim pattern summary.
- Existing manual decisions.

It returns:

- `riskLevel`: `clear`, `low`, `medium`, `high`, `critical`.
- `recommendedAction`: `allow`, `watch`, `review_required`, `reward_hold`, `xp_suspended`, `suspend`, `ban`.
- `publicStatus`: user-safe status text.
- `projectSummary`: project-safe summary without sensitive hashes.
- `reviewReasons`: human-readable reasons.
- `hiddenEvidence`: internal-only evidence references.

The v3 engine must never downgrade terminal v2 states automatically.

## Manual Review Flow

Reviewers should be able to:

- See project-safe user identity.
- See risk level and reason categories.
- See evidence references, not raw private identifiers unless super-admin.
- Choose allow, watch, review-required, reward-hold, XP-suspended, suspend, ban or restore.
- Add notes.
- Store the decision in `trust_decisions`.
- Update rollups and enforcement posture.

Manual decisions should always override auto recommendations until explicitly restored or superseded by a higher-severity event.

## Appeal Flow

Users should be able to submit an appeal for review-related enforcement states.

Appeal fields:

- Auth user.
- Optional project.
- Current trust status.
- Appeal reason.
- Optional evidence URL/text.
- Status: open, reviewing, accepted, rejected, closed.
- Reviewer notes.

Appeal visibility:

- User can see their own appeal status.
- Project can see appeal state for users in their project scope.
- Super-admin can see all evidence.

Appeal acceptance should create a restore or watch decision, not silently mutate state.

## Project-Visible Trust Summary

Projects should not see raw session hashes, IP hashes, private graph details or cross-project sensitive evidence.

They can see:

- Trust tier.
- Risk level.
- Open review state.
- Reward eligibility.
- XP eligibility.
- Broad risk categories, such as wallet graph, duplicate social, claim velocity.
- Recommended next action, such as review, hold rewards, or no action.

This gives projects confidence without turning the portal into a privacy leak.

## Data Model Additions

Add:

- `trust_review_cases`: one active review workspace per project/user when enforcement needs human action.
- `trust_appeals`: user-submitted appeal records.
- `trust_signal_summaries`: normalized rollup rows per user/project/category for fast reads.

Extend:

- `risk_events.risk_category` if new categories are needed.
- `risk_events.source_type` if engine-generated events need a distinct source type.
- `risk_event_rollups.metadata` to include v3 category counts and project-safe summary fields.

## API / Core Modules

Core modules:

- `trust-engine-v3.ts`: policy and decision builder.
- `trust-signals.ts`: builders for wallet, session, duplicate social and claim signals.
- `trust-review.ts`: review case and appeal read models.
- `project-trust-summary.ts`: project-safe summary builder.

API routes can be added after core is stable:

- `POST /api/trust/signals`: service/admin ingestion endpoint.
- `GET /api/trust/summary`: user-safe trust read.
- `GET /api/projects/[id]/trust/summary`: project-safe member trust read.
- `POST /api/trust/appeals`: user appeal submission.
- `POST /api/trust/review-decisions`: reviewer decision endpoint.

## Testing Strategy

Use TDD for each behavior.

Required tests:

- Wallet graph clusters escalate from watch to review/hold based on confidence and reward pressure.
- Session velocity creates review or reward hold without exposing raw hashes in project summaries.
- Duplicate social identity creates review.
- Suspicious claim velocity creates reward hold.
- Manual decisions override lower auto recommendations.
- Terminal statuses are never auto-downgraded.
- Appeals can restore only through an explicit decision.
- Project summaries hide raw session/IP/device identifiers.
- XP/reward enforcement respects v3 decisions.

## Rollout Plan

1. Core policy and signal builders.
2. SQL migration for review cases, appeals and signal summaries.
3. Project-safe summary model.
4. API routes for user summary, project summary and appeals.
5. Enforcement integration with XP/reward flows.
6. Portal UI once the correct portal source is available in this workspace or a separate checkout.

## Success Criteria

Trust / Anti-Fraud v3 is complete when:

- Evidence from wallet graph, session velocity, duplicate socials and claim behavior can become standardized risk events.
- The v3 decision engine produces stable recommendations without bypassing v2 enforcement.
- Reward and XP flows can pause safely on high-risk states.
- Users can appeal review/hold states.
- Projects can see useful trust summaries without private evidence leakage.
- Tests cover all critical policy paths.
