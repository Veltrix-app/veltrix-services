"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Clock3,
  Medal,
  ShieldAlert,
  Trophy,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  formatTradingCost,
  formatTradingReward,
  formatTradingWindow,
  getTradingCompetitionPosture,
  type TradingCompetitionRead,
  type TradingLeaderboardRow,
} from "@/lib/trading/trading-arena";

type CompetitionResponse = {
  ok?: boolean;
  competition?: TradingCompetitionRead;
  error?: string;
};

type LeaderboardResponse = {
  ok?: boolean;
  items?: TradingLeaderboardRow[];
  error?: string;
};

function shortUser(value: string) {
  if (!value) return "Member";
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function rankTone(rank: number) {
  if (rank === 1) return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  if (rank === 2) return "border-slate-300/16 bg-slate-300/8 text-slate-100";
  if (rank === 3) return "border-orange-300/18 bg-orange-300/9 text-orange-100";
  return "border-white/8 bg-white/[0.035] text-slate-300";
}

export function TradingCompetitionDetailScreen({ competitionId }: { competitionId: string }) {
  const { session } = useAuth();
  const [competition, setCompetition] = useState<TradingCompetitionRead | null>(null);
  const [leaderboard, setLeaderboard] = useState<TradingLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [competitionResponse, leaderboardResponse] = await Promise.all([
          fetch(`/api/trading/competitions/${competitionId}`, { cache: "no-store" }),
          fetch(`/api/trading/competitions/${competitionId}/leaderboard?limit=100`, {
            cache: "no-store",
          }),
        ]);
        const competitionPayload = (await competitionResponse.json().catch(() => null)) as
          | CompetitionResponse
          | null;
        const leaderboardPayload = (await leaderboardResponse.json().catch(() => null)) as
          | LeaderboardResponse
          | null;

        if (!competitionResponse.ok || !competitionPayload?.competition) {
          throw new Error(competitionPayload?.error || "Trading competition could not be loaded.");
        }

        if (!cancelled) {
          setCompetition(competitionPayload.competition);
          setLeaderboard(leaderboardPayload?.items ?? []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Trading competition could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [competitionId]);

  async function joinArena() {
    if (!session?.access_token) {
      setMessage("Sign in and verify a wallet before joining this Trading Arena.");
      return;
    }

    setJoining(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/trading/competitions/${competitionId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || "Could not join this Trading Arena.");
      }

      setMessage("You are in. Your verified wallet is now eligible for this arena.");
    } catch (joinError) {
      setMessage(joinError instanceof Error ? joinError.message : "Could not join this Trading Arena.");
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[30px] border border-white/6 bg-white/[0.025] p-8 text-sm font-semibold text-slate-300">
        Loading Trading Arena...
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="rounded-[30px] border border-amber-300/12 bg-amber-300/6 p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Arena read</p>
        <p className="mt-3 text-sm font-semibold text-white">{error ?? "Trading competition was not found."}</p>
        <Link
          href="/trading-arena"
          className="mt-5 inline-flex rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white"
        >
          Back to arenas
        </Link>
      </div>
    );
  }

  const posture = getTradingCompetitionPosture({
    status: competition.status,
    trackingMode: competition.trackingMode,
    costStatus: competition.costStatus,
    leaderboardCount: leaderboard.length,
    flagsCount: leaderboard.reduce((sum, row) => sum + row.flagsCount, 0),
  });

  return (
    <div className="space-y-5">
      <Link
        href="/trading-arena"
        className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-300 transition hover:border-white/14 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All arenas
      </Link>

      <section className="relative overflow-hidden rounded-[34px] border border-white/6 bg-[radial-gradient(circle_at_20%_8%,rgba(56,189,248,0.15),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(190,255,74,0.11),transparent_28%),linear-gradient(180deg,rgba(13,16,22,0.99),rgba(5,7,10,0.995))] p-5 shadow-[0_28px_110px_rgba(0,0,0,0.36)] sm:p-7">
        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-sky-300/12 bg-sky-300/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-sky-100">
                {competition.trackingMode === "live" ? "Live tracked" : "Snapshot"}
              </span>
              <span className="rounded-full border border-lime-300/12 bg-lime-300/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-lime-100">
                {competition.scoringMode}
              </span>
            </div>
            <h2 className="mt-5 max-w-4xl text-[clamp(2rem,4vw,4.8rem)] font-black leading-[0.92] tracking-[-0.07em] text-white">
              {competition.title}
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-400">
              {competition.description ||
                "Join with a verified wallet, trade the configured pair and climb the leaderboard before settlement."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={joinArena}
                disabled={joining}
                className="rounded-full bg-lime-300 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {joining ? "Joining..." : "Join arena"}
              </button>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">
                <ShieldAlert className="h-4 w-4 text-sky-200" />
                No custody
              </span>
            </div>
            {message ? <p className="mt-4 text-sm font-semibold text-slate-300">{message}</p> : null}
          </div>

          <div className="rounded-[28px] border border-white/7 bg-black/24 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
              Competition read
            </p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[20px] border border-white/6 bg-white/[0.035] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Now</p>
                <p className="mt-2 text-sm font-black text-white">{posture.label}</p>
                <p className="mt-1 text-[12px] leading-5 text-slate-400">{posture.nextAction}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-white/6 bg-white/[0.035] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Reward</p>
                  <p className="mt-2 text-sm font-black text-white">{formatTradingReward(competition.rewards)}</p>
                </div>
                <div className="rounded-[20px] border border-white/6 bg-white/[0.035] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Duration</p>
                  <p className="mt-2 text-sm font-black text-white">
                    {formatTradingWindow(competition.startsAt, competition.endsAt)}
                  </p>
                </div>
              </div>
              <div className="rounded-[20px] border border-white/6 bg-white/[0.035] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Usage cost</p>
                <p className="mt-2 text-sm font-black text-white">
                  {formatTradingCost(competition.currentCostCents)} / cap {formatTradingCost(competition.budgetCapCents)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-[26px] border border-white/6 bg-white/[0.025] p-5">
          <Wallet className="h-5 w-5 text-lime-200" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Pairs</p>
          <p className="mt-2 text-lg font-black text-white">
            {competition.pairs.map((pair) => `${pair.baseSymbol}/${pair.quoteSymbol}`).join(", ") || "TBA"}
          </p>
        </div>
        <div className="rounded-[26px] border border-white/6 bg-white/[0.025] p-5">
          <Clock3 className="h-5 w-5 text-sky-200" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</p>
          <p className="mt-2 text-lg font-black text-white">{competition.status}</p>
        </div>
        <div className="rounded-[26px] border border-white/6 bg-white/[0.025] p-5">
          <BarChart3 className="h-5 w-5 text-violet-200" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Scoring</p>
          <p className="mt-2 text-lg font-black text-white">{competition.scoringMode}</p>
        </div>
        <div className="rounded-[26px] border border-white/6 bg-white/[0.025] p-5">
          <Trophy className="h-5 w-5 text-amber-200" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Leaderboard</p>
          <p className="mt-2 text-lg font-black text-white">{leaderboard.length} traders</p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[30px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,17,22,0.98),rgba(7,9,12,0.99))] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
                Live leaderboard
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">
                Rank, score and trading proof
              </h3>
            </div>
            <Medal className="h-6 w-6 text-amber-200" />
          </div>

          <div className="mt-6 space-y-3">
            {leaderboard.length > 0 ? (
              leaderboard.map((row) => (
                <div
                  key={`${row.participantId}-${row.rank}`}
                  className={`grid gap-4 rounded-[22px] border p-4 md:grid-cols-[90px_minmax(0,1fr)_120px_120px_120px] ${rankTone(row.rank)}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/24 text-sm font-black">
                      #{row.rank}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{shortUser(row.authUserId)}</p>
                    <p className="mt-1 text-[11px] text-slate-400">Verified participant</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Score</p>
                    <p className="mt-1 text-sm font-black text-white">{Math.round(row.score).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Volume</p>
                    <p className="mt-1 text-sm font-black text-white">${Math.round(row.volumeUsd).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">ROI</p>
                    <p className="mt-1 text-sm font-black text-white">{row.roiPercent.toFixed(2)}%</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-8 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                  No trades scored yet
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Once verified wallets join and tracked events land, the leaderboard will build here.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-lime-300/10 bg-lime-300/[0.045] p-5">
            <BadgeCheck className="h-5 w-5 text-lime-200" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">
              How this stays fair
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Scores combine trading activity with trust-aware consistency. Suspicious behavior can
              be flagged before rewards are settled.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/6 bg-white/[0.025] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
              Wallet safety
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              VYNTRO does not custody funds and does not guarantee trading outcomes. You trade from
              your own wallet and remain responsible for gas, slippage and execution risk.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
