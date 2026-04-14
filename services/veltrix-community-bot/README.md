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
- `POST /webhooks/discord`
- `POST /webhooks/telegram`

The webhook routes accept confirmed membership payloads and then:
1. store a provider verification event in Supabase
2. call the Veltrix confirm callback

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

The next real implementation step is to replace manual webhook calls with provider-native membership confirmation:
- Discord guild membership verification
- Telegram group membership verification
