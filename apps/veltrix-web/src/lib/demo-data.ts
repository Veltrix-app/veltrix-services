export type ConnectedAccountState = {
  provider: "x" | "discord" | "telegram";
  label: string;
  handle: string;
  state: "connected" | "not_connected" | "reconnect_needed";
  detail: string;
};

export const connectedAccounts: ConnectedAccountState[] = [
  {
    provider: "x",
    label: "X",
    handle: "@gecko941",
    state: "connected",
    detail: "Ready for follow, like and repost verification.",
  },
  {
    provider: "discord",
    label: "Discord",
    handle: "Gecko941",
    state: "not_connected",
    detail: "Connect Discord to unlock guild-verified community quests.",
  },
  {
    provider: "telegram",
    label: "Telegram",
    handle: "@jordi",
    state: "reconnect_needed",
    detail: "Reconnect Telegram before group membership can auto-confirm again.",
  },
];

export const activeMissions = [
  {
    title: "Chainwars community loop",
    stage: "Awaiting verification",
    reward: "Starter access",
    hint: "Telegram and Discord joins are now integration-aware.",
  },
  {
    title: "Pepe Raiders launch sprint",
    stage: "2 quests left",
    reward: "Launch badge",
    hint: "One more social proof and the badge becomes claimable.",
  },
  {
    title: "Chainlink creator lane",
    stage: "Review in progress",
    reward: "Creator spotlight",
    hint: "Your last proof is being reviewed by the project team.",
  },
];

export const projectsPreview = [
  {
    name: "Chainwars",
    chain: "Base",
    status: "Trending",
    description: "Fast community loops, social quests and starter rewards.",
  },
  {
    name: "Pepe Raiders",
    chain: "Ethereum",
    status: "Hot",
    description: "Raid-heavy mission board with short, visible reward paths.",
  },
  {
    name: "Chainlink",
    chain: "Ethereum",
    status: "Research",
    description: "Higher-trust quests, docs reads and creator-style outputs.",
  },
];

export const rewardMoments = [
  {
    title: "Starter access",
    state: "Claimable",
    rarity: "Common",
  },
  {
    title: "Launch badge",
    state: "1 quest away",
    rarity: "Rare",
  },
  {
    title: "Creator spotlight",
    state: "Locked",
    rarity: "Epic",
  },
];

export const activityFeed = [
  "Submission approved on Chainlink Creator Campaign.",
  "Discord verification started for Chainwars Community Starter.",
  "Launch badge on Pepe Raiders moved to claimable.",
  "Telegram account needs reconnect before next mission starts.",
];
