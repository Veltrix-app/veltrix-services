"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Coins,
  Crown,
  ExternalLink,
  Gift,
  Gem,
  Globe2,
  LineChart,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Users,
  WalletCards,
} from "lucide-react";
import { ProjectBenchmarkCard } from "@/components/analytics/project-benchmark-card";
import { ArtworkImage } from "@/components/ui/artwork-image";
import { ContributionTierBadge } from "@/components/ui/contribution-tier-badge";
import { StatusChip } from "@/components/ui/status-chip";
import { XpValue, isXpDisplay } from "@/components/ui/xp-badge";
import { useLiveUserData } from "@/hooks/use-live-user-data";
import {
  buildProjectShowcase,
  type ProjectShowcaseContractScanEnrichment,
  type ProjectShowcaseModel,
  type ProjectShowcasePremiumModule,
  type ProjectShowcaseScanSeverity,
  type ProjectShowcaseModule,
  type ProjectShowcaseStatus,
} from "@/lib/projects/project-showcase";
import type { ProjectSwapTokenRegistryEntry } from "@/lib/defi/vyntro-swap";
import type { ProjectTokenPriceSnapshot } from "@/lib/defi/vyntro-prices";
import type {
  LiveCampaign,
  LiveRaid,
  LiveProject,
  LiveProjectReputation,
  LiveQuest,
  LiveReward,
} from "@/types/live";

type ProjectShowcaseMarketPayload = {
  ok?: boolean;
  projectSwapTokens?: ProjectSwapTokenRegistryEntry[];
  tokenPrice?: ProjectTokenPriceSnapshot | null;
  contractScanEnrichment?: ProjectShowcaseContractScanEnrichment | null;
};

type ProjectShowcaseMarketPayloadState = {
  projectId: string;
  payload: ProjectShowcaseMarketPayload;
};

type PublicProjectPayload = {
  ok?: boolean;
  project?: LiveProject;
  campaigns?: LiveCampaign[];
  quests?: LiveQuest[];
  rewards?: LiveReward[];
  raids?: LiveRaid[];
  error?: string;
};

type PublicProjectState = {
  projectId: string | null;
  loading: boolean;
  error: string | null;
  payload: PublicProjectPayload | null;
};

function getStatusTone(status: ProjectShowcaseStatus) {
  if (status === "live") return "positive" as const;
  if (status === "ready") return "info" as const;
  return "warning" as const;
}

function getStatusLabel(status: ProjectShowcaseStatus) {
  if (status === "live") return "Live";
  if (status === "ready") return "Ready";
  return "Setup";
}

function getScanSeverityTone(severity: ProjectShowcaseScanSeverity) {
  if (severity === "positive") return "positive" as const;
  if (severity === "info") return "info" as const;
  return "warning" as const;
}

function getScanSeverityLabel(severity: ProjectShowcaseScanSeverity) {
  if (severity === "positive") return "Pass";
  if (severity === "info") return "Info";
  if (severity === "danger") return "Risk";
  return "Watch";
}

function getScanRiskTone(riskLevel: string) {
  if (riskLevel === "low") return "positive" as const;
  if (riskLevel === "medium") return "info" as const;
  return "warning" as const;
}

function getScanRiskLabel(riskLevel: string) {
  if (riskLevel === "low") return "Low risk";
  if (riskLevel === "medium") return "Medium risk";
  if (riskLevel === "high") return "High risk";
  return "Unknown";
}

function getProjectMetric(
  metrics: Array<{ label: string; value: string; sub: string }>,
  label: string,
  fallback: string
) {
  return metrics.find((metric) => metric.label === label)?.value ?? fallback;
}

function formatTokenMove(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Pending";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function shortenMiddle(value: string | null | undefined) {
  if (!value) return "Pending";
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function toBackgroundImage(value: string) {
  return `url("${value.replaceAll('"', '\\"')}")`;
}

export function ProjectDetailScreen() {
  const params = useParams<{ id: string }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;
  const {
    loading,
    error,
    projects,
    campaigns,
    quests,
    rewards,
    raids,
    projectReputation,
  } = useLiveUserData({
    datasets: ["projects", "campaigns", "quests", "rewards", "raids", "projectReputation"],
  });
  const [marketPayloadState, setMarketPayloadState] =
    useState<ProjectShowcaseMarketPayloadState | null>(null);
  const [publicProjectState, setPublicProjectState] = useState<PublicProjectState>({
    projectId: null,
    loading: true,
    error: null,
    payload: null,
  });

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const currentProjectId = projectId;
    let cancelled = false;

    async function loadPublicProject() {
      const response = await fetch(
        `/api/public/projects/${encodeURIComponent(currentProjectId)}`,
        {
          cache: "no-store",
        }
      );
      const payload = (await response.json().catch(() => null)) as PublicProjectPayload | null;

      if (cancelled) {
        return;
      }

      if (!response.ok || !payload?.ok || !payload.project) {
        setPublicProjectState({
          projectId: currentProjectId,
          loading: false,
          error: payload?.error ?? "Public project could not be loaded.",
          payload: null,
        });
        return;
      }

      setPublicProjectState({
        projectId: currentProjectId,
        loading: false,
        error: null,
        payload,
      });
    }

    void loadPublicProject().catch((loadError) => {
      if (cancelled) {
        return;
      }

      setPublicProjectState({
        projectId: currentProjectId,
        loading: false,
        error: loadError instanceof Error ? loadError.message : "Public project could not be loaded.",
        payload: null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const liveProject = projects.find((item) => item.id === projectId);
  const publicPayload =
    publicProjectState.projectId === projectId ? publicProjectState.payload : null;
  const publicProjectLoading = publicProjectState.projectId !== projectId || publicProjectState.loading;
  const publicProject = publicPayload?.project ?? null;
  const project = useMemo(
    () =>
      liveProject && publicProject
        ? {
            ...liveProject,
            ...publicProject,
          }
        : publicProject ?? liveProject,
    [liveProject, publicProject]
  );
  const showcaseCampaigns = liveProject ? campaigns : (publicPayload?.campaigns ?? campaigns);
  const showcaseQuests = liveProject ? quests : (publicPayload?.quests ?? quests);
  const showcaseRewards = liveProject ? rewards : (publicPayload?.rewards ?? rewards);
  const showcaseRaids = liveProject ? raids : (publicPayload?.raids ?? raids);
  const marketPayload =
    marketPayloadState && marketPayloadState.projectId === project?.id
      ? marketPayloadState.payload
      : null;

  useEffect(() => {
    if (!project?.id) {
      return;
    }

    const currentProjectId = project.id;
    let cancelled = false;

    async function loadMarketPayload() {
      const response = await fetch(`/api/projects/${encodeURIComponent(currentProjectId)}/showcase-market`);
      const payload = (await response.json().catch(() => null)) as ProjectShowcaseMarketPayload | null;

      if (!cancelled && response.ok && payload?.ok) {
        setMarketPayloadState({ projectId: currentProjectId, payload });
      }
    }

    void loadMarketPayload().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  const showcase = useMemo(() => {
    if (!project) return null;

    return buildProjectShowcase({
      project,
      campaigns: showcaseCampaigns,
      quests: showcaseQuests,
      rewards: showcaseRewards,
      raids: showcaseRaids,
      projectSwapTokens: marketPayload?.projectSwapTokens,
      tokenPrice: marketPayload?.tokenPrice,
      contractScanEnrichment: marketPayload?.contractScanEnrichment,
    });
  }, [marketPayload, project, showcaseCampaigns, showcaseQuests, showcaseRaids, showcaseRewards]);
  const reputation = projectReputation.find((item) => item.projectId === projectId);

  if (!project && (loading || publicProjectLoading)) {
    return <Notice tone="default" text="Loading project..." />;
  }
  if (!project && error) return <Notice tone="error" text={error} />;
  if (!project && publicProjectState.error) {
    return <Notice tone="error" text={publicProjectState.error} />;
  }
  if (!project || !showcase) return <Notice tone="default" text="Project not found." />;

  const projectCampaignIds = new Set(
    showcaseCampaigns.filter((campaign) => campaign.projectId === project.id).map((campaign) => campaign.id)
  );
  const projectQuests = showcaseQuests
    .filter(
      (quest) =>
        quest.projectId === project.id ||
        (quest.campaignId ? projectCampaignIds.has(quest.campaignId) : false)
    )
    .slice(0, 4);
  const projectRaids = showcaseRaids
    .filter(
      (raid) =>
        raid.projectId === project.id ||
        (raid.campaignId ? projectCampaignIds.has(raid.campaignId) : false)
    )
    .slice(0, 4);
  const projectRewards = showcaseRewards
    .filter(
      (reward) =>
        reward.projectId === project.id ||
        (reward.campaignId ? projectCampaignIds.has(reward.campaignId) : false)
    )
    .slice(0, 4);
  const projectCampaignRows = showcaseCampaigns
    .filter((campaign) => campaign.projectId === project.id)
    .sort(
      (left, right) =>
        Number(right.featured) - Number(left.featured) ||
        right.xpBudget - left.xpBudget ||
        right.completionRate - left.completionRate
    )
    .slice(0, 3);
  const contributorRows = projectReputation
    .filter((item) => item.projectId === project.id)
    .sort((left, right) => right.xp - left.xp || right.trustScore - left.trustScore)
    .slice(0, 3);
  const memberCount = getProjectMetric(showcase.metrics, "Members", String(project.members));
  const questCount = getProjectMetric(showcase.metrics, "Quests", String(projectQuests.length));
  const rewardCount = getProjectMetric(showcase.metrics, "Rewards", String(projectRewards.length));
  const tokenMove = formatTokenMove(showcase.token.price?.priceChange24hPercent);
  const worldThemeStyle = showcase.worldTheme.cssVars as CSSProperties;

  return (
    <div className="project-world-theme space-y-4" style={worldThemeStyle}>
      <section className="motion-surface motion-light-sweep relative overflow-hidden rounded-[34px] border border-[var(--project-world-border)] bg-[#05080b] shadow-[0_32px_110px_rgba(0,0,0,0.38),0_0_80px_var(--project-world-glow)]">
        {showcase.heroImageUrl ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.98] brightness-110 contrast-110 saturate-125"
            style={{ backgroundImage: toBackgroundImage(showcase.heroImageUrl) }}
          />
        ) : null}
        <div className="absolute inset-0 bg-[image:var(--project-world-hero)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#050608] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[image:var(--project-world-line)]" />
        <div className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-[rgb(var(--project-world-primary)/0.18)] blur-3xl" />
        <div className="pointer-events-none absolute -left-28 bottom-16 h-72 w-72 rounded-full bg-[rgb(var(--project-world-secondary)/0.12)] blur-3xl" />

        <div className="relative z-10 grid min-h-[620px] gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_410px] xl:items-end">
          <div className="max-w-4xl self-end pb-2">
            <div className="flex flex-wrap items-center gap-3">
              <LogoMark project={project} size="hero" themed />
              <div className="flex flex-wrap gap-2">
                {showcase.badges.map((badge) => (
                  <StatusChip key={badge} label={badge} tone="info" />
                ))}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--project-world-border)] bg-[rgb(var(--project-world-primary)/0.12)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[rgb(var(--project-world-primary))]">
                  <Sparkles className="h-3 w-3" />
                  {showcase.worldTheme.label}
                </span>
              </div>
            </div>

            <h1 className="mt-8 max-w-[11ch] text-[clamp(3.25rem,7vw,7.4rem)] font-black leading-[0.86] text-white [text-shadow:0_18px_70px_rgba(0,0,0,0.72)]">
              {showcase.headline}
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-200 sm:text-[1rem]">
              {showcase.story}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/communities/${project.id}`}
                className="motion-press inline-flex items-center gap-2 rounded-full bg-[rgb(var(--project-world-primary))] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-110"
              >
                <Users className="h-4 w-4" />
                Join community
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={showcase.token.swapHref}
                className="motion-press inline-flex items-center gap-2 rounded-full border border-[var(--project-world-border)] bg-[rgb(var(--project-world-secondary)/0.08)] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl transition hover:bg-[rgb(var(--project-world-secondary)/0.14)]"
              >
                Open swap
                <Coins className="h-4 w-4" />
              </Link>
            </div>

            {showcase.socialLinks.length > 0 ? (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Follow
                </span>
                {showcase.socialLinks.slice(0, 5).map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="motion-press inline-flex items-center gap-2 rounded-full border border-[var(--project-world-border)] bg-black/30 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200 transition hover:bg-[rgb(var(--project-world-primary)/0.1)] hover:text-white"
                  >
                    {link.label}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <WorldStatusPanel
            showcaseScore={showcase.readinessScore}
            themeLabel={showcase.worldTheme.signature}
            nextAction={showcase.nextAction}
            tokenLabel={showcase.token.label}
            tokenPrice={showcase.token.price?.formattedPrice ?? "Pending"}
            tokenMove={tokenMove}
            trustScore={`${showcase.contractScan.score}/100`}
            trustLabel={getScanRiskLabel(showcase.contractScan.riskLevel)}
            members={memberCount}
            quests={questCount}
          />
        </div>
      </section>

      <section className="motion-surface rounded-[28px] border border-[var(--project-world-border)] bg-[var(--project-world-panel)] p-2 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          <WorldRouteLink href="#story" icon={<BookOpen className="h-5 w-5" />} label="Story" detail="Lore and identity" active />
          <WorldRouteLink href="#market" icon={<LineChart className="h-5 w-5" />} label="Market" detail="Token route" />
          <WorldRouteLink href="#missions" icon={<Target className="h-5 w-5" />} label="Missions" detail="Quest lane" />
          <WorldRouteLink href={projectRaids[0] ? `/raids/${projectRaids[0].id}` : "/raids"} icon={<Swords className="h-5 w-5" />} label="Raids" detail="Live pushes" />
          <WorldRouteLink href="#rewards" icon={<Gift className="h-5 w-5" />} label="Rewards" detail="Vault and claims" />
          <WorldRouteLink href="#security" icon={<ShieldCheck className="h-5 w-5" />} label="Trust" detail="Scan and safety" />
        </div>
      </section>

      <PremiumProjectCommandPanel
        showcase={showcase}
        campaigns={projectCampaignRows}
        quests={projectQuests}
        rewards={projectRewards}
        raids={projectRaids}
        contributors={contributorRows}
        memberCount={memberCount}
      />

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr_0.96fr_0.96fr]">
        <MissionLaneCard
          quest={projectQuests[0] ?? null}
          questCount={questCount}
          raidCount={String(projectRaids.length)}
        />
        <RewardVaultCard reward={projectRewards[0] ?? null} rewardCount={rewardCount} />
        <TokenTrustCard
          tokenLabel={showcase.token.label}
          tokenPrice={showcase.token.price?.formattedPrice ?? "Pending"}
          tokenMove={tokenMove}
          trustScore={showcase.contractScan.score}
          trustLabel={getScanRiskLabel(showcase.contractScan.riskLevel)}
          swapHref={showcase.token.swapHref}
        />
        <StandingCard reputation={reputation} />
      </section>

      <ProjectWorldThemePanel showcase={showcase} project={project} />

      <section id="story" className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <StoryWorldPanel project={project} story={showcase.story} />
        <div className="rounded-[30px] border border-white/7 bg-[linear-gradient(180deg,rgba(13,16,20,0.9),rgba(6,8,12,0.94))] p-4 sm:p-5">
          <SectionKicker icon={<Activity className="h-4 w-4" />} label="World systems" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {showcase.premiumModules.map((module) => (
              <PremiumModuleWorldCard key={module.key} module={module} />
            ))}
          </div>
        </div>
      </section>

      <section id="market" className="grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="rounded-[30px] border border-white/7 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.11),transparent_34%),linear-gradient(180deg,rgba(13,16,20,0.9),rgba(6,8,12,0.94))] p-4 sm:p-5">
          <SectionKicker icon={<WalletCards className="h-4 w-4" />} label="Token route" />
          <h2 className="mt-4 text-2xl font-black text-white">
            {showcase.token.configured ? `${showcase.token.label} market layer` : "Token route pending"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Project token context, live price, explorer route and swap intent stay visible before members move.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoTile icon={<Coins className="h-4 w-4" />} label="Price" value={showcase.token.price?.formattedPrice ?? "Price pending"} href={showcase.token.price?.pairUrl} />
            <InfoTile icon={<Activity className="h-4 w-4" />} label="24h" value={tokenMove} />
            <InfoTile icon={<Globe2 className="h-4 w-4" />} label="Explorer" value={showcase.token.explorerUrl ? "Available" : "Pending chain route"} href={showcase.token.explorerUrl} />
            <InfoTile icon={<WalletCards className="h-4 w-4" />} label="Contract" value={shortenMiddle(showcase.token.contractAddress)} />
          </div>
        </div>

        <TrustScanPanel showcase={showcase} />
      </section>

      <section id="missions" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div id="rewards" className="rounded-[30px] border border-white/7 bg-[linear-gradient(180deg,rgba(13,16,20,0.9),rgba(6,8,12,0.94))] p-4 sm:p-5">
          <SectionKicker icon={<Target className="h-4 w-4" />} label="Action lanes" />
          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            <ActivationColumn
              title="Daily quests"
              emptyText="No project quests are live yet."
              items={projectQuests.map((quest) => ({
                id: quest.id,
                href: `/quests/${quest.id}`,
                title: quest.title,
                meta: `${quest.xp} XP`,
                platformQuest: quest.isPlatformQuest,
                cadence: quest.platformQuestCadence,
                shardRewardAmount: quest.shardRewardAmount,
              }))}
            />
            <ActivationColumn
              title="Raids"
              emptyText="No project raids are live yet."
              items={projectRaids.map((raid) => ({
                id: raid.id,
                href: `/raids/${raid.id}`,
                title: raid.title,
                meta: `${raid.reward} XP`,
              }))}
            />
            <ActivationColumn
              title="Rewards"
              emptyText="No project rewards are visible yet."
              items={projectRewards.map((reward) => ({
                id: reward.id,
                href: `/rewards/${reward.id}`,
                title: reward.title,
                meta: `${reward.cost} XP`,
              }))}
            />
          </div>
        </div>

        <div className="rounded-[30px] border border-white/7 bg-[linear-gradient(180deg,rgba(13,16,20,0.9),rgba(6,8,12,0.94))] p-4 sm:p-5">
          <SectionKicker icon={<BarChart3 className="h-4 w-4" />} label="World modules" />
          <div className="mt-4 space-y-3">
            {showcase.modules.map((module) => (
              <WorldSystemCard key={module.key} module={module} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/7 bg-[linear-gradient(180deg,rgba(13,16,20,0.82),rgba(6,8,12,0.9))] p-2 sm:p-3">
        <ProjectBenchmarkCard projectId={project.id} />
      </section>
    </div>
  );
}

function LogoMark({
  project,
  size = "md",
  themed = false,
}: {
  project: Pick<LiveProject, "logo" | "name">;
  size?: "md" | "hero";
  themed?: boolean;
}) {
  const rootSize =
    size === "hero"
      ? "h-20 w-20 rounded-[26px] shadow-[0_0_44px_var(--project-world-glow)]"
      : "h-12 w-12 rounded-2xl";
  const textSize = size === "hero" ? "text-2xl" : "text-sm";
  const tone = themed ? "border-[var(--project-world-border)] bg-[rgb(var(--project-world-primary)/0.09)]" : "border-white/12 bg-white/[0.055]";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border ${tone} ${rootSize}`}
    >
      {project.logo ? (
        <ArtworkImage
          src={project.logo}
          alt={`${project.name} logo`}
          tone="cyan"
          fallbackLabel={project.name.slice(0, 1)}
          imgClassName="h-full w-full object-cover"
        />
      ) : (
        <span className={`${textSize} font-black text-white`}>{project.name.slice(0, 1)}</span>
      )}
    </div>
  );
}

function SectionKicker({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--project-world-border)] bg-[rgb(var(--project-world-primary)/0.08)] text-[rgb(var(--project-world-primary))]">
        {icon}
      </span>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[rgb(var(--project-world-primary))]">
        {label}
      </p>
      <span className="h-px flex-1 bg-[image:var(--project-world-line)]" />
    </div>
  );
}

function WorldStatusPanel({
  showcaseScore,
  themeLabel,
  nextAction,
  tokenLabel,
  tokenPrice,
  tokenMove,
  trustScore,
  trustLabel,
  members,
  quests,
}: {
  showcaseScore: number;
  themeLabel: string;
  nextAction: string;
  tokenLabel: string;
  tokenPrice: string;
  tokenMove: string;
  trustScore: string;
  trustLabel: string;
  members: string;
  quests: string;
}) {
  return (
    <aside className="self-end rounded-[30px] border border-[var(--project-world-border)] bg-black/42 p-4 shadow-[0_22px_90px_rgba(0,0,0,0.42),0_0_54px_var(--project-world-glow)] backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[rgb(var(--project-world-primary))]">
            World status
          </p>
          <h2 className="mt-3 text-3xl font-black text-white">{showcaseScore}%</h2>
          <p className="mt-1 text-[11px] font-bold text-slate-400">{themeLabel}</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--project-world-border)] bg-[rgb(var(--project-world-primary)/0.08)] text-[rgb(var(--project-world-primary))]">
          <ShieldCheck className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgb(var(--project-world-primary)),rgb(var(--project-world-secondary)),rgb(var(--project-world-tertiary)))]"
          style={{ width: `${Math.max(6, Math.min(100, showcaseScore))}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <WorldStatusMetric label={tokenLabel} value={tokenPrice} sub={tokenMove} />
        <WorldStatusMetric label="Trust" value={trustScore} sub={trustLabel} />
        <WorldStatusMetric label="Members" value={members} sub="Inside world" />
        <WorldStatusMetric label="Missions" value={quests} sub="Quest pressure" />
      </div>

      <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.035] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Next move
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-white">{nextAction}</p>
      </div>
    </aside>
  );
}

function WorldStatusMetric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="min-w-0 rounded-[20px] border border-white/8 bg-white/[0.045] p-3">
      <p className="truncate text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 truncate text-xl font-black text-white">{value}</p>
      <p className="mt-1 truncate text-[11px] font-semibold text-[rgb(var(--project-world-secondary)/0.78)]">{sub}</p>
    </div>
  );
}

function ProjectWorldThemePanel({
  project,
  showcase,
}: {
  project: LiveProject;
  showcase: ProjectShowcaseModel;
}) {
  const worldSignals = [
    {
      label: "Accent",
      value: showcase.worldTheme.tone,
      detail: project.brandAccent || "Inferred from project metadata",
    },
    {
      label: "Mood",
      value: showcase.worldTheme.mood,
      detail: project.brandMood || "Generated world posture",
    },
    {
      label: "Media",
      value: showcase.worldTheme.hasCustomMedia ? "Custom" : "Generated",
      detail: showcase.worldTheme.signature,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-[var(--project-world-border)] bg-[var(--project-world-panel)] p-4 shadow-[0_22px_80px_rgba(0,0,0,0.3),0_0_60px_var(--project-world-glow)] sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--project-world-radial)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[image:var(--project-world-line)]" />
      <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-center">
        <div>
          <SectionKicker icon={<Sparkles className="h-4 w-4" />} label="Project world theme" />
          <h2 className="mt-4 max-w-3xl text-2xl font-black tracking-normal text-white sm:text-3xl">
            {project.name} now has its own visual atmosphere.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            The page theme is generated from brand accent, mood, logo and banner state, then pushed into
            the hero, route rail, command panels, status chips and world modules as one coherent project skin.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          {worldSignals.map((signal) => (
            <div
              key={signal.label}
              className="rounded-[22px] border border-white/7 bg-black/24 p-4"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                {signal.label}
              </p>
              <p className="mt-2 truncate text-base font-black capitalize text-white">
                {signal.value}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[rgb(var(--project-world-secondary)/0.8)]">
                {signal.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PremiumProjectCommandPanel({
  showcase,
  campaigns,
  quests,
  rewards,
  raids,
  contributors,
  memberCount,
}: {
  showcase: ProjectShowcaseModel;
  campaigns: LiveCampaign[];
  quests: LiveQuest[];
  rewards: LiveReward[];
  raids: LiveRaid[];
  contributors: LiveProjectReputation[];
  memberCount: string;
}) {
  const shardQuests = quests.filter((quest) => Math.max(0, quest.shardRewardAmount ?? 0) > 0);

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/7 bg-[radial-gradient(circle_at_6%_0%,rgba(34,211,238,0.13),transparent_30%),radial-gradient(circle_at_94%_18%,rgba(190,255,74,0.1),transparent_28%),linear-gradient(145deg,rgba(12,15,20,0.96),rgba(5,7,11,0.98))] p-4 shadow-[0_24px_84px_rgba(0,0,0,0.32)] sm:p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip label={showcase.premiumCommand.statusLabel} tone="positive" />
            <StatusChip label={`${showcase.readinessScore}% showcase`} tone="info" />
            <StatusChip label={`+${showcase.premiumCommand.shardRewardTotal} shards`} tone="warning" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
            Premium project command
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {showcase.premiumCommand.statusDetail}
          </p>
        </div>

        <Link
          href={showcase.premiumCommand.nextAction.href}
          className="motion-press rounded-[24px] border border-lime-300/18 bg-lime-300/[0.075] p-4 transition hover:border-lime-300/30 xl:w-[340px]"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-200">
            {showcase.premiumCommand.nextAction.label}
          </p>
          <p className="mt-2 line-clamp-2 text-base font-black leading-6 text-white">
            {showcase.premiumCommand.nextAction.title}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100">
              {showcase.premiumCommand.nextAction.meta}
            </span>
            <ArrowRight className="h-4 w-4 text-white/70" />
          </div>
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {showcase.premiumCommand.heroStats.map((stat) => (
          <SmallStat key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
        <PremiumStack
          icon={<LineChart className="h-4 w-4" />}
          title="Active campaigns"
          emptyText="No active project campaigns yet."
          items={campaigns.map((campaign) => ({
            id: campaign.id,
            href: `/campaigns/${campaign.id}`,
            title: campaign.title,
            meta: `${campaign.completionRate}% complete`,
            badge: `${campaign.xpBudget} XP`,
          }))}
        />
        <PremiumStack
          icon={<Gem className="h-4 w-4" />}
          title="Shard reward routes"
          emptyText="No shard routes are attached to this project yet."
          items={shardQuests.map((quest) => ({
            id: quest.id,
            href: `/quests/${quest.id}`,
            title: quest.title,
            meta: quest.platformQuestCadence ?? quest.shardRewardWindow ?? "quest",
            badge: `+${quest.shardRewardAmount ?? 0}`,
          }))}
        />
        <div className="rounded-[24px] border border-white/7 bg-black/20 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-300/18 bg-amber-300/[0.08] text-amber-200">
              <Crown className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Community stats
              </p>
              <p className="mt-1 text-sm font-black text-white">{memberCount} members</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <SmallStat label="Raids" value={String(raids.length)} />
            <SmallStat label="Rewards" value={String(rewards.length)} />
          </div>
          <div className="mt-3 space-y-2">
            {contributors.length > 0 ? (
              contributors.map((item) => (
                <div key={item.projectId} className="rounded-[18px] border border-white/6 bg-white/[0.035] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-black text-white">{item.projectName}</span>
                    <StatusChip label={item.rank > 0 ? `#${item.rank}` : "Rank pending"} tone={item.rank > 0 ? "positive" : "info"} />
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">
                    {item.xp} XP / {item.trustScore} trust
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-[18px] border border-white/6 bg-white/[0.035] px-3 py-3 text-[12px] leading-5 text-slate-400">
                Your leaderboard standing appears here once project reputation is live for this account.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PremiumStack({
  icon,
  title,
  emptyText,
  items,
}: {
  icon: ReactNode;
  title: string;
  emptyText: string;
  items: Array<{ id: string; href: string; title: string; meta: string; badge: string }>;
}) {
  return (
    <div className="rounded-[24px] border border-white/7 bg-black/20 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-300/18 bg-cyan-300/[0.08] text-cyan-100">
          {icon}
        </span>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {title}
        </p>
      </div>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between gap-3 rounded-[18px] border border-white/6 bg-white/[0.035] px-3 py-3 transition hover:border-cyan-300/18"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-white">{item.title}</span>
                <span className="mt-1 block truncate text-[11px] font-semibold text-slate-500">{item.meta}</span>
              </span>
              <span className="shrink-0 rounded-full border border-lime-300/16 bg-lime-300/[0.07] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-lime-100">
                {item.badge}
              </span>
            </Link>
          ))
        ) : (
          <p className="rounded-[18px] border border-white/6 bg-white/[0.035] px-3 py-4 text-[13px] text-slate-400">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function WorldRouteLink({
  href,
  icon,
  label,
  detail,
  active = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  detail: string;
  active?: boolean;
}) {
  const body = (
    <span
      className={`group flex min-h-[92px] items-center gap-3 rounded-[22px] border px-4 py-3 transition ${
        active
          ? "border-lime-300/22 bg-lime-300/[0.075] shadow-[0_0_42px_rgba(190,255,74,0.08)]"
          : "border-white/7 bg-black/20 hover:border-cyan-300/18 hover:bg-white/[0.035]"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
          active
            ? "border-lime-300/22 bg-lime-300/[0.09] text-lime-200"
            : "border-white/9 bg-white/[0.045] text-cyan-100"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-white">{label}</span>
        <span className="mt-1 block truncate text-[11px] font-semibold text-slate-500">{detail}</span>
      </span>
      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
    </span>
  );

  if (href.startsWith("#")) return <a href={href}>{body}</a>;
  return <Link href={href}>{body}</Link>;
}

function MissionLaneCard({
  quest,
  questCount,
  raidCount,
}: {
  quest: LiveQuest | null;
  questCount: string;
  raidCount: string;
}) {
  const tone = quest?.status === "approved" ? "positive" : quest?.status === "open" ? "info" : "warning";

  return (
    <WorldFeatureCard
      href={quest ? `/quests/${quest.id}` : "/quests"}
      icon={<Target className="h-5 w-5" />}
      eyebrow="Mission lane"
      title={quest?.title ?? "Quest route is forming"}
      description={quest?.description ?? "Project quests appear here as soon as the world has a clear member objective."}
      ctaLabel={quest ? "Open mission" : "View quests"}
      accent="lime"
      contentClassName="max-w-[18rem]"
      mediaLayer={
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 bottom-[-2.8rem] h-[18.5rem] w-[22rem] sm:-right-20 sm:bottom-[-3rem] sm:h-[20rem] sm:w-[24rem]">
            <Image
              src="/assets/project-world/mission-lane.webp"
              alt=""
              fill
              unoptimized
              sizes="384px"
              className="h-full w-full object-contain opacity-[0.9] drop-shadow-[0_0_42px_rgba(45,212,191,0.22)] [mask-image:linear-gradient(90deg,transparent_0%,black_27%,black_100%)]"
            />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_70%,rgba(45,212,191,0.2),transparent_34%),radial-gradient(circle_at_76%_22%,rgba(190,255,74,0.13),transparent_32%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,12,10,0.97)_0%,rgba(8,12,10,0.88)_45%,rgba(8,12,10,0.5)_72%,rgba(8,12,10,0.24)_100%)]" />
        </div>
      }
    >
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SmallStat label="Quests" value={questCount} />
        <SmallStat label="Raids" value={raidCount} />
      </div>
      {quest ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusChip label={quest.status} tone={tone} />
          <XpValue size="sm">{`${quest.xp} XP`}</XpValue>
        </div>
      ) : null}
    </WorldFeatureCard>
  );
}

function RewardVaultCard({ reward, rewardCount }: { reward: LiveReward | null; rewardCount: string }) {
  return (
    <WorldFeatureCard
      href={reward ? `/rewards/${reward.id}` : "/rewards"}
      icon={<Gift className="h-5 w-5" />}
      eyebrow="Reward vault"
      title={reward?.title ?? "Rewards waiting for supply"}
      description={reward?.description ?? "Claimable project rewards and vault pressure become visible here."}
      ctaLabel={reward ? "Open reward" : "View rewards"}
      accent="violet"
      contentClassName="max-w-[18rem]"
      mediaLayer={
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-12 bottom-[-2.5rem] h-[18rem] w-[20rem] sm:-right-14 sm:bottom-[-2.7rem] sm:h-[19.5rem] sm:w-[22rem]">
            <Image
              src="/assets/project-world/claim-your-rewards.webp"
              alt=""
              fill
              unoptimized
              sizes="352px"
              className="h-full w-full object-contain opacity-[0.88] drop-shadow-[0_0_40px_rgba(45,212,191,0.2)] [mask-image:linear-gradient(90deg,transparent_0%,black_25%,black_100%)]"
            />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_70%,rgba(45,212,191,0.18),transparent_32%),radial-gradient(circle_at_72%_22%,rgba(167,139,250,0.16),transparent_34%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,9,14,0.96)_0%,rgba(8,9,14,0.88)_45%,rgba(8,9,14,0.48)_72%,rgba(8,9,14,0.24)_100%)]" />
        </div>
      }
    >
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SmallStat label="Visible" value={rewardCount} />
        <SmallStat
          label="Cost"
          value={reward ? `${reward.cost} XP` : "Pending"}
          valueNode={reward ? <XpValue size="md">{`${reward.cost} XP`}</XpValue> : undefined}
        />
      </div>
      {reward?.imageUrl ? (
        <div className="mt-3 h-24 overflow-hidden rounded-[18px] border border-white/8 bg-black/30">
          <ArtworkImage
            src={reward.imageUrl}
            alt={reward.title}
            tone="rose"
            fallbackLabel="Reward art"
            imgClassName="h-full w-full object-cover"
          />
        </div>
      ) : null}
    </WorldFeatureCard>
  );
}

function TokenTrustCard({
  tokenLabel,
  tokenPrice,
  tokenMove,
  trustScore,
  trustLabel,
  swapHref,
}: {
  tokenLabel: string;
  tokenPrice: string;
  tokenMove: string;
  trustScore: number;
  trustLabel: string;
  swapHref: string;
}) {
  return (
    <WorldFeatureCard
      href={swapHref}
      icon={<Coins className="h-5 w-5" />}
      eyebrow="Token and trust"
      title={tokenLabel}
      description="Live market signal and safety score sit together before members choose a route."
      ctaLabel="Open swap"
      accent="cyan"
      contentClassName="max-w-[18.5rem]"
      mediaLayer={
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 bottom-[-2.9rem] h-[18.5rem] w-[22rem] sm:-right-20 sm:bottom-[-3.1rem] sm:h-[20.5rem] sm:w-[24rem]">
            <Image
              src="/assets/project-world/token-and-trust.webp"
              alt=""
              fill
              unoptimized
              sizes="384px"
              className="h-full w-full object-contain opacity-[0.88] drop-shadow-[0_0_42px_rgba(34,211,238,0.22)] [mask-image:linear-gradient(90deg,transparent_0%,black_28%,black_100%)]"
            />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_66%,rgba(34,211,238,0.2),transparent_34%),radial-gradient(circle_at_74%_22%,rgba(125,211,252,0.13),transparent_31%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,10,14,0.97)_0%,rgba(6,10,14,0.88)_45%,rgba(6,10,14,0.5)_72%,rgba(6,10,14,0.24)_100%)]" />
        </div>
      }
    >
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SmallStat label="Price" value={tokenPrice} />
        <SmallStat label="24h" value={tokenMove} />
      </div>
      <div className="mt-3 rounded-[18px] border border-white/8 bg-black/25 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            AI scan
          </span>
          <StatusChip label={trustLabel} tone={getScanRiskTone(trustLabel.toLowerCase().split(" ")[0])} />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-lime-300"
            style={{ width: `${Math.max(4, Math.min(100, trustScore))}%` }}
          />
        </div>
      </div>
    </WorldFeatureCard>
  );
}

function StandingCard({ reputation }: { reputation?: LiveProjectReputation }) {
  return (
    <div className="motion-card-3d relative overflow-hidden rounded-[26px] border border-white/7 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.13),transparent_34%),linear-gradient(180deg,rgba(15,17,22,0.9),rgba(7,8,12,0.95))] p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-16 bottom-[-3rem] h-[19rem] w-[22rem] sm:-right-20 sm:bottom-[-3.2rem] sm:h-[21rem] sm:w-[24rem]">
          <Image
            src="/assets/project-world/your-standing.webp"
            alt=""
            fill
            unoptimized
            sizes="384px"
            className="h-full w-full object-contain opacity-[0.82] drop-shadow-[0_0_46px_rgba(250,204,21,0.18)] [mask-image:linear-gradient(90deg,transparent_0%,black_30%,black_100%)]"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_66%,rgba(250,204,21,0.16),transparent_34%),radial-gradient(circle_at_76%_22%,rgba(168,85,247,0.14),transparent_32%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,9,12,0.97)_0%,rgba(11,9,12,0.89)_45%,rgba(11,9,12,0.58)_73%,rgba(11,9,12,0.28)_100%)]" />
      </div>
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">
              Your standing
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              Level {reputation?.level ?? 0}
            </h2>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/18 bg-amber-300/[0.08] text-amber-200">
            <Crown className="h-5 w-5" />
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Your reputation in this project world grows through completed missions, raids and claimed rewards.
        </p>
        <div className="mt-4">
          <ContributionTierBadge tier={reputation?.contributionTier} size="lg" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <SmallStat label="XP" value={`${reputation?.xp ?? 0} XP`} valueNode={<XpValue size="md">{`${reputation?.xp ?? 0} XP`}</XpValue>} />
          <SmallStat label="Rank" value={reputation ? `#${reputation.rank}` : "Pending"} />
          <SmallStat label="Quests" value={String(reputation?.questsCompleted ?? 0)} />
          <SmallStat label="Raids" value={String(reputation?.raidsCompleted ?? 0)} />
        </div>
      </div>
    </div>
  );
}

function StoryWorldPanel({ project, story }: { project: LiveProject; story: string }) {
  const links = [
    { label: "Website", href: project.website },
    { label: "X", href: project.xUrl },
    { label: "Telegram", href: project.telegramUrl },
    { label: "Discord", href: project.discordUrl },
    { label: "Docs", href: project.docsUrl },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <div className="rounded-[30px] border border-white/7 bg-[radial-gradient(circle_at_top_left,rgba(190,255,74,0.09),transparent_34%),linear-gradient(180deg,rgba(13,16,20,0.9),rgba(6,8,12,0.94))] p-4 sm:p-5">
      <SectionKicker icon={<BookOpen className="h-4 w-4" />} label="Project world" />
      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start">
        <LogoMark project={project} />
        <div className="min-w-0">
          <h2 className="text-3xl font-black text-white">{project.name}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">{story}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {[project.category, project.chain, project.brandMood].filter(Boolean).map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
          {links.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="motion-press inline-flex items-center gap-2 rounded-full border border-cyan-300/14 bg-cyan-300/[0.055] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-200/30"
                >
                  {link.label}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PremiumModuleWorldCard({ module }: { module: ProjectShowcasePremiumModule }) {
  const body = (
    <div className="motion-card-3d group flex h-full flex-col rounded-[24px] border border-white/7 bg-white/[0.035] p-4 transition hover:border-cyan-300/18 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
          {module.eyebrow}
        </p>
        <StatusChip label={getStatusLabel(module.status)} tone={getStatusTone(module.status)} />
      </div>
      <h3 className="mt-3 text-lg font-black text-white">{module.title}</h3>
      <p className="mt-2 text-[13px] leading-6 text-slate-400">{module.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SmallStat label="Signal" value={module.primaryMetric} />
        <SmallStat label="Posture" value={module.secondaryMetric} />
      </div>
      <div className="mt-3 space-y-2">
        {module.highlights.slice(0, 2).map((highlight) => (
          <p
            key={highlight}
            className="rounded-[16px] border border-white/6 bg-black/20 px-3 py-2 text-[12px] font-semibold leading-5 text-slate-300"
          >
            {highlight}
          </p>
        ))}
      </div>
      <span className="mt-auto inline-flex items-center gap-2 pt-4 text-[11px] font-black uppercase tracking-[0.14em] text-lime-300">
        {module.ctaLabel}
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </div>
  );

  if (module.href.startsWith("http")) {
    return (
      <a href={module.href} target="_blank" rel="noreferrer">
        {body}
      </a>
    );
  }

  return <Link href={module.href}>{body}</Link>;
}

function TrustScanPanel({ showcase }: { showcase: ProjectShowcaseModel }) {
  return (
    <div
      id="security"
      className="rounded-[30px] border border-white/7 bg-[radial-gradient(circle_at_top_right,rgba(190,255,74,0.1),transparent_34%),linear-gradient(180deg,rgba(13,16,20,0.9),rgba(6,8,12,0.94))] p-4 sm:p-5"
    >
      <SectionKicker icon={<ShieldCheck className="h-4 w-4" />} label="AI contract scan" />
      <div className="mt-5 grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div className="rounded-[24px] border border-lime-300/14 bg-lime-300/[0.055] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">
            Safety score
          </p>
          <p className="mt-3 text-4xl font-black text-white">{showcase.contractScan.score}</p>
          <StatusChip
            label={getScanRiskLabel(showcase.contractScan.riskLevel)}
            tone={getScanRiskTone(showcase.contractScan.riskLevel)}
          />
          <p className="mt-4 text-[13px] leading-6 text-slate-300">{showcase.contractScan.summary}</p>
        </div>
        <div className="space-y-3">
          {showcase.contractScan.findings.slice(0, 3).map((finding) => (
            <div
              key={`${finding.label}-${finding.evidence}`}
              className="rounded-[20px] border border-white/7 bg-black/20 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-black text-white">{finding.label}</h3>
                <StatusChip
                  label={getScanSeverityLabel(finding.severity)}
                  tone={getScanSeverityTone(finding.severity)}
                />
              </div>
              <p className="mt-2 text-[13px] leading-6 text-slate-400">{finding.detail}</p>
              <p className="mt-2 break-words text-[11px] font-semibold text-slate-500">
                {finding.evidence}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorldSystemCard({ module }: { module: ProjectShowcaseModule }) {
  const content = (
    <div className="group rounded-[22px] border border-white/7 bg-black/20 p-4 transition hover:border-lime-300/16 hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">
            {module.label}
          </p>
          <p className="mt-2 text-base font-black text-white">{module.title}</p>
        </div>
        <StatusChip label={getStatusLabel(module.status)} tone={getStatusTone(module.status)} />
      </div>
      <p className="mt-3 text-[13px] leading-6 text-slate-400">{module.description}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">
        Open
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </div>
  );

  if (module.href.startsWith("http")) {
    return (
      <a href={module.href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return <Link href={module.href}>{content}</Link>;
}

function WorldFeatureCard({
  href,
  icon,
  eyebrow,
  title,
  description,
  ctaLabel,
  accent,
  mediaLayer,
  contentClassName = "",
  children,
}: {
  href: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  accent: "lime" | "cyan" | "violet";
  mediaLayer?: ReactNode;
  contentClassName?: string;
  children?: ReactNode;
}) {
  const accents = {
    lime: "from-lime-300/12 text-lime-200 border-lime-300/18",
    cyan: "from-cyan-300/12 text-cyan-100 border-cyan-300/18",
    violet: "from-violet-300/12 text-violet-100 border-violet-300/18",
  }[accent];

  const body = (
    <div
      className={`motion-card-3d group relative h-full overflow-hidden rounded-[26px] border border-white/7 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-from),transparent_38%),linear-gradient(180deg,rgba(15,17,22,0.9),rgba(7,8,12,0.95))] p-4 ${accents}`}
    >
      {mediaLayer}
      <div className={`relative z-10 ${contentClassName}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em]">{eyebrow}</p>
            <h2 className="mt-3 line-clamp-2 text-2xl font-black text-white">{title}</h2>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white/[0.045]">
            {icon}
          </span>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{description}</p>
        {children}
        <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-white">
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );

  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {body}
      </a>
    );
  }

  return <Link href={href}>{body}</Link>;
}

function ActivationColumn({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: Array<{
    id: string;
    href: string;
    title: string;
    meta: string;
    platformQuest?: boolean;
    cadence?: string | null;
    shardRewardAmount?: number;
  }>;
}) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between gap-3 rounded-[18px] border border-white/6 bg-white/[0.03] px-3 py-3 transition hover:border-cyan-300/18"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">{item.title}</span>
                {item.platformQuest ? (
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    <StatusChip label={item.cadence ?? "platform"} tone="info" />
                    {Number(item.shardRewardAmount ?? 0) > 0 ? (
                      <span className="rounded-full border border-cyan-300/16 bg-cyan-300/[0.07] px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100">
                        +{Math.floor(Number(item.shardRewardAmount))} shards
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0">
                {isXpDisplay(item.meta) ? (
                  <XpValue size="sm">{item.meta}</XpValue>
                ) : (
                  <span className="text-[11px] font-black uppercase tracking-[0.14em] text-lime-300">
                    {item.meta}
                  </span>
                )}
              </span>
            </Link>
          ))
        ) : (
          <p className="rounded-[18px] border border-white/6 bg-white/[0.03] px-3 py-4 text-[13px] text-slate-400">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string | null;
}) {
  const body = (
    <div className="rounded-[20px] border border-white/6 bg-black/20 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-cyan-200">{icon}</span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <p className="mt-2 break-words text-sm font-semibold leading-6 text-white">{value}</p>
        </div>
      </div>
    </div>
  );

  if (!href) return body;
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {body}
      </a>
    );
  }

  return <Link href={href}>{body}</Link>;
}

function SmallStat({
  label,
  value,
  valueNode,
}: {
  label: string;
  value: string;
  valueNode?: ReactNode;
}) {
  const hasXpBadge = isXpDisplay(label, value);

  return (
    <div className="rounded-[20px] border border-white/6 bg-black/20 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-2">
        {valueNode ?? (hasXpBadge ? <XpValue size="md">{value}</XpValue> : <p className="text-lg font-black text-white">{value}</p>)}
      </div>
    </div>
  );
}

function Notice({ text, tone }: { text: string; tone: "default" | "error" }) {
  return (
    <div
      className={`rounded-[24px] px-4 py-6 text-sm ${
        tone === "error"
          ? "border border-rose-400/20 bg-rose-500/10 text-rose-200"
          : "border border-white/8 bg-black/20 text-slate-300"
      }`}
    >
      {text}
    </div>
  );
}
