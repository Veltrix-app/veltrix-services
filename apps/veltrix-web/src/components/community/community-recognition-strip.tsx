"use client";

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
        accent="text-lime-200"
      />
      <RecognitionTile
        eyebrow="Streak"
        title={snapshot.recognition.streakLabel}
        copy={snapshot.recognition.milestoneLabel}
        accent="text-cyan-200"
      />
      <RecognitionTile
        eyebrow="Trust"
        title={snapshot.recognition.trustLabel}
        copy={`Trust score ${snapshot.trustScore}`}
        accent="text-white"
      />
      <RecognitionTile
        eyebrow="Next unlock"
        title={snapshot.nextUnlockLabel}
        copy={`Level ${snapshot.level} in ${snapshot.projectName}`}
        accent="text-amber-200"
      />
    </div>
  );
}

function RecognitionTile({
  eyebrow,
  title,
  copy,
  accent,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  accent: string;
}) {
  return (
    <div className="rounded-[26px] border border-white/8 bg-black/20 p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
        {eyebrow}
      </p>
      <p className={`mt-3 text-lg font-black ${accent}`}>{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{copy}</p>
    </div>
  );
}
