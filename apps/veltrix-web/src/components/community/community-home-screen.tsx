"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Orbit, Sparkles, Trophy } from "lucide-react";
import { useCommunityJourney } from "@/hooks/use-community-journey";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { CommunityStatusPanel } from "@/components/community/community-status-panel";

function getLaneLabel(lane: "onboarding" | "active" | "comeback") {
  if (lane === "onboarding") {
    return "Onboarding rail";
  }
  if (lane === "comeback") {
    return "Comeback rail";
  }
  return "Active rail";
}

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
  const laneHref = getLaneHref(snapshot.lane);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.22fr)_380px]">
        <div className="overflow-hidden rounded-[38px] border border-cyan-300/12 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.16),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(192,255,0,0.14),transparent_20%),linear-gradient(145deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            <span>Community Home</span>
            <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 tracking-[0.24em] text-cyan-100">
              Member Journey
            </span>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_320px]">
            <div className="space-y-5">
              <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.22),transparent_34%),linear-gradient(145deg,rgba(8,20,28,0.96),rgba(4,9,13,0.94))] p-6">
                <div className="absolute right-4 top-4 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/16 bg-cyan-300/10 text-cyan-200">
                  <Orbit className="h-8 w-8" />
                </div>
                <div className="max-w-[15ch]">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip label={getLaneLabel(snapshot.lane)} tone="info" />
                    <StatusChip label={snapshot.recognitionLabel} tone="positive" />
                  </div>
                  <h3 className="font-display mt-4 text-balance text-[clamp(2.1rem,4vw,4.4rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                    {snapshot.projectName || "Community rail"}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                    {snapshot.supportingCopy}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={snapshot.nextBestAction?.route ?? "/projects"}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                >
                  {snapshot.nextBestAction?.ctaLabel ?? "Open worlds"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={laneHref}
                  className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30"
                >
                  Open lane rail
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/24 p-4">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
                Recognition read
              </p>
              <div className="mt-4 space-y-3">
                <ReadTile label="Recognition" value={snapshot.recognitionLabel} accent="text-lime-200" />
                <ReadTile label="Signals" value={String(snapshot.unreadSignals)} accent="text-cyan-200" />
                <ReadTile label="Claimables" value={String(snapshot.claimableRewards)} accent="text-amber-200" />
                <ReadTile label="Milestones" value={String(snapshot.milestonesUnlockedCount)} accent="text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Surface
            eyebrow="Next Best Action"
            title={snapshot.nextBestAction?.label ?? "Community rail standing by"}
            description={snapshot.nextBestAction?.description ?? "Pick a world or arm your identity stack to activate your next move."}
          >
            <div className="space-y-3">
              <InfoTile
                title="Contribution status"
                copy={snapshot.contributionStatus}
              />
              <InfoTile title="Next unlock" copy={snapshot.nextUnlockLabel} />
            </div>
          </Surface>

          <Surface
            eyebrow="Fast Jumps"
            title="Where to move next"
            description="The community layer should always route you into the next meaningful surface."
          >
            <div className="flex flex-wrap gap-3">
              <QuickLink href="/notifications" label="Signal center" />
              <QuickLink href="/profile" label="Pilot profile" />
              <QuickLink href="/rewards" label="Reward vault" />
              <QuickLink href={snapshot.projectId ? `/communities/${snapshot.projectId}` : "/projects"} label="Project world" />
            </div>
          </Surface>
        </div>
      </section>

      <Surface
        eyebrow="Journey Rail"
        title="Your community control lane"
        description="Status, next unlock, action rail and manual progress logging all stay together here."
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
          eyebrow="Momentum Paths"
          title="Lane-specific routes"
          description="The journey keeps a dedicated path ready depending on whether you are onboarding, active or coming back."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <RailCard
              href="/community/onboarding"
              label="Onboarding rail"
              eyebrow="Readiness"
              copy="Link providers, verify wallet and clear the first mission without leaving the member rail."
              live={snapshot.lane === "onboarding"}
            />
            <RailCard
              href="/community"
              label="Active lane"
              eyebrow="Momentum"
              copy="Recognition, next unlocks and live missions stay concentrated on the main Community Home."
              live={snapshot.lane === "active"}
            />
            <RailCard
              href="/community/comeback"
              label="Comeback rail"
              eyebrow="Re-entry"
              copy="Signals, reactivation nudges and faster routes back into pressure stay isolated from the full backlog."
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
              copy="Your title, streak and milestone count keep the community rail feeling alive instead of anonymous."
            />
            <ValueCard
              icon={Trophy}
              title="Status"
              copy="Every lane clarifies what unlocks next, what is still pending and where your next visible contribution should land."
            />
          </div>
        </Surface>
      </section>
    </div>
  );
}

function ReadTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="metric-card rounded-[22px] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className={`mt-3 text-xl font-black ${accent}`}>{value}</p>
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
    <Link href={href} className="panel-card rounded-[28px] p-5 transition hover:border-cyan-300/24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
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
