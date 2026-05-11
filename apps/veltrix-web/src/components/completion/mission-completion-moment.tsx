"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Copy, Sparkles, X } from "lucide-react";
import { ShardBadge } from "@/components/ui/shard-badge";
import { XpValue, isXpDisplay } from "@/components/ui/xp-badge";
import type { MissionCompletionMoment as MissionCompletionMomentRead } from "@/lib/completion/mission-completion-moment";

export function MissionCompletionMoment({
  read,
  onClose,
}: {
  read: MissionCompletionMomentRead | null;
  onClose: () => void;
}) {
  if (!read) {
    return null;
  }

  const tone = getTone(read.tone);

  async function copyShareText() {
    if (!read) return;

    try {
      await navigator.clipboard.writeText(read.shareText);
    } catch {
      // Clipboard is best-effort; the reveal should stay usable without it.
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-xl">
      <div className={`relative w-full max-w-3xl overflow-hidden rounded-[32px] border ${tone.border} bg-[#05080b] p-5 shadow-[0_40px_130px_rgba(0,0,0,0.58)] sm:p-7`}>
        <div className={`absolute inset-0 ${tone.background}`} />
        <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.85),transparent)]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/28 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Close completion reveal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${tone.border} ${tone.badge}`}>
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${tone.text}`}>
                {read.eyebrow}
              </p>
              <p className="mt-1 text-[12px] font-semibold text-slate-400">{read.subtitle}</p>
            </div>
          </div>

          <h2 className="mt-6 max-w-2xl text-[2.3rem] font-black leading-[0.95] tracking-normal text-white sm:text-[4rem]">
            {read.title}
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {read.rewards.map((reward) => (
              <div key={`${reward.label}-${reward.value}`} className="rounded-[22px] border border-white/8 bg-black/30 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{reward.label}</p>
                <div className="mt-2">
                  {reward.label === "Shards" ? (
                    <ShardBadge value={reward.value} label="" size="sm" />
                  ) : isXpDisplay(reward.label, reward.value) || reward.label === "XP" ? (
                    <XpValue size="md">{reward.value}</XpValue>
                  ) : (
                    <p className="text-2xl font-black text-white">{reward.value}</p>
                  )}
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-400">{reward.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={read.primaryHref}
              onClick={onClose}
              className={`motion-press inline-flex items-center gap-2 rounded-full px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition ${tone.cta}`}
            >
              {read.primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={read.secondaryHref}
              onClick={onClose}
              className="motion-press inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:border-cyan-300/24 hover:bg-cyan-300/10"
            >
              {read.secondaryLabel}
              <Sparkles className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => void copyShareText()}
              className="motion-press inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/28 px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:border-white/18 hover:bg-white/10"
            >
              Copy moment
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTone(tone: MissionCompletionMomentRead["tone"]) {
  if (tone === "rose") {
    return {
      border: "border-rose-300/20",
      text: "text-rose-200",
      badge: "bg-rose-300/10 text-rose-100",
      cta: "bg-rose-300 hover:bg-rose-200",
      background: "bg-[radial-gradient(circle_at_22%_0%,rgba(251,113,133,0.2),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(251,191,36,0.12),transparent_30%)]",
    };
  }

  if (tone === "cyan") {
    return {
      border: "border-cyan-300/20",
      text: "text-cyan-100",
      badge: "bg-cyan-300/10 text-cyan-100",
      cta: "bg-cyan-300 hover:bg-cyan-200",
      background: "bg-[radial-gradient(circle_at_22%_0%,rgba(34,211,238,0.2),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(167,139,250,0.12),transparent_30%)]",
    };
  }

  if (tone === "amber") {
    return {
      border: "border-amber-300/20",
      text: "text-amber-200",
      badge: "bg-amber-300/10 text-amber-100",
      cta: "bg-amber-300 hover:bg-amber-200",
      background: "bg-[radial-gradient(circle_at_22%_0%,rgba(251,191,36,0.19),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(34,211,238,0.11),transparent_30%)]",
    };
  }

  return {
    border: "border-lime-300/20",
    text: "text-lime-200",
    badge: "bg-lime-300/10 text-lime-100",
    cta: "bg-lime-300 hover:bg-lime-200",
    background: "bg-[radial-gradient(circle_at_22%_0%,rgba(190,255,74,0.18),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(34,211,238,0.12),transparent_30%)]",
  };
}
