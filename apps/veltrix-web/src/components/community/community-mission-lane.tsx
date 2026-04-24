"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
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
      <div className="rounded-[26px] border border-white/8 bg-black/20 p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Mission path
        </p>
        <p className="mt-3 text-lg font-black text-white">No live journey path yet</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          As soon as your community journey has a clear next move, it will show up here instead of hiding behind generic links.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {snapshot.missionLane.map((item, index) => (
        <article key={item.key} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
          <div className="flex items-start justify-between gap-4">
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
      <p className="mt-2 text-[15px] font-black text-white">{item.label}</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={item.route}
              className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              {item.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300">
              {item.kind}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
