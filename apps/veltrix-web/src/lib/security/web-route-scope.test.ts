import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

test("Trading Arena job proxy requires a shared secret before running backend jobs", () => {
  const source = readFileSync(
    path.join(process.cwd(), "apps/veltrix-web/src/app/api/trading/jobs/run/route.ts"),
    "utf8"
  );

  assert.match(source, /TRADING_JOB_PROXY_SECRET/);
  assert.match(source, /x-trading-job-secret/);
  assert.match(source, /crypto\.timingSafeEqual/);
  assert.match(source, /Missing trading job proxy secret/);
});
