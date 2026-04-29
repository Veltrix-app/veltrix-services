import { runTradingLiveTrackingJobs } from "../core/trading/live-tracking.js";
import { runTradingSnapshotJobs } from "../core/trading/snapshots.js";

const mode = process.env.TRADING_ARENA_JOB_MODE ?? "all";
const limit = Number(process.env.TRADING_ARENA_JOB_LIMIT ?? "50");

async function main() {
  const snapshot =
    mode === "snapshot" || mode === "all"
      ? await runTradingSnapshotJobs({ limit: Number.isFinite(limit) ? limit : 50 })
      : null;
  const live =
    mode === "live" || mode === "all"
      ? await runTradingLiveTrackingJobs({ limit: Number.isFinite(limit) ? limit : 50 })
      : null;

  console.log(JSON.stringify({ ok: true, snapshot, live }, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
