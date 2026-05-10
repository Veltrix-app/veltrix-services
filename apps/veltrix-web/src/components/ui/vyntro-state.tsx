import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, LoaderCircle, Radar, SearchX } from "lucide-react";

type VyntroStateVariant = "loading" | "empty" | "error" | "success";

const variantConfig: Record<
  VyntroStateVariant,
  {
    label: string;
    Icon: LucideIcon;
    shell: string;
    icon: string;
    bar: string;
  }
> = {
  loading: {
    label: "Syncing",
    Icon: LoaderCircle,
    shell: "border-cyan-300/14 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.11),transparent_32%),linear-gradient(180deg,rgba(13,17,23,0.98),rgba(6,8,12,0.99))]",
    icon: "border-cyan-200/18 bg-cyan-300/[0.08] text-cyan-100",
    bar: "from-cyan-200 via-lime-200 to-violet-200",
  },
  empty: {
    label: "Standby",
    Icon: SearchX,
    shell: "border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(190,255,74,0.09),transparent_30%),linear-gradient(180deg,rgba(13,15,18,0.98),rgba(6,8,11,0.99))]",
    icon: "border-lime-200/16 bg-lime-300/[0.075] text-lime-100",
    bar: "from-lime-300 via-cyan-200 to-violet-200",
  },
  error: {
    label: "Attention",
    Icon: AlertTriangle,
    shell: "border-rose-300/18 bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.13),transparent_32%),linear-gradient(180deg,rgba(24,12,16,0.98),rgba(8,7,10,0.99))]",
    icon: "border-rose-200/18 bg-rose-400/[0.09] text-rose-100",
    bar: "from-rose-300 via-amber-200 to-rose-300",
  },
  success: {
    label: "Ready",
    Icon: CheckCircle2,
    shell: "border-emerald-300/16 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.11),transparent_32%),linear-gradient(180deg,rgba(12,20,17,0.98),rgba(6,9,10,0.99))]",
    icon: "border-emerald-200/18 bg-emerald-300/[0.085] text-emerald-100",
    bar: "from-emerald-200 via-lime-200 to-cyan-200",
  },
};

export function resolveVyntroStateVariant(text: string, tone?: "default" | "error" | "success") {
  if (tone === "error") {
    return "error";
  }

  if (tone === "success") {
    return "success";
  }

  return text.toLowerCase().startsWith("loading") ? "loading" : "empty";
}

export function VyntroState({
  title,
  description,
  label,
  variant = "empty",
  compact = false,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  label?: string;
  variant?: VyntroStateVariant;
  compact?: boolean;
  action?: ReactNode;
  className?: string;
}) {
  const config = variantConfig[variant];
  const Icon = config.Icon;
  const showSkeleton = variant === "loading";

  return (
    <div
      data-vyntro-state={variant}
      className={`motion-surface motion-light-sweep relative overflow-hidden rounded-[24px] border ${config.shell} ${
        compact ? "px-4 py-4" : "px-5 py-6 sm:px-6 sm:py-7"
      } ${className}`}
    >
      <div className="motion-ambient-grid opacity-[0.08]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
      <div className="vyntro-state-scan pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.055] to-transparent" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-[9px] font-black uppercase tracking-[0.26em] text-slate-500">
            {label ?? config.label}
          </p>
          <p className={`${compact ? "mt-2 text-[0.98rem]" : "mt-3 text-[1.25rem]"} font-black tracking-[-0.03em] text-white`}>
            {title}
          </p>
          {description ? (
            <p className={`${compact ? "mt-1.5 text-[12px]" : "mt-2 text-sm"} max-w-2xl leading-6 text-slate-400`}>
              {description}
            </p>
          ) : null}
        </div>

        <span
          className={`vyntro-state-pulse inline-flex shrink-0 items-center justify-center rounded-2xl border ${config.icon} ${
            compact ? "h-10 w-10" : "h-12 w-12"
          }`}
        >
          <Icon className={`${compact ? "h-4 w-4" : "h-5 w-5"} ${variant === "loading" ? "animate-spin" : ""}`} />
        </span>
      </div>

      <div className="relative z-10 mt-4 overflow-hidden rounded-full bg-white/[0.055]">
        <div className={`h-1.5 w-2/3 rounded-full bg-gradient-to-r ${config.bar} ${showSkeleton ? "vyntro-state-meter" : ""}`} />
      </div>

      {showSkeleton ? (
        <div className={`relative z-10 mt-4 grid gap-2 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
          {Array.from({ length: compact ? 3 : 4 }).map((_, index) => (
            <span
              key={index}
              className="vyntro-state-skeleton h-9 rounded-[14px] border border-white/6 bg-white/[0.035]"
              style={{ animationDelay: `${index * 120}ms` }}
            />
          ))}
        </div>
      ) : null}

      {action ? <div className="relative z-10 mt-4">{action}</div> : null}
    </div>
  );
}

export function VyntroPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05090c] px-5 py-10">
      <div className="w-full max-w-3xl">
        <VyntroState
          variant="loading"
          label="VYNTRO Web"
          title="Loading mission control..."
          description="Syncing the command surface, live account state and premium route layer."
        />
      </div>
    </div>
  );
}

export function VyntroInlineLoading({ title = "Loading account..." }: { title?: string }) {
  return (
    <VyntroState
      compact
      variant="loading"
      title={title}
      description="Opening the live session layer and preparing the next route."
      label="Session sync"
      className="max-w-3xl"
    />
  );
}

export function VyntroRouteStandby({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <VyntroState
      compact
      variant="empty"
      title={title}
      description={description}
      label="Route standby"
      action={
        <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          <Radar className="h-3.5 w-3.5 text-lime-100/70" />
          Waiting for signal
        </div>
      }
    />
  );
}
