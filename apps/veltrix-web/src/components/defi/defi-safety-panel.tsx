import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import {
  getDefiGlobalSafetyContract,
  getDefiSafetySurface,
  type DefiSafetyRoute,
  type DefiSafetyTone,
} from "@/lib/defi/defi-safety-contract";

const toneStyles = {
  positive: {
    shell:
      "border-lime-300/10 bg-[radial-gradient(circle_at_100%_0%,rgba(190,255,74,0.11),transparent_34%),linear-gradient(180deg,rgba(13,16,18,0.98),rgba(7,9,12,0.995))]",
    chip: "border-lime-300/14 bg-lime-300/[0.08] text-lime-200",
    icon: "border-lime-300/14 bg-lime-300/10 text-lime-200",
    eyebrow: "text-lime-300",
  },
  neutral: {
    shell:
      "border-white/6 bg-[linear-gradient(180deg,rgba(13,15,19,0.98),rgba(7,9,12,0.995))]",
    chip: "border-white/8 bg-white/[0.035] text-slate-300",
    icon: "border-white/8 bg-white/[0.04] text-slate-300",
    eyebrow: "text-slate-400",
  },
  warning: {
    shell:
      "border-amber-300/12 bg-[radial-gradient(circle_at_100%_0%,rgba(251,191,36,0.1),transparent_34%),linear-gradient(180deg,rgba(16,14,11,0.96),rgba(7,9,12,0.995))]",
    chip: "border-amber-300/14 bg-amber-300/[0.07] text-amber-100",
    icon: "border-amber-300/14 bg-amber-300/10 text-amber-100",
    eyebrow: "text-amber-200",
  },
  danger: {
    shell:
      "border-rose-300/12 bg-[radial-gradient(circle_at_100%_0%,rgba(251,113,133,0.11),transparent_34%),linear-gradient(180deg,rgba(18,10,12,0.96),rgba(7,9,12,0.995))]",
    chip: "border-rose-300/14 bg-rose-300/[0.07] text-rose-100",
    icon: "border-rose-300/14 bg-rose-300/10 text-rose-100",
    eyebrow: "text-rose-200",
  },
} satisfies Record<DefiSafetyTone, Record<string, string>>;

function ToneIcon({ tone }: { tone: DefiSafetyTone }) {
  if (tone === "danger" || tone === "warning") {
    return <AlertTriangle className="h-5 w-5" />;
  }

  if (tone === "neutral") {
    return <Zap className="h-5 w-5" />;
  }

  return <ShieldCheck className="h-5 w-5" />;
}

export function DefiSafetyPanel({
  actionSlot,
  className = "",
  compact = false,
  route,
  showGlobalContract = false,
}: {
  actionSlot?: ReactNode;
  className?: string;
  compact?: boolean;
  route: DefiSafetyRoute;
  showGlobalContract?: boolean;
}) {
  const surface = getDefiSafetySurface(route);
  const globalContract = getDefiGlobalSafetyContract();
  const tone = toneStyles[surface.tone];
  const checks = compact ? surface.checks.slice(0, 3) : surface.checks;

  return (
    <section className={`rounded-[26px] border p-4 sm:p-5 ${tone.shell} ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${tone.icon}`}>
          <ToneIcon tone={surface.tone} />
        </div>
        <div className="min-w-0">
          <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${tone.eyebrow}`}>
            {surface.eyebrow}
          </p>
          <h3 className="mt-2 text-[1.05rem] font-black tracking-[-0.04em] text-white">
            {surface.headline}
          </h3>
        </div>
      </div>

      <p className="mt-4 text-[12px] leading-6 text-slate-400">{surface.copy}</p>

      {showGlobalContract ? (
        <p className="mt-3 rounded-[17px] border border-white/6 bg-black/18 px-3 py-2 text-[11px] leading-5 text-slate-300">
          {globalContract.copy}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2">
        {checks.map((check) => {
          const checkTone = toneStyles[check.tone];

          return (
            <div
              key={check.label}
              className={`rounded-[16px] border px-3 py-2.5 ${checkTone.chip}`}
            >
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em]">
                    {check.label}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-300">{check.copy}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-[17px] border border-white/6 bg-black/20 px-3 py-2.5">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
          Next safe move
        </p>
        <p className="mt-1.5 text-[11px] font-semibold leading-5 text-white">
          {surface.primaryMove}
        </p>
      </div>

      {actionSlot ? <div className="mt-4">{actionSlot}</div> : null}
    </section>
  );
}
