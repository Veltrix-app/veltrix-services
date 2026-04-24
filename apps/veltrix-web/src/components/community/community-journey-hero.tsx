"use client";

import Link from "next/link";
import { ArrowRight, Orbit } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import type { LiveCommunityJourneySnapshot } from "@/types/live";

type CommunityJourneyHeroProps = {
  snapshot: LiveCommunityJourneySnapshot;
};

function getReadinessTone(snapshot: LiveCommunityJourneySnapshot) {
  if (snapshot.lane === "onboarding") {
    return snapshot.walletVerified && snapshot.linkedProvidersCount >= 2 ? "positive" : "warning";
  }

  if (snapshot.lane === "comeback") {
    return snapshot.unreadSignals > 0 ? "warning" : "info";
  }

  return snapshot.claimableRewards > 0 ? "positive" : "info";
}

export function CommunityJourneyHero({ snapshot }: CommunityJourneyHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.14),transparent_26%),radial-gradient(circle_at_88%_14%,rgba(192,255,0,0.08),transparent_18%),linear-gradient(180deg,rgba(10,13,19,0.99),rgba(6,8,13,0.98))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
        <span>Community Home</span>
        <StatusChip label={snapshot.projectName || "No community"} tone="info" />
        <StatusChip label={snapshot.readinessLabel} tone={getReadinessTone(snapshot)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_320px]">
        <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5">
            <div className="absolute right-4 top-4 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/16 bg-cyan-300/10 text-cyan-200">
              <Orbit className="h-8 w-8" />
            </div>
            <div className="max-w-[16ch]">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip label={snapshot.recognition.label} tone="positive" />
                <StatusChip label={snapshot.recognition.trustLabel} tone="info" />
              </div>
              <h3 className="font-display mt-4 text-balance text-[clamp(2.1rem,4vw,4.4rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                {snapshot.headline}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                {snapshot.supportingCopy}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <ReadTile
              label="Now"
              value={
                snapshot.nextBestAction?.label ??
                "Your current lane is already primed for the next community move."
              }
            />
            <ReadTile
              label="Next"
              value={
                snapshot.nextBestAction?.description ??
                "Use the preferred route to keep the member journey moving with less friction."
              }
            />
            <ReadTile
              label="Watch"
              value={snapshot.recognition.nextUnlockLabel}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={snapshot.nextBestAction?.route ?? snapshot.preferredRoute}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              {snapshot.nextBestAction?.ctaLabel ?? "Open journey"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={snapshot.preferredRoute}
              className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30"
            >
              Stay on best lane
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
              Ongoing
            </p>
            <div className="mt-4 space-y-3">
              <MetricReadTile label="Recognition" value={snapshot.recognition.label} accent="text-lime-200" />
              <MetricReadTile label="Lane posture" value={snapshot.readinessLabel} accent="text-cyan-200" />
              <MetricReadTile label="Trust" value={String(snapshot.trustScore)} accent="text-white" />
              <MetricReadTile label="Level" value={String(snapshot.level)} accent="text-amber-200" />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/6 bg-black/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Next unlock</p>
            <p className="mt-3 text-sm font-semibold text-white">{snapshot.recognition.nextUnlockLabel}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Stay on the preferred route and let the next community move compound instead of splitting your attention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-7 text-slate-200">{value}</p>
    </div>
  );
}

function MetricReadTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="metric-card rounded-[22px] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className={`mt-2 text-[15px] font-black ${accent}`}>{value}</p>
    </div>
  );
}
