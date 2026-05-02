import { Router } from "express";
import { env } from "../config/env.js";
import {
  AUTOMATION_RETRY_BACKOFF_MINUTES,
  AUTOMATION_RUN_LOCK_MINUTES,
  AUTOMATION_STALE_RUN_MINUTES,
} from "../core/community/automation-reliability.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const supabaseHost = (() => {
    try {
      return new URL(env.SUPABASE_URL).host;
    } catch {
      return "invalid";
    }
  })();

  const callbackHost = (() => {
    try {
      return new URL(env.VERIFICATION_CALLBACK_URL).host;
    } catch {
      return "invalid";
    }
  })();

  res.json({
    ok: true,
    service: "vyntro-community-bot",
    supabaseHost,
    callbackHost,
    onchain: {
      rpcConfigured: Boolean(env.ONCHAIN_EVM_RPC_URL),
      confirmations: env.ONCHAIN_SYNC_CONFIRMATIONS,
      batchBlocks: env.ONCHAIN_SYNC_BATCH_BLOCKS,
      backfillBlocks: env.ONCHAIN_SYNC_BACKFILL_BLOCKS
    },
    providers: {
      discord: Boolean(env.DISCORD_BOT_TOKEN),
      telegram: Boolean(env.TELEGRAM_BOT_TOKEN)
    },
    tweetToRaid: {
      xApiConfigured: Boolean(env.X_API_BEARER_TOKEN),
      pollerEnabled: Boolean(env.X_API_BEARER_TOKEN && env.X_RAID_SOURCE_POLL_INTERVAL_SECONDS > 0),
      pollerIntervalSeconds: env.X_RAID_SOURCE_POLL_INTERVAL_SECONDS,
      pollLimit: env.X_RAID_SOURCE_POLL_LIMIT
    },
    automations: {
      runLockMinutes: AUTOMATION_RUN_LOCK_MINUTES,
      staleRunMinutes: AUTOMATION_STALE_RUN_MINUTES,
      retryBackoffMinutes: AUTOMATION_RETRY_BACKOFF_MINUTES,
      partialDelivery: true
    }
  });
});
