# Manual Live Raid Commands Design

## Purpose

Manual live raid commands let approved project admins create a live VYNTRO raid from Telegram or Discord with one command. A command such as `/newraid https://x.com/project/status/123` should create an active raid, publish it on the webapp, and push the same raid card back into Telegram and Discord.

This is not a replacement for Tweet-to-Raid Autopilot. It is the lower-cost, operator-driven lane for projects that want RaidShark-style speed without asking every project to own an X API app.

## Product Positioning

Projects experience this as: "Drop a tweet URL into the community bot and VYNTRO turns it into a raid everywhere."

The service value is that VYNTRO owns the X API access, safe defaults, raid creation, delivery, dedupe, webapp visibility and audit trail. Projects can pay for the automation layer instead of managing X API credentials, Telegram posting, Discord posting and raid formatting themselves.

## Recommended First Version

Ship a defaults-first command with safe overrides:

- Telegram: `/newraid https://x.com/example/status/123 xp=50 duration=24h campaign=starter`
- Discord: `/newraid url:<x-url> xp:<optional> duration:<optional> campaign:<optional>`

The plain command with only a URL must work. Optional overrides are allowed only within VYNTRO guardrails.

## Permissions

Only project owners or captain seats with the `raid_alert` permission can create manual live raids.

The bot must resolve the actor through existing connected identity:

- Telegram command actor -> `user_connected_accounts.provider = telegram`
- Discord command actor -> `user_connected_accounts.provider = discord`
- Resolved auth user -> project captain config or project ownership

If the actor is not authorized, the bot replies privately/ephemerally and creates no raid.

## Command Defaults

Manual commands should use the same project-level defaults as Tweet-to-Raid sources where possible:

- Default campaign
- Default reward XP
- Default duration
- Default button label
- Fallback artwork
- Cooldown
- Max raids per day
- Delivery scope: Telegram, Discord or both

If a project has no configured X raid source, VYNTRO should still allow a command-driven default config from Community Bot settings. This avoids forcing projects into auto-polling just to use manual commands.

## Override Rules

Admins may override:

- XP, clamped to central XP policy
- Duration, clamped to safe min/max windows
- Campaign, only if it belongs to the same project
- Button label, optional and length-limited

Admins may not override:

- Project id
- Source provider
- Global XP policy caps
- Delivery targets outside configured project integrations
- Duplicate detection

## Core Flow

1. Admin runs `/newraid` in a mapped Telegram chat or Discord guild.
2. Bot resolves project context from the chat/guild integration.
3. Bot verifies the actor has project owner or `raid_alert` captain permission.
4. Bot parses and validates the X post URL.
5. Bot fetches the target post using the VYNTRO X API bearer token.
6. Bot builds a raid draft with command defaults and safe overrides.
7. Bot dedupes by project and X post id.
8. Bot creates an active `raids` row immediately.
9. Bot records an ingest/audit event with `source_provider = x_manual_command`.
10. Bot dispatches the raid card to configured Discord and Telegram targets.
11. Bot replies to the command with the live raid URL and delivery status.

## Data Model

Prefer reusing `x_raid_ingest_events` for dedupe and history with explicit metadata:

- `decision = created_raid`, `skipped` or `failed`
- `decision_reason = manual_command`
- `raw_payload.commandSource = telegram | discord`
- `raw_payload.commandActorProviderUserId`
- `raw_payload.commandOverrides`
- `raw_payload.manual = true`

If command-specific settings become too large for `community_bot_settings.metadata`, add a dedicated `manual_raid_command_settings` shape later. The first version can store defaults in existing community bot metadata and fall back to `x_raid_sources` defaults.

## Delivery

Manual command raids should use the existing `dispatchProjectCommunityMessageWithResults` pipeline so Discord and Telegram behave like generated auto-raids.

Message shape:

- Eyebrow: `LIVE RAID`
- Title: generated from the X post
- Body: short action summary plus VYNTRO confirmation instruction
- Meta: reward, duration, source, created by command
- Image: X media first, fallback artwork second
- Button: configured label or `Open raid`

Delivery failures should not delete the raid. The command reply should say which providers succeeded or failed.

## Error Handling

Skip safely when:

- The URL is not a supported X status URL.
- The tweet was already used for a project raid.
- The project is over cooldown or daily command cap.
- The requested campaign does not belong to the project.
- The actor lacks permission.

Fail visibly when:

- X API billing/access blocks the read.
- X post lookup fails.
- Supabase raid insert fails.
- No delivery targets are configured.

## Testing

Unit tests:

- Parse X status URLs.
- Parse Telegram command text.
- Normalize Discord command options.
- Clamp command overrides.
- Reject unauthorized actors.
- Deduplicate existing X post ids.
- Create live raid decisions from manual command input.

Integration-style tests:

- Telegram `/newraid` creates an active raid for an authorized captain.
- Discord `/newraid` creates an active raid for an authorized captain.
- Duplicate commands do not create a second raid.
- Delivery failure is returned in command reply but the raid remains live.

Verification commands:

- `npm run typecheck --workspace vyntro-community-bot`
- `npm run test --workspace vyntro-community-bot` if available
- `npm run verify`

## Launch Sequence

1. Add shared manual raid command core.
2. Reuse existing ingest/raid creation path where possible.
3. Add Telegram `/newraid`.
4. Add Discord `/newraid`.
5. Add portal defaults if the existing settings surface is not enough.
6. Add docs for project admins.
7. Push to live bot and verify with one real command.

## Decisions

- Manual `/newraid` creates active raids immediately, not drafts.
- VYNTRO-owned X API credentials are the default.
- Bring-your-own X token is reserved for enterprise/high-volume accounts.
- Safe overrides are allowed, but XP and duration remain centrally capped.
- The manual command feature should be sold as a paid automation service, not treated as a free bot utility.
