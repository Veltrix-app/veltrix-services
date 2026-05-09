"use client";

import Image from "next/image";
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
  type LucideIcon,
  UsersRound,
  Wallet,
} from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuth } from "@/components/providers/auth-provider";
import { useCommunityJourney } from "@/hooks/use-community-journey";
import { CommunityStatusPanel } from "@/components/community/community-status-panel";
import { CommunityMissionLane } from "@/components/community/community-mission-lane";
import { CommunityRecognitionStrip } from "@/components/community/community-recognition-strip";
import { ContributionTierBadge } from "@/components/ui/contribution-tier-badge";
import { FeatureBadgeMark, type FeatureBadgeName } from "@/components/ui/feature-badge-mark";
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
      badge: "profile" as FeatureBadgeName,
    },
    {
      href: "/community",
      eyebrow: "Momentum",
      label: "Active path",
      copy: "Recognition, live missions and reward pressure stay here.",
      live: snapshot.lane === "active",
      icon: Flame,
      accent: "lime" as RouteAccent,
      badge: "reputation" as FeatureBadgeName,
    },
    {
      href: "/community/comeback",
      eyebrow: "Re-entry",
      label: "Comeback path",
      copy: "Signals and reactivation nudges stay out of the full backlog.",
      live: snapshot.lane === "comeback",
      icon: Radar,
      accent: "amber" as RouteAccent,
      badge: "quest" as FeatureBadgeName,
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
    { label: "Recognition", value: snapshot.recognitionLabel, icon: Crown, accent: "text-lime-200" },
    { label: "Lane", value: getLaneLabel(snapshot.lane), icon: Orbit, accent: "text-cyan-200" },
    { label: "Trust", value: `${snapshot.trustScore}/100`, icon: ShieldCheck, accent: "text-white" },
    { label: "Streak", value: `${snapshot.streakDays}d`, icon: Flame, accent: "text-amber-200" },
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
        <section className="motion-surface motion-light-sweep relative min-h-[29rem] overflow-hidden rounded-[34px] border border-white/8 bg-[#05070b] p-4 shadow-[0_34px_118px_rgba(0,0,0,0.42)] sm:p-5 lg:p-6">
          <Image
            src="/assets/community/community-hero-background.webp"
            alt=""
            fill
            priority
            unoptimized
            sizes="(min-width: 1280px) 1180px, 100vw"
            className="pointer-events-none object-cover object-center opacity-[0.88] saturate-125 [mask-image:linear-gradient(90deg,black_0%,black_100%)]"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.12),transparent_32%),radial-gradient(circle_at_18%_74%,rgba(45,212,191,0.13),transparent_34%),linear-gradient(90deg,rgba(4,7,10,0.97)_0%,rgba(5,8,12,0.86)_38%,rgba(5,6,10,0.5)_64%,rgba(4,5,8,0.72)_100%)]" />
          <div className="motion-ambient-grid opacity-[0.16]" />
          <div className="motion-shard-field opacity-75">
            <span />
            <span />
            <span />
          </div>
          <FeatureBadgeMark
            badge="reputation"
            priority
            className="absolute -right-8 bottom-[-5.75rem] h-40 w-40 opacity-[0.38] mix-blend-screen sm:h-52 sm:w-52 lg:right-[23rem] xl:right-[28rem]"
            imageClassName="drop-shadow-[0_0_52px_rgba(168,85,247,0.44)]"
            sizes="224px"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-300/45 via-lime-300/28 to-transparent" />
          <div className="relative z-10 grid min-h-[25.5rem] gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center xl:grid-cols-[minmax(0,1fr)_25rem]">
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

              <h1 className="mt-5 max-w-5xl text-4xl font-black leading-[0.94] tracking-normal text-white sm:text-5xl xl:text-6xl">
                {displayHeadline}
              </h1>
              <p className="mt-4 max-w-3xl text-[13px] leading-6 text-slate-300 sm:text-[14px]">
                {displayCopy}
              </p>

              <div className="mt-7 grid max-w-4xl gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {commandStats.map((stat) => (
                  <HeroMetricCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                    accent={stat.accent}
                  />
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={primaryRoute}
                  className="motion-button-glow motion-press inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#BEFF4A,#7DFFB2)] px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.12em] text-slate-950 shadow-[0_16px_42px_rgba(190,255,74,0.2)] transition hover:brightness-105"
                >
                  {primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={snapshot.projectId ? `/projects/${snapshot.projectId}` : "/projects"}
                  className="motion-press inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.12em] text-white transition hover:border-cyan-300/18 hover:bg-white/[0.06]"
                >
                  Open project
                  <UsersRound className="h-4 w-4 text-cyan-200" />
                </Link>
              </div>
            </div>

            <aside className="motion-surface relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,13,18,0.72),rgba(5,7,11,0.88))] p-4 shadow-[0_26px_88px_rgba(0,0,0,0.34)] backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-lime-300/50 via-cyan-300/18 to-transparent" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
                    Member command
                  </p>
                  <h2 className="mt-2 text-xl font-black text-white">
                    {snapshot.readinessLabel}
                  </h2>
                </div>
                <ContributionTierBadge tier={snapshot.recognitionLabel} size="md" />
              </div>

              <div className="mt-4 rounded-[22px] border border-white/8 bg-black/25 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Trust posture
                  </span>
                  <span className="text-sm font-black text-white">{snapshot.trustScore}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-lime-300 to-violet-300"
                    style={{ width: `${Math.max(5, Math.min(100, snapshot.trustScore))}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <MiniStat label="Providers" value={String(snapshot.linkedProvidersCount)} />
                <MiniStat label="Signals" value={String(snapshot.unreadSignals)} />
                <MiniStat label="Claims" value={String(snapshot.claimableRewards)} />
                <MiniStat label="Open" value={String(snapshot.openMissionCount)} />
              </div>

              <div className="mt-3 rounded-[22px] border border-lime-300/13 bg-lime-300/[0.055] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-200">
                  Next useful move
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white">
                  {snapshot.nextBestAction?.description ?? snapshot.nextUnlockLabel}
                </p>
                <Link
                  href={primaryRoute}
                  className="motion-press mt-4 inline-flex items-center gap-2 rounded-full border border-lime-300/18 bg-lime-300/12 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-lime-100 transition hover:bg-lime-300/18"
                >
                  {primaryCta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </aside>
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
                      className="motion-surface motion-3d-card motion-light-sweep group relative min-h-[12rem] overflow-hidden rounded-[22px] border border-white/7 bg-black/22 p-4 transition duration-300 hover:border-cyan-300/18 hover:bg-white/[0.035]"
                    >
                      <div className="motion-ambient-grid opacity-[0.08]" />
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

function HeroMetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className="motion-surface relative overflow-hidden rounded-[18px] border border-white/8 bg-black/28 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-md">
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <span>{label}</span>
      </div>
      <p className={`mt-2 truncate text-[13px] font-black ${accent}`}>{value}</p>
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
    icon: LucideIcon;
    accent: RouteAccent;
    badge: FeatureBadgeName;
  };
}) {
  const Icon = route.icon;
  const accent = routeAccentClasses[route.accent];

  return (
    <Link
      href={route.href}
      className="motion-surface motion-3d-card motion-light-sweep group relative min-h-[12.5rem] overflow-hidden rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)_56%,rgba(0,0,0,0.18))] p-4 shadow-[0_18px_64px_rgba(0,0,0,0.22)] transition duration-300 hover:border-white/13 hover:bg-white/[0.055]"
    >
      <div className="motion-ambient-grid opacity-[0.08]" />
      <FeatureBadgeMark
        badge={route.badge}
        className="absolute -right-8 bottom-[-2.6rem] h-32 w-32 opacity-[0.5] mix-blend-screen transition duration-300 group-hover:opacity-[0.72]"
        sizes="128px"
      />
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent.line} to-transparent`} />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${accent.icon}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
      </div>
      <p className={`relative z-10 mt-4 text-[9px] font-black uppercase tracking-[0.22em] ${accent.label}`}>
        {route.eyebrow}
      </p>
      <h3 className="relative z-10 mt-2 text-[1.08rem] font-black tracking-normal text-white">
        {route.label}
      </h3>
      <p className="relative z-10 mt-2 text-[12px] leading-5 text-slate-400">{route.copy}</p>
      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
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
    icon: LucideIcon;
  }>;
}) {
  return (
    <aside className="motion-surface motion-light-sweep relative overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_100%_0%,rgba(190,255,74,0.12),transparent_32%),linear-gradient(180deg,rgba(13,16,18,0.98),rgba(7,9,12,0.995))] p-4 shadow-[0_24px_82px_rgba(0,0,0,0.3)] xl:sticky xl:top-4">
      <div className="motion-ambient-grid opacity-[0.09]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 overflow-hidden">
        <Image
          src="/assets/project-world/your-standing.webp"
          alt=""
          fill
          unoptimized
          sizes="420px"
          className="object-cover object-[56%_36%] opacity-[0.28] saturate-125 [mask-image:linear-gradient(180deg,black,transparent_92%)]"
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-lime-300/45 via-cyan-200/16 to-transparent" />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
            Member signal
          </p>
          <h3 className="mt-2 text-[1.05rem] font-black tracking-normal text-white">
            {snapshot.projectName}
          </h3>
        </div>
        <ContributionTierBadge tier={snapshot.recognitionLabel} size="sm" />
      </div>

      <div className="relative z-10 mt-4 rounded-[22px] border border-white/8 bg-black/28 p-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Readiness
          </span>
          <span className="text-[11px] font-black uppercase tracking-[0.14em] text-lime-200">
            {getLaneLabel(snapshot.lane)}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold leading-6 text-white">
          {snapshot.contributionStatus}
        </p>
      </div>

      <div className="relative z-10 mt-4 grid gap-2">
        <JourneyMetric label="Recognition" value={snapshot.recognitionLabel} icon={Sparkles} />
        <JourneyMetric label="Trust" value={String(snapshot.trustScore)} icon={Trophy} />
        <JourneyMetric label="Wallet" value={snapshot.walletVerified ? "Verified" : "Pending"} icon={Wallet} />
        <JourneyMetric label="Signals" value={String(snapshot.unreadSignals)} icon={Radar} />
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-2 gap-2">
        <MiniStat label="Providers" value={String(snapshot.linkedProvidersCount)} />
        <MiniStat label="Joined" value={String(snapshot.joinedProjectsCount)} />
        <MiniStat label="Streak" value={String(snapshot.streakDays)} />
        <MiniStat label="Level" value={String(snapshot.level)} />
      </div>

      <div className="relative z-10 mt-4 grid gap-2">
        {quickLinks.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className="motion-press group flex items-center justify-between gap-3 rounded-[17px] border border-white/7 bg-black/24 px-3 py-3 transition hover:border-white/12 hover:bg-white/[0.045]"
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
  icon: LucideIcon;
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
