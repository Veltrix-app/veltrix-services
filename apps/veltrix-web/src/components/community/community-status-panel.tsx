"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  LoaderCircle,
  RadioTower,
  ShieldCheck,
  TimerReset,
  Wallet,
} from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import type { LiveCommunityJourneyAction, LiveCommunityJourneySnapshot } from "@/types/live";

type CommunityStatusPanelProps = {
  snapshot: LiveCommunityJourneySnapshot;
  loading: boolean;
  refreshing?: boolean;
  error?: string | null;
  onAdvance?: (input: {
    actionKey: string;
    lane?: "onboarding" | "active" | "comeback";
  }) => Promise<{ ok: boolean; error?: string | null }>;
  mode?: "compact" | "detailed";
  actionLimit?: number;
  className?: string;
};

function getStatusTone(tone: LiveCommunityJourneyAction["tone"]) {
  if (tone === "positive") {
    return "positive" as const;
  }
  if (tone === "warning") {
    return "warning" as const;
  }
  if (tone === "danger") {
    return "danger" as const;
  }
  return "info" as const;
}

function getLaneLabel(lane: LiveCommunityJourneySnapshot["lane"]) {
  if (lane === "onboarding") {
    return "Onboarding path";
  }
  if (lane === "comeback") {
    return "Comeback path";
  }
  return "Active path";
}

function getLaneAccent(lane: LiveCommunityJourneySnapshot["lane"]) {
  if (lane === "onboarding") {
    return "text-cyan-200";
  }
  if (lane === "comeback") {
    return "text-amber-200";
  }
  return "text-lime-200";
}

function getActionProgressLabel(action: LiveCommunityJourneyAction) {
  if (action.completed) {
    return "Handled";
  }
  if (action.locked) {
    return "Locked";
  }
  return "Log progress";
}

export function CommunityStatusPanel({
  snapshot,
  loading,
  refreshing = false,
  error = null,
  onAdvance,
  mode = "detailed",
  actionLimit,
  className = "",
}: CommunityStatusPanelProps) {
  const [message, setMessage] = useState<{
    tone: "default" | "error" | "success";
    text: string;
  } | null>(null);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const actions = snapshot.actions.slice(0, actionLimit ?? (mode === "compact" ? 2 : 4));

  async function handleAdvance(action: LiveCommunityJourneyAction) {
    if (!onAdvance || action.completed || action.locked) {
      return;
    }

    setActiveActionKey(action.key);
    setMessage(null);
    const result = await onAdvance({
      actionKey: action.key,
      lane: snapshot.lane,
    });

    if (!result.ok) {
      setMessage({
        tone: "error",
        text: result.error ?? "Could not advance this community step yet.",
      });
      setActiveActionKey(null);
      return;
    }

    setMessage({
      tone: "success",
      text: `${action.label} logged into your current journey.`,
    });
    setActiveActionKey(null);
  }

  if (loading) {
    return (
      <div className={`rounded-[22px] border border-white/8 bg-black/20 px-4 py-5 text-sm text-slate-300 ${className}`}>
        Loading your community journey...
      </div>
    );
  }

  if (error) {
    return (
      <div
      className={`rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-5 text-sm text-rose-200 ${className}`}
      >
        {error}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip label={getLaneLabel(snapshot.lane)} tone={getStatusTone(snapshot.nextBestAction?.tone ?? "default")} />
              <StatusChip label={snapshot.recognitionLabel} tone="positive" />
              {snapshot.projectChain ? <StatusChip label={snapshot.projectChain} tone="info" /> : null}
              {refreshing ? <StatusChip label="Refreshing" tone="info" /> : null}
            </div>
      <h3 className={`mt-3 text-[1.1rem] font-black text-white ${mode === "compact" ? "max-w-[20ch]" : "max-w-[18ch]"}`}>
              {snapshot.headline}
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{snapshot.supportingCopy}</p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Project</p>
            <p className="mt-2 text-sm font-semibold text-white">{snapshot.projectName}</p>
          </div>
        </div>

        <div className={`mt-5 grid gap-3 ${mode === "compact" ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
          <MetricTile
            icon={ShieldCheck}
            label="Linked providers"
            value={String(snapshot.linkedProvidersCount)}
            accent="text-cyan-200"
          />
          <MetricTile
            icon={Wallet}
            label="Wallet"
            value={snapshot.walletVerified ? "Verified" : "Pending"}
            accent={snapshot.walletVerified ? "text-lime-200" : "text-amber-200"}
          />
          <MetricTile
            icon={Flame}
            label="Streak"
            value={String(snapshot.streakDays)}
            accent="text-rose-200"
          />
          {mode === "compact" ? (
            <MetricTile
              icon={RadioTower}
              label="Signals"
              value={String(snapshot.unreadSignals)}
              accent="text-white"
            />
          ) : (
            <MetricTile
              icon={TimerReset}
              label="Open missions"
              value={String(snapshot.openMissionCount)}
              accent="text-white"
            />
          )}
        </div>

        <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Next unlock</p>
          <p className="mt-3 text-base font-semibold text-white">{snapshot.nextUnlockLabel}</p>
          <p className={`mt-2 text-sm leading-6 ${getLaneAccent(snapshot.lane)}`}>{snapshot.contributionStatus}</p>

          {snapshot.nextBestAction ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={snapshot.nextBestAction.route}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
              >
                {snapshot.nextBestAction.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {onAdvance && !snapshot.nextBestAction.completed && !snapshot.nextBestAction.locked ? (
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() => {
                      void handleAdvance(snapshot.nextBestAction!);
                    })
                  }
                  disabled={isPending || activeActionKey === snapshot.nextBestAction.key}
                  className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending && activeActionKey === snapshot.nextBestAction.key ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  Log next step
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {message ? (
        <div
          className={`rounded-[24px] px-4 py-4 text-sm ${
            message.tone === "error"
              ? "border border-rose-400/20 bg-rose-500/10 text-rose-200"
              : message.tone === "success"
                ? "border border-lime-300/20 bg-lime-300/10 text-lime-100"
                : "border border-white/8 bg-black/20 text-slate-300"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {actions.length > 0 ? (
        <div className={`grid gap-4 ${mode === "compact" ? "lg:grid-cols-2" : "xl:grid-cols-2"}`}>
          {actions.map((action) => (
            <article key={action.key} className="rounded-[26px] border border-white/8 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip label={action.completed ? "Done" : action.locked ? "Locked" : "Live"} tone={action.completed ? "positive" : action.locked ? "warning" : getStatusTone(action.tone)} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      {snapshot.projectName}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-black text-white">{action.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{action.description}</p>
                </div>
                {action.completed ? (
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-lime-200" />
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={action.route}
                  className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  {action.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {onAdvance ? (
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(() => {
                        void handleAdvance(action);
                      })
                    }
                    disabled={action.completed || action.locked || isPending}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {isPending && activeActionKey === action.key ? "Logging..." : getActionProgressLabel(action)}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="metric-card rounded-[22px] px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className={`mt-2 text-[15px] font-black ${accent}`}>{value}</p>
    </div>
  );
}
