export type UserProfile = {
  id: string;
  authUserId: string;
  username: string;
  avatarUrl: string;
  bannerUrl: string;
  title: string;
  faction: string;
  bio: string;
  wallet: string;
  xp: number;
  level: number;
  streak: number;
  trustScore: number;
  sybilScore: number;
  contributionTier: string;
  reputationRank: number;
  questsCompleted: number;
  raidsCompleted: number;
  rewardsClaimed: number;
  status: string;
};

export type ConnectedAccount = {
  id: string;
  provider: "x" | "discord" | "telegram";
  providerUserId: string;
  username: string | null;
  status: "connected" | "expired" | "revoked";
  connectedAt: string;
  updatedAt: string;
};
