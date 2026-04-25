"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function CommunityDetailScreen() {
  const params = useParams<{ id: string }>();
  const communityId = Array.isArray(params.id) ? params.id[0] : params.id;
  const {
    loading,
    error,
    projects,
    campaigns,
    rewards,
    leaderboard,
    projectReputation,
    joinedCommunityIds,
    joinCommunity,
  } = useLiveUserData({
    datasets: [
      "projects",
      "campaigns",
      "rewards",
      "leaderboard",
      "projectReputation",
      "joinedCommunityIds",
    ],
  });
  const [busy, setBusy] = useState(false);

  const community = projects.find((item) => item.id === communityId);
  const communityCampaigns = useMemo(
    () => campaigns.filter((item) => item.projectId === communityId),
    [campaigns, communityId]
  );
  const highlightedRewards = useMemo(
    () =>
      rewards
        .filter((reward) => communityCampaigns.some((campaign) => campaign.id === reward.campaignId))
        .slice(0, 3),
    [communityCampaigns, rewards]
  );
  const communityReputation = projectReputation.find((item) => item.projectId === communityId);
  const communityLeaders = leaderboard.slice(0, 5).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
  const nextBestCampaigns = [...communityCampaigns]
    .sort((a, b) => {
      const featuredScore = Number(b.featured) - Number(a.featured);
      if (featuredScore !== 0) return featuredScore;
      return b.xpBudget - a.xpBudget;
    })
    .slice(0, 2);
  const joined = joinedCommunityIds.includes(communityId);

  if (loading) {
    return <Notice tone="default" text="Loading community..." />;
  }

  if (error) {
    return <Notice tone="error" text={error} />;
  }

  if (!community) {
    return <Notice tone="default" text="Community not found." />;
  }

  const currentCommunity = community;

  async function handleJoin() {
    setBusy(true);
    await joinCommunity(currentCommunity.id);
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(192,255,0,0.12),rgba(0,0,0,0)_26%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_52px_rgba(0,0,0,0.24)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
              Community Detail
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
              {currentCommunity.name}
            </h2>
            <p className="mt-3 text-sm text-lime-200">
              {currentCommunity.chain ?? "Community"}
              {currentCommunity.category ? ` - ${currentCommunity.category}` : ""}
              {` - ${currentCommunity.members.toLocaleString()} members`}
            </p>
          </div>
          <StatusChip label={joined ? "Joined" : "Explore"} tone={joined ? "positive" : "info"} />
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          {currentCommunity.description}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => void handleJoin()}
            disabled={busy}
            className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Updating..." : joined ? "Leave community" : "Join community"}
          </button>
          {currentCommunity.website ? (
            <a
              href={currentCommunity.website}
              target="_blank"
              rel="noreferrer"
              className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Open website
            </a>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <MetricTile label="Rewards" value={`${highlightedRewards.length} live`} />
          <MetricTile label="Campaigns" value={String(communityCampaigns.length)} />
          <MetricTile label="Joined" value={joined ? "Yes" : "No"} />
          <MetricTile label="Trust" value={String(communityReputation?.trustScore ?? 50)} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface
          eyebrow="Story"
          title="What this project stands for"
          description="Web now has the same stronger ecosystem framing as the mobile community screen."
        >
          <p className="text-sm leading-7 text-slate-300">
            {currentCommunity.description ||
              "This community uses VYNTRO to run campaigns, highlight contributors and convert engagement into visible reputation."}
          </p>
        </Surface>

        <Surface
          eyebrow="Reputation"
          title="Project reputation"
          description="Your momentum inside this ecosystem is tracked separately from your global VYNTRO score."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricTile
              label="Tier"
              value={communityReputation ? communityReputation.contributionTier.toUpperCase() : "NOT STARTED"}
            />
            <MetricTile label="Rank" value={communityReputation?.rank ? `#${communityReputation.rank}` : "-"} />
            <MetricTile label="Project XP" value={communityReputation ? communityReputation.xp.toLocaleString() : "0"} />
            <MetricTile label="Trust" value={String(communityReputation?.trustScore ?? 50)} />
          </div>
        </Surface>
      </div>

      <Surface
        eyebrow="Campaigns"
        title="Active campaigns"
        description="All active campaigns inside this community."
      >
        {communityCampaigns.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {communityCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                prefetch={false}
                className="panel-card rounded-[26px] p-5 transition hover:border-lime-300/30 hover:bg-black/25"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white">{campaign.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{campaign.description}</p>
                  </div>
                  <StatusChip
                    label={campaign.featured ? "Featured" : `${campaign.completionRate}% live`}
                    tone={campaign.featured ? "positive" : "info"}
                  />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MiniStat label="XP budget" value={String(campaign.xpBudget)} />
                  <MiniStat label="Ends" value={campaign.endsAt ? new Date(campaign.endsAt).toLocaleDateString("nl-NL") : "Open"} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No live campaigns are tied to this community yet." />
        )}
      </Surface>

      {nextBestCampaigns.length > 0 ? (
        <Surface
          eyebrow="Best Next Move"
          title="Strongest campaign entries"
          description="The highest-signal mission starts inside this ecosystem right now."
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {nextBestCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                prefetch={false}
                className="panel-card rounded-[26px] p-5 transition hover:border-cyan-300/30 hover:bg-black/25"
              >
                <p className="text-sm font-semibold text-cyan-200">
                  {campaign.featured ? "Momentum" : "Start here"}
                </p>
                        <p className="mt-1.5 text-[15px] font-black text-white">{campaign.title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{campaign.description}</p>
              </Link>
            ))}
          </div>
        </Surface>
      ) : null}

      <Surface
        eyebrow="Leaderboard"
        title="Top contributors"
        description="Current contributor ladder inside this community surface."
      >
        {communityLeaders.length > 0 ? (
          <div className="space-y-4">
            {communityLeaders.map((item) => (
              <article
                key={item.id}
                className={`rounded-[26px] border p-5 ${
                  item.isCurrentUser
                    ? "border-lime-300/30 bg-lime-300/10"
                    : "panel-card"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="metric-card flex h-12 w-12 items-center justify-center rounded-full text-lg font-black text-white">
                      {item.rank}
                    </div>
                    <div>
                      <p className="text-lg font-black text-white">{item.username}</p>
                      <p className="mt-1 text-sm text-slate-300">Level {item.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.isCurrentUser ? <StatusChip label="You" tone="positive" /> : null}
                    <StatusChip label={`${item.xp} XP`} tone="info" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No community leaders yet." />
        )}
      </Surface>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[24px] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[20px] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
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
