"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole, Route } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import { FeatureBadgeMark } from "@/components/ui/feature-badge-mark";
import type { LiveCommunityJourneySnapshot } from "@/types/live";

type CommunityMissionLaneProps = {
  snapshot: LiveCommunityJourneySnapshot;
};

function getPriorityTone(priority: "critical" | "high" | "medium") {
  if (priority === "critical") {
    return "warning" as const;
  }

  if (priority === "high") {
    return "info" as const;
  }

  return "default" as const;
}

export function CommunityMissionLane({ snapshot }: CommunityMissionLaneProps) {
  if (snapshot.missionLane.length === 0) {
    return (
      <div className="motion-surface motion-light-sweep relative overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.014),rgba(0,0,0,0.18))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)]">
        <div className="motion-ambient-grid opacity-[0.08]" />
        <FeatureBadgeMark
          badge="quest"
          className="absolute -right-8 bottom-[-2.4rem] h-36 w-36 opacity-[0.48] mix-blend-screen"
          sizes="144px"
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-300/45 via-lime-300/16 to-transparent" />
        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/14 bg-cyan-300/[0.08] text-cyan-200">
          <Route className="h-[18px] w-[18px]" />
        </div>
        <p className="relative z-10 mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Mission path
        </p>
        <p className="relative z-10 mt-3 text-lg font-black tracking-normal text-white">No live journey path yet</p>
        <p className="relative z-10 mt-3 max-w-xl text-sm leading-6 text-slate-300">
          As soon as your community journey has a clear next move, it will show up here instead of hiding behind generic links.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {snapshot.missionLane.map((item, index) => (
        <article key={item.key} className="motion-surface motion-3d-card motion-light-sweep group relative overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.014)_58%,rgba(0,0,0,0.18))] p-4 shadow-[0_18px_64px_rgba(0,0,0,0.22)]">
          <div className="motion-ambient-grid opacity-[0.07]" />
          <FeatureBadgeMark
            badge={item.completed ? "reputation" : item.locked ? "profile" : "quest"}
            className="absolute -right-7 bottom-[-2.8rem] h-32 w-32 opacity-[0.38] mix-blend-screen transition duration-300 group-hover:opacity-[0.58]"
            sizes="128px"
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-lime-300/42 via-cyan-200/14 to-transparent" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  {item.eyebrow}
                </span>
                <StatusChip label={item.priority} tone={getPriorityTone(item.priority)} />
                <StatusChip
                  label={item.completed ? "Done" : item.locked ? "Locked" : `Path ${index + 1}`}
                  tone={item.completed ? "positive" : item.locked ? "warning" : "default"}
                />
              </div>
              <p className="mt-3 text-[15px] font-black tracking-normal text-white">{item.label}</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.035] text-slate-300">
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-lime-200" />
              ) : item.locked ? (
                <LockKeyhole className="h-4 w-4 text-amber-200" />
              ) : (
                <Route className="h-4 w-4 text-cyan-200" />
              )}
            </div>
          </div>

          <div className="relative z-10 mt-5 flex flex-wrap gap-3">
            <Link
              href={item.route}
              className="motion-press inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-4 py-2.5 text-sm font-black text-white transition hover:border-cyan-300/18 hover:bg-white/[0.06]"
            >
              {item.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2.5 text-sm font-semibold text-slate-300">
              {item.kind}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
