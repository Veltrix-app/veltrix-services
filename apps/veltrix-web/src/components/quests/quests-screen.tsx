"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Flame, Search, ShieldCheck, Sparkles, Target, Trophy } from "lucide-react";
import { ArtworkImage } from "@/components/ui/artwork-image";
import { CinematicRouteHero } from "@/components/ui/cinematic-route-hero";
import { FeatureBadgeMark } from "@/components/ui/feature-badge-mark";
import { ShardBadge } from "@/components/ui/shard-badge";
import { StatusChip } from "@/components/ui/status-chip";
import { XpValue, isXpDisplay } from "@/components/ui/xp-badge";
import { useLiveUserData } from "@/hooks/use-live-user-data";
import { resolveBestFeaturedShardPool } from "@/lib/lootboxes/featured-shard-pools";
import type { LiveFeaturedShardPool } from "@/types/live";

type QuestFilter = "all" | "open" | "high-xp";

const QUEST_HERO_IMAGE = "/assets/quests/quest-hero.webp";
const XP_ECONOMY_CARD_IMAGE = "/assets/quests/xp-economy-card.webp";

function getQuestTone(status: string) {
  if (status === "approved") return "positive";
  if (status === "pending") return "warning";
  if (status === "rejected") return "danger";
  return "info";
}

function getQuestStatusLabel(status: string) {
  if (status === "open") return "active";
  return status;
}

export function QuestsScreen() {
  const { loading, error, quests, campaigns, projects, rewards, featuredShardPools } = useLiveUserData({
    datasets: ["quests", "campaigns", "projects", "rewards", "featuredShardPools"],
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuestFilter>("all");

  const enrichedQuests = useMemo(() => {
    return quests
      .map((quest) => {
        const linkedCampaign = campaigns.find((campaign) => campaign.id === quest.campaignId);
        const linkedProject = projects.find(
          (project) => project.id === (quest.projectId ?? linkedCampaign?.projectId)
        );
        const rewardCount = rewards.filter((reward) => reward.campaignId === quest.campaignId).length;
        const shardPool = resolveBestFeaturedShardPool({
          pools: featuredShardPools,
          campaignId: quest.campaignId,
          questId: quest.id,
        });

        return {
          ...quest,
          campaignTitle: linkedCampaign?.title ?? "Mission lane",
          projectName: linkedProject?.name ?? "Project",
          projectLogo: linkedProject?.logo ?? null,
          campaignFeatured: linkedCampaign?.featured ?? false,
          imageUrl: linkedCampaign?.bannerUrl ?? linkedCampaign?.thumbnailUrl ?? linkedProject?.bannerUrl ?? null,
          rewardCount,
          shardPool,
        };
      })
      .sort(
        (left, right) =>
          Number(right.campaignFeatured) - Number(left.campaignFeatured) ||
          Number(left.status === "approved") - Number(right.status === "approved") ||
          right.xp - left.xp
      );
  }, [campaigns, featuredShardPools, projects, quests, rewards]);

  const filteredQuests = useMemo(() => {
    let items = enrichedQuests;

    if (query.trim()) {
      const normalized = query.toLowerCase();
      items = items.filter((quest) =>
        [quest.title, quest.description, quest.projectName, quest.campaignTitle].some((value) =>
          value.toLowerCase().includes(normalized)
        )
      );
    }

    if (filter === "open") {
      items = items.filter((quest) => quest.status !== "approved");
    }

    if (filter === "high-xp") {
      items = items.filter((quest) => quest.xp >= 250);
    }

    return items;
  }, [enrichedQuests, filter, query]);

  const spotlightQuests = filteredQuests.slice(0, 3);
  const openCount = enrichedQuests.filter((quest) => quest.status !== "approved").length;
  const pendingCount = enrichedQuests.filter((quest) => quest.status === "pending").length;
  const rewardLinkedCount = enrichedQuests.filter((quest) => quest.rewardCount > 0).length;
  const shardBoostCount = enrichedQuests.filter((quest) => quest.shardPool).length;
  const featuredCount = enrichedQuests.filter((quest) => quest.campaignFeatured).length;
  const availableXp = enrichedQuests
    .filter((quest) => quest.status !== "approved")
    .reduce((total, quest) => total + quest.xp, 0);
  const priorityQuest = spotlightQuests[0] ?? enrichedQuests[0] ?? null;

  return (
    <div className="space-y-6">
      <CinematicRouteHero
        imageSrc={QUEST_HERO_IMAGE}
        imagePosition="center 50%"
        title="Quest board"
        description="Scan active missions, boosted shard lanes, XP pressure and reward-linked tasks from one premium command surface."
        chips={["Featured quests", "Shard hunts", "XP routes"]}
        stats={[
          { label: "Open missions", value: String(openCount) },
          { label: "Available XP", value: String(availableXp) },
          { label: "Shard boosts", value: String(shardBoostCount) },
        ]}
        panelTitle={priorityQuest?.title ?? "Quest lane forming"}
        panelText="The strongest available mission stays visible first, while filters keep the full quest grid fast to scan."
        panelStats={[
          { label: "Rewards", value: String(rewardLinkedCount), sub: "linked" },
          { label: "Pending", value: String(pendingCount), sub: "review" },
          { label: "Featured", value: String(featuredCount), sub: "lanes" },
          { label: "Priority", value: priorityQuest ? "Ready" : "Forming", sub: "next move" },
        ]}
        panelIcon={Target}
        primaryCta={{ href: "#quest-board", label: "Open quests" }}
        secondaryCta={{ href: "#quest-controls", label: "Filter board" }}
        tone="cyan"
      />

      <section
        id="quest-controls"
        className="motion-surface motion-light-sweep scroll-mt-28 overflow-hidden rounded-[26px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),linear-gradient(180deg,rgba(13,17,24,0.98),rgba(6,8,12,0.99))] p-4 shadow-[0_18px_58px_rgba(0,0,0,0.28)] sm:p-5"
      >
        <div className="relative z-10 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">Mission filters</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <label className="flex min-h-12 items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 py-2 shadow-[0_16px_44px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                <Search className="h-4 w-4 shrink-0 text-cyan-100/70" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Quest, project or mission lane..."
                  className="w-full bg-transparent text-[13px] font-semibold text-white outline-none placeholder:text-slate-500"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
                <FilterButton active={filter === "open"} onClick={() => setFilter("open")} label="Open" />
                <FilterButton active={filter === "high-xp"} onClick={() => setFilter("high-xp")} label="High XP" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SignalCard label="Open" value={String(openCount)} meta="missions" icon={<Flame className="h-3.5 w-3.5" />} />
            <SignalCard label="XP" value={String(availableXp)} meta="available" icon={<Sparkles className="h-3.5 w-3.5" />} />
            <SignalCard label="Rewards" value={String(rewardLinkedCount)} meta="linked" icon={<Trophy className="h-3.5 w-3.5" />} />
            <SignalCard label="Shards" value={String(shardBoostCount)} meta="boosted" icon={<ShieldCheck className="h-3.5 w-3.5" />} />
          </div>
        </div>
      </section>

      <section id="quest-board" className="grid scroll-mt-28 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <BoardStat label="Featured lanes" value={String(featuredCount)} detail="visual campaign pressure" />
        <BoardStat label="Open missions" value={String(openCount)} detail="not approved yet" />
        <BoardStat label="Pending review" value={String(pendingCount)} detail="waiting signal" />
        <BoardStat label="Shard boosts" value={String(shardBoostCount)} detail="sponsored pools" />
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Spotlights"
          title="Featured mission lanes"
          description="The top quests get the visual treatment first, so members understand where momentum and rewards are most active."
        />

        {loading ? (
          <EmptyNotice text="Loading quest spotlights..." />
        ) : error ? (
          <EmptyNotice text={error} tone="error" />
        ) : spotlightQuests.length > 0 ? (
          <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]">
            {spotlightQuests.map((quest, index) => (
              <Link
                key={quest.id}
                href={`/quests/${quest.id}`}
                prefetch={false}
                className={`motion-surface motion-3d-card motion-light-sweep group relative overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.12),transparent_30%),linear-gradient(180deg,rgba(18,21,27,0.98),rgba(7,9,14,0.99))] shadow-[0_24px_74px_rgba(0,0,0,0.34)] transition hover:border-cyan-300/24 ${
                  index === 0 ? "min-h-[248px] p-4 sm:p-5" : "min-h-[208px] p-3.5 sm:p-4"
                }`}
                >
                <div className="motion-ambient-grid opacity-[0.13]" />
                <div className="motion-shard-field opacity-60">
                  <span />
                  <span />
                  <span />
                </div>
                {quest.campaignFeatured && quest.imageUrl ? (
                  <>
                    <ArtworkImage
                      src={quest.imageUrl}
                      alt={quest.title}
                      tone="cyan"
                      fallbackLabel="Quest art offline"
                      className="absolute inset-0"
                      imgClassName="h-full w-full object-cover opacity-28"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,11,0.28),rgba(5,7,11,0.82)_48%,rgba(5,7,11,0.98))]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,217,255,0.18),transparent_34%)]" />
                  </>
                ) : null}

                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <ProjectLogoMark name={quest.projectName} logo={quest.projectLogo} size={index === 0 ? "lg" : "md"} />
                      <div className="min-w-0 pt-1">
                        <CardPill>{quest.projectName}</CardPill>
                        <p className="mt-2 max-w-[16rem] truncate text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                          {quest.campaignTitle}
                        </p>
                      </div>
                    </div>
                    <QuestStatusMark status={quest.status} prominent={index === 0} />
                  </div>

                  <h3
                    className={`font-semibold leading-6 text-white ${
                      index === 0 ? "mt-7 text-[1.08rem]" : "mt-5 text-[0.94rem]"
                    }`}
                  >
                    {quest.title}
                  </h3>
                  <p className="mt-2.5 line-clamp-2 text-[12px] leading-5 text-slate-300">
                    {quest.description || "Mission lane with live verification pressure and a direct route into action."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <MetricPill label="XP" value={String(quest.xp)} />
                    {quest.shardPool ? <ShardBoostPill pool={quest.shardPool} /> : null}
                    <MetricPill label="Mode" value={quest.completionMode ?? "manual"} />
                    <MetricPill label="Rewards" value={String(quest.rewardCount)} />
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-white/6 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Open mission
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition group-hover:translate-x-0.5">
                      View
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyNotice text="No featured quests are visible yet." />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Grid"
          title="All quests"
          description="A cleaner mission grid for fast scanning: logo first, quest state top-right, reward context below."
        />

        {loading ? (
          <EmptyNotice text="Loading quests..." />
        ) : error ? (
          <EmptyNotice text={error} tone="error" />
        ) : filteredQuests.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
            {filteredQuests.map((quest) => (
              <Link
                key={quest.id}
                href={`/quests/${quest.id}`}
                prefetch={false}
                className="motion-surface motion-3d-card motion-light-sweep group relative min-h-[14.5rem] overflow-hidden rounded-[22px] border border-white/8 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.08),transparent_28%),linear-gradient(180deg,rgba(15,18,23,0.98),rgba(6,8,12,0.99))] p-3.5 shadow-[0_16px_46px_rgba(0,0,0,0.22)] transition hover:border-cyan-300/18"
              >
                <Image
                  src={XP_ECONOMY_CARD_IMAGE}
                  alt=""
                  width={160}
                  height={104}
                  unoptimized
                  className="pointer-events-none absolute -right-10 bottom-1 h-28 w-40 object-contain opacity-[0.13] mix-blend-screen saturate-125 transition duration-300 group-hover:opacity-[0.22]"
                  sizes="160px"
                />
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <ProjectLogoMark name={quest.projectName} logo={quest.projectLogo} />
                  </div>
                  <QuestStatusMark status={quest.status} compact />
                </div>

                <div className="relative z-10 mt-3 min-w-0">
                  <p className="truncate text-[0.94rem] font-semibold text-white">{quest.title}</p>
                  <p className="mt-2 truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    {quest.projectName}
                  </p>
                </div>

                <div className="relative z-10 mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                  <span className="truncate">{quest.campaignTitle}</span>
                  <span>{quest.rewardCount} rewards</span>
                </div>

                <div className="relative z-10 mt-4 flex flex-wrap gap-1.5">
                  <MetricPill label="XP" value={String(quest.xp)} />
                  {quest.shardPool ? <ShardBoostPill pool={quest.shardPool} compact /> : null}
                  <MetricPill label="Mode" value={quest.completionMode ?? "manual"} />
                </div>

                <div className="relative z-10 mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Open mission
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-200">
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyNotice text="No quests match this board filter yet." />
        )}
      </section>
    </div>
  );
}

function QuestStatusMark({
  status,
  compact = false,
  prominent = false,
}: {
  status: string;
  compact?: boolean;
  prominent?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <StatusChip label={getQuestStatusLabel(status)} tone={getQuestTone(status)} />
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <FeatureBadgeMark
        badge="quest"
        className={`motion-soft-float opacity-[0.92] mix-blend-screen transition duration-300 group-hover:opacity-100 ${
          prominent ? "h-16 w-16" : "h-[52px] w-[52px]"
        }`}
        imageClassName="rotate-[8deg]"
        sizes={prominent ? "64px" : "52px"}
      />
      <StatusChip label={getQuestStatusLabel(status)} tone={getQuestTone(status)} />
    </div>
  );
}

function ProjectLogoMark({
  name,
  logo,
  size = "md",
}: {
  name: string;
  logo: string | null;
  size?: "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().slice(0, 1).toUpperCase() || "V";
  const dimension = size === "lg" ? "h-[52px] w-[52px] rounded-[18px]" : "h-11 w-11 rounded-2xl";
  const textSize = size === "lg" ? "text-base" : "text-sm";
  const logoSource = logo?.trim() ?? "";
  const showLogo =
    !failed &&
    (logoSource.startsWith("/") ||
      logoSource.startsWith("http://") ||
      logoSource.startsWith("https://") ||
      logoSource.startsWith("data:image/"));

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_35%_22%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] shadow-[0_14px_34px_rgba(0,0,0,0.22)] ${dimension}`}
    >
      {showLogo ? (
        <Image
          src={logoSource}
          alt={`${name} logo`}
          fill
          unoptimized
          sizes={size === "lg" ? "52px" : "44px"}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={`font-black text-white ${textSize}`}>{initial}</span>
      )}
    </span>
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
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-2 text-[0.98rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.08rem]">
          {title}
        </h2>
        <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-400">{description}</p>
      </div>
      <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400">
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

function BoardStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="motion-surface relative overflow-hidden rounded-[22px] border border-white/8 bg-[radial-gradient(circle_at_85%_0%,rgba(34,211,238,0.12),transparent_30%),linear-gradient(180deg,rgba(15,18,24,0.88),rgba(7,9,13,0.94))] px-4 py-3 shadow-[0_16px_46px_rgba(0,0,0,0.18)]">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-[1.35rem] font-black tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-1 truncate text-[10px] uppercase tracking-[0.13em] text-slate-500">{detail}</p>
    </div>
  );
}

function SignalCard({
  label,
  value,
  meta,
  icon,
}: {
  label: string;
  value: string;
  meta: string;
  icon: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[18px] border border-white/8 bg-white/[0.035] px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <span className="text-cyan-100/70">{icon}</span>
      </div>
      <p className="mt-2 truncate text-[1.05rem] font-black tracking-[-0.03em] text-white">{value}</p>
      <p className="mt-1 truncate text-[10px] uppercase tracking-[0.14em] text-slate-500">{meta}</p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
        active
          ? "border border-cyan-300/16 bg-cyan-300/10 text-cyan-100"
          : "border border-white/8 bg-white/[0.03] text-slate-400 hover:border-white/12 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function CardPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-slate-300">
      {children}
    </span>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  const hasXpBadge = isXpDisplay(label, value);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/20 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
      <span>{label}</span>
      {hasXpBadge ? <XpValue size="xs">{value}</XpValue> : <span className="text-white">{value}</span>}
    </span>
  );
}

function ShardBoostPill({
  pool,
  compact = false,
}: {
  pool: LiveFeaturedShardPool;
  compact?: boolean;
}) {
  const label =
    pool.bonusMin === pool.bonusMax ? `+${pool.bonusMin}` : `+${pool.bonusMin}-${pool.bonusMax}`;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.075] text-[8px] font-bold uppercase tracking-[0.13em] text-emerald-100 shadow-[0_12px_28px_rgba(16,185,129,0.08)] ${
        compact ? "px-1.5 py-0.5" : "px-2 py-1"
      }`}
    >
      <ShardBadge
        value={label}
        label={compact ? "" : "boost"}
        size="sm"
        className="border-0 bg-transparent p-0 text-[8px] shadow-none"
      />
      {!compact ? (
        <span className="text-emerald-100/55">{pool.remainingShards} left</span>
      ) : null}
    </span>
  );
}

function EmptyNotice({
  text,
  tone = "default",
}: {
  text: string;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`rounded-[24px] border px-4 py-5 text-sm ${
        tone === "error"
          ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
          : "border-white/8 bg-black/20 text-slate-300"
      }`}
    >
      {text}
    </div>
  );
}
