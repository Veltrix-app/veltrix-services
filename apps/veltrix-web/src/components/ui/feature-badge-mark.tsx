import Image from "next/image";

export const featureBadgeAssets = {
  leaderboard: "/brand/badges/leaderboard-badge.webp",
  lending: "/brand/badges/lending-badge.webp",
  profile: "/brand/badges/profile-badge.webp",
  quest: "/brand/badges/quest-badge.webp",
  raid: "/brand/badges/raid-badge.webp",
  reputation: "/brand/badges/reputation-badge.webp",
  reward: "/brand/badges/reward-badge.webp",
  staking: "/brand/badges/staking-badge.webp",
  swap: "/brand/badges/swap-badge.webp",
  vaults: "/brand/badges/vaults-badge.webp",
} as const;

export type FeatureBadgeName = keyof typeof featureBadgeAssets;

export function FeatureBadgeMark({
  badge,
  className = "",
  imageClassName = "",
  priority = false,
  sizes = "96px",
}: {
  badge: FeatureBadgeName;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none relative inline-flex shrink-0 ${className}`}
    >
      <Image
        src={featureBadgeAssets[badge]}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className={`object-contain drop-shadow-[0_0_22px_rgba(168,85,247,0.32)] ${imageClassName}`}
      />
    </span>
  );
}
