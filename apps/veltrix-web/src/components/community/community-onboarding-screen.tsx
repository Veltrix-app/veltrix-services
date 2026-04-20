"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Compass, Link2, Wallet } from "lucide-react";
import { useCommunityJourney } from "@/hooks/use-community-journey";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { CommunityStatusPanel } from "@/components/community/community-status-panel";
import { CommunityMissionLane } from "@/components/community/community-mission-lane";
import { CommunityRecognitionStrip } from "@/components/community/community-recognition-strip";

export function CommunityOnboardingScreen() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { snapshot, loading, refreshing, error, advance } = useCommunityJourney({ projectId });
  const isPrimaryLane = snapshot.lane === "onboarding";

  return (
    <div className="space-y-6">
      {!isPrimaryLane ? (
        <div className="rounded-[28px] border border-amber-300/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
          Your primary community rail is currently <span className="font-semibold">{snapshot.lane}</span>. This onboarding surface stays available as a readiness checklist.
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_360px]">
        <div className="overflow-hidden rounded-[38px] border border-cyan-300/12 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.18),transparent_26%),radial-gradient(circle_at_88%_18%,rgba(192,255,0,0.1),transparent_18%),linear-gradient(145deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            <span>Onboarding Rail</span>
            <StatusChip label={snapshot.projectName || "No project"} tone="info" />
          </div>

          <div className="mt-6 space-y-5">
            <div className="max-w-[14ch]">
              <h3 className="font-display text-balance text-[clamp(2.1rem,4vw,4.4rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                Arm the full member loadout
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                Identity, wallet, community join and first mission all live here so a new member never has to guess what comes next.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <ReadinessTile icon={Link2} label="Providers" value={String(snapshot.linkedProvidersCount)} accent="text-cyan-200" />
              <ReadinessTile icon={Wallet} label="Wallet" value={snapshot.walletVerified ? "Verified" : "Pending"} accent={snapshot.walletVerified ? "text-lime-200" : "text-amber-200"} />
              <ReadinessTile icon={Compass} label="Joined worlds" value={String(snapshot.joinedProjectsCount)} accent="text-white" />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={snapshot.nextBestAction?.route ?? snapshot.preferredRoute}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
              >
                {snapshot.nextBestAction?.ctaLabel ?? "Open loadout"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/community"
                className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30"
              >
                Back to Community Home
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Surface
            eyebrow="Why this rail exists"
            title="No hidden setup debt"
            description="Every missing readiness step is made explicit before the member gets thrown into deeper mission pressure."
          >
            <div className="space-y-3">
              <InfoTile title="Readiness posture" copy={snapshot.readinessLabel} />
              <InfoTile title="Trust posture" copy={snapshot.recognition.trustLabel} />
              <InfoTile title="First mission" copy="The first meaningful contribution closes the loop and graduates the member into the active rail." />
            </div>
          </Surface>
        </div>
      </section>

      <CommunityRecognitionStrip snapshot={snapshot} />

      <Surface
        eyebrow="Onboarding Lane"
        title="The exact readiness moves left"
        description="This lane should tell a new member what to arm next, not force them to scan the whole product."
      >
        <CommunityMissionLane snapshot={snapshot} />
      </Surface>

      <Surface
        eyebrow="Readiness Checklist"
        title="Everything a new member needs"
        description="The onboarding rail keeps the status read and the action queue in one place."
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
          eyebrow="Fast Surfaces"
          title="Where onboarding routes you"
          description="These are the main destinations the rail will keep steering new members toward."
        >
          <div className="flex flex-wrap gap-3">
            <QuickLink href="/profile#discord" label="Provider loadout" />
            <QuickLink href="/profile/edit" label="Wallet verify" />
            <QuickLink href={snapshot.projectId ? `/communities/${snapshot.projectId}` : "/projects"} label="Join world" />
            <QuickLink href="/quests" label="First mission" />
          </div>
        </Surface>

        <Surface
          eyebrow="What unlocks next"
          title="Recognition after onboarding"
          description="Once the readiness stack is armed, the member should transition straight into the active lane with visible status."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoTile title="Recognition label" copy={snapshot.recognition.label} />
            <InfoTile title="Next unlock" copy={snapshot.recognition.nextUnlockLabel} />
          </div>
        </Surface>
      </section>
    </div>
  );
}

function ReadinessTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Link2;
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
