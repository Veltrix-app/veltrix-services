"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { Coins, Radar, RefreshCcw, ShieldCheck, Wallet2 } from "lucide-react";
import { ArtworkImage } from "@/components/ui/artwork-image";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuth } from "@/components/providers/auth-provider";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function CampaignDetailScreen() {
  const params = useParams<{ id: string }>();
  const campaignId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { session, profile, connectedAccounts } = useAuth();
  const {
    loading,
    error,
    campaigns,
    projects,
    quests,
    rewards,
    xpStakes,
    rewardDistributions,
    reload,
  } = useLiveUserData({
    datasets: [
      "campaigns",
      "projects",
      "quests",
      "rewards",
      "xpStakes",
      "rewardDistributions",
    ],
  });
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeBusy, setStakeBusy] = useState(false);
  const [stakeMessage, setStakeMessage] = useState<{
    tone: "default" | "error" | "success";
    text: string;
  } | null>(null);
  const [stakeLeaderboard, setStakeLeaderboard] = useState<
    Array<{
      rank: number;
      stakeId: string;
      username: string;
      avatarUrl?: string;
      stakedXp: number;
      weightedXp: number;
      state: string;
      rewardStatus: string;
      rewardAmount: number;
      rewardAsset: string | null;
    }>
  >([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const campaign = campaigns.find((item) => item.id === campaignId);
  const project = projects.find((item) => item.id === campaign?.projectId);
  const campaignQuests = quests.filter((item) => item.campaignId === campaignId);
  const campaignRewards = rewards.filter((item) => item.campaignId === campaignId);
  const campaignStake = xpStakes.find((item) => item.campaignId === campaignId) ?? null;
  const campaignDistributions = rewardDistributions.filter((item) => item.campaignId === campaignId);
  const claimableDistribution =
    campaignDistributions.find((item) => item.status === "claimable") ?? campaignDistributions[0] ?? null;
  const connectedSocialCount = connectedAccounts.filter((account) => account.status === "connected").length;
  const requiredActiveXp = Math.max(campaign?.minXpRequired ?? 0, campaign?.activityThreshold ?? 0);
  const walletReady = Boolean(profile?.wallet && profile?.walletVerified);
  const socialReady = connectedSocialCount > 0;
  const activeXp = profile?.activeXp ?? 0;
  const activeXpReady = activeXp >= requiredActiveXp;
  const trustScore = profile?.trustScore ?? 50;
  const trustReady = trustScore >= 40;
  const canStake =
    Boolean(session?.access_token) &&
    Boolean(campaign) &&
    campaign?.campaignMode !== null &&
    walletReady &&
    socialReady &&
    activeXpReady &&
    trustReady;

  const stakeRecommendation = useMemo(() => {
    if (!campaign) {
      return "";
    }

    const lowerBound = Math.max(requiredActiveXp, 50);
    const recommended = Math.min(Math.max(lowerBound, 100), Math.max(activeXp, 0));
    return recommended > 0 ? String(recommended) : "";
  }, [activeXp, campaign, requiredActiveXp]);

  useEffect(() => {
    if (!stakeAmount && stakeRecommendation) {
      setStakeAmount(stakeRecommendation);
    }
  }, [stakeAmount, stakeRecommendation]);

  useEffect(() => {
    let cancelled = false;

    async function loadStakeLeaderboard() {
      if (!campaignId || !session?.access_token) {
        return;
      }

      setLeaderboardLoading(true);

      const response = await fetch(`/api/campaigns/${campaignId}/leaderboard?limit=8`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      const payload = await response.json().catch(() => null);
      if (cancelled) {
        return;
      }

      if (!response.ok || !payload?.ok) {
        setStakeMessage((current) =>
          current ?? {
            tone: "error",
            text: payload?.error ?? "Could not read the stake leaderboard right now.",
          }
        );
        setLeaderboardLoading(false);
        return;
      }

      setStakeLeaderboard(Array.isArray(payload.items) ? payload.items : []);
      setLeaderboardLoading(false);
    }

    void loadStakeLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [campaignId, session?.access_token]);

  if (loading) return <Notice tone="default" text="Loading campaign..." />;
  if (error) return <Notice tone="error" text={error} />;
  if (!campaign) return <Notice tone="default" text="Campaign not found." />;

  const activeCampaign = campaign;

  async function handleStake() {
    if (!session?.access_token) {
      setStakeMessage({
        tone: "error",
        text: "Sign in before staking into this campaign.",
      });
      return;
    }

    setStakeBusy(true);
    setStakeMessage(null);

    const response = await fetch(`/api/campaigns/${activeCampaign.id}/stakes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        stakedXp: Number(stakeAmount),
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      setStakeMessage({
        tone: "error",
        text: payload?.error ?? "The stake request did not clear.",
      });
      setStakeBusy(false);
      return;
    }

    setStakeMessage({
      tone: "success",
      text: "XP stake locked in. The active campaign pool now sees this member on the live stake board.",
    });
    setStakeBusy(false);
    await reload();

    const leaderboardResponse = await fetch(
      `/api/campaigns/${activeCampaign.id}/leaderboard?limit=8`,
      {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
      }
    );
    const leaderboardPayload = await leaderboardResponse.json().catch(() => null);
    if (leaderboardResponse.ok && leaderboardPayload?.ok) {
      setStakeLeaderboard(Array.isArray(leaderboardPayload.items) ? leaderboardPayload.items : []);
    }
  }

  async function handleRefreshStake() {
    if (!session?.access_token || !campaignStake) {
      return;
    }

    setStakeBusy(true);
    setStakeMessage(null);

    const response = await fetch(
      `/api/campaigns/${activeCampaign.id}/stakes/${campaignStake.id}/refresh`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      setStakeMessage({
        tone: "error",
        text: payload?.error ?? "The live stake pulse could not refresh.",
      });
      setStakeBusy(false);
      return;
    }

    setStakeMessage({
      tone: "success",
      text: "Stake pulse refreshed. This campaign now sees your latest live activity window.",
    });
    setStakeBusy(false);
    await reload();
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(135deg,rgba(192,255,0,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        {activeCampaign.bannerUrl || activeCampaign.thumbnailUrl ? (
          <div className="relative h-64 bg-[linear-gradient(135deg,rgba(192,255,0,0.14),rgba(0,0,0,0.18))]">
            <ArtworkImage
              src={activeCampaign.bannerUrl ?? activeCampaign.thumbnailUrl}
              alt={activeCampaign.title}
              tone="lime"
              fallbackLabel="Campaign art offline"
              imgClassName="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </div>
        ) : null}

        <div className="p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">Campaign</p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-[14ch]">
              <h2 className="font-display text-balance text-[clamp(2.2rem,4vw,4.5rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                {activeCampaign.title}
              </h2>
              <p className="mt-3 text-sm text-lime-200">{project?.name ?? "Project"}</p>
            </div>
            <StatusChip label={campaign.featured ? "Featured" : `${campaign.completionRate}% live`} tone={campaign.featured ? "positive" : "info"} />
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            {activeCampaign.description}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <MetricTile label="XP budget" value={String(activeCampaign.xpBudget)} />
            <MetricTile label="Quests" value={String(campaignQuests.length)} />
            <MetricTile label="Rewards" value={String(campaignRewards.length)} />
            <MetricTile
              label="Ends"
              value={
                activeCampaign.endsAt
                  ? new Date(activeCampaign.endsAt).toLocaleDateString("nl-NL")
                  : "Open"
              }
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface
          eyebrow="Campaign Read"
          title="Campaign posture"
          description="This campaign should feel like an active operation with live pressure and real outcome."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricTile label="Project" value={project?.name ?? "Unlinked"} />
            <MetricTile label="Completion" value={`${activeCampaign.completionRate}%`} />
            <MetricTile label="Featured" value={activeCampaign.featured ? "Yes" : "No"} />
            <MetricTile label="Window" value={activeCampaign.endsAt ? "Timed" : "Open"} />
          </div>
        </Surface>

        <Surface
          eyebrow="AESP Staking"
          title="Campaign stake posture"
          description="Stake active XP into this campaign, keep the pulse fresh, and watch claimable distribution weight build against the live pool."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricTile label="Active XP" value={String(activeXp)} />
            <MetricTile label="Minimum" value={String(requiredActiveXp)} />
            <MetricTile label="Trust" value={`${trustScore}`} />
            <MetricTile
              label="Pool"
              value={`${activeCampaign.rewardPoolAmount ?? 0} ${activeCampaign.rewardType ?? "pool"}`}
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <GateCard
              icon={<Wallet2 className="h-4 w-4" />}
              label="Verified wallet"
              value={walletReady ? "Ready" : "Missing"}
              ready={walletReady}
            />
            <GateCard
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Linked systems"
              value={socialReady ? `${connectedSocialCount} linked` : "Missing"}
              ready={socialReady}
            />
            <GateCard
              icon={<Coins className="h-4 w-4" />}
              label="Active XP gate"
              value={activeXpReady ? "Passed" : "Below threshold"}
              ready={activeXpReady}
            />
            <GateCard
              icon={<Radar className="h-4 w-4" />}
              label="Trust read"
              value={trustReady ? "Eligible" : "Below launch threshold"}
              ready={trustReady}
            />
          </div>

          <div className="mt-5 rounded-[24px] border border-white/8 bg-black/20 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[180px] flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Stake XP
                </p>
                <input
                  value={stakeAmount}
                  onChange={(event) => setStakeAmount(event.target.value)}
                  inputMode="numeric"
                  className="mt-3 w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-lime-300/35 focus:bg-white/[0.07]"
                  placeholder={stakeRecommendation || "100"}
                />
              </div>
              <button
                onClick={() => void handleStake()}
                disabled={!canStake || stakeBusy}
                className={`rounded-full px-5 py-3 text-sm font-black transition ${
                  canStake && !stakeBusy
                    ? "bg-lime-300 text-black hover:scale-[0.99]"
                    : "cursor-not-allowed border border-white/10 bg-white/[0.05] text-slate-400"
                }`}
              >
              {campaignStake ? "Update stake" : "Stake into campaign"}
              </button>
              {campaignStake ? (
                <button
                  onClick={() => void handleRefreshStake()}
                  disabled={stakeBusy}
                  className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh pulse
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Stake state" value={campaignStake?.state ?? "Not staked"} />
              <MiniStat
                label="Weighted XP"
                value={
                  campaignStake
                    ? String(
                        Number(
                          (
                            (campaignStake.stakedXp ?? 0) * (campaignStake.activeMultiplier ?? 1)
                          ).toFixed(2)
                        )
                      )
                    : "0"
                }
              />
              <MiniStat
                label="Distribution"
                value={
                  claimableDistribution
                    ? `${Number(claimableDistribution.rewardAmount.toFixed(4))} ${
                        claimableDistribution.rewardAsset
                      }`
                    : "Pending"
                }
              />
            </div>

            {stakeMessage ? (
              <div
                className={`mt-4 rounded-[18px] px-4 py-3 text-sm ${
                  stakeMessage.tone === "error"
                    ? "border border-rose-400/20 bg-rose-500/10 text-rose-200"
                    : stakeMessage.tone === "success"
                      ? "border border-lime-300/20 bg-lime-300/10 text-lime-100"
                      : "border border-white/8 bg-white/[0.04] text-slate-300"
                }`}
              >
                {stakeMessage.text}
              </div>
            ) : null}
          </div>
        </Surface>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface
          eyebrow="Pool Leaderboard"
          title="Stake pressure"
          description="Active members ranked by weighted stake inside this campaign."
        >
          {leaderboardLoading ? (
            <Notice tone="default" text="Loading campaign pool..." />
          ) : stakeLeaderboard.length > 0 ? (
            <div className="space-y-3">
              {stakeLeaderboard.map((entry) => (
                <div
                  key={entry.stakeId}
                  className="flex items-center justify-between gap-4 rounded-[24px] border border-white/8 bg-black/20 px-4 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-lime-300/18 bg-lime-300/10 text-sm font-black text-lime-100">
                      #{entry.rank}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{entry.username}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {entry.state} stake
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{entry.weightedXp} weighted XP</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {entry.rewardAmount > 0 && entry.rewardAsset
                        ? `${Number(entry.rewardAmount.toFixed(4))} ${entry.rewardAsset}`
                        : "No distribution yet"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Notice tone="default" text="No live stakes have landed in this campaign yet." />
          )}
        </Surface>

        <Surface
          eyebrow="Mission Routing"
          title="Move through the campaign"
          description="Jump directly into the project or community context around this campaign while the AESP layer handles the stake and distribution pressure."
        >
          <div className="flex flex-wrap gap-3">
            {project ? (
              <Link href={`/projects/${project.id}`} prefetch={false} className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99]">
              Open project
              </Link>
            ) : null}
            {project ? (
              <Link href={`/communities/${project.id}`} prefetch={false} className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
              Open community
              </Link>
            ) : null}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniStat label="Campaign mode" value={activeCampaign.campaignMode ?? "offchain"} />
            <MiniStat label="Reward asset" value={activeCampaign.rewardType ?? "campaign_pool"} />
          </div>
        </Surface>
      </div>

      <Surface
        eyebrow="Quest Flow"
        title="Mission steps"
          description="Verification-aware mission steps tied to this campaign."
      >
        {campaignQuests.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {campaignQuests.map((quest) => (
              <Link key={quest.id} href={`/quests/${quest.id}`} prefetch={false} className="panel-card rounded-[30px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white">{quest.title}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {quest.verificationProvider ? `${quest.verificationProvider} verification` : "Custom verification"}
                    </p>
                  </div>
                  <StatusChip
                    label={quest.status}
                    tone={
                      quest.status === "approved"
                        ? "positive"
                        : quest.status === "pending"
                          ? "warning"
                          : quest.status === "rejected"
                            ? "danger"
                            : "info"
                    }
                  />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MiniStat label="XP" value={`+${quest.xp}`} />
                  <MiniStat label="Mode" value={quest.completionMode ?? "manual"} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
            <Notice tone="default" text="No quests are linked to this campaign yet." />
        )}
      </Surface>

      <Surface
        eyebrow="Reward Outcome"
        title="Campaign rewards"
          description="Reward outcomes unlocked or progressed by this campaign."
      >
        {campaignRewards.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {campaignRewards.map((reward) => (
              <Link key={reward.id} href={`/rewards/${reward.id}`} prefetch={false} className="panel-card rounded-[30px] p-5 transition hover:border-lime-300/30 hover:bg-black/25">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white">{reward.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{reward.description}</p>
                  </div>
                  <StatusChip label={reward.claimable ? "Claimable" : "Locked"} tone={reward.claimable ? "positive" : "default"} />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MiniStat label="Cost" value={`${reward.cost} XP`} />
                  <MiniStat label="Rarity" value={reward.rarity} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
            <Notice tone="default" text="No rewards are linked to this campaign yet." />
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

function GateCard({
  icon,
  label,
  value,
  ready,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  ready: boolean;
}) {
  return (
    <div className="metric-card rounded-[20px] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          {icon}
          <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{label}</p>
        </div>
        <StatusChip label={ready ? "Ready" : "Blocked"} tone={ready ? "positive" : "warning"} />
      </div>
      <p className="mt-3 text-sm font-semibold text-white">{value}</p>
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
