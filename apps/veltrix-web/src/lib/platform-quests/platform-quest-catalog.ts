export const PLATFORM_QUEST_PROJECT_ID = "c0951cfd-b434-41d5-977d-813156934493";

export type PlatformQuestCadence = "onboarding" | "daily" | "weekly" | "lifetime";
export type PlatformQuestSlug =
  | "connect-wallet"
  | "complete-profile"
  | "join-vyntro-community"
  | "first-safe-swap-review"
  | "first-verified-swap"
  | "daily-check-in"
  | "daily-real-action"
  | "weekly-activity-streak"
  | "verified-invite"
  | "first-lootbox-open";

export type PlatformQuestDefinition = {
  slug: PlatformQuestSlug;
  title: string;
  description: string;
  questType: string;
  cadence: PlatformQuestCadence;
  projectPoints: number;
  proofRequired: boolean;
  proofType: "none" | "tx_hash" | "url" | "wallet";
  verificationType: "rule_auto" | "event_check" | "wallet_check" | "manual_review";
  completionMode: "rule_auto" | "integration_auto" | "manual";
  actionLabel: string;
  actionUrl: string | null;
  shardRewardAmount: number;
  shardRewardWindow: "none" | "daily" | "weekly" | "lifetime";
};

export const PLATFORM_QUESTS: PlatformQuestDefinition[] = [
  {
    slug: "connect-wallet",
    title: "Connect your wallet",
    description: "Verify the wallet that will anchor swaps, DeFi reads, XP and future shard claims.",
    questType: "wallet_connect",
    cadence: "onboarding",
    projectPoints: 50,
    proofRequired: false,
    proofType: "wallet",
    verificationType: "wallet_check",
    completionMode: "integration_auto",
    actionLabel: "Connect wallet",
    actionUrl: "/profile/edit",
    shardRewardAmount: 0,
    shardRewardWindow: "none",
  },
  {
    slug: "complete-profile",
    title: "Complete your profile",
    description: "Add the profile basics VYNTRO uses for reputation, rewards and visible standing.",
    questType: "profile_complete",
    cadence: "onboarding",
    projectPoints: 40,
    proofRequired: false,
    proofType: "none",
    verificationType: "rule_auto",
    completionMode: "rule_auto",
    actionLabel: "Edit profile",
    actionUrl: "/profile/edit",
    shardRewardAmount: 0,
    shardRewardWindow: "none",
  },
  {
    slug: "join-vyntro-community",
    title: "Join VYNTRO community",
    description: "Join the VYNTRO project context so platform quests roll into one standing surface.",
    questType: "community_join",
    cadence: "onboarding",
    projectPoints: 35,
    proofRequired: false,
    proofType: "none",
    verificationType: "rule_auto",
    completionMode: "rule_auto",
    actionLabel: "Join community",
    actionUrl: `/communities/${PLATFORM_QUEST_PROJECT_ID}`,
    shardRewardAmount: 0,
    shardRewardWindow: "none",
  },
  {
    slug: "first-safe-swap-review",
    title: "Review your first safe swap route",
    description: "Open VYNTRO Swap and review route, fee, slippage and custody notes before signing anything.",
    questType: "swap_review",
    cadence: "lifetime",
    projectPoints: 45,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Review swap",
    actionUrl: "/defi/swap",
    shardRewardAmount: 0,
    shardRewardWindow: "none",
  },
  {
    slug: "first-verified-swap",
    title: "Complete your first verified swap",
    description: "Confirm a non-custodial VYNTRO swap from your verified wallet.",
    questType: "defi_swap",
    cadence: "lifetime",
    projectPoints: 120,
    proofRequired: true,
    proofType: "tx_hash",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Open swap",
    actionUrl: "/defi/swap",
    shardRewardAmount: 25,
    shardRewardWindow: "lifetime",
  },
  {
    slug: "daily-check-in",
    title: "Daily check-in",
    description: "Open your VYNTRO command surface and keep the daily XP loop alive.",
    questType: "daily_check_in",
    cadence: "daily",
    projectPoints: 20,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Open home",
    actionUrl: "/home",
    shardRewardAmount: 0,
    shardRewardWindow: "none",
  },
  {
    slug: "daily-real-action",
    title: "Complete a real daily action",
    description: "Complete one verified quest, raid, swap, DeFi claim or lootbox action today.",
    questType: "daily_platform_action",
    cadence: "daily",
    projectPoints: 35,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Find action",
    actionUrl: "/quests",
    shardRewardAmount: 3,
    shardRewardWindow: "daily",
  },
  {
    slug: "weekly-activity-streak",
    title: "Weekly activity streak",
    description: "Complete at least three real platform actions in the weekly window.",
    questType: "weekly_activity_streak",
    cadence: "weekly",
    projectPoints: 100,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Build streak",
    actionUrl: "/xp",
    shardRewardAmount: 40,
    shardRewardWindow: "weekly",
  },
  {
    slug: "verified-invite",
    title: "Invite an activated friend",
    description: "Invite a friend and earn only after they activate with a real VYNTRO action.",
    questType: "referral",
    cadence: "weekly",
    projectPoints: 60,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Invite friend",
    actionUrl: "/profile/invites",
    shardRewardAmount: 20,
    shardRewardWindow: "weekly",
  },
  {
    slug: "first-lootbox-open",
    title: "Open your first lootbox",
    description: "Spend shards on your first lootbox and record the milestone.",
    questType: "lootbox_open",
    cadence: "lifetime",
    projectPoints: 45,
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    completionMode: "integration_auto",
    actionLabel: "Open lootboxes",
    actionUrl: "/lootboxes",
    shardRewardAmount: 15,
    shardRewardWindow: "lifetime",
  },
];

export function getPlatformQuestBySlug(slug: string) {
  return PLATFORM_QUESTS.find((quest) => quest.slug === slug) ?? null;
}

export function getShardBearingPlatformQuests() {
  return PLATFORM_QUESTS.filter((quest) => quest.shardRewardAmount > 0);
}
