"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useMemo, useState } from "react";

type ArtworkTone = "cyan" | "lime" | "amber" | "rose" | "neutral";

const toneClasses: Record<ArtworkTone, string> = {
  cyan: "bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.24),transparent_38%),linear-gradient(180deg,rgba(8,14,20,0.45),rgba(3,7,12,0.9))]",
  lime: "bg-[radial-gradient(circle_at_top_left,rgba(192,255,0,0.24),transparent_38%),linear-gradient(180deg,rgba(8,14,20,0.45),rgba(3,7,12,0.9))]",
  amber: "bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.24),transparent_38%),linear-gradient(180deg,rgba(8,14,20,0.45),rgba(3,7,12,0.9))]",
  rose: "bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.24),transparent_38%),linear-gradient(180deg,rgba(8,14,20,0.45),rgba(3,7,12,0.9))]",
  neutral: "bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.22),transparent_38%),linear-gradient(180deg,rgba(8,14,20,0.45),rgba(3,7,12,0.9))]",
};

const blockedHosts = ["cryptologos.cc", "www.cryptologos.cc"];

export function ArtworkImage({
  src,
  alt,
  className = "",
  imgClassName = "h-full w-full object-cover",
  tone = "neutral",
  fallbackLabel = "Signal art offline",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  tone?: ArtworkTone;
  fallbackLabel?: string;
}) {
  const normalizedSrc = useMemo(() => {
    const trimmed = src?.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const url = new URL(trimmed);
      if (blockedHosts.includes(url.hostname)) {
        return null;
      }
    } catch {
      // Keep non-URL values like data URIs or relative paths intact.
    }

    return trimmed;
  }, [src]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const showImage = Boolean(normalizedSrc) && failedSrc !== normalizedSrc;

  return (
    <div className={`relative ${className || "h-full w-full"}`}>
      {showImage ? (
        <Image
          src={normalizedSrc ?? ""}
          alt={alt}
          fill
          unoptimized
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className={imgClassName}
          onError={() => setFailedSrc(normalizedSrc)}
        />
      ) : (
        <div
          className={`relative h-full w-full overflow-hidden ${toneClasses[tone]}`}
          aria-label={alt}
          role="img"
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_28%,rgba(255,255,255,0.02)_60%,transparent)]" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/75 backdrop-blur-sm">
            <ImageOff className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{fallbackLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}
