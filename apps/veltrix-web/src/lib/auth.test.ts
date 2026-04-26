import test from "node:test";
import assert from "node:assert/strict";

import { mapProfile } from "./auth";

test("mapProfile does not revive a disconnected non-primary wallet link", () => {
  const profile = mapProfile({
    id: "profile_1",
    auth_user_id: "user_1",
    username: "raider",
    wallet: "",
    primary_wallet_link: {
      wallet_address: "0x1234567890abcdef1234567890abcdef12345678",
      chain: "evm",
      verified: true,
      metadata: { primary: false },
    },
  });

  assert.equal(profile.wallet, "");
  assert.equal(profile.walletVerified, false);
});

test("mapProfile treats global reputation as the primary XP economy read", () => {
  const profile = mapProfile({
    id: "profile_1",
    auth_user_id: "user_1",
    username: "raider",
    xp: 25,
    level: 1,
    streak: 0,
    user_global_reputation: {
      total_xp: 1300,
      active_xp: 1200,
      level: 3,
      streak: 4,
      trust_score: 72,
      sybil_score: 8,
      contribution_tier: "explorer",
    },
  });

  assert.equal(profile.xp, 1300);
  assert.equal(profile.activeXp, 1200);
  assert.equal(profile.level, 3);
  assert.equal(profile.streak, 4);
  assert.equal(profile.trustScore, 72);
  assert.equal(profile.sybilScore, 8);
});
