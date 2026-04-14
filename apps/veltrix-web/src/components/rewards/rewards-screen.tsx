"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Gem, LockKeyhole } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

type RewardFilter = "all" | "claimable" | "high-value";

export function RewardsScreen() {
  const { loading, error, rewards, campaigns, claimableRewardCount } = useLiveUserData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RewardFilter>("all");

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

    return items;
  }, [enrichedRewards, filter, query]);

  const [featuredReward, ...queueRewards] = filteredRewards;
  const highValueCount = enrichedRewards.filter((reward) => reward.cost >= 500).length;
  const lockedCount = enrichedRewards.filter((reward) => !reward.claimable).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[36px] border border-amber-300/16 bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.18),transparent_42%),linear-gradient(145deg,rgba(9,15,21,0.98),rgba(3,7,12,0.92))] p-6 shadow-[0_28px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-amber-300">
            <span>Loot Vault</span>
            <span className="rounded-full border border-amber-300/16 bg-amber-300/10 px-3 py-1 tracking-[0.24em] text-amber-100">
              Payoff Pressure
            </span>
          </div>

          {featuredReward ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-5">
                <ArtworkPanel
                  src={featuredReward.imageUrl}
                  alt={featuredReward.title}
                  badge={featuredReward.rarity}
                  className="h-56"
                />
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-amber-300/16 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-100">
                        {featuredReward.linkedCampaignTitle}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                        {featuredReward.rewardType}
                      </span>
                    </div>
                    <h3 className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                      Unlock {featuredReward.title}
                    </h3>
                    <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                      {featuredReward.description ||
                        "This reward is live in the vault with real rarity, cost pressure and claim gating."}
                    </p>
                  </div>

                  <StatusChip
                    label={featuredReward.claimable ? "Ready to claim" : "Locked"}
                    tone={featuredReward.claimable ? "positive" : "default"}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <HeroStat label="XP cost" value={`${featuredReward.cost}`} />
                  <HeroStat label="Rarity" value={featuredReward.rarity} />
                  <HeroStat label="Type" value={featuredReward.rewardType} />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/rewards/${featuredReward.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
                  >
                    Open reward
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/campaigns/${featuredReward.campaignId}`}
                    className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:border-amber-300/30"
                  >
                    View source lane
                  </Link>
                </div>
              </div>

              <div className="space-y-3 rounded-[28px] border border-white/10 bg-black/24 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  Vault queue
                </p>
                {queueRewards.slice(0, 4).map((reward, index) => (
                  <Link
                    key={reward.id}
                    href={`/rewards/${reward.id}`}
                    className="panel-card flex items-center justify-between gap-4 rounded-[24px] p-4 transition hover:border-amber-300/24 hover:bg-black/24"
                  >
                    <QueueThumb src={reward.imageUrl} alt={reward.title} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                        Slot {index + 1}
                      </p>
                      <p className="mt-2 truncate text-lg font-black text-white">{reward.title}</p>
                      <p className="mt-1 text-sm text-slate-300">{reward.linkedCampaignTitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-200">{reward.cost} XP</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                        {reward.claimable ? "Ready" : "Locked"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 px-5 py-8 text-sm text-slate-300">
              No live rewards are visible yet.
            </div>
          )}
        </div>

        <Surface
          eyebrow="Signals"
          title="Vault pressure"
          description="See what is ready now, what is premium, and where the grind is still locked."
        >
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <MetricTile label="Rewards" value={String(enrichedRewards.length)} />
            <MetricTile label="Claimable" value={String(claimableRewardCount)} />
            <MetricTile label="Locked" value={String(lockedCount)} />
          </div>

          <div className="mt-5 space-y-3">
            <SignalTile icon={Gem} label="High value" value={String(highValueCount)} accent="text-amber-200" />
            <SignalTile icon={LockKeyhole} label="Locked now" value={String(lockedCount)} accent="text-slate-200" />
            <SignalTile label="Ready now" value={String(claimableRewardCount)} accent="text-lime-200" />
          </div>
        </Surface>
      </section>

      <Surface
        eyebrow="Vault Grid"
        title="Choose your payoff"
        description="Browse the live vault with stronger rarity hierarchy, claim readiness and campaign linkage."
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full flex-col gap-4 xl:max-w-xl">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search loot, rarity, source lanes..."
              className="glass-button w-full rounded-[22px] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/40"
            />

            <div className="flex flex-wrap gap-2">
              <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All loot" />
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

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
            <SignalTile label="Vault" value={String(filteredRewards.length)} accent="text-white" compact />
            <SignalTile label="Ready" value={String(claimableRewardCount)} accent="text-lime-200" compact />
            <SignalTile label="Premium" value={String(highValueCount)} accent="text-amber-200" compact />
          </div>
        </div>

        <div className="mt-6">
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
                  className="panel-card rounded-[30px] p-5 transition hover:-translate-y-0.5 hover:border-amber-300/28 hover:bg-black/24"
                >
                  <ArtworkPanel
                    src={reward.imageUrl}
                    alt={reward.title}
                    badge={reward.rewardType}
                    className="mb-5 h-44"
                  />
                  <div className="flex min-h-[94px] items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-amber-300/16 bg-amber-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-100">
                          {reward.rarity}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                          {reward.rewardType}
                        </span>
                      </div>
                      <p className="mt-4 text-2xl font-black leading-tight text-white">{reward.title}</p>
                    </div>
                    <StatusChip
                      label={reward.claimable ? "Ready" : "Locked"}
                      tone={reward.claimable ? "positive" : "default"}
                    />
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-300">
                    {reward.description || "Vault entry is live, but still needs a stronger prize briefing."}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Cost" value={`${reward.cost} XP`} />
                    <MiniStat label="Rarity" value={reward.rarity} />
                    <MiniStat label="Lane" value={reward.linkedCampaignTitle} />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Claim state
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {reward.claimable ? "Ready to redeem now" : "Still locked behind progression"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                      Inspect
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyNotice text="No rewards match this filter yet." />
          )}
        </div>
      </Surface>
    </div>
  );
}

function ArtworkPanel({
  src,
  alt,
  badge,
  className,
}: {
  src: string | null;
  alt: string;
  badge: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 ${className ?? "h-44"}`}>
      {src ? <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover opacity-80" /> : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,12,0.06),rgba(3,7,12,0.8)_56%,rgba(3,7,12,0.98))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.25),transparent_38%)]" />
      <div className="absolute left-4 top-4 rounded-full border border-amber-300/20 bg-black/45 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-100">
        {badge}
      </div>
    </div>
  );
}

function QueueThumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] border border-white/10 bg-slate-950/80">
      {src ? <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover opacity-85" /> : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,12,0.04),rgba(3,7,12,0.82))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.26),transparent_40%)]" />
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/24 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
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
      <p className="mt-2 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SignalTile({
  icon: Icon,
  label,
  value,
  accent,
  compact = false,
}: {
  icon?: typeof Gem;
  label: string;
  value: string;
  accent: string;
  compact?: boolean;
}) {
  return (
    <div className="metric-card rounded-[22px] px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        <span>{label}</span>
      </div>
      <p className={`mt-3 ${compact ? "text-xl" : "text-2xl"} font-black ${accent}`}>{value}</p>
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
