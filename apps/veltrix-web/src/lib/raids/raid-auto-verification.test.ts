import assert from "node:assert/strict";
import test from "node:test";

import {
  getRaidAutoVerificationRequirement,
  getRaidAutoVerificationUrl,
  isApprovedRaidVerification,
} from "./raid-auto-verification";

test("X-backed raids require automatic verification before rewards", () => {
  const requirement = getRaidAutoVerificationRequirement({
    source_provider: "x_manual_command",
    source_url: "https://x.com/vyntro_/status/123",
    source_external_id: "123",
  });

  assert.equal(requirement.required, true);
  assert.equal(requirement.provider, "x");
  assert.equal(requirement.sourcePostId, "123");
});

test("non-verifiable raids are blocked instead of falling back to self confirmation", () => {
  const requirement = getRaidAutoVerificationRequirement({
    source_provider: "manual",
    source_url: null,
    source_external_id: null,
  });

  assert.equal(requirement.required, false);
  assert.match(requirement.reason, /automatic verification/i);
});

test("community bot raid verification URL targets the dedicated raid endpoint", () => {
  assert.equal(
    getRaidAutoVerificationUrl("https://bot.example.com/"),
    "https://bot.example.com/webhooks/x/verify-raid"
  );
});

test("only approved raid verification can unlock completion writes", () => {
  assert.equal(isApprovedRaidVerification({ ok: true, status: "approved" }), true);
  assert.equal(isApprovedRaidVerification({ ok: true, status: "pending" }), false);
  assert.equal(isApprovedRaidVerification(null), false);
});
