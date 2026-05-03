"use client";

import { Crown, Flame, ShieldCheck, Sparkles } from "lucide-react";
import type { LiveCommunityJourneySnapshot } from "@/types/live";

type CommunityRecognitionStripProps = {
  snapshot: LiveCommunityJourneySnapshot;
};

export function CommunityRecognitionStrip({
  snapshot,
}: CommunityRecognitionStripProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <RecognitionTile
        eyebrow="Recognition"
        title={snapshot.recognition.label}
        copy={snapshot.recognition.contributionLabel}
        icon={Sparkles}
        accent="text-lime-200"
        line="from-lime-300/55 via-lime-300/12"
      />
      <RecognitionTile
        eyebrow="Streak"
        title={snapshot.recognition.streakLabel}
        copy={snapshot.recognition.milestoneLabel}
        icon={Flame}
        accent="text-cyan-200"
        line="from-cyan-300/55 via-cyan-300/12"
      />
      <RecognitionTile
        eyebrow="Trust"
        title={snapshot.recognition.trustLabel}
        copy={`Trust score ${snapshot.trustScore}`}
        icon={ShieldCheck}
        accent="text-white"
        line="from-white/35 via-white/10"
      />
      <RecognitionTile
        eyebrow="Next unlock"
        title={snapshot.nextUnlockLabel}
        copy={`Level ${snapshot.level} in ${snapshot.projectName}`}
        icon={Crown}
        accent="text-amber-200"
        line="from-amber-300/55 via-amber-300/12"
      />
    </div>
  );
}

function RecognitionTile({
  eyebrow,
  title,
  copy,
  icon: Icon,
  accent,
  line,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  icon: typeof Sparkles;
  accent: string;
  line: string;
}) {
  return (
    <div className="relative min-h-[11rem] overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.014)_58%,rgba(0,0,0,0.18))] p-4 shadow-[0_18px_64px_rgba(0,0,0,0.22)]">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${line} to-transparent`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.035] text-slate-200">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
        {eyebrow}
      </p>
      <p className={`mt-3 text-lg font-black tracking-normal ${accent}`}>{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{copy}</p>
    </div>
  );
}
