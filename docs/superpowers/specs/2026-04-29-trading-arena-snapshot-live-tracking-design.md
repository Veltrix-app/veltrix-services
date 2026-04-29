# VYNTRO Trading Arena: Snapshot + Live Tracking Design

Date: 2026-04-29
Status: Design ready for review
Owner: VYNTRO product / engineering

## Product Intent

VYNTRO Trading Arena lets projects launch trading competitions with a live leaderboard, configured rewards, clear duration, and measurable participation. The product should feel like a premium growth module rather than a simple leaderboard widget.

The core promise is:

- Projects can launch a trading competition without building their own tracking, leaderboard, reward, and anti-abuse stack.
- Members can join, trade through their own wallet, track their rank, and claim rewards when the competition settles.
- VYNTRO can price the service safely because every snapshot, event, request, retry, and indexing workload is measured.

## Product Tiers

### Snapshot Mode

Snapshot Mode is the default, scalable tier.

Projects configure:

- Chain: Base/EVM first.
- One or more tracked pairs.
- Start time and end time.
- Snapshot cadence: start/end only, hourly, or daily.
- Reward pool and reward distribution rules.
- Eligibility rules such as minimum wallet age, minimum XP, verified wallet, and trust threshold.

VYNTRO records:

- Pair price/liquidity snapshots.
- Participant join state.
- Wallet balance/exposure snapshots where supported.
- Final scoring snapshot at settlement.

This mode is inexpensive, predictable, and suitable for most early competitions.

### Live Tracking Mode

Live Tracking Mode is the premium tier.

Projects configure everything from Snapshot Mode plus:

- DEX routers, pools, or contract addresses to monitor.
- Max participant cap.
- Tracking interval and freshness target.
- Budget cap.
- Overages allowed or hard stop.
- Review policy for suspicious wallets.

VYNTRO records:

- Swap/trade events for the selected pairs.
- Per-wallet volume, net buy/sell, realized or estimated PnL, and score.
- Event ingestion health.
- Provider usage and internal compute/storage usage.
- Suspicious activity flags.

This mode is sold as a paid add-on because it uses provider capacity, indexing, monitoring, retry handling, and support.

## V1 Scope

V1 supports:

- Base/EVM-first competitions.
- Spot trading competitions only.
- Wallet-based participation.
- Selected pairs only, not whole-market scanning.
- Snapshot Mode and Live Tracking Mode.
- Portal creation and management.
- Webapp discovery, join, leaderboard, score explanation, and rewards.
- Budget caps and usage visibility.
- Manual settlement review before rewards become claimable.

V1 does not support:

- CEX API integrations.
- Futures, leverage, or derivatives.
- Custodial trading.
- Guaranteed yield or guaranteed profit claims.
- Unlimited market scanning.
- Fully automated reward payout without review.

## Portal Flow

Projects create a Trading Arena from the project workspace.

Recommended navigation:

- Project Workspace > Campaigns > Create > Trading Competition
- Project Workspace > Trading Arena
- Community OS can surface competition announcements, but creation belongs in the project workspace.

Creation steps:

1. Basics: title, description, project, campaign link, banner, rules summary.
2. Market: chain, token pair(s), router/pool/contract addresses, quote token.
3. Mode: Snapshot or Live Tracking.
4. Scoring: primary score type, tie-breakers, anti-abuse constraints.
5. Rewards: reward pool, token/perk/XP, rank ranges, raffle rules.
6. Duration: scheduled start/end, registration window, freeze window.
7. Cost Control: estimated cost, budget cap, overage behavior.
8. Review and launch.

Portal live state:

- Status: draft, scheduled, live, paused, settling, settled, cancelled.
- Cost meter: estimated, current usage, budget remaining, projected overage.
- Tracking health: last synced block/time, latest snapshot, event count, failures.
- Leaderboard health: ranked participants, flagged participants, stale rows.
- Next action: launch, pause tracking, settle, review flags, publish winners.

## Webapp Flow

Members see a Trading Arena area in the DeFi/growth surface.

Webapp pages:

- Trading Arena overview: featured competitions and active competitions.
- Competition detail: rules, pair(s), timer, reward pool, join button, tracking mode.
- Live leaderboard: rank, user, avatar, badges, score, volume, PnL/ROI where available, last update.
- My position: current score, eligibility state, warning flags, next safe action.
- Settlement view: final rank, reward status, claim route.

Member actions:

- Connect wallet.
- Join competition.
- Open trading route or project-provided link.
- Track rank and eligibility.
- Claim reward after settlement.

Important copy:

- VYNTRO never takes custody.
- Users trade through their own wallet.
- Trading has risk.
- Competition score and rewards are based on the published rules.

## Data Model

Recommended new tables:

- `trading_competitions`
- `trading_competition_pairs`
- `trading_competition_rewards`
- `trading_competition_participants`
- `trading_competition_snapshots`
- `trading_competition_events`
- `trading_competition_leaderboard`
- `trading_competition_flags`
- `tracking_usage_ledger`
- `tracking_provider_runs`

Existing tables to reuse:

- `projects`
- `campaigns`
- `wallet_links`
- `project_assets`
- `onchain_events`
- `reward_distributions`
- `xp_events`
- `trust_snapshots`
- `onchain_cases`

Competition rows should link to `project_id` and optionally `campaign_id`. Rewards should be separate from generic campaign rewards because competition rewards need rank bands, tie-breakers, and settlement metadata.

## Scoring

V1 should support three scoring presets.

### ROI Score

Best for skill-based competitions.

Score inputs:

- Starting exposure.
- Ending exposure.
- Net deposits/withdrawals adjustment when measurable.
- Estimated PnL percentage.
- Minimum volume requirement.

Risk:

- More complex.
- Requires careful interpretation for wallets that move assets in and out.

### Volume Score

Best for simple growth competitions.

Score inputs:

- Eligible buy/sell volume.
- Minimum trade size.
- Max score impact per wallet/day.
- Wash-trade flags.

Risk:

- Easier to manipulate if not capped.

### Hybrid Score

Recommended default.

Score inputs:

- Volume score.
- ROI score where reliable.
- Consistency bonus.
- Trust multiplier.
- Abuse penalties.

This gives projects a strong default while still letting advanced teams customize.

Recommended V1 default:

`score = capped_volume_points + roi_points + consistency_bonus + trust_bonus - abuse_penalties`

## Snapshot Mode Dataflow

1. Project creates a competition and selected pairs.
2. Scheduler creates the first snapshot at competition start.
3. Snapshot job records pair state and participant wallet state where available.
4. Periodic snapshots run based on configured cadence.
5. End snapshot freezes final state.
6. Settlement worker calculates leaderboard from snapshots.
7. Project reviews flags.
8. Rewards become claimable.

Failure handling:

- Missed snapshots are marked in `tracking_provider_runs`.
- If a snapshot fails, the system retries.
- If retries fail, the competition shows a tracking warning.
- Settlement cannot finalize until required start/end snapshots exist or an operator accepts a degraded settlement.

## Live Tracking Mode Dataflow

1. Project creates a competition and selected pairs.
2. Live tracking job starts at scheduled time.
3. Provider adapter scans selected pools/routers/contracts.
4. Events are normalized into `trading_competition_events`.
5. Linked wallets are matched through `wallet_links`.
6. Unlinked activity is tracked for visibility but does not rank unless linked before settlement rules allow it.
7. Leaderboard worker updates `trading_competition_leaderboard`.
8. Usage is written to `tracking_usage_ledger`.
9. Budget cap can pause tracking automatically.
10. Settlement freezes final leaderboard and creates reward distributions.

Failure handling:

- Provider failures create `tracking_provider_runs` failures.
- Reorg or duplicate events are deduped by chain, tx hash, log index, and competition.
- Late events after freeze window are marked but do not affect final rank unless operator reopens settlement.
- Budget cap pause keeps the competition page live but marks tracking as paused.

## Cost Metering

Cost must be measured internally before it is billed externally.

Usage ledger dimensions:

- Competition ID.
- Project ID.
- Provider.
- Chain.
- Operation type: snapshot, rpc_call, log_scan, event_decode, leaderboard_rebuild, retry, storage_write.
- Unit count.
- Estimated cost.
- Raw provider metadata.
- Created timestamp.

Portal cost read:

- Estimated cost before launch.
- Current cost.
- Budget cap.
- Projected cost at current velocity.
- Remaining budget.
- Last expensive operation.
- Pause reason if capped.

Commercial pricing:

- Snapshot Mode can be included or sold as low-cost add-on.
- Live Tracking Mode should require paid plan or per-competition activation.
- Dedicated Tracking should be enterprise with pass-through usage and support margin.

Important principle:

Provider prices change, so VYNTRO should store units and configured rates. Do not hard-code provider pricing into business logic.

## Anti-Abuse

Required V1 controls:

- Verified wallet required.
- Minimum wallet age or minimum VYNTRO trust score.
- Minimum trade size.
- Max score impact per wallet per time window.
- Duplicate wallet and linked identity checks.
- Wash-trade suspicion flags.
- Suspicious transfer-in/out flags.
- Manual review before settlement.

Recommended suspicious flags:

- Very low-value repeated trades.
- Rapid back-and-forth trading.
- Same wallet cluster behavior.
- New wallet with no social/account history.
- Volume spike near competition close.
- Large transfers into wallet immediately before trade and out immediately after.

## Rewards And Settlement

Reward rules:

- Rank bands: 1st, 2nd, 3rd, top 10, top 100.
- Fixed amount or percentage of pool.
- Optional raffle among eligible participants.
- Optional XP for joining, placing, and completing without flags.

Settlement states:

- `pending_snapshot`
- `calculating`
- `review_required`
- `approved`
- `claimable`
- `paid`
- `disputed`

The system should never silently pay rewards after a complex live competition. It should produce a settlement report first.

## Bot And Community Distribution

Trading competitions should reuse the community bot surfaces after the core product is stable.

Potential commands:

- `/competition`
- `/tradingarena`
- `/leaderboard competition:<id>`

Automations:

- Launch announcement.
- Mid-competition leaderboard pulse.
- Final-hour reminder.
- Winner announcement after settlement.

## Compliance And Trust Copy

Product copy must avoid profit promises.

Required copy:

- VYNTRO does not provide financial advice.
- VYNTRO does not take custody.
- Trading competitions involve risk.
- Rewards depend on project rules and eligibility.
- Suspicious activity can be excluded.

This is product-risk language, not legal review. Before public launch, legal terms should be reviewed for trading competitions and regional restrictions.

## Rollout Plan

### Phase 1: Data Foundation

- Add competition tables.
- Add usage ledger and provider run tables.
- Add scoring helpers and tests.
- Add settlement helpers and tests.

### Phase 2: Snapshot Mode

- Portal create/edit flow.
- Webapp competition detail and join.
- Snapshot scheduler.
- Snapshot leaderboard.
- Settlement and rewards.

### Phase 3: Live Tracking Mode

- Provider adapter abstraction.
- Event ingestion for selected pairs.
- Live leaderboard worker.
- Cost meter.
- Budget cap pause.
- Tracking health UI.

### Phase 4: Premium Polish

- Competition cards and hero treatment.
- Bot announcements.
- Public winner pages.
- Advanced reward templates.
- Enterprise cost export.

## Production Readiness Checklist

Before production activation:

- Database migrations are applied.
- Snapshot jobs are idempotent.
- Live event jobs are idempotent.
- Provider failures create visible warnings.
- Budget caps pause live tracking safely.
- Settlement cannot finalize with missing required data unless explicitly overridden.
- Reward distributions are previewed before becoming claimable.
- Tests cover scoring, settlement, cost ledger, and provider failure paths.
- Portal clearly shows project costs.
- Webapp clearly shows risk and no-custody copy.

## Recommended Decision

Build both modes, but launch them in this order:

1. Data foundation shared by both modes.
2. Snapshot Mode end-to-end.
3. Live Tracking Mode end-to-end.
4. Bot/community distribution.

This keeps the product production-proof while preventing the live tracking layer from delaying the entire Trading Arena.
