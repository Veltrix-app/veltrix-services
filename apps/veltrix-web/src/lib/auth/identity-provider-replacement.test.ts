import assert from "node:assert/strict";
import test from "node:test";
import type { UserIdentity } from "@supabase/supabase-js";

import {
  findProviderIdentities,
  getProviderReplaceButtonLabel,
  normalizeLinkableIdentityProvider,
} from "./identity-provider-replacement";

test("normalizes X and legacy Twitter identities to the same provider", () => {
  assert.equal(normalizeLinkableIdentityProvider("x"), "x");
  assert.equal(normalizeLinkableIdentityProvider("twitter"), "x");
  assert.equal(normalizeLinkableIdentityProvider("discord"), "discord");
  assert.equal(normalizeLinkableIdentityProvider("google"), null);
});

test("finds every auth identity that should be removed before replacing X", () => {
  const identities = [
    { provider: "twitter", identity_id: "old-twitter" },
    { provider: "x", identity_id: "old-x" },
    { provider: "discord", identity_id: "discord" },
  ] as UserIdentity[];

  assert.deepEqual(
    findProviderIdentities(identities, "x").map((identity) => identity.identity_id),
    ["old-twitter", "old-x"]
  );
});

test("connected providers use replace copy instead of refresh copy", () => {
  assert.equal(getProviderReplaceButtonLabel({ provider: "x", connected: true }), "Replace X link");
  assert.equal(getProviderReplaceButtonLabel({ provider: "x", connected: false }), "Link X");
});
