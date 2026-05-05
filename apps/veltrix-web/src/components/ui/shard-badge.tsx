import Image from "next/image";
import { SHARD_ASSET_PATH } from "@/lib/lootboxes/lootbox-catalog";

export function ShardBadge({
  value,
  label = "shards",
  size = "md",
  className = "",
}: {
  value: number | string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const imageSize = size === "sm" ? 18 : 24;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/[0.075] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100 shadow-[0_10px_24px_rgba(16,185,129,0.08)] ${className}`}
    >
      <Image
        src={SHARD_ASSET_PATH}
        alt=""
        width={imageSize}
        height={imageSize}
        className="h-auto w-auto object-contain"
      />
      <span>{value}</span>
      {label ? <span className="text-emerald-100/60">{label}</span> : null}
    </span>
  );
}
