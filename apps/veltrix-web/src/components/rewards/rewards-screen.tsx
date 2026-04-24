"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

type RewardFilter = "all" | "claimable" | "high-value";

export function RewardsScreen() {
  const {
    loading,
    error,
    rewards,
    campaigns,
    claimableRewardCount,
    rewardDistributions,
    claimRewardDistribution,
  } = useLiveUserData({
    datasets: ["rewards", "campaigns", "rewardDistributions"],
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RewardFilter>("all");
  const [activeDistributionId, setActiveDistributionId] = useState<string | null>(null);
  const [distributionMessage, setDistributionMessage] = useState<{
    tone: "default" | "error" | "success";
    text: string;
  } | null>(null);

  const enrichedRewards = useMemo(() => {
    return rewards
      .map((reward) => {
        const linkedCampaign = campaigns.find((campaign) => campaign.id === reward.campaignId);

        return {
          ...reward,
          linkedCampaignTitle: linkedCampaign?.title ?? "Direct reward",
        };
      })
      .sort((left, right) => Number(right.claimable) - Number(left.claimable) || right.cost - left.cost);
  }, [rewards, campaigns]);

  const filteredRewards = useMemo(() => {
    let items = enrichedRewards;

    if (query.trim()) {
      const normalized = query.toLowerCase();
      items = items.filter((reward) =>
        [reward.title, reward.description, reward.rewardType, reward.linkedCampaignTitle].some((value) =>
          value.toLowerCase().includes(normalized)
        )
      );
    }

    if (filter === "claimable") {
      items = items.filter((reward) => reward.claimable);
    }

    if (filter === "high-value") {
      items = items.filter((reward) => reward.cost >= 500);
    }

    return items;
  }, [enrichedRewards, filter, query]);

  const spotlightRewards = filteredRewards.slice(0, 3);
  const highValueCount = enrichedRewards.filter((reward) => reward.cost >= 500).length;
  const lockedCount = enrichedRewards.filter((reward) => !reward.claimable).length;
  const payoutRows = useMemo(() => {
    return rewardDistributions
      .map((distribution) => {
        const linkedCampaign = campaigns.find((campaign) => campaign.id === distribution.campaignId);

        return {
          ...distribution,
          campaignTitle: linkedCampaign?.title ?? "Campaign pool",
          rewardAmountLabel: Number(distribution.rewardAmount.toFixed(2)).toString(),
          stateLabel:
            distribution.status === "claimable"
              ? "Claimable"
              : distribution.status === "queued"
                ? "Queued"
                : distribution.status === "processing"
                  ? "Processing"
                  : distribution.status === "paid"
                    ? "Paid"
                    : distribution.status === "rejected"
                      ? "Rejected"
                      : distribution.status,
        };
      })
      .sort((left, right) => {
        const leftClaimable = left.status === "claimable" ? 1 : 0;
        const rightClaimable = right.status === "claimable" ? 1 : 0;
        return rightClaimable - leftClaimable || right.rewardAmount - left.rewardAmount;
      });
  }, [campaigns, rewardDistributions]);
  const claimableDistributionRows = payoutRows.filter((distribution) => distribution.status === "claimable");
  const pendingDistributionCount = rewardDistributions.filter(
    (distribution) => distribution.status === "queued" || distribution.status === "processing"
  ).length;

  async function handleClaimDistribution(distributionId: string) {
    try {
      setActiveDistributionId(distributionId);
      setDistributionMessage({
        tone: "default",
        text: "Routing this payout lane into the operator queue now.",
      });

      const result = await claimRewardDistribution(distributionId);
      if (!result.ok) {
        throw new Error(result.error ?? "Campaign payout claim failed.");
      }

      setDistributionMessage({
        tone: "success",
        text: result.alreadyQueued
          ? "This payout lane was already queued and has been refreshed."
          : "Campaign payout queued. Operators can now push it through processing and payout.",
      });
    } catch (nextError) {
      setDistributionMessage({
        tone: "error",
        text:
          nextError instanceof Error ? nextError.message : "Campaign payout claim failed.",
      });
    } finally {
      setActiveDistributionId(null);
    }
  }

  return (
    <div className="space-y-7">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_300px]">
        <div className="rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_26%),linear-gradient(180deg,rgba(13,15,18,0.99),rgba(6,8,11,0.99))] p-4 shadow-[0_20px_54px_rgba(0,0,0,0.24)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">Reward lanes</p>
            <h2 className="mt-2.5 text-[1rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.12rem]">
              Keep the payoff layer compact and obvious
            </h2>
            <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-slate-400">
              Reward lanes should open fast: title first, unlock state next, payout context after that.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <BoardStat label="Rewards" value={String(enrichedRewards.length)} />
            <BoardStat label="Claimable" value={String(claimableRewardCount)} />
            <BoardStat label="Locked" value={String(lockedCount)} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Find</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Reward, rarity or linked campaign..."
              className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-slate-500"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
            <FilterButton active={filter === "claimable"} onClick={() => setFilter("claimable")} label="Claimable" />
            <FilterButton active={filter === "high-value"} onClick={() => setFilter("high-value")} label="High value" />
          </div>
        </div>
        </div>

        <div className="rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.12),transparent_28%),linear-gradient(180deg,rgba(13,14,18,0.98),rgba(8,9,12,0.98))] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Payoff signal</p>
          <p className="mt-2.5 text-[1rem] font-semibold tracking-[-0.02em] text-white">
            Reward pressure
          </p>

          <div className="mt-4 space-y-2.5">
            <SignalCard label="Claimable" value={String(claimableRewardCount)} meta="ready now" />
            <SignalCard label="Locked" value={String(lockedCount)} meta="not unlocked" />
            <SignalCard label="Pending payout" value={String(pendingDistributionCount)} meta="distribution queue" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Spotlights"
          title="Rewards worth opening first"
          description="A short top row for the unlocks and pools currently carrying the most payoff pressure."
        />

        {loading ? (
          <EmptyNotice text="Loading reward spotlights..." />
        ) : error ? (
          <EmptyNotice text={error} tone="error" />
        ) : spotlightRewards.length > 0 ? (
          <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]">
            {spotlightRewards.map((reward, index) => (
              <Link
                key={reward.id}
                href={`/rewards/${reward.id}`}
                prefetch={false}
                className={`group relative overflow-hidden rounded-[25px] border border-white/6 bg-[linear-gradient(180deg,rgba(18,20,24,0.98),rgba(9,11,15,0.98))] shadow-[0_18px_52px_rgba(0,0,0,0.26)] transition hover:border-amber-300/18 hover:bg-[linear-gradient(180deg,rgba(24,22,18,0.98),rgba(10,11,14,0.98))] ${
                  index === 0 ? "min-h-[238px] p-4.5 sm:p-5" : "min-h-[200px] p-3.5 sm:p-4"
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_35%),linear-gradient(180deg,rgba(10,12,15,0.08),rgba(10,12,15,0.88))]" />
                <div className="relative flex h-full flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <CardPill>{reward.linkedCampaignTitle}</CardPill>
                      <CardPill>{reward.rewardType}</CardPill>
                    </div>
                    <StatusChip label={reward.claimable ? "Ready" : "Locked"} tone={reward.claimable ? "positive" : "default"} />
                  </div>

                  <h3
                    className={`font-semibold leading-6 text-white ${
                      index === 0 ? "mt-6 text-[1.06rem]" : "mt-5 text-[0.94rem]"
                    }`}
                  >
                    {reward.title}
                  </h3>
                  <p className="mt-2.5 line-clamp-2 text-[12px] leading-5 text-slate-300">
                    {reward.description || "Reward lane with clear cost pressure and a live claim state."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <MetricPill label="Cost" value={`${reward.cost} XP`} />
                    <MetricPill label="Rarity" value={reward.rarity} />
                    <MetricPill label="Type" value={reward.rewardType} />
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-white/6 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Reward lane
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200 transition group-hover:translate-x-0.5">
                      View
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyNotice text="No reward spotlights are visible yet." />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Grid"
          title="All rewards"
          description="Dense text-first slabs keep the reward board easy to browse without drowning the payoff story in big media."
        />

        {loading ? (
          <EmptyNotice text="Loading rewards..." />
        ) : error ? (
          <EmptyNotice text={error} tone="error" />
        ) : filteredRewards.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
            {filteredRewards.map((reward) => (
              <Link
                key={reward.id}
                href={`/rewards/${reward.id}`}
                prefetch={false}
                className="group rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,17,20,0.98),rgba(7,9,12,0.98))] p-3.5 transition hover:border-amber-300/16 hover:bg-[linear-gradient(180deg,rgba(21,19,16,0.98),rgba(8,10,13,0.98))]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[0.94rem] font-semibold text-white">{reward.title}</p>
                    <p className="mt-2 truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      {reward.linkedCampaignTitle}
                    </p>
                  </div>
                  <StatusChip label={reward.claimable ? "Ready" : "Locked"} tone={reward.claimable ? "positive" : "default"} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                  <span>{reward.rarity}</span>
                  <span>{reward.cost} XP</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <MetricPill label="Type" value={reward.rewardType} />
                  <MetricPill label="State" value={reward.claimable ? "ready" : "locked"} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Open reward
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-200">
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyNotice text="No rewards match this board filter yet." />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Payout lanes"
          title="Campaign pool claims"
          description="Campaign distributions stay compact here so payout actions remain available without taking over the whole reward board."
        />

        <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            {distributionMessage ? (
              <EmptyNotice
                text={distributionMessage.text}
                tone={distributionMessage.tone === "error" ? "error" : "default"}
              />
            ) : null}

            {payoutRows.length > 0 ? (
              payoutRows.slice(0, 6).map((distribution) => (
                <div
                  key={distribution.id}
                  className="rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(16,18,21,0.98),rgba(8,10,13,0.98))] p-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-white">{distribution.campaignTitle}</p>
                      <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        {distribution.rewardAsset}
                      </p>
                    </div>
                    <StatusChip
                      label={distribution.stateLabel}
                      tone={
                        distribution.status === "claimable"
                          ? "positive"
                          : distribution.status === "queued" || distribution.status === "processing"
                            ? "warning"
                            : distribution.status === "paid"
                              ? "info"
                              : distribution.status === "rejected"
                                ? "danger"
                                : "default"
                      }
                    />
                  </div>

                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    <MetricPill label="Pool" value={distribution.rewardAmountLabel} />
                    <MetricPill label="State" value={distribution.stateLabel} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/6 pt-3">
                    {distribution.status === "claimable" ? (
                      <button
                        onClick={() => void handleClaimDistribution(distribution.id)}
                        disabled={activeDistributionId === distribution.id}
                        className="rounded-full bg-lime-300 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-950 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-lime-300/40"
                      >
                        {activeDistributionId === distribution.id ? "Queueing..." : "Queue payout"}
                      </button>
                    ) : (
                      <span className="rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        {distribution.status === "paid"
                          ? "Already paid"
                          : distribution.status === "rejected"
                            ? "Needs review"
                            : "In queue"}
                      </span>
                    )}

                    <Link
                      href={`/campaigns/${distribution.campaignId}`}
                      prefetch={false}
                      className="rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300 transition hover:border-white/12 hover:text-white"
                    >
                      Open campaign
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <EmptyNotice text="No campaign pool payout lanes have landed yet." />
            )}
          </div>

          <div className="rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(16,18,21,0.98),rgba(8,10,13,0.98))] p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Payout read</p>
            <div className="mt-3.5 grid gap-2.5">
              <BoardStat label="Claimable pools" value={String(claimableDistributionRows.length)} />
              <BoardStat label="Queued / processing" value={String(pendingDistributionCount)} />
              <BoardStat label="High value rewards" value={String(highValueCount)} />
            </div>
          </div>
        </div>
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

function BoardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-1.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-white">{value}</p>
    </div>
  );
}

function SignalCard({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-3.5 py-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-[13px] font-semibold text-white">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">{meta}</p>
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
          ? "border border-amber-300/16 bg-amber-300/10 text-amber-100"
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
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/20 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
      <span>{label}</span>
      <span className="text-white">{value}</span>
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
