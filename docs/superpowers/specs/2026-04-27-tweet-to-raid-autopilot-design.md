# Tweet-to-Raid Autopilot Design

## Purpose

Tweet-to-Raid Autopilot turns a project's X activity into coordinated VYNTRO raid execution. When a connected project posts on X, VYNTRO can create a raid, make it visible in the webapp and portal, and publish the same raid into Discord and Telegram through the community bot.

This is a product automation, not a standalone bot feature. The bot delivers and verifies provider actions, but VYNTRO remains the source of truth for raids, automation state, audit logs and member-facing XP flow.

## Product Positioning

Projects should experience this as: "Post once on X, let VYNTRO turn it into a raid everywhere." The value is fewer manual steps, consistent raid formatting, and one operational history across portal, webapp, Telegram and Discord.

The feature should be sold as part of Community OS / automation capacity, with plan limits controlling how many live raids, providers and automation runs a project can use.

## Recommended Operating Mode

The first production version should ship as controlled autopilot:

- Review mode: new X posts create draft raid candidates that an operator can approve.
- Auto-live mode: eligible X posts create active raids immediately when project guardrails are satisfied.
- Manual ingest fallback: operators can paste a tweet URL or simulate an X event for testing and projects without X API access yet.

Auto-live should never be blind. It needs dedupe, cooldown, max raids per day, source account matching, and optional hashtag filtering.

## Core Flow

1. A project connects an X account and enables Tweet-to-Raid Autopilot.
2. The project configures guardrails: provider targets, mode, hashtags, cooldown, daily cap, reward XP, duration, campaign, CTA and artwork fallback.
3. X ingest receives a post event or a manual tweet URL.
4. VYNTRO validates that the post belongs to the configured project account and passes filters.
5. The system dedupes by X post id.
6. The system creates either a draft raid candidate or an active raid.
7. The raid appears in portal and webapp from the existing `raids` source.
8. The bot publishes a branded raid card to configured Discord and Telegram targets.
9. Automation runs, delivery results and failures are logged for portal visibility.

## Architecture

### Source of Truth

Supabase should remain the truth layer:

- `raids` stores member-facing raid records.
- `community_automations` stores the project-level automation toggle and cadence/status posture.
- New X ingest tables store event dedupe, raw source metadata and candidate state.
- `community_automation_runs` stores execution results.
- `admin_audit_logs` stores operational history.

### Bot Service

The community bot service should own provider work:

- X ingest job/webhook endpoint.
- Tweet normalization.
- Raid candidate or raid creation through Supabase service role.
- Discord and Telegram publishing using existing push helpers.
- Delivery failure capture and retry-safe status.

### Webapp

The public webapp should not need a special data path for generated raids. Once a raid is created in `raids`, existing home, raids, detail, XP and notifications surfaces should pick it up.

### Portal

The project workspace should expose:

- Autopilot setup card under project community/raids/automation surfaces.
- Current status: active, review mode, paused, blocked, last event, last delivery.
- Raid candidates if review mode is enabled.
- Manual "test with tweet URL" action.
- Pause/resume and run history.

## Data Model Additions

### `x_raid_sources`

Stores project-level X source configuration.

Important fields:

- `project_id`
- `integration_id`
- `x_account_id`
- `x_username`
- `mode`: `review` or `auto_live`
- `status`: `active`, `paused`, `blocked`
- `required_hashtags`
- `exclude_replies`
- `exclude_reposts`
- `cooldown_minutes`
- `max_raids_per_day`
- `default_reward_xp`
- `default_duration_minutes`
- `default_campaign_id`
- `default_button_label`
- `default_artwork_url`
- `metadata`

### `x_raid_ingest_events`

Stores every received X event for dedupe and auditability.

Important fields:

- `project_id`
- `source_id`
- `x_post_id`
- `x_author_id`
- `x_username`
- `post_url`
- `text`
- `media_urls`
- `received_at`
- `decision`: `created_raid`, `created_candidate`, `skipped`, `failed`
- `decision_reason`
- `raid_id`
- `candidate_id`
- `raw_payload`

### `raid_generation_candidates`

Stores review-mode candidates before they become active raids.

Important fields:

- `project_id`
- `source_event_id`
- `status`: `pending`, `approved`, `rejected`, `expired`
- `title`
- `short_description`
- `tweet_url`
- `banner`
- `reward_xp`
- `starts_at`
- `ends_at`
- `approved_by_auth_user_id`
- `approved_at`
- `metadata`

## Raid Generation Rules

Title:

- Prefer the first strong sentence of the post.
- Trim aggressive whitespace.
- Cap for UI readability.
- Fallback: `New raid from {projectName}`.

Description:

- Preserve the original post text.
- Include a clear action line: "Open the post, engage, then confirm the raid in VYNTRO."

CTA:

- Primary URL should be the original X post.
- VYNTRO button should link to `/raids/{raidId}` after creation.

Reward XP:

- Use project template value.
- Clamp to central XP policy so projects cannot inflate global XP through automation.

Duration:

- Default from project template.
- Treat expired raids as non-live in the webapp immediately by comparing `ends_at` against the current time; a scheduled cleanup job can then mark expired active raids as completed for operator reporting.

## Delivery Rules

Discord and Telegram pushes should use existing provider helpers with a new raid-specific message shape:

- Eyebrow: `LIVE RAID`
- Title: generated raid title
- Body: short action-oriented summary
- Meta: reward, duration, source, project
- Image: post media, project banner or VYNTRO raid default
- Button: `Open raid`

Each delivery should be independently recorded. A Discord failure should not prevent Telegram delivery or raid creation.

## Error Handling

The system should skip safely when:

- The post is already ingested.
- The post author does not match the configured source account.
- The post is a reply/repost and those are disabled.
- Required hashtag filters do not match.
- The project is over daily/cooldown limits.
- The account is over live raid entitlement capacity.

The system should block and surface operator action when:

- X auth/API credentials fail.
- Discord or Telegram targets are missing.
- Supabase insert fails.
- Raid capacity guard rejects an auto-live creation.

## Security And Abuse Controls

- Verify job/webhook requests with the existing community job secret pattern.
- Store raw payloads for audit but keep secrets out of metadata.
- Dedupe by project and X post id.
- Enforce project ownership through source configuration.
- Respect billing limits before creating active raids.
- Clamp XP through the central XP policy.
- Allow pausing per project.

## Testing Strategy

Unit tests:

- Tweet normalization.
- Filter decisions.
- Dedupe behavior.
- Raid draft payload generation.
- Provider delivery message payloads.
- XP clamping.

Integration-style tests:

- Manual ingest creates candidate in review mode.
- Manual ingest creates active raid in auto-live mode.
- Duplicate ingest is skipped.
- Delivery failure records partial failure without deleting the raid.
- Capacity failure creates a failed ingest decision and no active raid.

Verification commands:

- `npm run typecheck --workspace vyntro-community-bot`
- `npm run typecheck --workspace vyntro-web`
- `npm run test`
- `npm run verify`

## Implementation Phases

### Phase 1: Manual Ingest MVP

Build the full pipeline with a manual tweet URL/test payload first. This proves raid creation, portal/web visibility and Discord/Telegram delivery without waiting on X API setup.

### Phase 2: X API Ingest

Add official X event ingestion once the account/API path is confirmed. This can use webhook or polling depending on available access tier, but it should feed the same internal ingest service.

### Phase 3: Portal Control Surface

Add polished setup and run history inside project workspace. Review mode candidates should be easy to approve, reject or convert.

### Phase 4: Advanced Automation

Add richer filters, AI-assisted title generation if desired, per-campaign routing, scheduled repost reminders and analytics on raid conversion.

## Open Decisions

The recommended defaults are:

- Start with review mode enabled by default.
- Allow auto-live only after a project has tested delivery targets.
- Require a hashtag filter by default for auto-live projects.
- Use manual ingest as the first shipped version so we can test end-to-end without X API friction.
