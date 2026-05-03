"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Crown,
  Flame,
  Orbit,
  Radar,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
  Wallet,
} from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuth } from "@/components/providers/auth-provider";
import { useCommunityJourney } from "@/hooks/use-community-journey";
import { CommunityStatusPanel } from "@/components/community/community-status-panel";
import { CommunityMissionLane } from "@/components/community/community-mission-lane";
import { CommunityRecognitionStrip } from "@/components/community/community-recognition-strip";
import type { LiveCommunityJourneySnapshot } from "@/types/live";

const routeAccentClasses = {
  cyan: {
    icon: "border-cyan-300/14 bg-cyan-300/[0.08] text-cyan-200 shadow-[0_0_34px_rgba(34,211,238,0.1)]",
    line: "from-cyan-300/55 via-cyan-300/12",
    label: "text-cyan-200",
  },
  lime: {
    icon: "border-lime-300/14 bg-lime-300/[0.08] text-lime-200 shadow-[0_0_34px_rgba(190,255,74,0.1)]",
    line: "from-lime-300/55 via-lime-300/12",
    label: "text-lime-200",
  },
  amber: {
    icon: "border-amber-300/14 bg-amber-300/[0.08] text-amber-200 shadow-[0_0_34px_rgba(245,158,11,0.1)]",
    line: "from-amber-300/55 via-amber-300/12",
    label: "text-amber-200",
  },
} as const;

type RouteAccent = keyof typeof routeAccentClasses;

function getLaneHref(lane: "onboarding" | "active" | "comeback") {
  if (lane === "onboarding") {
    return "/community/onboarding";
  }
  if (lane === "comeback") {
    return "/community/comeback";
  }
  return "/community";
}

function getLaneLabel(lane: LiveCommunityJourneySnapshot["lane"]) {
  if (lane === "onboarding") {
    return "Onboarding lane";
  }
  if (lane === "comeback") {
    return "Comeback lane";
  }
  return "Active lane";
}

export function CommunityHomeScreen() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { session } = useAuth();
  const { snapshot, loading, refreshing, error, advance } = useCommunityJourney({ projectId });
  const accountReady = Boolean(session);

  const routeCards = [
    {
      href: "/community/onboarding",
      eyebrow: "Readiness",
      label: "Onboarding path",
      copy: "Link providers, verify the wallet and clear the first steps.",
      live: snapshot.lane === "onboarding",
      icon: ShieldCheck,
      accent: "cyan" as RouteAccent,
    },
    {
      href: "/community",
      eyebrow: "Momentum",
      label: "Active path",
      copy: "Recognition, live missions and reward pressure stay here.",
      live: snapshot.lane === "active",
      icon: Flame,
      accent: "lime" as RouteAccent,
    },
    {
      href: "/community/comeback",
      eyebrow: "Re-entry",
      label: "Comeback path",
      copy: "Signals and reactivation nudges stay out of the full backlog.",
      live: snapshot.lane === "comeback",
      icon: Radar,
      accent: "amber" as RouteAccent,
    },
  ];

  const quickLinks = [
    {
      href: "/notifications",
      label: "Signals",
      meta: `${snapshot.unreadSignals} unread`,
      icon: Bell,
    },
    {
      href: "/rewards",
      label: "Rewards",
      meta: `${snapshot.claimableRewards} claimable`,
      icon: Trophy,
    },
    {
      href: snapshot.projectId ? `/projects/${snapshot.projectId}` : "/projects",
      label: "Project space",
      meta: snapshot.projectName,
      icon: UsersRound,
    },
  ];

  const commandStats = [
    { label: "Recognition", value: snapshot.recognitionLabel },
    { label: "Lane", value: getLaneLabel(snapshot.lane) },
    { label: "Trust", value: String(snapshot.trustScore) },
    { label: "Streak", value: `${snapshot.streakDays}d` },
  ];

  const missionHighlights = snapshot.missionLane.slice(0, 3);
  const displayHeadline = snapshot.projectId
    ? snapshot.headline
    : "Find your strongest community lane.";
  const displayCopy = snapshot.projectId
    ? snapshot.supportingCopy
    : "Scan onboarding, momentum, recognition and rewards from one focused command surface before you choose where to participate.";
  const primaryRoute = accountReady
    ? snapshot.nextBestAction?.route ?? getLaneHref(snapshot.lane)
    : "/sign-in";
  const primaryCta = accountReady
    ? snapshot.nextBestAction?.ctaLabel ?? "Open journey"
    : "Access workspace";

  return (
    <div className="relative overflow-hidden pb-4">
      <div className="pointer-events-none absolute inset-x-[-8%] top-[-12rem] h-[30rem] bg-[linear-gradient(115deg,rgba(34,211,238,0.09),transparent_30%),linear-gradient(90deg,transparent,rgba(190,255,74,0.075)_58%,transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.017)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.017)_1px,transparent_1px)] bg-[size:74px_74px] opacity-35 [mask-image:linear-gradient(180deg,black,transparent_70%)]" />

      <div className="relative space-y-5">
        <section className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(135deg,rgba(10,18,23,0.94),rgba(5,7,11,0.99)_56%,rgba(12,9,22,0.94))] px-4 py-5 shadow-[0_26px_96px_rgba(0,0,0,0.3)] sm:px-5 lg:px-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-300/45 via-lime-300/28 to-transparent" />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/14 bg-cyan-300/[0.08] text-cyan-200">
                  <Orbit className="h-[18px] w-[18px]" />
                </div>
                <StatusChip label={snapshot.projectName} tone="info" />
                <StatusChip label={snapshot.recognitionLabel} tone="positive" />
                <StatusChip label={getLaneLabel(snapshot.lane)} tone="default" />
                {refreshing ? <StatusChip label="Refreshing" tone="info" /> : null}
              </div>

              <h1 className="mt-5 max-w-5xl text-4xl font-black leading-[0.94] tracking-normal text-white sm:text-5xl lg:text-6xl">
                {displayHeadline}
              </h1>
              <p className="mt-4 max-w-3xl text-[13px] leading-6 text-slate-300 sm:text-[14px]">
                {displayCopy}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={primaryRoute}
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#BEFF4A,#7DFFB2)] px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.12em] text-slate-950 shadow-[0_16px_42px_rgba(190,255,74,0.2)] transition hover:brightness-105"
                >
                  {primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={snapshot.projectId ? `/projects/${snapshot.projectId}` : "/projects"}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.12em] text-white transition hover:border-cyan-300/18 hover:bg-white/[0.06]"
                >
                  Open project
                  <UsersRound className="h-4 w-4 text-cyan-200" />
                </Link>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {commandStats.map((stat) => (
                <div key={stat.label} className="border-l border-white/8 px-3.5 py-2.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-1.5 text-sm font-black text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_25.5rem] xl:items-start">
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              {routeCards.map((route) => (
                <CommunityRouteCard key={route.href} route={route} />
              ))}
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)_52%,rgba(0,0,0,0.18))] p-4 shadow-[0_22px_76px_rgba(0,0,0,0.24)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-lime-300/42 via-cyan-200/14 to-transparent" />
              <SectionHeading
                eyebrow="Priority routes"
                title="Keep one community move in focus."
                description="The current lane stays compact, readable and tied to the project context."
              />

              <div className="mt-4 grid gap-3 xl:grid-cols-3">
                {missionHighlights.length > 0 ? (
                  missionHighlights.map((item, index) => (
                    <Link
                      key={item.key}
                      href={item.route}
                      className="group relative min-h-[12rem] overflow-hidden rounded-[22px] border border-white/7 bg-black/22 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/18 hover:bg-white/[0.035]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-lime-300/12 bg-lime-300/[0.07] text-lime-200">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <StatusChip
                          label={item.completed ? "Done" : item.locked ? "Locked" : item.priority}
                          tone={item.completed ? "positive" : item.locked ? "warning" : item.priority === "critical" ? "warning" : item.priority === "high" ? "info" : "default"}
                        />
                      </div>
                      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Route {index + 1}
                      </p>
                      <p className="mt-2 text-base font-black text-white">{item.label}</p>
                      <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-slate-400">
                        {item.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-white/7 pt-3">
                        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">
                          Open route
                        </span>
                        <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <CommunityNotice
                    text={loading ? "Loading live mission routes..." : "Join a project world to arm the first community route."}
                    compact
                  />
                )}
              </div>
            </div>
          </div>

          <CommunityAssetRail snapshot={snapshot} quickLinks={quickLinks} />
        </section>

        <CommunityRecognitionStrip snapshot={snapshot} />

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
    </div>
  );
}

function CommunityRouteCard({
  route,
}: {
  route: {
    href: string;
    eyebrow: string;
    label: string;
    copy: string;
    live: boolean;
    icon: typeof ShieldCheck;
    accent: RouteAccent;
  };
}) {
  const Icon = route.icon;
  const accent = routeAccentClasses[route.accent];

  return (
    <Link
      href={route.href}
      className="group relative min-h-[12.5rem] overflow-hidden rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)_56%,rgba(0,0,0,0.18))] p-4 shadow-[0_18px_64px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-white/13 hover:bg-white/[0.055]"
    >
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent.line} to-transparent`} />
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${accent.icon}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
      </div>
      <p className={`mt-4 text-[9px] font-black uppercase tracking-[0.22em] ${accent.label}`}>
        {route.eyebrow}
      </p>
      <h3 className="mt-2 text-[1.08rem] font-black tracking-normal text-white">
        {route.label}
      </h3>
      <p className="mt-2 text-[12px] leading-5 text-slate-400">{route.copy}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/24 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-slate-300">
          <span className={`h-1.5 w-1.5 rounded-full ${route.live ? "bg-lime-300" : "bg-white/22"}`} />
          {route.live ? "Live now" : "Available"}
        </span>
      </div>
    </Link>
  );
}

function CommunityAssetRail({
  snapshot,
  quickLinks,
}: {
  snapshot: LiveCommunityJourneySnapshot;
  quickLinks: Array<{
    href: string;
    label: string;
    meta: string;
    icon: typeof Bell;
  }>;
}) {
  return (
    <aside className="relative overflow-hidden rounded-[26px] border border-white/8 bg-[radial-gradient(circle_at_100%_0%,rgba(190,255,74,0.1),transparent_32%),linear-gradient(180deg,rgba(13,16,18,0.98),rgba(7,9,12,0.995))] p-4 shadow-[0_22px_74px_rgba(0,0,0,0.26)] xl:sticky xl:top-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-lime-300/45 via-cyan-200/16 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
            Community assets
          </p>
          <h3 className="mt-2 text-[1.05rem] font-black tracking-normal text-white">
            {snapshot.projectName}
          </h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-lime-300/14 bg-lime-300/10 text-lime-200">
          <Crown className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <JourneyMetric label="Recognition" value={snapshot.recognitionLabel} icon={Sparkles} />
        <JourneyMetric label="Trust" value={String(snapshot.trustScore)} icon={Trophy} />
        <JourneyMetric label="Wallet" value={snapshot.walletVerified ? "Verified" : "Pending"} icon={Wallet} />
        <JourneyMetric label="Signals" value={String(snapshot.unreadSignals)} icon={Radar} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniStat label="Providers" value={String(snapshot.linkedProvidersCount)} />
        <MiniStat label="Joined" value={String(snapshot.joinedProjectsCount)} />
        <MiniStat label="Streak" value={String(snapshot.streakDays)} />
        <MiniStat label="Level" value={String(snapshot.level)} />
      </div>

      <div className="mt-4 grid gap-2">
        {quickLinks.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center justify-between gap-3 rounded-[17px] border border-white/7 bg-black/20 px-3 py-3 transition hover:border-white/12 hover:bg-white/[0.045]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.035] text-slate-300">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-black text-white">{link.label}</p>
                  <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    {link.meta}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-white" />
            </Link>
          );
        })}
      </div>
    </aside>
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
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
        <h3 className="mt-2 text-[1.08rem] font-black tracking-normal text-white sm:text-[1.18rem]">
          {title}
        </h3>
        <p className="mt-1.5 text-[12px] leading-5 text-slate-400">{description}</p>
      </div>
      <span className="mt-1 hidden h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.035] text-slate-400 sm:inline-flex">
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </div>
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
    <div className="flex items-center justify-between gap-3 rounded-[15px] border border-white/7 bg-white/[0.03] px-3 py-2.5">
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="text-[11px] font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[15px] border border-white/7 bg-black/20 px-3 py-2.5">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-[11px] font-black text-white">{value}</p>
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
