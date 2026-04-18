# Veltrix Community Bot

Community integration service for Veltrix.

This service is responsible for:
- Discord bot connectivity
- Telegram bot connectivity
- provider-specific membership events
- forwarding verified events to the Veltrix confirm callback

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
2. call the Veltrix confirm callback

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
- service: `veltrix-community-bot`
- root directory: `services/veltrix-community-bot`
- build command: `npm ci && npm run build`
- start command: `npm run start`
- health check: `/health`

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
