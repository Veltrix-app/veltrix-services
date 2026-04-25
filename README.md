# VYNTRO Infrastructure Workspace

This repo is the shared infrastructure workspace for VYNTRO services and database assets.

## Structure

- `services/`
  Shared backend services that support the app and admin portal.
- `database/migrations/`
  SQL foundations, schema expansions, and migration utilities.

## Current services

- [`services/veltrix-community-bot`](C:\Users\jordi\OneDrive\Documenten\New%20project\services\veltrix-community-bot)
  Community integration service for Discord and Telegram verification callbacks.

## Current database assets

The migration folder currently contains the SQL foundation used across:
- verification
- claims
- analytics
- project context
- reputation
- multitenancy

## Notes

- The admin portal and mobile app currently live in separate repos.
- This workspace is intended for shared infra and service code that sits beside those product repos.
- The next planned build step is Discord guild membership confirmation end-to-end inside the community bot.
