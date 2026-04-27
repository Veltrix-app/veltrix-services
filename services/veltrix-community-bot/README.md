# VYNTRO Community Bot

Community integration service for VYNTRO.

This service is responsible for:
- Discord bot connectivity
- Telegram bot connectivity
- provider-specific membership events
- forwarding verified events to the VYNTRO confirm callback

## Current foundation

- Express service with health and webhook endpoints
- Discord and Telegram provider bootstrap
- Supabase-backed verification event logging
- Confirm callback client into the admin portal
- Signed webhook contract for membership confirmations

## Scripts

- `npm run dev`
- `npm run build`
- `npm run typecheck`

## Endpoints

- `GET /`
- `GET /health`
- `POST /jobs/retry-community-verifications`
- `POST /webhooks/discord`
- `POST /webhooks/discord/verify`
- `POST /webhooks/telegram`
- `POST /webhooks/telegram/verify`

The webhook routes accept confirmed membership payloads and then:
1. store a provider verification event in Supabase
2. call the VYNTRO confirm callback

The Discord verify route is the first real provider-owned verification endpoint:
1. load the linked Discord account from Supabase
2. load the project Discord integration from Supabase
3. resolve `guildId` or `serverId` from integration config
4. check live guild membership through the Discord bot
5. auto-confirm the quest if membership is real

The Telegram verify route now mirrors the same flow:
1. load the linked Telegram account from Supabase
2. load the project Telegram integration from Supabase
3. resolve `chatId` or `groupId` from integration config
4. check live group membership through the Telegram bot
5. auto-confirm the quest if membership is real

## Required env

Copy `.env.example` to `.env` and fill in:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERIFICATION_CALLBACK_URL`
- `VERIFICATION_CALLBACK_SECRET`
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `X_API_BEARER_TOKEN`
- `X_RAID_SOURCE_POLL_LIMIT`
- `COMMUNITY_BOT_WEBHOOK_SECRET`
- `COMMUNITY_RETRY_JOB_SECRET`
- `ONCHAIN_EVM_RPC_URL`
- `ONCHAIN_SYNC_CONFIRMATIONS`
- `ONCHAIN_SYNC_BATCH_BLOCKS`
- `ONCHAIN_SYNC_BACKFILL_BLOCKS`
- `ONCHAIN_SYNC_DEFAULT_HOLD_THRESHOLD_HOURS`

## Deploying on Render

This service should run as a long-lived Node web service because the Discord client keeps an active gateway connection and the Telegram provider performs live membership checks.

The repo root now includes [render.yaml](C:\Users\jordi\OneDrive\Documenten\New%20project\render.yaml), so you can create a Render Blueprint directly from the GitHub repo.

Render settings:
- service: `vyntro-community-bot`
- root directory: `services/veltrix-community-bot`
- build command: `npm ci && npm run build`
- start command: `npm run start`
- health check: `/health`

Tweet-to-Raid automation also provisions a cron worker:
- service: `veltrix-tweet-to-raid-poller`
- schedule: every 10 minutes
- command: `npm run poll:x-raid-sources`
- failure signal: exits non-zero when X credentials are missing or a poll run fails

After Render provisions the service, the public base URL becomes the bot URL you need in the web app, for example:
- `https://veltrix-community-bot.onrender.com`

Then the important live endpoints are:
- `GET /health`
- `POST /webhooks/telegram/verify`
- `POST /webhooks/discord/verify`
- `POST /jobs/retry-community-verifications`
- `POST /jobs/sync-onchain-provider`
- `POST /jobs/enrich-onchain-events`
- `POST /jobs/retry-onchain-ingress`
- `POST /jobs/poll-x-raid-sources`

## On-chain provider sync

The runtime can now pull live EVM activity from a managed RPC provider and normalize it into
`POST /webhooks/onchain-events`-compatible events before scoring.

For each active `project_asset`, the sync job uses:
- `metadata.startBlock`
- `metadata.marketMakerAddresses`
- `metadata.stakingContractAddresses`
- `metadata.lpContractAddresses`
- `metadata.allowedFunctions`
- `metadata.trackContractCalls`
- `metadata.enableHoldTracking`
- `metadata.holdThresholdHours`

The latest cursor/status lands back in `project_assets.metadata.syncState`, so operators can see:
- `lastSyncedBlock`
- `lastSyncedAt`
- `lastSyncStatus`
- `lastSyncGenerated`
- `lastSyncError`

## Next step

The next real implementation step after deployment is:
- wire the web app to call the live bot URL for `telegram/verify` and `discord/verify`
- keep project-side Discord integration setup storing `guildId`
- keep project-side Telegram integration setup storing `chatId`
- wire a cron or worker to `POST /jobs/retry-community-verifications`

## Tweet-to-Raid Autopilot

Tweet-to-Raid Autopilot turns an approved project X post event into a VYNTRO raid. The production-safe path has two rails: manual ingest for smoke tests and source polling for real automation. The poller reads active `x_raid_sources`, fetches recent X posts with `X_API_BEARER_TOKEN`, then creates either a review candidate or an active raid based on `x_raid_sources.mode`.

### Endpoint

`POST /jobs/ingest-x-raid-post`

`POST /jobs/poll-x-raid-sources`

Required header:

`x-community-job-secret: <COMMUNITY_BOT_WEBHOOK_SECRET or COMMUNITY_RETRY_JOB_SECRET>`

Example payload:

```json
{
  "projectId": "9aceb865-06a4-4124-b5f8-e53018a4e712",
  "forceMode": "review",
  "post": {
    "id": "1916812345678900000",
    "username": "chainwarshq",
    "text": "New guild raid is live. Join the push. #VYNTRO",
    "url": "https://x.com/chainwarshq/status/1916812345678900000",
    "mediaUrls": ["https://example.com/banner.png"],
    "isReply": false,
    "isRepost": false
  }
}
```

Poll payload:

```json
{
  "projectId": "9aceb865-06a4-4124-b5f8-e53018a4e712",
  "sourceId": "optional-source-id",
  "limit": 10
}
```

### Expected Decisions

- `created_candidate`: review mode stored a row in `raid_generation_candidates`.
- `created_raid`: auto-live mode created a row in `raids` and attempted Discord/Telegram delivery.
- `skipped`: dedupe, source mismatch, filters, cooldown or daily cap prevented creation.
- `failed`: the job failed after accepting the event and stored the failure in the ingest event.

### Rollout Checklist

1. Run the SQL migration in Supabase.
2. Insert one active `x_raid_sources` row for the project account.
3. Configure `X_API_BEARER_TOKEN` on the live community bot.
4. Test manual ingest with `forceMode: "review"`.
5. Confirm the candidate row is created.
6. Run `POST /jobs/poll-x-raid-sources` or the portal "Poll now" action.
7. Confirm `x_raid_sources.metadata.lastPollStatus` and ingest events update.
8. Switch the source to `auto_live` only after provider targets are connected.
9. Test another post and confirm a raid appears at `/raids/<raidId>` and community delivery is attempted.
