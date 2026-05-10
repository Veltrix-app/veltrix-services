# Platform Quest Pack v1 Design

Date: 2026-05-10
Status: Design ready for review
Owner: VYNTRO Platform

## Goal

Add first-party VYNTRO platform quests without creating a separate platform hub. The first release should use the existing VYNTRO project as the project context so platform quests appear in the same webapp surfaces as other project quests.

The existing VYNTRO project id is:

- `c0951cfd-b434-41d5-977d-813156934493`

This keeps the first version simple:

- Platform quests are normal quests with the VYNTRO project id.
- The existing project detail page becomes the collection point.
- The existing quest, XP, reputation and shard systems stay authoritative.
- Discord and Telegram join quests are not part of this pack because they already exist for VYNTRO.

## Product Positioning

Platform quests should feel like official VYNTRO missions, not project-sponsored campaigns. They guide users through the core platform loops:

- Create a trustworthy account.
- Learn how VYNTRO features work.
- Try safe swap and DeFi routes.
- Return daily and weekly.
- Invite real users.
- Earn XP broadly and shards selectively.

The first version should not add a special hub treatment. VYNTRO can remain a normal project in the product UI while its quests carry first-party copy and metadata.

## Quest Pack

The v1 pack should include these quest families.

### Onboarding

- Connect wallet.
- Complete profile.
- Join VYNTRO community.

These quests should award XP only. They are important for activation, but they are too easy to farm for meaningful shard rewards.

### Swap

- First safe swap review.
- First verified swap.

The safe swap review should award XP only. The first verified swap may award XP and shards after transaction confirmation.

Repeated swaps should not earn repeat shards in v1. They can still appear as activity, but the first release should avoid creating a swap-farming loop.

### Retention

- Daily check-in.
- Daily real action.
- Weekly activity streak.

Daily check-in should award XP only in v1. Daily real action can award a small fixed shard amount when it is backed by a meaningful action, such as completing a quest, confirmed raid, verified swap, DeFi claim or lootbox action.

Weekly activity streak should award XP and shards. It should require multiple real actions across the week, not just opening the app.

### Growth

- Verified invite.

Invite quests should award XP and shards only after the invited user performs a real activation step. A raw invite link click is not enough.

Recommended activation requirements:

- Invited user signs up.
- Invited user completes profile or connects wallet.
- Invited user completes at least one non-trivial quest or verified action.

### Lootbox

- First lootbox open milestone.

This can be added after the core pack is live. It should award XP and either a shard reward or a refund-style bonus. It should only be claimable when the user has actually opened a lootbox.

## Shard Reward Model

Use fixed shard rewards with caps for v1.

Initial v1 amounts:

- First verified swap: `25 shards`, lifetime once.
- Verified invite: `20 shards`, capped at `3` shard-bearing invites per week.
- Daily real action: `3 shards`, capped once per day.
- Weekly activity streak: `40 shards`, capped once per week.
- Lootbox milestone: `15 shards`, lifetime once for the first release.

Daily check-in should not award shards in v1. It may become a `1 shard` reward later if abuse controls are strong enough, but the default should be XP only.

Shard writes should use the existing `shard_ledger` and dedupe keys. Each reward source needs a stable source type, source ref and action so retries remain idempotent.

## XP Model

Use the existing XP economy.

The platform quests should use normal quest XP policy instead of bypassing the global system. Suggested quest types:

- `wallet_connect`
- `profile_complete`
- `community_join`
- `swap_review`
- `onchain_action` or `defi_swap`
- `daily_check_in`
- `daily_platform_action`
- `weekly_activity_streak`
- `referral`
- `lootbox_open`

Global XP should still be calculated centrally by quest type, difficulty, verification strength and caps. Project-local points may stay on the quest record for presentation, but global XP must come from the existing XP policy.

## Data Model

Do not create a separate platform quest table for v1.

Use existing entities:

- `projects`: the VYNTRO project is the owner/context.
- `quests`: platform quest records use the VYNTRO project id.
- `quest_submissions`: proof and completion status remain unified.
- `xp_events`: XP awards remain deduped by source ref.
- `user_global_reputation`: global progression remains the read model.
- `shard_ledger`: shard awards and spends remain the source of truth.
- `featured_shard_pools`: optional later booster layer for special platform quests.

If metadata is needed, store it on quest configuration fields or quest metadata rather than adding a new v1 table. Useful metadata keys:

- `platformQuest: true`
- `cadence: onboarding | daily | weekly | lifetime`
- `shardRewardAmount`
- `shardRewardWindow`
- `activationRequirement`
- `vyntroProjectId`

## User Surface

The existing VYNTRO project page should be the main collection point for platform quests.

Expected surfaces:

- VYNTRO project detail page shows platform quests in the existing Daily quests/action lane.
- `/quests` shows platform quests alongside normal quests, with VYNTRO project context.
- `/xp` can count these quests as normal XP sources.
- `/lootboxes` can route users toward shard-bearing VYNTRO quests.

Do not add a special VYNTRO platform hub in v1.

## Verification Rules

Each shard-bearing quest must have a verification rule stronger than a simple click.

Recommended verification:

- First verified swap: confirmed swap transaction tied to the user wallet.
- Verified invite: invited user has a completed activation requirement.
- Daily real action: server-recognized action from an approved source.
- Weekly streak: server-derived count of qualifying actions in the weekly window.
- Lootbox milestone: existing lootbox open record.

Social joins for Discord and Telegram are excluded from this pack because VYNTRO already has those quests.

## Anti-Abuse Rules

Shard-bearing rewards need tighter limits than XP-only quests.

Rules:

- Lifetime rewards must use lifetime dedupe keys.
- Daily real action shards must be capped once per UTC day.
- Weekly streak shards must be capped once per UTC week.
- Invite rewards must be capped weekly and require invited-user activation.
- High sybil risk or account review status blocks shard claims.
- Repeated swaps alone should not award repeat shards.
- Borrow volume must not be rewarded directly.

The first release should prefer conservative rewards. It is easier to raise shard amounts later than to unwind an over-generous economy.

## Rollout

Phase 1:

- Seed or create the platform quest records under the VYNTRO project.
- Add XP-only onboarding quests.
- Add first verified swap shard reward.
- Add weekly activity streak shard reward.

Phase 2:

- Add verified invite shard rewards.
- Add daily real action shards.
- Add clearer quest metadata labels for platform, daily, weekly and lifetime.

Phase 3:

- Add lootbox milestone quest.
- Add featured shard pools for temporary platform events.
- Consider a special VYNTRO hub treatment only if the normal project page becomes too crowded.

## Testing

Before release:

- Unit test reward eligibility and dedupe key generation.
- Unit test daily and weekly cap calculations.
- Unit test invite activation requirements.
- Unit test that Discord and Telegram joins are not duplicated in the seed pack.
- Integration test that quests using the VYNTRO project id appear on the project detail page.
- Integration test that shard-bearing quests write to `shard_ledger` once.
- Browser smoke test the VYNTRO project page with at least one onboarding, one swap and one weekly quest.

## Defaults

The shard amounts above are the implementation defaults for v1. They can be tuned in a later economy revision, but the first implementation should use fixed values so product behavior, tests and user-facing copy all match.
