"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Coins,
  ExternalLink,
  Globe2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { ProjectBenchmarkCard } from "@/components/analytics/project-benchmark-card";
import { ArtworkImage } from "@/components/ui/artwork-image";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";
import {
  buildProjectShowcase,
  type ProjectShowcaseModule,
  type ProjectShowcaseStatus,
} from "@/lib/projects/project-showcase";

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

  const project = projects.find((item) => item.id === projectId);
  const showcase = useMemo(() => {
    if (!project) return null;

    return buildProjectShowcase({
      project,
      campaigns,
      quests,
      rewards,
      raids,
    });
  }, [campaigns, project, quests, raids, rewards]);
  const reputation = projectReputation.find((item) => item.projectId === projectId);

  if (loading) return <Notice tone="default" text="Loading project..." />;
  if (error) return <Notice tone="error" text={error} />;
  if (!project || !showcase) return <Notice tone="default" text="Project not found." />;

  const projectCampaignIds = new Set(
    campaigns.filter((campaign) => campaign.projectId === project.id).map((campaign) => campaign.id)
  );
  const projectQuests = quests.filter((quest) => quest.projectId === project.id).slice(0, 4);
  const projectRewards = rewards
    .filter(
      (reward) =>
        reward.projectId === project.id ||
        (reward.campaignId ? projectCampaignIds.has(reward.campaignId) : false)
    )
    .slice(0, 4);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[32px] border border-white/6 bg-black shadow-[0_28px_90px_rgba(0,0,0,0.32)]">
        {showcase.heroImageUrl ? (
          <ArtworkImage
            src={showcase.heroImageUrl}
            alt={project.name}
            tone="cyan"
            fallbackLabel="Project showcase art offline"
            className="absolute inset-0"
            imgClassName="h-full w-full object-cover opacity-54"
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(190,255,74,0.12),transparent_26%),linear-gradient(90deg,rgba(0,0,0,0.94),rgba(0,0,0,0.7)_46%,rgba(0,0,0,0.35)),linear-gradient(180deg,rgba(4,6,10,0.1),rgba(4,6,10,0.94))]" />
        <div className="relative z-10 grid min-h-[460px] gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div className="max-w-4xl self-end">
            <div className="flex flex-wrap items-center gap-2">
              <LogoMark project={project} />
              {showcase.badges.map((badge) => (
                <StatusChip key={badge} label={badge} tone="info" />
              ))}
            </div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-lime-300">
              Premium project showcase
            </p>
            <h1 className="mt-3 max-w-[12ch] text-[clamp(3rem,7vw,6.4rem)] font-black leading-[0.86] tracking-[-0.075em] text-white">
              {showcase.headline}
            </h1>
            <p className="mt-5 max-w-3xl text-[15px] leading-7 text-slate-300 sm:text-base">
              {showcase.story}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/communities/${project.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-lime-200"
              >
                Join community
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={showcase.token.swapHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:border-cyan-300/20 hover:bg-cyan-300/10"
              >
                Open swap
                <Coins className="h-4 w-4" />
              </Link>
              {showcase.socialLinks[0] ? (
                <a
                  href={showcase.socialLinks[0].href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/24 px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:border-white/16"
                >
                  {showcase.socialLinks[0].label}
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="self-end rounded-[28px] border border-white/8 bg-black/46 p-4 backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">
                  Showcase score
                </p>
                <p className="mt-2 text-4xl font-black tracking-[-0.06em] text-white">
                  {showcase.readinessScore}%
                </p>
              </div>
              <ShieldCheck className="h-8 w-8 text-lime-200" />
            </div>
            <p className="mt-4 text-[13px] leading-6 text-slate-300">{showcase.nextAction}</p>
            <div className="mt-4 grid gap-2">
              {showcase.metrics.map((metric) => (
                <MetricLine key={metric.label} label={metric.label} value={metric.value} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {showcase.metrics.map((metric) => (
          <div key={metric.label} className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-black tracking-[-0.06em] text-white">{metric.value}</p>
            <p className="mt-2 text-[12px] leading-5 text-slate-400">{metric.sub}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Surface
          eyebrow="Showcase modules"
          title="Everything a listed project should expose"
          description="The public page stays premium and compact, while the portal remains the source of truth for every field."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {showcase.modules.map((module) => (
              <ModuleCard key={module.key} module={module} />
            ))}
          </div>
        </Surface>

        <Surface
          eyebrow="Market + safety"
          title={showcase.token.configured ? `${showcase.token.label} route` : "Token route pending"}
          description="Project token context, explorer links and swap entry stay visible before users take action."
        >
          <div className="space-y-3">
            <InfoTile
              icon={<WalletCards className="h-4 w-4" />}
              label="Contract"
              value={showcase.token.contractAddress ?? "Not connected yet"}
            />
            <InfoTile
              icon={<Globe2 className="h-4 w-4" />}
              label="Explorer"
              value={showcase.token.explorerUrl ? "Available" : "Pending chain route"}
              href={showcase.token.explorerUrl}
            />
            <InfoTile
              icon={<Coins className="h-4 w-4" />}
              label="Swap"
              value={showcase.token.knownSwapToken ? "Launch route ready" : "Route registry needed"}
              href={showcase.token.swapHref}
            />
          </div>
        </Surface>
      </section>

      <ProjectBenchmarkCard projectId={project.id} />

      <section id="security" className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Surface
          eyebrow="AI security scan"
          title="Transparent safety read before users engage"
          description="This is the first public scan layer. Later we can connect explorer source, ABI reads and deeper AI findings."
        >
          <div className="grid gap-3">
            {showcase.checks.map((check) => (
              <div
                key={check.label}
                className="rounded-[20px] border border-white/6 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">{check.label}</p>
                    <p className="mt-2 text-[13px] leading-6 text-slate-400">{check.detail}</p>
                  </div>
                  <StatusChip label={getStatusLabel(check.status)} tone={getStatusTone(check.status)} />
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface
          eyebrow="Activation"
          title="Daily quests and rewards"
          description="Show users what they can do immediately, then route them into the existing quest and reward economy."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            <ActivationColumn
              title="Daily quests"
              emptyText="No project quests are live yet."
              items={projectQuests.map((quest) => ({
                id: quest.id,
                href: `/quests/${quest.id}`,
                title: quest.title,
                meta: `${quest.xp} XP`,
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
        </Surface>
      </section>

      <Surface
        eyebrow="Your standing"
        title="Project reputation"
        description="User reputation stays separate per project, so contribution history can become part of the showcase experience."
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <SmallStat label="Tier" value={reputation ? reputation.contributionTier.toUpperCase() : "NOT STARTED"} />
          <SmallStat label="Rank" value={reputation?.rank ? `#${reputation.rank}` : "-"} />
          <SmallStat label="Project XP" value={reputation ? reputation.xp.toLocaleString() : "0"} />
          <SmallStat label="Trust" value={String(reputation?.trustScore ?? 50)} />
        </div>
      </Surface>
    </div>
  );
}

function LogoMark({ project }: { project: { logo: string | null; name: string } }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055]">
      {project.logo ? (
        <ArtworkImage
          src={project.logo}
          alt={`${project.name} logo`}
          tone="cyan"
          fallbackLabel={project.name.slice(0, 1)}
          imgClassName="h-full w-full object-cover"
        />
      ) : (
        <span className="text-sm font-black text-white">{project.name.slice(0, 1)}</span>
      )}
    </div>
  );
}

function ModuleCard({ module }: { module: ProjectShowcaseModule }) {
  const content = (
    <div className="group rounded-[24px] border border-white/6 bg-black/20 p-4 transition hover:border-lime-300/16 hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">
            {module.label}
          </p>
          <p className="mt-3 text-lg font-black tracking-[-0.04em] text-white">{module.title}</p>
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

function ActivationColumn({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: Array<{ id: string; href: string; title: string; meta: string }>;
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
              <span className="text-sm font-semibold text-white">{item.title}</span>
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-lime-300">
                {item.meta}
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

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-white/6 bg-white/[0.035] px-3 py-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/6 bg-black/20 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
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
