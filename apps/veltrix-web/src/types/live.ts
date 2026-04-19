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
  telegramUrl?: string | null;
  discordUrl?: string | null;
};

export type LiveCampaign = {
  id: string;
  projectId: string | null;
  title: string;
  description: string;
  bannerUrl: string | null;
  thumbnailUrl: string | null;
  xpBudget: number;
  featured: boolean;
  completionRate: number;
  endsAt: string | null;
  campaignMode?: string | null;
  rewardType?: string | null;
  rewardPoolAmount?: number;
  minXpRequired?: number;
  activityThreshold?: number;
  lockDays?: number;
};

export type LiveReward = {
  id: string;
  campaignId: string | null;
  title: string;
  description: string;
  imageUrl: string | null;
  cost: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  claimable: boolean;
  claimed?: boolean;
  claimedAt?: string | null;
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

export type LiveProjectReputation = {
  projectId: string;
  projectName: string;
  xp: number;
  level: number;
  streak: number;
  trustScore: number;
  contributionTier: string;
  questsCompleted: number;
  raidsCompleted: number;
  rewardsClaimed: number;
  rank: number;
};

export type LiveXpStake = {
  id: string;
  campaignId: string;
  stakedXp: number;
  activeMultiplier: number;
  lockStartAt: string | null;
  lockEndAt: string | null;
  lastActivityAt: string | null;
  state: string;
  metadata: Record<string, unknown>;
};

export type LiveRewardDistribution = {
  id: string;
  campaignId: string;
  rewardAsset: string;
  rewardAmount: number;
  status: string;
  calculationSnapshot: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type LiveCommunityJourneyTone = "default" | "positive" | "warning" | "danger";

export type LiveCommunityJourneyAction = {
  key: string;
  label: string;
  description: string;
  route: string;
  ctaLabel: string;
  tone: LiveCommunityJourneyTone;
  completed: boolean;
  locked: boolean;
};

export type LiveCommunityJourneySnapshot = {
  projectId: string;
  projectName: string;
  projectChain: string | null;
  lane: "onboarding" | "active" | "comeback";
  status: "active" | "paused" | "completed" | "archived";
  currentStepKey: string;
  lastEventType: string;
  lastEventAt: string;
  completedStepsCount: number;
  nudgesSentCount: number;
  milestonesUnlockedCount: number;
  streakDays: number;
  linkedProvidersCount: number;
  walletVerified: boolean;
  joinedProjectsCount: number;
  unreadSignals: number;
  openMissionCount: number;
  claimableRewards: number;
  recognitionLabel: string;
  contributionStatus: string;
  nextUnlockLabel: string;
  headline: string;
  supportingCopy: string;
  nextBestAction: LiveCommunityJourneyAction | null;
  actions: LiveCommunityJourneyAction[];
};
