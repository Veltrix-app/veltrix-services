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
  campaignId: string | null;
  title: string;
  status: "open" | "pending" | "approved" | "rejected";
  xp: number;
  verificationProvider: string | null;
  completionMode: string | null;
};

export type LiveNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  type: string;
  createdAt: string;
};
