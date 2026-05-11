"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  ArrowRight,
  Box,
  CalendarDays,
  CheckCircle2,
  Flame,
  Gift,
  LockKeyhole,
  Radar,
  Rocket,
  Shield,
  Sparkles,
  Swords,
  Wallet,
  Zap,
} from "lucide-react";
import { LiveActivityFeedPanel } from "@/components/activity/live-activity-feed-panel";
import { CommunityStatusPanel } from "@/components/community/community-status-panel";
import { ArtworkImage } from "@/components/ui/artwork-image";
import { ContributionTierBadge } from "@/components/ui/contribution-tier-badge";
import { ShardBadge } from "@/components/ui/shard-badge";
import { StatusChip } from "@/components/ui/status-chip";
import { XpValue, isXpDisplay } from "@/components/ui/xp-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { useCommunityJourney } from "@/hooks/use-community-journey";
import { useLiveUserData } from "@/hooks/use-live-user-data";
import { buildLiveActivityFeed } from "@/lib/activity/live-activity-feed";
import { buildStreakLadderRead } from "@/lib/streaks/streak-ladder";

const HOME_HERO_IMAGE = "/assets/home/home-hero.webp";

type HomeNextAction = {
  href: string;
  label: string;
  title: string;
  meta: string;
  tone: "lime" | "cyan" | "amber" | "violet";
};

function toBackgroundImage(value: string) {
  return `url("${value.replaceAll('"', '\\"')}")`;
}

function getQuestTone(status: string) {
  if (status === "approved") return "positive";
  if (status === "pending") return "warning";
  if (status === "rejected") return "danger";
  return "info";
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function splitIntoColumns<T>(items: T[], count: number) {
  const columnSize = Math.ceil(items.length / count);
  return Array.from({ length: count }, (_, index) =>
    items.slice(index * columnSize, index * columnSize + columnSize)
  );
}

function getLevelProgress(xp: number) {
  const nextXp = Math.max(0, xp);
  return Math.min(100, Math.max(4, Math.round((nextXp % 1000) / 10)));
}

export function HomeScreen() {
  const { profile } = useAuth();
  const {
    loading,
    error,
    projects,
    campaigns,
    raids,
    rewards,
    quests,
    notifications,
    leaderboard,
    projectReputation,
    featuredShardPools,
    shardBalance,
    lootboxTiers,
    inventory,
    approvedQuestCount,
    pendingQuestCount,
    claimableRewardCount,
  } = useLiveUserData({
    datasets: [
      "projects",
      "campaigns",
      "raids",
      "rewards",
      "quests",
      "notifications",
      "leaderboard",
      "projectReputation",
      "featuredShardPools",
      "lootboxes",
      "inventory",
    ],
  });
  const {
    snapshot: communitySnapshot,
    loading: communityLoading,
    refreshing: communityRefreshing,
    error: communityError,
    advance: advanceCommunityJourney,
  } = useCommunityJourney();

  const enrichedCampaigns = campaigns
    .map((campaign) => {
      const linkedProject = projects.find((project) => project.id === campaign.projectId);
      return {
        ...campaign,
        projectName: linkedProject?.name ?? "Project",
        artwork: campaign.bannerUrl ?? campaign.thumbnailUrl ?? linkedProject?.bannerUrl ?? null,
      };
    })
    .sort(
      (left, right) =>
        Number(right.featured) - Number(left.featured) ||
        right.xpBudget - left.xpBudget ||
        right.completionRate - left.completionRate
    );

  const spotlightLead = enrichedCampaigns[0] ?? null;
  const spotlightQueue = enrichedCampaigns.slice(1, 4);

  const hotProjects = [...projects]
    .map((project) => {
      const linkedCampaignCount = campaigns.filter((campaign) => campaign.projectId === project.id).length;
      return {
        ...project,
        linkedCampaignCount,
      };
    })
    .sort((left, right) => right.linkedCampaignCount * 1000 + right.members - (left.linkedCampaignCount * 1000 + left.members))
    .slice(0, 10);
  const hotProjectColumns = splitIntoColumns(hotProjects, 2);

  const openQuestQueue = useMemo(
    () =>
      [...quests].sort(
        (left, right) =>
          Number(left.status === "approved") - Number(right.status === "approved") ||
          Number(right.isPlatformQuest) - Number(left.isPlatformQuest) ||
          (right.shardRewardAmount ?? 0) - (left.shardRewardAmount ?? 0) ||
          right.xp - left.xp
      ),
    [quests]
  );
  const dailyQuests = openQuestQueue.slice(0, 6);
  const shardQuestQueue = openQuestQueue.filter(
    (quest) => quest.status !== "approved" && (quest.shardRewardAmount ?? 0) > 0
  );
  const raidLane = [...raids].sort((left, right) => right.participants - left.participants).slice(0, 6);
  const rewardLane = [...rewards]
    .sort((left, right) => Number(right.claimable) - Number(left.claimable) || right.cost - left.cost)
    .slice(0, 6);
  const unlockedLootboxTiers = [...lootboxTiers]
    .filter((tier) => tier.eligibility.unlocked)
    .sort((left, right) => left.priceShards - right.priceShards);
  const nextLootboxTier = unlockedLootboxTiers[0] ?? [...lootboxTiers].sort((left, right) => left.priceShards - right.priceShards)[0] ?? null;
  const shardsUntilLootbox = nextLootboxTier ? Math.max(0, nextLootboxTier.priceShards - shardBalance) : 0;
  const currentRankIndex = leaderboard.findIndex((user) => user.isCurrentUser);
  const rankLabel =
    currentRankIndex >= 0
      ? `#${currentRankIndex + 1}`
      : profile?.reputationRank && profile.reputationRank > 0
        ? `#${profile.reputationRank}`
        : "Unranked";
  const strongestProjectRep = [...projectReputation].sort((left, right) => right.xp - left.xp)[0] ?? null;
  const activeShardPoolCount = featuredShardPools.filter((pool) => pool.status === "active").length;
  const activityFeed = useMemo(
    () =>
      buildLiveActivityFeed({
        notifications,
        preferredRoute: communitySnapshot.preferredRoute,
      }),
    [communitySnapshot.preferredRoute, notifications]
  );
  const weeklyShardPotential = shardQuestQueue.reduce(
    (total, quest) => total + Math.max(0, quest.shardRewardAmount ?? 0),
    0
  );
  const streakLadder = useMemo(
    () =>
      buildStreakLadderRead({
        currentStreak: profile?.streak ?? communitySnapshot.streakDays,
        quests,
      }),
    [communitySnapshot.streakDays, profile?.streak, quests]
  );
  const nextAction: HomeNextAction = (() => {
    const claimableReward = rewardLane.find((reward) => reward.claimable);
    if (claimableReward) {
      return {
        href: `/rewards/${claimableReward.id}`,
        label: "Claim reward",
        title: claimableReward.title,
        meta: `${claimableReward.rarity} reward ready`,
        tone: "amber",
      };
    }

    const shardQuest = shardQuestQueue[0];
    if (shardQuest) {
      return {
        href: `/quests/${shardQuest.id}`,
        label: "Earn shards",
        title: shardQuest.title,
        meta: `+${shardQuest.shardRewardAmount ?? 0} shards`,
        tone: "lime",
      };
    }

    if (nextLootboxTier && shardBalance >= nextLootboxTier.priceShards) {
      return {
        href: "/lootboxes",
        label: "Open lootbox",
        title: nextLootboxTier.label,
        meta: `${nextLootboxTier.priceShards} shards entry`,
        tone: "violet",
      };
    }

    const nextQuest = openQuestQueue.find((quest) => quest.status !== "approved");
    if (nextQuest) {
      return {
        href: `/quests/${nextQuest.id}`,
        label: "Start mission",
        title: nextQuest.title,
        meta: `${nextQuest.xp} XP available`,
        tone: "cyan",
      };
    }

    return {
      href: spotlightLead ? `/campaigns/${spotlightLead.id}` : "/projects",
      label: spotlightLead ? "Open campaign" : "Explore projects",
      title: spotlightLead?.title ?? "Find the next useful launch route",
      meta: spotlightLead?.projectName ?? "VYNTRO",
      tone: "cyan",
    };
  })();

  const commandLinks = [
    {
      href: "/projects",
      label: "Project lanes",
      meta: `${projects.length} spaces`,
      accent: "cyan" as const,
    },
    {
      href: "/campaigns",
      label: "Campaign board",
      meta: `${campaigns.length} lanes`,
      accent: "lime" as const,
    },
    {
      href: "/notifications",
      label: "Signals",
      meta: `${notifications.length} updates`,
      accent: "amber" as const,
    },
    {
      href: "/rewards",
      label: "Rewards",
      meta: `${claimableRewardCount} claimable`,
      accent: "violet" as const,
    },
  ];

  return (
    <div className="space-y-5">
      <HomeHero
        username={profile?.username ?? "Guest member"}
        tier={profile?.contributionTier ?? "explorer"}
        campaignCount={campaigns.length}
        questCount={quests.length}
        raidCount={raids.length}
        claimableRewardCount={claimableRewardCount}
        approvedQuestCount={approvedQuestCount}
        signalCount={notifications.length}
        primaryHref={nextAction.href}
        primaryLabel={nextAction.label}
        nextHref={claimableRewardCount > 0 ? "/rewards" : "/projects"}
        nextLabel={claimableRewardCount > 0 ? "View rewards" : "Explore projects"}
        nextTitle={nextAction.title}
        nextMeta={nextAction.meta}
        nextTone={nextAction.tone}
        level={profile?.level ?? 1}
        xp={profile?.xp ?? 0}
        xpProgress={getLevelProgress(profile?.xp ?? 0)}
        streak={profile?.streak ?? communitySnapshot.streakDays}
        shardBalance={shardBalance}
        walletConnected={Boolean(profile?.wallet)}
        rankLabel={rankLabel}
        strongestProjectLabel={strongestProjectRep?.projectName ?? "No project rank yet"}
        weeklyShardPotential={weeklyShardPotential}
        activeShardPoolCount={activeShardPoolCount}
        lootboxLabel={
          nextLootboxTier
            ? shardsUntilLootbox > 0
              ? `${shardsUntilLootbox} shards away`
              : "Ready to open"
            : "No active box"
        }
        inventoryCount={inventory.length}
        platformQuestCount={quests.filter((quest) => quest.isPlatformQuest).length}
      />

      <LiveActivityFeedPanel feed={activityFeed} compact />

      <StreakLadderPanel read={streakLadder} />

      <section className="grid gap-3.5 xl:grid-cols-[minmax(0,1.48fr)_280px]">
        <div className="rounded-[28px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(128,91,255,0.2),transparent_24%),radial-gradient(circle_at_78%_20%,rgba(0,209,255,0.14),transparent_24%),linear-gradient(180deg,rgba(10,11,15,0.995),rgba(6,7,10,0.995))] p-4 shadow-[0_22px_72px_rgba(0,0,0,0.38)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-200">Home</p>
              <h2 className="mt-2.5 text-[0.96rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.08rem]">
                Spotlight lanes first. Browse the rest fast.
              </h2>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
                Open the strongest surface first, then keep the rest in one dense pass.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <BoardStat label="Lanes" value={String(campaigns.length)} />
              <BoardStat label="Quests" value={String(quests.length)} />
              <BoardStat label="Rewards" value={String(claimableRewardCount)} />
            </div>
          </div>

          {loading ? (
            <HomeNotice text="Loading launch board..." />
          ) : error ? (
            <HomeNotice text={error} tone="error" />
          ) : spotlightLead ? (
            <>
              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.24fr)_minmax(0,0.76fr)]">
                <Link
                href={`/campaigns/${spotlightLead.id}`}
                prefetch={false}
                className="group relative overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,18,22,0.98),rgba(8,9,12,0.98))] p-4 transition hover:border-violet-300/20 sm:p-4.5"
              >
                {spotlightLead.artwork ? (
                  <>
                    <ArtworkImage
                      src={spotlightLead.artwork}
                      alt={spotlightLead.title}
                      tone="cyan"
                      fallbackLabel="Launch art offline"
                      className="absolute inset-0"
                      imgClassName="h-full w-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,12,0.28),rgba(6,8,12,0.94)_66%,rgba(6,8,12,0.98))]" />
                  </>
                ) : null}

                <div className="relative z-10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <CardPill>{spotlightLead.projectName}</CardPill>
                      <CardPill>{spotlightLead.featured ? "Featured" : "Live lane"}</CardPill>
                    </div>
                    <StatusChip
                      label={spotlightLead.featured ? "Featured" : "Open run"}
                      tone={spotlightLead.featured ? "positive" : "info"}
                    />
                  </div>

                  <p className="mt-6 max-w-[16ch] text-[1rem] font-semibold leading-6 text-white sm:text-[1.18rem]">
                    {spotlightLead.title}
                  </p>
                  <p className="mt-2.5 max-w-2xl line-clamp-2 text-[11px] leading-5 text-slate-300">
                    {spotlightLead.description || "High-signal launch lane with live steps, clear rewards and momentum already in motion."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <MetricPill label="XP" value={formatCompactNumber(spotlightLead.xpBudget)} />
                    <MetricPill label="Clear" value={`${spotlightLead.completionRate}%`} />
                    <MetricPill label="Space" value={spotlightLead.projectName} />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/6 pt-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Open first
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-100 transition group-hover:translate-x-0.5">
                      View campaign
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>

                <div className="grid gap-3">
                  {spotlightQueue.length > 0 ? (
                    spotlightQueue.map((campaign, index) => (
                      <Link
                        key={campaign.id}
                        href={`/campaigns/${campaign.id}`}
                        prefetch={false}
                        className="group relative overflow-hidden rounded-[20px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,16,20,0.98),rgba(8,9,11,0.98))] p-3 transition hover:border-cyan-300/16"
                      >
                        {campaign.artwork ? (
                          <>
                            <ArtworkImage
                              src={campaign.artwork}
                              alt={campaign.title}
                              tone="cyan"
                              fallbackLabel="Launch art offline"
                              className="absolute inset-0"
                              imgClassName="h-full w-full object-cover opacity-22"
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,11,0.34),rgba(5,7,11,0.92))]" />
                          </>
                        ) : null}

                        <div className="relative z-10">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                              Queue {index + 1}
                            </p>
                            <StatusChip label={campaign.projectName} tone="info" />
                          </div>
                          <p className="mt-2 text-[11px] font-semibold leading-5 text-white">{campaign.title}</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <MetricPill label="XP" value={formatCompactNumber(campaign.xpBudget)} />
                            <MetricPill label="Clear" value={`${campaign.completionRate}%`} />
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <HomeNotice text="No secondary live lanes yet." compact />
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/6 pt-3.5">
                <div className="flex flex-1 items-center gap-2">
                  {Array.from({ length: Math.max(4, spotlightQueue.length + (spotlightLead ? 1 : 0)) }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-[3px] flex-1 rounded-full ${
                        index === 0
                          ? "bg-violet-200 shadow-[0_0_16px_rgba(196,181,253,0.45)]"
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {commandLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300 transition hover:border-white/12 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <HomeNotice text="No live campaign is leading the board yet." />
          )}
        </div>

        <div className="rounded-[24px] border border-white/6 bg-[radial-gradient(circle_at_bottom_right,rgba(112,76,255,0.18),transparent_28%),linear-gradient(180deg,rgba(13,14,18,0.98),rgba(8,9,12,0.98))] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">My board</p>
          <p className="mt-2 text-[0.96rem] font-semibold tracking-[-0.02em] text-white">
            {profile?.username ?? "Guest member"}
          </p>

          <div className="mt-4 space-y-2.5">
            <AssetMetric
              label="Tier"
              value={profile?.contributionTier ?? "explorer"}
              icon={Sparkles}
              valueNode={<ContributionTierBadge tier={profile?.contributionTier ?? "explorer"} size="sm" />}
            />
            <AssetMetric label="Wallet" value={profile?.wallet ? "Connected" : "Not linked"} icon={Wallet} />
            <AssetMetric label="Signals" value={String(notifications.length)} icon={Radar} />
            <AssetMetric label="Approved" value={String(approvedQuestCount)} icon={Shield} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <MiniStat label="Streak" value={String(profile?.streak ?? communitySnapshot.streakDays)} />
            <MiniStat label="Pending" value={String(pendingQuestCount)} />
            <MiniStat label="Claimable" value={String(claimableRewardCount)} />
            <MiniStat label="Projects" value={String(projects.length)} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <QuickJump href="/community" label="Open community" />
            <QuickJump href="/notifications" label="Signals" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Hot spaces"
          title="Strongest participation now"
          description="Ranked first so the hottest spaces stay visible before the mission grids."
        />

        {loading ? (
          <HomeNotice text="Loading hot spaces..." />
        ) : error ? (
          <HomeNotice text={error} tone="error" />
        ) : hotProjects.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {hotProjectColumns.map((column, columnIndex) => (
              <RankPanel
                key={columnIndex}
                items={column}
                offset={columnIndex * Math.ceil(hotProjects.length / 2)}
              />
            ))}
          </div>
        ) : (
          <HomeNotice text="No spaces are active yet." />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Daily quests"
          title="Open quests"
          description="Title first. Action next. Rewards stay secondary."
        />

        {loading ? (
          <HomeNotice text="Loading quests..." />
        ) : error ? (
          <HomeNotice text={error} tone="error" />
        ) : dailyQuests.length > 0 ? (
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-5 2xl:grid-cols-6">
            {dailyQuests.map((quest) => (
              <Link
                key={quest.id}
                href={`/quests/${quest.id}`}
                prefetch={false}
                className="group rounded-[20px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,15,18,0.98),rgba(8,10,13,0.98))] p-3 transition hover:border-cyan-300/16"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                      <p className="truncate text-[0.86rem] font-semibold text-white">{quest.title}</p>
                      <p className="mt-1.5 truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">
                        {quest.verificationProvider ?? "custom route"}
                      </p>
                  </div>
                  <StatusChip label={quest.status} tone={getQuestTone(quest.status)} />
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                  <span>{quest.completionMode ?? "manual"}</span>
                  <XpValue size="xs">{quest.xp} XP</XpValue>
                </div>

                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  <MetricPill label="XP" value={String(quest.xp)} />
                  <MetricPill label="Mode" value={quest.completionMode ?? "manual"} />
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-white/6 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Open quest
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
          <HomeNotice text="No open quests are visible yet." />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Trending raids"
          title="Live pushes"
          description="Short dark slabs keep active raid pressure readable without the old utility wall."
        />

        {loading ? (
          <HomeNotice text="Loading raids..." />
        ) : error ? (
          <HomeNotice text={error} tone="error" />
        ) : raidLane.length > 0 ? (
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-5 2xl:grid-cols-6">
            {raidLane.map((raid) => (
              <Link
                key={raid.id}
                href={`/raids/${raid.id}`}
                prefetch={false}
                className="group rounded-[20px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,15,18,0.98),rgba(8,9,11,0.98))] p-3 transition hover:border-rose-300/16"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                      <p className="truncate text-[0.86rem] font-semibold text-white">{raid.title}</p>
                      <p className="mt-1.5 truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">
                        {raid.community}
                      </p>
                  </div>
                  <Swords className="mt-0.5 h-4 w-4 shrink-0 text-rose-200" />
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                  <span>{raid.timer}</span>
                  <span>{formatCompactNumber(raid.participants)} in</span>
                </div>

                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  <MetricPill label="Reward" value={`${formatCompactNumber(raid.reward)} XP`} />
                  <MetricPill label="People" value={formatCompactNumber(raid.participants)} />
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-white/6 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Open raid
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-rose-100">
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <HomeNotice text="No live raids are active yet." />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Token rewards"
          title="Claimable and high-signal rewards"
          description="Compact reward slabs keep the board browseable and fast to scan."
        />

        {loading ? (
          <HomeNotice text="Loading rewards..." />
        ) : error ? (
          <HomeNotice text={error} tone="error" />
        ) : rewardLane.length > 0 ? (
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-5 2xl:grid-cols-6">
            {rewardLane.map((reward) => (
              <Link
                key={reward.id}
                href={`/rewards/${reward.id}`}
                prefetch={false}
                className="group rounded-[20px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,15,18,0.98),rgba(8,9,11,0.98))] p-3 transition hover:border-amber-300/16"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                      <p className="truncate text-[0.86rem] font-semibold text-white">{reward.title}</p>
                      <p className="mt-1.5 truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">
                        {reward.rarity}
                      </p>
                  </div>
                  <StatusChip label={reward.claimable ? "Claimable" : "Locked"} tone={reward.claimable ? "positive" : "default"} />
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                  <span>{reward.rewardType}</span>
                  <XpValue size="xs">{reward.cost} XP</XpValue>
                </div>

                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  <MetricPill label="Cost" value={`${reward.cost} XP`} />
                  <MetricPill label="Type" value={reward.rewardType} />
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-white/6 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Reward ready
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-100">
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <HomeNotice text="No rewards are active yet." />
        )}
      </section>

      <section className="grid gap-3.5 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <div className="space-y-4">
          <SectionHeading
            eyebrow="Journey command"
            title="Keep one guided rail visible"
            description="After discovery, keep one compact command rail for the next move."
          />
          <CommunityStatusPanel
            snapshot={communitySnapshot}
            loading={communityLoading}
            refreshing={communityRefreshing}
            error={communityError}
            onAdvance={advanceCommunityJourney}
            mode="compact"
            actionLimit={2}
          />
        </div>

        <div className="space-y-4">
          <SectionHeading
            eyebrow="Open rails"
            title="Compact routes back into the grid"
            description="Keep these small and direct so the bottom of Home still feels curated."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {commandLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className="group rounded-[20px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,15,18,0.98),rgba(8,10,13,0.98))] p-3.5 transition hover:border-white/12"
              >
                <p
                  className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
                    link.accent === "lime"
                      ? "text-lime-300"
                      : link.accent === "amber"
                        ? "text-amber-200"
                        : link.accent === "violet"
                          ? "text-violet-200"
                          : "text-cyan-200"
                  }`}
                >
                  {link.meta}
                </p>
                <p className="mt-2.5 text-[13px] font-semibold text-white">{link.label}</p>
                <div className="mt-3.5 flex items-center justify-between border-t border-white/6 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Open route
                  </span>
                  <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:text-white" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function HomeHero({
  username,
  tier,
  campaignCount,
  questCount,
  raidCount,
  claimableRewardCount,
  approvedQuestCount,
  signalCount,
  primaryHref,
  primaryLabel,
  nextHref,
  nextLabel,
  nextTitle,
  nextMeta,
  nextTone,
  level,
  xp,
  xpProgress,
  streak,
  shardBalance,
  walletConnected,
  rankLabel,
  strongestProjectLabel,
  weeklyShardPotential,
  activeShardPoolCount,
  lootboxLabel,
  inventoryCount,
  platformQuestCount,
}: {
  username: string;
  tier: string;
  campaignCount: number;
  questCount: number;
  raidCount: number;
  claimableRewardCount: number;
  approvedQuestCount: number;
  signalCount: number;
  primaryHref: string;
  primaryLabel: string;
  nextHref: string;
  nextLabel: string;
  nextTitle: string;
  nextMeta: string;
  nextTone: HomeNextAction["tone"];
  level: number;
  xp: number;
  xpProgress: number;
  streak: number;
  shardBalance: number;
  walletConnected: boolean;
  rankLabel: string;
  strongestProjectLabel: string;
  weeklyShardPotential: number;
  activeShardPoolCount: number;
  lootboxLabel: string;
  inventoryCount: number;
  platformQuestCount: number;
}) {
  const momentumScore = Math.min(
    100,
    Math.max(
      12,
      approvedQuestCount * 12 +
        claimableRewardCount * 16 +
        Math.min(20, streak * 4) +
        Math.min(16, Math.floor(shardBalance / 10)) +
        campaignCount * 4 +
        raidCount * 3
    )
  );
  const nextToneClass =
    nextTone === "amber"
      ? "bg-amber-300 text-black hover:bg-amber-200"
      : nextTone === "violet"
        ? "bg-violet-300 text-black hover:bg-violet-200"
        : nextTone === "cyan"
          ? "bg-cyan-300 text-black hover:bg-cyan-200"
          : "bg-lime-300 text-black hover:bg-lime-200";

  return (
    <section className="motion-surface motion-light-sweep relative overflow-hidden rounded-[34px] border border-white/7 bg-[#05080b] shadow-[0_32px_110px_rgba(0,0,0,0.38)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.98] brightness-[0.98] contrast-110 saturate-125"
        style={{ backgroundImage: toBackgroundImage(HOME_HERO_IMAGE) }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_66%_16%,rgba(168,85,247,0.18),transparent_32%),linear-gradient(90deg,rgba(1,3,7,0.9),rgba(2,4,10,0.66)_36%,rgba(3,4,10,0.2)_64%,rgba(3,5,9,0.66)),linear-gradient(180deg,rgba(4,6,10,0.04),rgba(3,5,8,0.72))]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#050608] to-transparent" />

      <div className="relative z-10 grid min-h-[560px] gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_430px] xl:items-end">
        <div className="max-w-4xl self-end pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip label="Personal command" tone="positive" />
            <StatusChip label={`Level ${level}`} tone="info" />
            <StatusChip label={`${streak} day streak`} tone={streak > 0 ? "positive" : "default"} />
            <StatusChip label={walletConnected ? "Wallet linked" : "Wallet needed"} tone={walletConnected ? "positive" : "warning"} />
          </div>

          <h1 className="mt-7 max-w-[12ch] text-[3.3rem] font-black leading-[0.9] tracking-normal text-white [text-shadow:0_18px_70px_rgba(0,0,0,0.72)] sm:text-[4.8rem] xl:text-[6.2rem]">
            {username}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-100 sm:text-[1rem]">
            Your daily VYNTRO command center: earn shards, clear the next mission, open reward loops and keep your reputation moving.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className={`motion-press inline-flex items-center gap-2 rounded-full px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] transition ${nextToneClass}`}
            >
              <Rocket className="h-4 w-4" />
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={nextHref}
              className="motion-press inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl transition hover:border-cyan-300/24 hover:bg-cyan-300/10"
            >
              {nextLabel}
              <Gift className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid max-w-3xl gap-2.5 sm:grid-cols-3">
            <HeroSignal icon={<Zap className="h-4 w-4" />} label="XP progress" value={`${xpProgress}% to next`} />
            <HeroSignal icon={<Flame className="h-4 w-4" />} label="Shard upside" value={`+${weeklyShardPotential} open`} />
            <HeroSignal icon={<Radar className="h-4 w-4" />} label="Rank" value={rankLabel} />
          </div>
        </div>

        <div className="motion-surface relative overflow-hidden rounded-[28px] border border-white/9 bg-black/46 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(190,255,74,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_45%)]" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">Today</p>
                <h2 className="mt-2 text-[1.25rem] font-black text-white">Next best action</h2>
              </div>
              <ContributionTierBadge tier={tier} size="sm" />
            </div>

            <Link
              href={primaryHref}
              className="mt-4 block rounded-[22px] border border-lime-300/18 bg-lime-300/[0.07] p-4 transition hover:border-lime-300/30 hover:bg-lime-300/[0.1]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-200">{primaryLabel}</p>
              <p className="mt-2 line-clamp-2 text-[1rem] font-black leading-6 text-white">{nextTitle}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">{nextMeta}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/70" />
              </div>
            </Link>

            <div className="mt-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Momentum score</p>
                  <p className="mt-1 text-4xl font-black text-white">{momentumScore}%</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <ShardBadge value={shardBalance} size="sm" />
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {activeShardPoolCount} shard pools
                  </span>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#beff4a,#74f7ff,#c4b5fd)] shadow-[0_0_24px_rgba(190,255,74,0.28)]"
                  style={{ width: `${momentumScore}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <HeroPanelMetric label="Level" value={String(level)} sub={`${formatCompactNumber(xp)} XP`} icon={<Zap className="h-4 w-4" />} />
              <HeroPanelMetric label="Streak" value={String(streak)} sub="Daily loop" icon={<Flame className="h-4 w-4" />} />
              <HeroPanelMetric label="Lootbox" value={lootboxLabel} sub={`${inventoryCount} owned`} icon={<Box className="h-4 w-4" />} />
              <HeroPanelMetric label="Platform" value={String(platformQuestCount)} sub="VYNTRO quests" icon={<CheckCircle2 className="h-4 w-4" />} />
            </div>

            <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.04] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Strongest project</p>
                <StatusChip label={`${campaignCount} lanes`} tone="info" />
              </div>
              <p className="mt-2 truncate text-[13px] font-black text-white">{strongestProjectLabel}</p>
              <p className="mt-1 text-[10px] font-bold text-slate-400">
                {questCount} quests, {raidCount} raids, {signalCount} signals, {claimableRewardCount} claimable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type StreakLadderRead = ReturnType<typeof buildStreakLadderRead>;

function StreakLadderPanel({ read }: { read: StreakLadderRead }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/7 bg-[radial-gradient(circle_at_8%_0%,rgba(251,191,36,0.16),transparent_28%),radial-gradient(circle_at_92%_20%,rgba(34,211,238,0.12),transparent_28%),linear-gradient(145deg,rgba(10,12,16,0.98),rgba(5,7,11,0.99))] p-4 shadow-[0_22px_76px_rgba(0,0,0,0.32)] sm:p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(251,191,36,0.75),rgba(34,211,238,0.45),transparent)]" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)_260px] xl:items-stretch">
        <div className="rounded-[22px] border border-amber-300/14 bg-amber-300/[0.055] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
                Daily / Weekly Ladder
              </p>
              <h2 className="mt-2 text-[1.3rem] font-black text-white">
                {read.currentStreak} day streak
              </h2>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/18 bg-black/24 text-amber-100">
              <Flame className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <HeroPanelMetric
              label="Daily"
              value={read.dailyStatus === "claimed" ? "Done" : "Open"}
              sub="Today"
              icon={<CalendarDays className="h-4 w-4" />}
            />
            <HeroPanelMetric
              label="Weekly"
              value={`${read.weeklyProgress.current}/${read.weeklyProgress.target}`}
              sub={read.weeklyStatus}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <HeroPanelMetric
              label="Boost"
              value={read.multiplierLabel}
              sub="XP preview"
              icon={<Zap className="h-4 w-4" />}
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              <span>Weekly actions</span>
              <span>{read.weeklyProgress.percent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#fbbf24,#bef264,#67e8f9)] shadow-[0_0_22px_rgba(251,191,36,0.26)]"
                style={{ width: `${read.weeklyProgress.percent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {read.milestones.map((milestone) => (
            <div
              key={milestone.day}
              className={`relative overflow-hidden rounded-[22px] border p-4 ${
                milestone.status === "claimed"
                  ? "border-lime-300/16 bg-lime-300/[0.055]"
                  : milestone.status === "next"
                    ? "border-cyan-300/18 bg-cyan-300/[0.06]"
                    : "border-white/8 bg-white/[0.035] opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {milestone.label}
                  </p>
                  <p className="mt-2 text-[15px] font-black text-white">{milestone.reward}</p>
                </div>
                {milestone.status === "claimed" ? (
                  <CheckCircle2 className="h-4 w-4 text-lime-200" />
                ) : milestone.status === "next" ? (
                  <Flame className="h-4 w-4 text-cyan-200" />
                ) : (
                  <LockKeyhole className="h-4 w-4 text-slate-500" />
                )}
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-white/70"
                  style={{ width: `${milestone.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[22px] border border-cyan-300/14 bg-cyan-300/[0.055] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            Next streak move
          </p>
          <p className="mt-2 text-[15px] font-black leading-6 text-white">
            {read.nextAction?.label ?? "Keep streak alive"}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-slate-300">
            {read.nextAction?.meta ?? "Open the next verified action to protect the rhythm."}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <ShardBadge value={`+${read.weeklyShardUpside}`} size="sm" />
            <Link
              href={read.nextAction?.href ?? "/quests"}
              className="motion-press inline-flex items-center gap-2 rounded-full bg-cyan-300 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-black transition hover:bg-cyan-200"
            >
              Go
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroSignal({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/26 px-3.5 py-3 backdrop-blur-md">
      <div className="flex items-center gap-2 text-cyan-200">{icon}</div>
      <p className="mt-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-[13px] font-black text-white">{value}</p>
    </div>
  );
}

function HeroPanelMetric({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/28 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
        {icon ? <span className="text-lime-200/80">{icon}</span> : null}
      </div>
      <p className="mt-2 text-[1.35rem] font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-slate-400">{sub}</p>
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
        <h3 className="mt-1.5 text-[0.94rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.02rem]">
          {title}
        </h3>
        <p className="mt-1 text-[11px] leading-5 text-slate-400">{description}</p>
      </div>
      <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400">
        <ArrowRight className="h-3 w-3" />
      </span>
    </div>
  );
}

function BoardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-[11px] font-semibold text-white">{value}</p>
    </div>
  );
}

function CardPill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-300">
      {children}
    </span>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  const hasXpBadge = isXpDisplay(label, value);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/20 px-2 py-[3px] text-[7px] font-bold uppercase tracking-[0.12em] text-slate-400">
      <span>{label}</span>
      {hasXpBadge ? <XpValue size="xs">{value}</XpValue> : <span className="text-white">{value}</span>}
    </span>
  );
}

function AssetMetric({
  label,
  value,
  icon: Icon,
  valueNode,
}: {
  label: string;
  value: string;
  icon: typeof Sparkles;
  valueNode?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      {valueNode ?? <p className="text-[10px] font-semibold text-white">{value}</p>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/6 bg-black/20 px-2.5 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-[10px] font-semibold text-white">{value}</p>
    </div>
  );
}

function QuickJump({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-white/[0.08]"
    >
      {label}
    </Link>
  );
}

function RankPanel({
  items,
  offset,
}: {
  items: Array<{
    id: string;
    name: string;
    chain: string | null;
    category: string | null;
    members: number;
    linkedCampaignCount: number;
  }>;
  offset: number;
}) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(12,13,17,0.98),rgba(8,9,12,0.98))] p-3.5">
      <div className="flex items-center justify-between gap-3 border-b border-white/6 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Space</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Participation</p>
      </div>

      <div className="divide-y divide-white/6">
        {items.map((project, index) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            prefetch={false}
            className="grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3 py-3.5 transition first:pt-3.5 hover:text-cyan-100"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {String(offset + index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white">{project.name}</p>
              <p className="mt-1 truncate text-[10px] uppercase tracking-[0.18em] text-slate-500">
                {project.chain ?? project.category ?? "Project"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-semibold text-white">{formatCompactNumber(project.members)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                {project.linkedCampaignCount} lanes
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function HomeNotice({
  text,
  tone = "default",
  compact = false,
}: {
  text: string;
  tone?: "default" | "error";
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border px-3.5 ${compact ? "py-3.5" : "py-4"} text-[12px] ${
        tone === "error"
          ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
          : "border-white/8 bg-black/20 text-slate-300"
      }`}
    >
      {text}
    </div>
  );
}
