import { FeatureBadgeMark } from "@/components/ui/feature-badge-mark";

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
    <FeatureBadgeMark
      badge="raid"
      className={className}
      imageClassName={imageClassName}
      priority={priority}
    />
  );
}
