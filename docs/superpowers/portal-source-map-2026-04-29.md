# Portal source map: Trading Arena controls

Date: 2026-04-29

## Finding

The production portal target remains:

- `https://crypto-raid-admin-portal.vercel.app`

This workspace contains the service layer and member webapp, but the recognizable admin portal source for the current production UI was not found in the active repo tree.

Searches across `apps` and `services` did not find the current portal copy/surfaces such as:

- `Workspace board`
- `Project roster`
- `Launch command center`
- `Board mode`

## What is ready in this repo

- Community bot service routes for Trading Arena creation, read, join, leaderboard, settlement and tracking jobs.
- Supabase migration for Trading Arena competitions, pairs, rewards, participants, snapshots, events, leaderboard, flags and usage ledger.
- Webapp member-facing Trading Arena landing and competition detail routes.
- Service entry point mounted at `/trading`.

## What is blocked until the portal source is connected

- Project-owner Trading Arena creation form in the actual portal UI.
- Portal-side project workspace tab or module for Snapshot Mode / Live Tracking Mode.
- Portal-side budget/cost meter and settlement controls.

## Guardrail

Do not deploy or recreate the removed/unknown `admin-portal` project. Production portal work must target the existing `crypto-raid-admin-portal` source/project only.
