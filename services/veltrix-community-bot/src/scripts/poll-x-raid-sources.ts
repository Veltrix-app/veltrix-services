import { pollXRaidSourcesJob } from "../jobs/poll-x-raid-sources.js";

function readLimit() {
  const value = Number(process.env.X_RAID_SOURCE_POLL_LIMIT ?? 25);
  if (!Number.isFinite(value)) return 25;
  return Math.min(100, Math.max(1, Math.round(value)));
}

const result = await pollXRaidSourcesJob({
  limit: readLimit(),
});

console.log(JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}
