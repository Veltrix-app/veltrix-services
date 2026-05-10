import assert from "node:assert/strict";
import test from "node:test";
import type { UserProfile } from "@/types/auth";
import { buildReputationCardRead } from "./reputation-card";

const profile: UserProfile = {
  id: "profile-1",
  authUserId: "user-1",
  username: "jordi",
  avatarUrl: "",
  bannerUrl: "",
  title: "Shard Hunter",
  faction: "VYNTRO",
  bio: "",
  wallet: "0x1234567890abcdef",
  walletChain: "base",
  walletVerified: true,
  xp: 12345,
  activeXp: 12000,
  level: 8,
  streak: 5,
  trustScore: 82,
  sybilScore: 0,
  contributionTier: "operator",
  reputationRank: 12,
  questsCompleted: 21,
  raidsCompleted: 7,
  rewardsClaimed: 3,
  status: "active",
};

test("buildReputationCardRead creates a shareable reputation summary", () => {
  const read = buildReputationCardRead({
    profile,
    shardBalance: 144,
    equippedCosmetic: "Neon frame",
    activeSeasonAccess: "Season pass",
    connectedSystemCount: 3,
  });

  assert.equal(read.username, "jordi");
  assert.equal(read.title, "Shard Hunter");
  assert.equal(read.rankLabel, "#12");
  assert.equal(read.shardLabel, "144 shards");
  assert.match(read.headline, /level 8/i);
  assert.match(read.shareText, /12,345 XP/);
  assert.deepEqual(
    read.badges.map((badge) => badge.label),
    ["operator", "Neon frame", "Season pass", "Wallet verified"]
  );
});

test("buildReputationCardRead falls back safely for empty profiles", () => {
  const read = buildReputationCardRead({
    profile: null,
    shardBalance: -5,
    equippedCosmetic: null,
    activeSeasonAccess: null,
    connectedSystemCount: 0,
  });

  assert.equal(read.username, "Guest member");
  assert.equal(read.rankLabel, "Unranked");
  assert.equal(read.shardLabel, "0 shards");
  assert.equal(read.stats.find((stat) => stat.label === "Level")?.value, "1");
});
