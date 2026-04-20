"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BellRing, Flame, Trophy } from "lucide-react";
import { useCommunityJourney } from "@/hooks/use-community-journey";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { CommunityStatusPanel } from "@/components/community/community-status-panel";
import { CommunityMissionLane } from "@/components/community/community-mission-lane";
import { CommunityRecognitionStrip } from "@/components/community/community-recognition-strip";

export function CommunityComebackScreen() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { snapshot, loading, refreshing, error, advance } = useCommunityJourney({ projectId });
  const isPrimaryLane = snapshot.lane === "comeback";

  return (
    <div className="space-y-6">
      {!isPrimaryLane ? (
        <div className="rounded-[28px] border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm text-cyan-100">
          Your primary lane is currently <span className="font-semibold">{snapshot.lane}</span>. This comeback rail stays ready whenever re-entry needs a dedicated path.
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_360px]">
        <div className="overflow-hidden rounded-[38px] border border-amber-300/12 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_26%),radial-gradient(circle_at_84%_18%,rgba(0,204,255,0.1),transparent_18%),linear-gradient(145deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-amber-200">
            <span>Comeback Rail</span>
            <StatusChip label={snapshot.projectName || "No project"} tone="warning" />
          </div>

          <div className="mt-6 space-y-5">
            <div className="max-w-[14ch]">
              <h3 className="font-display text-balance text-[clamp(2.1rem,4vw,4.4rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                Re-enter without friction
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                Signals, nudges and comeback missions stay focused here so returning members do not get buried under the full mission backlog.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <RecoveryTile icon={BellRing} label="Unread signals" value={String(snapshot.unreadSignals)} accent="text-cyan-200" />
              <RecoveryTile icon={Flame} label="Streak" value={String(snapshot.streakDays)} accent="text-amber-200" />
              <RecoveryTile icon={Trophy} label="Claimables" value={String(snapshot.claimableRewards)} accent="text-lime-200" />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={snapshot.nextBestAction?.route ?? snapshot.preferredRoute}
                className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
              >
                {snapshot.nextBestAction?.ctaLabel ?? "Open signal feed"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/community"
                className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:border-amber-300/30"
              >
                Back to Community Home
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Surface
            eyebrow="Re-entry logic"
            title="Comeback without confusion"
            description="The goal is to offer one clear way back into value instead of dumping members into everything at once."
          >
            <div className="space-y-3">
              <InfoTile title="Re-entry posture" copy={snapshot.readinessLabel} />
              <InfoTile title="Mission second" copy="A comeback mission becomes the fastest route back into visible pressure." />
              <InfoTile title="Rewards still count" copy="Claimables and campaign unlocks can also work as re-entry magnets." />
            </div>
          </Surface>
        </div>
      </section>

      <CommunityRecognitionStrip snapshot={snapshot} />

      <Surface
        eyebrow="Comeback Lane"
        title="The shortest route back into pressure"
        description="Signals, missions and claims should compete here until the member is truly back in motion."
      >
        <CommunityMissionLane snapshot={snapshot} />
      </Surface>

      <Surface
        eyebrow="Comeback Queue"
        title="Everything this member needs to re-enter"
        description="Signals, missions and reactivation prompts stay together until the comeback lane is complete."
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
          eyebrow="Re-entry paths"
          title="Where the comeback rail routes you"
          description="These jumps should be enough to get a returning member moving again."
        >
          <div className="flex flex-wrap gap-3">
            <QuickLink href="/notifications" label="Signal feed" />
            <QuickLink href="/quests" label="Live missions" />
            <QuickLink href="/raids" label="Raid board" />
            <QuickLink href="/rewards" label="Reward vault" />
          </div>
        </Surface>

        <Surface
          eyebrow="Post comeback"
          title="What happens after re-entry"
          description="Once a member is back in motion, the active lane should carry recognition, streak and contribution pressure again."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoTile title="Recognition label" copy={snapshot.recognition.label} />
            <InfoTile title="Contribution status" copy={snapshot.recognition.contributionLabel} />
          </div>
        </Surface>
      </section>
    </div>
  );
}

function RecoveryTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof BellRing;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="metric-card rounded-[24px] px-4 py-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className={`mt-3 text-2xl font-black ${accent}`}>{value}</p>
    </div>
  );
}

function InfoTile({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4">
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
