"use client";

import type { ComponentType, ReactNode } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

type RouteHeroTone = "rose" | "cyan" | "lime" | "violet" | "amber";

const toneStyles = {
  rose: {
    chip: "border-rose-300/18 bg-rose-300/12 text-rose-100",
    cta: "bg-rose-300 text-black hover:bg-rose-200",
    glow: "from-rose-400/22 via-violet-400/12 to-transparent",
    progress: "bg-[linear-gradient(90deg,#fb7185,#d946ef,#74f7ff)]",
    panelIcon: "border-rose-300/18 bg-rose-300/12 text-rose-100",
    overlay:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(244,63,94,0.16),transparent_32%),radial-gradient(circle_at_74%_52%,rgba(168,85,247,0.2),transparent_34%),linear-gradient(90deg,rgba(3,2,8,0.92),rgba(3,4,10,0.62)_37%,rgba(8,3,13,0.22)_64%,rgba(2,3,7,0.76)),linear-gradient(180deg,rgba(2,3,7,0.02),rgba(2,3,7,0.84))]",
  },
  cyan: {
    chip: "border-cyan-300/18 bg-cyan-300/12 text-cyan-100",
    cta: "bg-cyan-200 text-black hover:bg-cyan-100",
    glow: "from-cyan-300/20 via-violet-400/12 to-transparent",
    progress: "bg-[linear-gradient(90deg,#74f7ff,#c4b5fd,#beff4a)]",
    panelIcon: "border-cyan-300/18 bg-cyan-300/12 text-cyan-100",
    overlay:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(103,232,249,0.17),transparent_32%),radial-gradient(circle_at_82%_50%,rgba(190,255,74,0.15),transparent_32%),linear-gradient(90deg,rgba(1,4,9,0.92),rgba(2,5,12,0.62)_38%,rgba(3,8,12,0.24)_64%,rgba(1,3,8,0.78)),linear-gradient(180deg,rgba(2,3,7,0.02),rgba(2,3,7,0.82))]",
  },
  lime: {
    chip: "border-lime-300/18 bg-lime-300/12 text-lime-100",
    cta: "bg-lime-300 text-black hover:bg-lime-200",
    glow: "from-lime-300/20 via-cyan-300/12 to-transparent",
    progress: "bg-[linear-gradient(90deg,#beff4a,#74f7ff,#c4b5fd)]",
    panelIcon: "border-lime-300/18 bg-lime-300/12 text-lime-100",
    overlay:
      "bg-[radial-gradient(circle_at_48%_24%,rgba(190,255,74,0.16),transparent_32%),radial-gradient(circle_at_80%_52%,rgba(103,232,249,0.15),transparent_32%),linear-gradient(90deg,rgba(2,5,4,0.92),rgba(2,7,9,0.62)_38%,rgba(3,9,9,0.24)_64%,rgba(2,3,6,0.78)),linear-gradient(180deg,rgba(2,3,7,0.02),rgba(2,3,7,0.82))]",
  },
  violet: {
    chip: "border-violet-300/18 bg-violet-300/12 text-violet-100",
    cta: "bg-violet-200 text-black hover:bg-violet-100",
    glow: "from-violet-300/22 via-cyan-300/12 to-transparent",
    progress: "bg-[linear-gradient(90deg,#c4b5fd,#74f7ff,#beff4a)]",
    panelIcon: "border-violet-300/18 bg-violet-300/12 text-violet-100",
    overlay:
      "bg-[radial-gradient(circle_at_50%_24%,rgba(168,85,247,0.18),transparent_32%),radial-gradient(circle_at_82%_52%,rgba(103,232,249,0.13),transparent_32%),linear-gradient(90deg,rgba(3,2,8,0.92),rgba(4,4,12,0.62)_38%,rgba(7,4,12,0.24)_64%,rgba(2,3,7,0.78)),linear-gradient(180deg,rgba(2,3,7,0.02),rgba(2,3,7,0.82))]",
  },
  amber: {
    chip: "border-amber-300/18 bg-amber-300/12 text-amber-100",
    cta: "bg-amber-200 text-black hover:bg-amber-100",
    glow: "from-amber-300/20 via-lime-300/10 to-transparent",
    progress: "bg-[linear-gradient(90deg,#fde68a,#beff4a,#74f7ff)]",
    panelIcon: "border-amber-300/18 bg-amber-300/12 text-amber-100",
    overlay:
      "bg-[radial-gradient(circle_at_50%_24%,rgba(251,191,36,0.16),transparent_32%),radial-gradient(circle_at_82%_52%,rgba(190,255,74,0.13),transparent_32%),linear-gradient(90deg,rgba(5,3,1,0.92),rgba(6,5,2,0.62)_38%,rgba(8,6,3,0.24)_64%,rgba(2,3,7,0.78)),linear-gradient(180deg,rgba(2,3,7,0.02),rgba(2,3,7,0.82))]",
  },
} satisfies Record<RouteHeroTone, Record<string, string>>;

function toBackgroundImage(value: string) {
  return `url("${value.replaceAll('"', '\\"')}")`;
}

export function CinematicRouteHero({
  imageSrc,
  imagePosition = "center",
  title,
  description,
  chips,
  stats,
  panelTitle,
  panelText,
  panelStats,
  panelIcon: PanelIcon = ShieldCheck,
  primaryCta,
  secondaryCta,
  tone = "violet",
}: {
  imageSrc: string;
  imagePosition?: string;
  title: string;
  description: string;
  chips: string[];
  stats: Array<{ label: string; value: string }>;
  panelTitle: string;
  panelText: string;
  panelStats: Array<{ label: string; value: string; sub?: string }>;
  panelIcon?: ComponentType<{ className?: string }>;
  primaryCta: { href: string; label: string; icon?: ReactNode };
  secondaryCta?: { href: string; label: string; icon?: ReactNode };
  tone?: RouteHeroTone;
}) {
  const styles = toneStyles[tone];

  return (
    <section className="motion-surface motion-light-sweep relative overflow-hidden rounded-[34px] border border-white/7 bg-[#05060a] shadow-[0_32px_110px_rgba(0,0,0,0.38)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-no-repeat opacity-[0.98] brightness-[0.94] contrast-110 saturate-125"
        style={{ backgroundImage: toBackgroundImage(imageSrc), backgroundPosition: imagePosition }}
      />
      <div className={`absolute inset-0 ${styles.overlay}`} />
      <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${styles.glow}`} />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#050608] via-[#050608]/72 to-transparent" />

      <div className="relative z-10 grid min-h-[500px] gap-6 p-5 sm:min-h-[560px] sm:p-7 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
        <div className="max-w-4xl self-end pb-2">
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] backdrop-blur-xl ${styles.chip}`}
              >
                {chip}
              </span>
            ))}
          </div>

          <h1 className="mt-7 max-w-[10ch] text-[3.4rem] font-black leading-[0.88] tracking-normal text-white [text-shadow:0_18px_70px_rgba(0,0,0,0.72)] sm:text-[5.1rem] xl:text-[6.6rem]">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-100 sm:text-[1rem]">
            {description}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={primaryCta.href}
              className={`motion-press inline-flex items-center gap-2 rounded-full px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] transition ${styles.cta}`}
            >
              {primaryCta.icon}
              {primaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </a>
            {secondaryCta ? (
              <a
                href={secondaryCta.href}
                className="motion-press inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl transition hover:border-white/22 hover:bg-white/[0.1]"
              >
                {secondaryCta.label}
                {secondaryCta.icon}
              </a>
            ) : null}
          </div>

          <div className="mt-6 grid max-w-3xl gap-2.5 sm:grid-cols-3">
            {stats.map((stat) => (
              <RouteHeroStat key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>

        <div className="motion-surface relative overflow-hidden rounded-[28px] border border-white/9 bg-black/48 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_45%)]" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                  Route posture
                </p>
                <h2 className="mt-2 text-[1.35rem] font-black text-white">{panelTitle}</h2>
              </div>
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${styles.panelIcon}`}
              >
                <PanelIcon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
              <div className={`h-full w-[82%] rounded-full shadow-[0_0_24px_rgba(190,255,74,0.22)] ${styles.progress}`} />
            </div>

            <p className="mt-4 text-[13px] leading-6 text-slate-300">{panelText}</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {panelStats.map((stat) => (
                <RouteHeroPanelMetric
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  sub={stat.sub}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RouteHeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/26 px-3.5 py-3 backdrop-blur-md">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1.5 truncate text-[13px] font-black text-white">{value}</p>
    </div>
  );
}

function RouteHeroPanelMetric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/28 p-3.5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 truncate text-[1.05rem] font-black text-white">{value}</p>
      {sub ? <p className="mt-1 truncate text-[10px] font-bold text-slate-400">{sub}</p> : null}
    </div>
  );
}
