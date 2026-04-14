"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Gem, LockKeyhole, Sparkles } from "lucide-react";
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
  const vaultPressure = enrichedRewards.slice(0, 3);
  const highValueCount = enrichedRewards.filter((reward) => reward.cost >= 500).length;
  const lockedCount = enrichedRewards.filter((reward) => !reward.claimable).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_380px]">
        <div className="overflow-hidden rounded-[38px] border border-amber-300/12 bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.18),transparent_26%),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(145deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-amber-300">
            <span>Loot Vault</span>
            <span className="rounded-full border border-amber-300/16 bg-amber-300/10 px-3 py-1 tracking-[0.24em] text-amber-100">
              Unlock Pressure
            </span>
          </div>

          {featuredReward ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_320px]">
                <div className="space-y-5">
                  <ArtworkPanel
                    src={featuredReward.imageUrl}
                    alt={featuredReward.title}
                    badge={featuredReward.rarity}
                    className="h-64"
                  />

                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-[14ch]">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-amber-300/16 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-100">
                          {featuredReward.linkedCampaignTitle}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                          {featuredReward.rewardType}
                        </span>
                      </div>
                      <h3 className="font-display mt-4 text-balance text-[clamp(2.2rem,4vw,4.5rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                        {featuredReward.title}
                      </h3>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                        {featuredReward.description ||
                          "This vault item is live with real rarity, real cost pressure and real unlock desire."}
                      </p>
                    </div>

                    <StatusChip
                      label={featuredReward.claimable ? "Ready to claim" : "Locked"}
                      tone={featuredReward.claimable ? "positive" : "default"}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <FeatureStat label="XP cost" value={String(featuredReward.cost)} />
                    <FeatureStat label="Rarity" value={featuredReward.rarity} />
                    <FeatureStat label="Type" value={featuredReward.rewardType} />
                    <FeatureStat label="State" value={featuredReward.claimable ? "Ready" : "Locked"} />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/rewards/${featuredReward.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
                    >
                      Open vault item
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

                <div className="rounded-[28px] border border-white/10 bg-black/24 p-4">
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-amber-200">
                    Vault queue
                  </p>
                  <div className="mt-4 space-y-3">
                    {queueRewards.slice(0, 4).map((reward, index) => (
                      <Link
                        key={reward.id}
                        href={`/rewards/${reward.id}`}
                        className="panel-card flex items-center gap-4 rounded-[24px] p-4 transition hover:border-amber-300/24 hover:bg-black/24"
                      >
                        <QueueThumb src={reward.imageUrl} alt={reward.title} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                            Slot {index + 1}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-white">{reward.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                            {reward.linkedCampaignTitle}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-amber-200">{reward.cost} XP</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {vaultPressure.map((reward, index) => (
                  <Link
                    key={reward.id}
                    href={`/rewards/${reward.id}`}
                    className="rounded-[26px] border border-white/8 bg-white/[0.04] p-4 transition hover:border-amber-300/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Vault heat {index + 1}
                      </p>
                      <Gem className="h-4 w-4 text-amber-300" />
                    </div>
                    <p className="mt-3 truncate text-lg font-black text-white">{reward.title}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MiniMetric label="Cost" value={`${reward.cost}`} />
                      <MiniMetric label="State" value={reward.claimable ? "Ready" : "Locked"} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <EmptyNotice text="No live rewards are visible yet." />
          )}
        </div>

        <div className="space-y-6">
          <Surface
            eyebrow="Vault Read"
            title="Payoff pressure"
            description="See what is hot, what is ready and what still needs grind."
          >
            <div className="grid gap-4 sm:grid-cols-3 2xl:grid-cols-1">
              <MetricTile label="Vault items" value={String(enrichedRewards.length)} />
              <MetricTile label="Claimable" value={String(claimableRewardCount)} />
              <MetricTile label="Locked" value={String(lockedCount)} />
            </div>

            <div className="mt-5 space-y-3">
              <SignalTile icon={Gem} label="High value" value={String(highValueCount)} accent="text-amber-200" />
              <SignalTile icon={LockKeyhole} label="Locked now" value={String(lockedCount)} accent="text-slate-200" />
              <SignalTile icon={Sparkles} label="Ready now" value={String(claimableRewardCount)} accent="text-lime-200" />
            </div>
          </Surface>

          <Surface
            eyebrow="Vault Filters"
            title="Refine reward vault"
            description="Trim the vault down to what is claimable, premium or worth chasing next."
          >
            <div className="space-y-4">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search loot, rarity, source lanes..."
                className="glass-button w-full rounded-[22px] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/40"
              />
              <div className="flex flex-wrap gap-2">
                <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All loot" />
                <FilterButton active={filter === "claimable"} onClick={() => setFilter("claimable")} label="Claimable" />
                <FilterButton active={filter === "high-value"} onClick={() => setFilter("high-value")} label="High value" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SignalTile label="Vault" value={String(filteredRewards.length)} accent="text-white" compact />
                <SignalTile label="Ready" value={String(claimableRewardCount)} accent="text-lime-200" compact />
                <SignalTile label="Premium" value={String(highValueCount)} accent="text-amber-200" compact />
              </div>
            </div>
          </Surface>
        </div>
      </section>

      <Surface
        eyebrow="Vault Catalog"
        title="Choose your payoff"
        description="The vault should feel like desirable unlocks, not just reward rows."
      >
        <div className="mt-1">
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
                  className="panel-card rounded-[32px] p-5 transition hover:-translate-y-0.5 hover:border-amber-300/28 hover:bg-black/24"
                >
                  <ArtworkPanel
                    src={reward.imageUrl}
                    alt={reward.title}
                    badge={reward.rewardType}
                    className="mb-5 h-44"
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-2xl font-black text-white">{reward.title}</p>
                      <p className="mt-2 text-sm text-amber-200">{reward.rarity}</p>
                    </div>
                    <StatusChip
                      label={reward.claimable ? "Ready" : "Locked"}
                      tone={reward.claimable ? "positive" : "default"}
                    />
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-300">
                    {reward.description || "Vault entry is live, but still needs a stronger prize briefing."}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    <MiniMetric label="Cost" value={`${reward.cost} XP`} />
                    <MiniMetric label="Type" value={reward.rewardType} />
                    <MiniMetric label="Lane" value={reward.linkedCampaignTitle} />
                    <MiniMetric label="State" value={reward.claimable ? "Ready" : "Locked"} />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Claim read
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
    <div className={`relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/70 ${className ?? "h-44"}`}>
      {src ? <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover opacity-84" /> : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,12,0.06),rgba(3,7,12,0.82)_58%,rgba(3,7,12,0.98))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.24),transparent_38%)]" />
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

function FeatureStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[24px] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.04] px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
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
