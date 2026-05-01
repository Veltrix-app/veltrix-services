# VYNTRO Trust Engine v2 Design

Date: 2026-05-01
Status: Design ready for review
Owner: VYNTRO Trust / Security

## Goal

Bring VYNTRO from a launchable anti-sybil foundation to a premium anti-fraud moat. The system should protect global XP, rewards, DeFi missions, raids, quest completions and project trust by combining risk events, wallet graph signals, session signals, scoring, reward holds and a clear review workflow.

The product promise is:

- Projects can trust that rewards are not paid to obvious bot farms or low-quality sybil clusters.
- Members can understand when an account is clear, under review, reward-held or suspended.
- VYNTRO can explain every automated trust decision with evidence, not black-box magic.
- Admins can override decisions safely without weakening the default protection layer.

## Current Foundation

The current system already has a strong v1 base:

- Global XP is calculated centrally with source caps and policy bands.
- XP awards use `trust_score`, `sybil_score` and account `status`.
- XP is blocked for `review_required`, `xp_suspended`, `reward_hold`, `banned`, `suspended` and `flagged`.
- Suspicious bot/on-chain signals can create trust cases and update global reputation.
- Sensitive reputation, XP, wallet, reward and verification tables are now protected by stricter RLS.

This design builds on that foundation rather than replacing it.

## Product Principles

### 1. Evidence Before Punishment

Every automated restriction must be tied to structured evidence. A user should not be suspended just because a number changed. The system must store which event changed the score, where it came from, when it happened and what action was recommended.

### 2. Hold Rewards Before Banning Users

The safest default is to pause reward delivery before banning a user. Most suspicious states should start as `watch` or `reward_hold`, then escalate only when multiple signals agree.

### 3. Separate XP, Rewards and Access

The system needs independent controls:

- XP eligibility: can this user earn global XP?
- Reward eligibility: can this user receive campaign rewards?
- Access eligibility: can this user keep using the product?

This avoids overreacting. A user can be allowed to browse while rewards are held for review.

### 4. Project-Friendly Explanations

The portal should show a clear explanation: `Fresh wallet + repeated low-value activity + shared funding cluster`. It should not force projects to read raw database rows.

### 5. Privacy-First Signals

Session and device signals should use hashes and aggregates. VYNTRO should not store raw IP addresses unless a separate legal/privacy decision explicitly allows it.

## V2 Scope

V2 includes:

- Risk event ingestion and storage.
- Trust Engine v2 scoring.
- Reward hold and claim eligibility gates.
- Wallet graph risk signals.
- Session/device risk signals using hashed identifiers.
- Trust review center data model.
- Admin/project decision workflow.
- User-facing trust states.
- Tests for scoring, gates, reward holds and RLS-sensitive flows.

V2 does not include:

- Full KYC.
- External anti-fraud providers.
- CAPTCHA provider rollout.
- Legal identity verification.
- Full machine-learning model training.

Those belong in a future enterprise add-on phase after the core trust moat is stable.

## Trust States

Use one central status model for global account posture:

- `active`: clear enough to earn XP and claim rewards.
- `watch`: user can keep earning, but trust evidence is being monitored.
- `review_required`: XP and reward claims pause until review.
- `reward_hold`: XP may remain visible, but reward delivery is blocked.
- `xp_suspended`: XP earning and reward delivery are blocked.
- `suspended`: product participation is blocked.
- `banned`: account is permanently blocked.

For display, map these to member-facing labels:

- `active` -> `Clear`
- `watch` -> `Monitored`
- `review_required` -> `Under review`
- `reward_hold` -> `Reward held`
- `xp_suspended` -> `XP suspended`
- `suspended` -> `Suspended`
- `banned` -> `Banned`

## Risk Event Layer

Create a normalized risk event layer that every suspicious subsystem can write to.

Each risk event should contain:

- `auth_user_id`
- `project_id`
- `wallet_address`
- `event_type`
- `risk_category`
- `severity`
- `source_type`
- `source_id`
- `dedupe_key`
- `reason`
- `evidence`
- `score_delta`
- `recommended_action`
- `created_at`

Risk categories:

- `wallet_graph`
- `session_velocity`
- `quest_abuse`
- `raid_abuse`
- `reward_abuse`
- `defi_abuse`
- `social_abuse`
- `manual_review`

Recommended actions:

- `allow`
- `watch`
- `review_required`
- `reward_hold`
- `xp_suspended`
- `suspend`
- `ban`

The risk event layer becomes the audit trail behind trust cases and global reputation.

## Trust Engine v2

The scoring engine reads risk events and current reputation, then produces:

- `trust_score`
- `sybil_score`
- `risk_level`
- `status`
- `recommended_action`
- `review_required`
- `reward_hold_required`
- `hard_blocked`
- `reason_codes`

Risk levels:

- `clear`: sybil score below 35 and trust score at least 50.
- `low`: minor issues, no restrictions.
- `medium`: monitor and lower XP multiplier.
- `high`: review required and reward hold.
- `critical`: XP suspended or account suspended.

Default thresholds:

- `sybil_score >= 50`: `watch`
- `sybil_score >= 70`: `review_required`
- `sybil_score >= 80`: `reward_hold`
- `sybil_score >= 90`: `xp_suspended`
- `trust_score < 35`: `watch`
- `trust_score < 25`: `review_required`
- `trust_score < 15`: `reward_hold`

Terminal enforcement statuses must not auto-downgrade:

- `reward_hold`
- `xp_suspended`
- `suspended`
- `banned`

## Reward Hold Flow

Reward eligibility should no longer depend only on campaign completion. Before a reward becomes claimable, VYNTRO checks:

- User global reputation status.
- User project reputation status.
- Open trust cases for the project/user.
- Recent high-severity risk events.
- Wallet link health.
- Campaign-specific eligibility rules.

Reward claim states:

- `locked`: not yet earned.
- `eligible`: earned but not yet claimed.
- `held_for_review`: earned but blocked by trust/risk policy.
- `claimable`: clear and claimable.
- `claimed`: completed.
- `rejected`: reviewed and rejected.

Default policy:

- `active` and `watch`: claimable if campaign rules pass.
- `review_required`: `held_for_review`.
- `reward_hold`: `held_for_review`.
- `xp_suspended`, `suspended`, `banned`: not claimable.

The UI should explain held rewards with plain copy:

`This reward is held while VYNTRO reviews trust signals. Your progress is saved.`

## Wallet Graph Signals

Wallet graph analysis should start with deterministic rules:

- Fresh wallet: wallet age below project threshold.
- Shared funding source: multiple participating wallets funded by the same source.
- Reused wallet cluster: same wallet linked to suspicious accounts.
- Low-value spam: many low-value actions within a short window.
- Round-trip behavior: deposit/action/withdraw pattern with very short hold time.
- Contract allowlist violation: action comes from unsupported contract or router.

Each wallet graph signal creates a risk event and can open or refresh a trust case.

V1 graph computation can run in the community bot jobs using existing wallet, on-chain and XP tables. A future scale phase can move this to a dedicated graph service.

## Session and Device Signals

Add a privacy-first session risk table. Store hashes, not raw identifiers.

Signals:

- Many accounts from one session hash.
- Many wallets verified from one device hash.
- Very high action velocity.
- Repeated failed verification attempts.
- Impossible timing patterns across quests/raids.

Suggested stored values:

- `ip_hash`
- `user_agent_hash`
- `session_hash`
- `request_path`
- `event_type`
- `auth_user_id`
- `created_at`

Do not show raw hashes to projects. The portal should show human-readable summaries, for example:

`Multiple accounts share the same session pattern.`

## Portal Review Center

The portal needs one dedicated trust workflow instead of scattering trust data across pages.

Primary surfaces:

- Trust overview: open cases, held rewards, suspended accounts, recent high-risk events.
- Case detail: user, wallet, project, evidence, score movement and related rewards.
- Decision actions: approve, hold rewards, suspend XP, suspend account, ban, add note.
- Project-safe view: projects see their own affected users and evidence summaries.
- Super-admin view: VYNTRO sees cross-project clusters and full evidence.

Decision actions should create immutable decision records.

Every decision record should include:

- actor auth user id
- actor role
- action
- previous status
- new status
- reason
- notes
- created_at

## User-Facing UX

Users should never see raw fraud language first. The public app should use calm states:

- `Clear`: normal.
- `Monitored`: account is usable, no action required.
- `Under review`: XP/rewards pause while checks complete.
- `Reward held`: progress saved, reward cannot be claimed yet.
- `Suspended`: contact support or wait for review.

Avoid public labels like `sybil`, `bot`, `fraud` unless the user is fully banned and legal/compliance copy is approved.

## Data Model Changes

Add or extend:

- `risk_events`
- `risk_event_rollups`
- `trust_decisions`
- `session_risk_events`
- `wallet_graph_edges`
- `reward_distributions.status` normalization if needed
- `user_global_reputation.metadata` with latest risk summary

Use server/service-role writes for sensitive trust mutation. Browser clients may read their own summarized trust posture but must not mutate scores.

## API and Job Changes

Add server-side helpers:

- `recordRiskEvent`
- `deriveTrustDecision`
- `applyTrustDecision`
- `getRewardClaimEligibility`
- `holdRewardForReview`
- `releaseHeldReward`

Update flows:

- XP award route uses Trust Engine v2 output.
- DeFi XP eligibility uses Trust Engine v2 output.
- Reward distribution jobs apply reward hold before claimable.
- Bot trust cases write risk events first, then derive reputation.
- Wallet verification writes session/device risk signals.

## Security Requirements

- RLS enabled on all new risk tables.
- Users can read only their own summarized trust posture.
- Project members can read project-scoped cases and summaries.
- Only super admins or service-role jobs can mutate risk scores.
- Raw session hashes are not exposed to project members.
- Trust decisions are append-only.
- Manual overrides require actor and reason.

## Testing Requirements

Tests must cover:

- Risk event dedupe.
- Score derivation by severity and category.
- Terminal status does not auto-downgrade.
- Reward eligibility returns `held_for_review` when risk requires it.
- XP award blocks `review_required`, `reward_hold`, `xp_suspended`, `suspended`, `banned`.
- Browser bootstrap cannot overwrite reputation.
- Session signal creation does not store raw IP.
- RLS policies prevent user-side mutation of risk/reputation tables.

## Launch Criteria

The feature is launch-ready when:

- New SQL migration runs cleanly on Supabase.
- Existing XP and DeFi tests pass.
- Trust Engine v2 tests pass.
- Reward hold behavior is visible in webapp data reads.
- Portal can display at least trust summaries and held reward counts.
- No browser route can directly mutate global trust score.
- Production deploys are clean for webapp, docs if touched and portal if portal code changes.

## Rollout Plan

Roll out in four stages:

1. Data + engine foundation: risk events, Trust Engine v2 and tests.
2. Enforcement: XP gate and reward hold gate.
3. Visibility: webapp trust states and portal review summaries.
4. Moat expansion: wallet graph and session velocity signals.

Stage 1 and 2 should ship together because detection without enforcement does not protect rewards.

## Recommendation

Build VYNTRO Trust Engine v2 as the next major security increment. Start with risk events, scoring and reward holds, then add portal review workflows and graph/session signals. This gives VYNTRO a credible anti-fraud moat while keeping the system explainable, project-friendly and privacy-conscious.
