"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, Crown, Gem, ShieldCheck, X, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useLiveUserData } from "@/hooks/use-live-user-data";
import { ShardBadge } from "@/components/ui/shard-badge";
import { XpValue } from "@/components/ui/xp-badge";
import type { UserProfile } from "@/types/auth";
import { buildAnimatedShardWalletRead } from "@/lib/lootboxes/animated-shard-wallet";

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: value >= 1000 ? 1 : 0,
    notation: value >= 1000 ? "compact" : "standard",
  }).format(value);
}

function formatTier(value?: string | null) {
  if (!value) {
    return "Explorer";
  }

  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function resolveRank(profile: UserProfile | null, leaderboardRank: number) {
  if (profile?.reputationRank && profile.reputationRank > 0) {
    return profile.reputationRank;
  }

  return leaderboardRank;
}

export function VyntroWalletWidget({
  accountReady,
  profile,
}: {
  accountReady: boolean;
  profile: UserProfile | null;
}) {
  const { leaderboard, shardBalance, lootboxTiers, loading } = useLiveUserData({
    datasets: ["leaderboard", "lootboxes"],
  });
  const [collapsed, setCollapsed] = useState(false);
  const [previousShardBalance, setPreviousShardBalance] = useState<number | null>(null);

  const currentLeaderboardRank = useMemo(
    () => leaderboard.findIndex((user) => user.isCurrentUser) + 1,
    [leaderboard]
  );
  const shardWalletRead = useMemo(
    () =>
      buildAnimatedShardWalletRead({
        shardBalance,
        previousShardBalance,
        lootboxTiers,
      }),
    [lootboxTiers, previousShardBalance, shardBalance]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setPreviousShardBalance(shardBalance), 900);

    return () => window.clearTimeout(timeoutId);
  }, [shardBalance]);

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const rank = resolveRank(profile, currentLeaderboardRank);
  const tier = formatTier(profile?.contributionTier);
  const rankLabel = rank > 0 ? `#${rank}` : accountReady ? "Unranked" : "Guest";

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        aria-label="Open VYNTRO wallet"
        className="fixed right-0 top-1/2 z-50 hidden -translate-y-1/2 items-center gap-2 overflow-hidden rounded-l-[22px] border border-r-0 border-cyan-200/15 bg-[#071012]/88 py-3 pl-3 pr-2 text-left shadow-[0_18px_60px_rgba(0,0,0,0.46),0_0_36px_rgba(34,211,238,0.09)] backdrop-blur-2xl transition hover:border-lime-300/25 hover:bg-[#091412]/94 md:flex"
      >
        <span className="relative h-9 w-9 overflow-hidden rounded-full border border-violet-300/24 bg-black shadow-[0_0_22px_rgba(139,92,246,0.22)]">
          <Image
            src="/brand/logo/vyntro-logo.webp"
            alt=""
            fill
            sizes="36px"
            className="object-cover"
          />
        </span>
        <span className="min-w-0 pr-1">
          <span className="block text-[9px] font-black uppercase tracking-[0.22em] text-lime-200">
            Wallet
          </span>
          <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300 lg:block">
            Lv {level} / {rankLabel}
          </span>
        </span>
        <ChevronLeft className="h-3.5 w-3.5 text-cyan-100/70" />
      </button>
    );
  }

  return (
    <aside className="fixed right-2 top-1/2 z-50 hidden w-[14.25rem] -translate-y-1/2 md:block 2xl:right-3">
      <div className="motion-surface motion-light-sweep relative overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,14,19,0.92),rgba(3,5,8,0.9))] p-3 shadow-[0_24px_90px_rgba(0,0,0,0.58),0_0_44px_rgba(34,211,238,0.07)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_5%,rgba(163,230,53,0.12),transparent_32%),radial-gradient(circle_at_95%_8%,rgba(139,92,246,0.16),transparent_30%),linear-gradient(135deg,rgba(103,232,249,0.07),transparent_42%)]" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-lime-300/10 bg-lime-300/[0.04] blur-xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-violet-300/24 bg-black shadow-[0_0_28px_rgba(139,92,246,0.24)]">
                <Image
                  src="/brand/logo/vyntro-logo.webp"
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.22em] text-lime-300">
                  VYNTRO Wallet
                </p>
                <p className="mt-1 truncate text-xs font-black text-white">
                  {accountReady ? profile?.username || "Member OS" : "Guest access"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Close VYNTRO wallet"
              className="motion-press inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-slate-300 transition hover:border-white/14 hover:bg-white/[0.07] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <WalletStat label="XP" icon={Zap}>
              <XpValue size="sm" textClassName="text-white">
                {compactNumber(xp)}
              </XpValue>
            </WalletStat>
            <WalletStat label="Level" icon={ShieldCheck} value={`Lv ${level}`} />
            <WalletStat label="Rank" icon={Crown} value={rankLabel} />
            <WalletStat label="Tier" icon={Gem} value={tier} />
          </div>

          <AnimatedShardWallet
            loading={loading && accountReady}
            read={shardWalletRead}
          />

          <div className="mt-2 rounded-[18px] border border-cyan-200/10 bg-cyan-200/[0.045] p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-100/70">
                  Contribution tier
                </p>
                <p className="mt-1 truncate text-xs font-black text-white">{tier}</p>
              </div>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(163,230,53,0.7)]" />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <WalletLink href="/xp" label="XP" />
            <WalletLink href="/lootboxes" label="Shards" />
            <WalletLink href="/leaderboard" label="Rank" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function AnimatedShardWallet({
  loading,
  read,
}: {
  loading: boolean;
  read: ReturnType<typeof buildAnimatedShardWalletRead>;
}) {
  const pulseClass =
    read.pulseTone === "earn"
      ? "shard-wallet-pulse-earn"
      : read.pulseTone === "spend"
        ? "shard-wallet-pulse-spend"
        : "";

  return (
    <Link
      href="/lootboxes"
      key={`${read.balance}-${read.pulseTone}`}
      className={`motion-press shard-wallet-meter ${pulseClass} group mt-2 block rounded-[20px] border border-emerald-300/14 bg-[radial-gradient(circle_at_14%_0%,rgba(52,211,153,0.14),transparent_35%),linear-gradient(180deg,rgba(6,14,14,0.72),rgba(3,7,10,0.72))] p-3 transition hover:border-emerald-200/26 hover:bg-emerald-300/[0.07]`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-200/70">
            Shard wallet
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <ShardBadge
              value={loading ? "..." : compactNumber(read.balance)}
              label=""
              size="sm"
              className="border-0 bg-transparent px-0 py-0 shadow-none"
            />
            {read.deltaLabel ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[8px] font-black ${
                  read.pulseTone === "earn" ? "bg-lime-300/14 text-lime-100" : "bg-rose-300/14 text-rose-100"
                }`}
              >
                {read.deltaLabel}
              </span>
            ) : null}
          </div>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-emerald-100/55 transition group-hover:translate-x-0.5 group-hover:text-emerald-100" />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[0.12em]">
          <span className="truncate text-slate-400">{read.spendForecast}</span>
          <span className="shrink-0 text-emerald-100">{read.progressPercent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full border border-white/8 bg-black/38">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#bef264)] shadow-[0_0_18px_rgba(52,211,153,0.34)] transition-[width] duration-700"
            style={{ width: `${read.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 rounded-[14px] border border-white/7 bg-black/22 px-2.5 py-2">
        <span className="min-w-0 truncate text-[10px] font-bold text-white">
          {read.nextUnlock ? read.nextUnlock.label : "Lootbox route"}
        </span>
        <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
          {read.nextUnlock
            ? read.nextUnlock.ready
              ? "Ready"
              : `${read.nextUnlock.shortfall} left`
            : "Earn"}
        </span>
      </div>
    </Link>
  );
}

function WalletStat({
  label,
  icon: Icon,
  value,
  children,
}: {
  label: string;
  icon: LucideIcon;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-white/7 bg-black/24 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <Icon className="h-3 w-3 text-cyan-100/55" />
      </div>
      <div className="mt-2 min-h-5 text-base font-black leading-none text-white">
        {children ?? value}
      </div>
    </div>
  );
}

function WalletLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="motion-press rounded-full border border-white/8 bg-white/[0.035] px-2 py-2 text-center text-[8px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:border-lime-300/20 hover:bg-lime-300/10 hover:text-lime-100"
    >
      {label}
    </Link>
  );
}
