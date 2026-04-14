"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

type RewardFilter = "all" | "claimable" | "high-value";

export function RewardsScreen() {
  const { loading, error, rewards, campaigns, claimableRewardCount } = useLiveUserData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RewardFilter>("all");

  const enrichedRewards = useMemo(() => {
    return rewards.map((reward) => {
      const linkedCampaign = campaigns.find((campaign) => campaign.id === reward.campaignId);

      return {
        ...reward,
        linkedCampaignTitle: linkedCampaign?.title ?? "Direct reward",
      };
    });
  }, [rewards, campaigns]);

  const filteredRewards = useMemo(() => {
    let items = enrichedRewards;

    if (query.trim()) {
      const normalized = query.toLowerCase();
      items = items.filter((reward) =>
        [reward.title, reward.description, reward.rewardType, reward.linkedCampaignTitle]
          .some((value) => value.toLowerCase().includes(normalized))
      );
    }

    if (filter === "claimable") {
      items = items.filter((reward) => reward.claimable);
    }

    if (filter === "high-value") {
      items = items.filter((reward) => reward.cost >= 500);
    }

    return items.sort(
      (left, right) => Number(right.claimable) - Number(left.claimable) || right.cost - left.cost
    );
  }, [enrichedRewards, filter, query]);

  const highValueCount = enrichedRewards.filter((reward) => reward.cost >= 500).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,196,0,0.14),rgba(0,0,0,0)_30%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-amber-300">
            Reward Vault
          </p>
          <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Rewards now come straight from the live backend.
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            The reward vault now reads like a payoff surface instead of a raw list: real value,
            real rarity, real claimability and clearer reward heat.
          </p>
        </div>

        <Surface
          eyebrow="Snapshot"
          title="Reward pressure"
          description="A quick read on what is ready now and what is worth pushing for."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricTile label="Rewards" value={String(enrichedRewards.length)} />
            <MetricTile label="Claimable" value={String(claimableRewardCount)} />
            <MetricTile label="High value" value={String(highValueCount)} />
          </div>
        </Surface>
      </section>

      <Surface
        eyebrow="Filters"
        title="Reward search"
        description="Filter the live reward vault by name, type, claimability or value."
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search rewards..."
            className="glass-button w-full rounded-[22px] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/40 lg:max-w-md"
          />

          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
            <FilterButton
              active={filter === "claimable"}
              onClick={() => setFilter("claimable")}
              label="Claimable"
            />
            <FilterButton
              active={filter === "high-value"}
              onClick={() => setFilter("high-value")}
              label="High value"
            />
          </div>
        </div>
      </Surface>

      <Surface
        eyebrow="Catalog"
        title="Live rewards"
        description="The reward vault now reads from the same reward rows the mobile app uses."
      >
        {loading ? (
          <EmptyNotice text="Loading live rewards..." />
        ) : error ? (
          <ErrorNotice text={error} />
        ) : filteredRewards.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredRewards.map((reward) => (
              <Link
                key={reward.id}
                href={`/rewards/${reward.id}`}
                className="panel-card rounded-[28px] p-5 transition hover:border-amber-300/30 hover:bg-black/25"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white">{reward.title}</p>
                    <p className="mt-2 text-sm text-amber-200">{reward.linkedCampaignTitle}</p>
                  </div>
                  <StatusChip
                    label={reward.claimable ? "Claimable" : "Locked"}
                    tone={reward.claimable ? "positive" : "default"}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">{reward.description}</p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MiniStat label="Cost" value={`${reward.cost} XP`} />
                  <MiniStat label="Rarity" value={reward.rarity} />
                  <MiniStat label="Type" value={reward.rewardType} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyNotice text="No rewards match this filter yet." />
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
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-amber-300/14 text-amber-200 ring-1 ring-amber-300/20"
          : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.08]"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyNotice({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-6 text-sm text-slate-300">
      {text}
    </div>
  );
}

function ErrorNotice({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">
      {text}
    </div>
  );
}
