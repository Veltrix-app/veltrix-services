export type VyntroMemberPassId = "spark" | "surge" | "mythic";

export type VyntroMemberPassPerk = {
  label: string;
  detail: string;
};

export type VyntroMemberPass = {
  id: VyntroMemberPassId;
  label: string;
  priceUsd: 5 | 10 | 15;
  status: "planned";
  accent: "emerald" | "violet" | "amber";
  assetPath: string;
  position: string;
  shardLiftLabel: string;
  perks: VyntroMemberPassPerk[];
};

export const VYNTRO_MEMBER_PASSES: VyntroMemberPass[] = [
  {
    id: "spark",
    label: "Spark Pass",
    priceUsd: 5,
    status: "planned",
    accent: "emerald",
    assetPath: "/assets/member-passes/spark-pass.webp",
    position: "Entry utility",
    shardLiftLabel: "Small featured shard lift",
    perks: [
      {
        label: "Featured shard lift",
        detail: "A light shard boost for featured quests and raids once passes go live.",
      },
      {
        label: "Profile pass mark",
        detail: "A public member pass marker for profile and leaderboard identity.",
      },
      {
        label: "Common lane priority",
        detail: "A clearer route into common and rare lootbox chase loops.",
      },
    ],
  },
  {
    id: "surge",
    label: "Surge Pass",
    priceUsd: 10,
    status: "planned",
    accent: "violet",
    assetPath: "/assets/member-passes/surge-pass.webp",
    position: "Hunter utility",
    shardLiftLabel: "Medium featured shard lift",
    perks: [
      {
        label: "Stronger shard lift",
        detail: "A bigger featured activity boost for users who hunt consistently.",
      },
      {
        label: "Epic access pressure",
        detail: "A pass layer designed around faster epic-tier readiness.",
      },
      {
        label: "Cosmetic lane",
        detail: "A stronger chance to make cosmetic rewards feel visible and collectible.",
      },
    ],
  },
  {
    id: "mythic",
    label: "Mythic Pass",
    priceUsd: 15,
    status: "planned",
    accent: "amber",
    assetPath: "/assets/member-passes/mythic-pass.webp",
    position: "Premium utility",
    shardLiftLabel: "Highest featured shard lift",
    perks: [
      {
        label: "Mythic window support",
        detail: "A premium layer for users chasing the highest rarity box windows.",
      },
      {
        label: "Season identity",
        detail: "A stronger public signal for pass holders during active seasons.",
      },
      {
        label: "Reward readiness",
        detail: "A clearer path for future USDC, sponsored and premium reward lanes.",
      },
    ],
  },
];

export function getVyntroMemberPass(passId: VyntroMemberPassId) {
  const pass = VYNTRO_MEMBER_PASSES.find((item) => item.id === passId);
  if (!pass) {
    throw new Error(`Unknown VYNTRO member pass: ${passId}`);
  }

  return pass;
}

export function getRecommendedVyntroMemberPass(params: { hasSeasonAccess: boolean }) {
  return params.hasSeasonAccess ? getVyntroMemberPass("mythic") : getVyntroMemberPass("surge");
}
