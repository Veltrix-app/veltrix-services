export type LiveProject = {
  id: string;
  name: string;
  description: string;
  category: string | null;
  chain: string | null;
  logo: string | null;
  bannerUrl: string | null;
  members: number;
  website: string | null;
};

export type LiveCampaign = {
  id: string;
  projectId: string | null;
  title: string;
  description: string;
  xpBudget: number;
  featured: boolean;
  completionRate: number;
  endsAt: string | null;
};

export type LiveReward = {
  id: string;
  campaignId: string | null;
  title: string;
  description: string;
  cost: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  claimable: boolean;
  rewardType: string;
};

export type LiveQuest = {
  id: string;
  projectId: string | null;
  campaignId: string | null;
  title: string;
  description: string;
  type: string;
  questType: string;
  status: "open" | "pending" | "approved" | "rejected";
  xp: number;
  actionLabel: string | null;
  actionUrl: string | null;
  proofRequired: boolean;
  proofType: string;
  verificationType: string;
  verificationProvider: string | null;
  completionMode: string | null;
  verificationConfig: Record<string, unknown> | null;
};

export type LiveNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  type: string;
  createdAt: string;
};

export type LiveLeaderboardUser = {
  id: string;
  username: string;
  xp: number;
  level: number;
  avatarUrl: string;
  bannerUrl: string;
  isCurrentUser: boolean;
};

export type LiveRaid = {
  id: string;
  campaignId: string | null;
  title: string;
  community: string;
  timer: string;
  reward: number;
  participants: number;
  progress: number;
  target: string;
  banner: string;
  instructions: string[];
};
