import Image from "next/image";

const RAID_BADGE_SRC = "/brand/raids/raid-badge.png";

export function RaidBadgeMark({
  className = "",
  imageClassName = "",
  priority = false,
}: {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none relative inline-flex shrink-0 ${className}`}
    >
      <Image
        src={RAID_BADGE_SRC}
        alt=""
        fill
        priority={priority}
        sizes="96px"
        className={`object-contain drop-shadow-[0_0_22px_rgba(168,85,247,0.34)] ${imageClassName}`}
      />
    </span>
  );
}
