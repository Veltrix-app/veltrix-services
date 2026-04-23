import { AlertTriangle, CheckCircle2, Gauge, Wrench } from "lucide-react";
import type { PublicStatusOverview } from "@/lib/status/public-status";

function toneConfig(status: PublicStatusOverview["overallStatus"]) {
  switch (status) {
    case "major_outage":
      return {
        icon: AlertTriangle,
        badge: "Major outage",
        accent: "text-rose-300",
        ring: "border-rose-400/20 bg-rose-500/10",
      };
    case "partial_outage":
      return {
        icon: AlertTriangle,
        badge: "Partial outage",
        accent: "text-amber-300",
        ring: "border-amber-400/20 bg-amber-500/10",
      };
    case "degraded":
      return {
        icon: Gauge,
        badge: "Degraded",
        accent: "text-cyan-200",
        ring: "border-cyan-400/20 bg-cyan-500/10",
      };
    case "maintenance":
      return {
        icon: Wrench,
        badge: "Maintenance",
        accent: "text-slate-200",
        ring: "border-white/12 bg-white/[0.06]",
      };
    default:
      return {
        icon: CheckCircle2,
        badge: "Operational",
        accent: "text-emerald-300",
        ring: "border-emerald-400/20 bg-emerald-500/10",
      };
  }
}

export function StatusHero({ overview }: { overview: PublicStatusOverview }) {
  const config = toneConfig(overview.overallStatus);
  const Icon = config.icon;

  return (
    <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(11,15,22,0.96))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-3xl">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">Service status</p>
          <h1 className="font-display mt-4 text-balance text-4xl font-black tracking-[0.03em] text-white sm:text-5xl">
            Current Veltrix platform posture
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Use this page during rollout, support, or incident handling to see whether current platform conditions are
            normal, degraded, or actively being recovered.
          </p>
        </div>

        <div className={`rounded-[26px] border px-5 py-4 shadow-[0_16px_48px_rgba(0,0,0,0.18)] ${config.ring}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/10 bg-black/20 ${config.accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Overall status</p>
              <p className={`mt-1 text-lg font-black ${config.accent}`}>{config.badge}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
