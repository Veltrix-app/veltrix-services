import test from "node:test";
import assert from "node:assert/strict";

import { getXRaidPollIntervalMs } from "./schedule-x-raid-poller.js";

test("X raid poller interval is disabled without a bearer token", () => {
  assert.equal(
    getXRaidPollIntervalMs({
      bearerToken: undefined,
      intervalSeconds: 600,
    }),
    null
  );
});

test("X raid poller interval clamps unsafe low values", () => {
  assert.equal(
    getXRaidPollIntervalMs({
      bearerToken: "token",
      intervalSeconds: 10,
    }),
    60_000
  );
});
