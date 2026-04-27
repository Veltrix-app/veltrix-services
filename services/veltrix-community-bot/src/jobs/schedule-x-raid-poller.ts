import { env } from "../config/env.js";
import { pollXRaidSourcesJob } from "./poll-x-raid-sources.js";

export function getXRaidPollIntervalMs(params: {
  bearerToken?: string;
  intervalSeconds: number;
}) {
  if (!params.bearerToken) {
    return null;
  }

  if (params.intervalSeconds <= 0) {
    return null;
  }

  return Math.max(60, Math.round(params.intervalSeconds)) * 1000;
}

export function startXRaidSourcePoller() {
  const intervalMs = getXRaidPollIntervalMs({
    bearerToken: env.X_API_BEARER_TOKEN,
    intervalSeconds: env.X_RAID_SOURCE_POLL_INTERVAL_SECONDS,
  });

  if (!intervalMs) {
    console.log("[tweet-to-raid] source poller disabled");
    return;
  }

  let running = false;
  const run = async () => {
    if (running) {
      console.log("[tweet-to-raid] previous poll still running; skipping this tick");
      return;
    }

    running = true;
    try {
      const result = await pollXRaidSourcesJob({
        limit: env.X_RAID_SOURCE_POLL_LIMIT,
      });
      console.log("[tweet-to-raid] source poll complete", JSON.stringify(result));
    } catch (error) {
      console.error("[tweet-to-raid] source poll failed", error);
    } finally {
      running = false;
    }
  };

  console.log(`[tweet-to-raid] source poller enabled every ${intervalMs / 1000}s`);
  const timer = setInterval(() => {
    void run();
  }, intervalMs);
  timer.unref();

  setTimeout(() => {
    void run();
  }, 15_000).unref();
}
