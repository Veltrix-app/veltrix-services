"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, Trophy } from "lucide-react";
import { useCommunityJourney } from "@/hooks/use-community-journey";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { CommunityStatusPanel } from "@/components/community/community-status-panel";
import { CommunityJourneyHero } from "@/components/community/community-journey-hero";
import { CommunityMissionLane } from "@/components/community/community-mission-lane";
import { CommunityRecognitionStrip } from "@/components/community/community-recognition-strip";

function getLaneHref(lane: "onboarding" | "active" | "comeback") {
  if (lane === "onboarding") {
    return "/community/onboarding";
  }
  if (lane === "comeback") {
    return "/community/comeback";
  }
  return "/community";
}

export function CommunityHomeScreen() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { snapshot, loading, refreshing, error, advance } = useCommunityJourney({ projectId });

  return (
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.22fr)_380px]">
        <CommunityJourneyHero snapshot={snapshot} />

        <div className="space-y-6">
          <Surface
            eyebrow="Command read"
            title={snapshot.nextBestAction?.label ?? "Community journey ready"}
            description={
              snapshot.nextBestAction?.description ??
              "Finish setup, pick a mission or jump into the next meaningful project surface."
            }
            className="bg-[radial-gradient(circle_at_top_left,rgba(74,217,255,0.08),transparent_28%),linear-gradient(180deg,rgba(16,22,34,0.96),rgba(9,13,22,0.96))]"
          >
            <div className="grid gap-3">
              <InfoTile title="Now" copy={snapshot.readinessLabel} />
              <InfoTile title="Next" copy={snapshot.nextBestAction?.description ?? "Open the preferred route to keep moving."} />
              <InfoTile title="Watch" copy={snapshot.recognition.nextUnlockLabel} />
            </div>
          </Surface>

          <Surface
            eyebrow="Fast Jumps"
            title="Where to move next"
            description="The community experience should always route you into the next meaningful surface."
          >
            <div className="flex flex-wrap gap-3">
              <QuickLink href="/notifications" label="Signals" />
              <QuickLink href="/profile" label="Profile" />
              <QuickLink href="/rewards" label="Rewards" />
              <QuickLink
                href={snapshot.projectId ? `/communities/${snapshot.projectId}` : "/projects"}
                label="Project"
              />
            </div>
          </Surface>
        </div>
      </section>

      <CommunityRecognitionStrip snapshot={snapshot} />

      <Surface
        eyebrow="Mission Path"
        title="What matters right now"
        description="The path below should feel like your real route forward, not a flat backlog."
      >
        <CommunityMissionLane snapshot={snapshot} />
      </Surface>

      <Surface
        eyebrow="Journey Status"
        title="Your community status"
        description="Status, next unlock, guided actions and manual progress logging all stay together here."
      >
        <CommunityStatusPanel
          snapshot={snapshot}
          loading={loading}
          refreshing={refreshing}
          error={error}
          onAdvance={advance}
        />
      </Surface>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Surface
          eyebrow="Journey Paths"
          title="Routes by momentum"
          description="The journey keeps a dedicated route ready depending on whether you are onboarding, active or returning."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <RailCard
              href="/community/onboarding"
              label="Onboarding path"
              eyebrow="Readiness"
              copy="Link providers, verify your wallet and clear the first mission without leaving the guided member journey."
              live={snapshot.lane === "onboarding"}
            />
            <RailCard
              href="/community"
              label="Active path"
              eyebrow="Momentum"
              copy="Recognition, next unlocks and live missions stay concentrated on the main Community Home."
              live={snapshot.lane === "active"}
            />
            <RailCard
              href="/community/comeback"
              label="Comeback path"
              eyebrow="Re-entry"
              copy="Signals, reactivation nudges and fast routes back into momentum stay isolated from the full backlog."
              live={snapshot.lane === "comeback"}
            />
          </div>
        </Surface>

        <Surface
          eyebrow="Why this matters"
          title="Recognition and status"
          description="Projects should feel your contribution immediately, and you should always know what pushes your status forward."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ValueCard
              icon={Sparkles}
              title="Recognition"
              copy="Your title, streak and mission path keep the community experience feeling personal instead of anonymous."
            />
            <ValueCard
              icon={Trophy}
              title="Status"
              copy={`This journey currently routes you through ${getLaneHref(snapshot.lane)} with a clear next unlock in sight.`}
            />
          </div>
        </Surface>
      </section>
    </div>
  );
}

function InfoTile({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
    >
      {label}
    </Link>
  );
}

function RailCard({
  href,
  label,
  eyebrow,
  copy,
  live,
}: {
  href: string;
  label: string;
  eyebrow: string;
  copy: string;
  live: boolean;
}) {
  return (
    <Link
      href={href}
      className="panel-card rounded-[28px] p-5 transition hover:border-cyan-300/24"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          {eyebrow}
        </p>
        <StatusChip label={live ? "Live now" : "Available"} tone={live ? "positive" : "default"} />
      </div>
      <p className="mt-3 text-lg font-black text-white">{label}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{copy}</p>
    </Link>
  );
}

function ValueCard({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Sparkles;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-[26px] border border-white/8 bg-black/20 p-5">
      <div className="flex items-center gap-3 text-cyan-200">
        <Icon className="h-5 w-5" />
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{copy}</p>
    </div>
  );
}
