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

## Next step

The next real implementation step after this foundation is:
- project-side Discord integration setup that stores `guildId`
- project-side Telegram integration setup that stores `chatId`
- wire a cron or worker to `POST /jobs/retry-community-verifications`
