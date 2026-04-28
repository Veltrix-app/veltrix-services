import test from "node:test";
import assert from "node:assert/strict";

import { parseXStatusUrl } from "./x-post-url.js";

test("parses x.com status URLs", () => {
  assert.deepEqual(parseXStatusUrl("https://x.com/VYNTRO_/status/1789000000000000000"), {
    ok: true,
    username: "vyntro_",
    postId: "1789000000000000000",
    canonicalUrl: "https://x.com/vyntro_/status/1789000000000000000",
  });
});

test("parses twitter.com status URLs with query strings", () => {
  assert.deepEqual(parseXStatusUrl("https://twitter.com/ChainWars/status/12345?s=20"), {
    ok: true,
    username: "chainwars",
    postId: "12345",
    canonicalUrl: "https://x.com/chainwars/status/12345",
  });
});

test("rejects non-status URLs", () => {
  assert.deepEqual(parseXStatusUrl("https://x.com/vyntro_"), {
    ok: false,
    reason: "unsupported_x_status_url",
  });
});
