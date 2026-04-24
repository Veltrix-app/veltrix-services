"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Radar, Sparkles, Trophy, Wallet } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import { useCommunityJourney } from "@/hooks/use-community-journey";
import { CommunityStatusPanel } from "@/components/community/community-status-panel";
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

  const routeCards = [
    {
      href: "/community/onboarding",
      eyebrow: "Readiness",
      label: "Onboarding path",
      copy: "Link providers, verify the wallet and clear the first steps.",
      live: snapshot.lane === "onboarding",
    },
    {
      href: "/community",
      eyebrow: "Momentum",
      label: "Active path",
      copy: "Recognition, live missions and reward pressure stay here.",
      live: snapshot.lane === "active",
    },
    {
      href: "/community/comeback",
      eyebrow: "Re-entry",
      label: "Comeback path",
      copy: "Signals and reactivation nudges stay out of the full backlog.",
      live: snapshot.lane === "comeback",
    },
  ];

  const quickLinks = [
    {
      href: "/notifications",
      label: "Signals",
      meta: `${snapshot.unreadSignals} unread`,
    },
    {
      href: "/rewards",
      label: "Rewards",
      meta: `${snapshot.claimableRewards} claimable`,
    },
    {
      href: snapshot.projectId ? `/projects/${snapshot.projectId}` : "/projects",
      label: "Project space",
      meta: snapshot.projectName,
    },
  ];

  const missionHighlights = snapshot.missionLane.slice(0, 3);
  const primaryRoute = snapshot.nextBestAction?.route ?? getLaneHref(snapshot.lane);
  const primaryCta = snapshot.nextBestAction?.ctaLabel ?? "Open journey";

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_300px]">
        <div className="rounded-[24px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(0,209,255,0.14),transparent_24%),radial-gradient(circle_at_78%_18%,rgba(186,255,59,0.12),transparent_24%),linear-gradient(180deg,rgba(11,12,16,0.99),rgba(7,8,10,0.99))] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.28)] sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <StatusChip label={snapshot.projectName} tone="info" />
                <StatusChip label={snapshot.recognitionLabel} tone="positive" />
                <StatusChip label={snapshot.lane === "onboarding" ? "Onboarding" : snapshot.lane === "comeback" ? "Comeback" : "Active"} tone="default" />
                {snapshot.projectChain ? <StatusChip label={snapshot.projectChain} tone="info" /> : null}
                {refreshing ? <StatusChip label="Refreshing" tone="info" /> : null}
              </div>

              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200">Community</p>
              <h2 className="mt-3 max-w-[18ch] text-[1rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.14rem]">
                {snapshot.headline}
              </h2>
              <p className="mt-2.5 max-w-3xl text-[12px] leading-5 text-slate-300">{snapshot.supportingCopy}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <MetricPill label="Missions" value={String(snapshot.openMissionCount)} />
                <MetricPill label="Signals" value={String(snapshot.unreadSignals)} />
                <MetricPill label="Rewards" value={String(snapshot.claimableRewards)} />
                <MetricPill label="Streak" value={String(snapshot.streakDays)} />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={primaryRoute}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2.5 text-[13px] font-bold text-slate-950 transition hover:bg-cyan-200"
                >
                  {primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={snapshot.projectId ? `/projects/${snapshot.projectId}` : "/projects"}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Open project
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.38fr)_repeat(2,minmax(0,1fr))]">
            {missionHighlights.length > 0 ? (
              missionHighlights.map((item, index) => (
                <Link
                  key={item.key}
                  href={item.route}
                  className={`group rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,16,19,0.98),rgba(9,10,12,0.98))] transition hover:border-cyan-300/16 ${
                    index === 0 ? "p-4.5 sm:p-5" : "p-3.5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Route {index + 1}
                    </p>
                    <StatusChip
                      label={item.completed ? "Done" : item.locked ? "Locked" : item.priority}
                      tone={item.completed ? "positive" : item.locked ? "warning" : item.priority === "critical" ? "warning" : item.priority === "high" ? "info" : "default"}
                    />
                  </div>
                  <p className={`font-semibold text-white ${index === 0 ? "mt-3.5 text-[0.94rem]" : "mt-3 text-[12px]"}`}>
                    {item.label}
                  </p>
                  <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-slate-400">{item.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Open route
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:text-white" />
                  </div>
                </Link>
              ))
            ) : (
              <CommunityNotice text={loading ? "Loading live mission routes..." : "No live mission routes are visible yet."} compact />
            )}
          </div>
        </div>

        <div className="rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_bottom_right,rgba(186,255,59,0.12),transparent_28%),linear-gradient(180deg,rgba(13,14,18,0.98),rgba(8,9,12,0.98))] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">My community assets</p>
          <p className="mt-2.5 text-[0.98rem] font-semibold tracking-[-0.02em] text-white">{snapshot.projectName}</p>

          <div className="mt-5 space-y-3">
            <JourneyMetric label="Recognition" value={snapshot.recognitionLabel} icon={Sparkles} />
            <JourneyMetric label="Trust" value={String(snapshot.trustScore)} icon={Trophy} />
            <JourneyMetric label="Wallet" value={snapshot.walletVerified ? "Verified" : "Pending"} icon={Wallet} />
            <JourneyMetric label="Signals" value={String(snapshot.unreadSignals)} icon={Radar} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniStat label="Providers" value={String(snapshot.linkedProvidersCount)} />
            <MiniStat label="Joined" value={String(snapshot.joinedProjectsCount)} />
            <MiniStat label="Streak" value={String(snapshot.streakDays)} />
            <MiniStat label="Level" value={String(snapshot.level)} />
          </div>

          <div className="mt-5 space-y-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between gap-3 rounded-[18px] border border-white/6 bg-white/[0.03] px-3 py-3 transition hover:bg-white/[0.05]"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{link.label}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">{link.meta}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/40" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CommunityRecognitionStrip snapshot={snapshot} />

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Ongoing"
          title="Open the lane that matches your momentum"
          description="Keep the route stack compact so the next move is obvious."
        />

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.38fr)_repeat(2,minmax(0,1fr))]">
          {routeCards.map((route, index) => (
            <Link
              key={route.href}
              href={route.href}
            className={`group rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,15,18,0.98),rgba(8,10,13,0.98))] transition hover:border-cyan-300/16 ${
                index === 0 ? "p-4.5 sm:p-5" : "p-3.5"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{route.eyebrow}</p>
                <StatusChip label={route.live ? "Live now" : "Available"} tone={route.live ? "positive" : "default"} />
              </div>
              <p className={`font-semibold text-white ${index === 0 ? "mt-3.5 text-[0.94rem]" : "mt-3 text-[12px]"}`}>
                {route.label}
              </p>
              <p className="mt-2 text-[12px] leading-5 text-slate-400">{route.copy}</p>
              <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Open route
                </span>
                <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:text-white" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Mission lane"
          title="Current live path"
          description="Keep the active path visible before the deeper status surface."
        />
        <CommunityMissionLane snapshot={snapshot} />
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Journey status"
          title="Status, next unlock and progress logging"
          description="This is the deeper command surface for guided progress and confirmation."
        />
        <CommunityStatusPanel
          snapshot={snapshot}
          loading={loading}
          refreshing={refreshing}
          error={error}
          onAdvance={advance}
        />
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-3xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
        <h3 className="mt-2 text-[0.96rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.04rem]">
          {title}
        </h3>
        <p className="mt-1 text-[12px] leading-5 text-slate-400">{description}</p>
      </div>
      <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400">
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/20 px-2 py-[3px] text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
      <span>{label}</span>
      <span className="text-white">{value}</span>
    </span>
  );
}

function JourneyMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Sparkles;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2.5">
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="text-[11px] font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-black/20 px-2.5 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-[11px] font-semibold text-white">{value}</p>
    </div>
  );
}

function CommunityNotice({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-[18px] border border-white/8 bg-black/20 px-3.5 ${compact ? "py-3.5" : "py-4"} text-[12px] text-slate-300`}>
      {text}
    </div>
  );
}
