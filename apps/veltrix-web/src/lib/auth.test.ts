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
