"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Clock3,
  Trophy,
  Wallet,
} from "lucide-react";
import { DefiRouteNav } from "@/components/defi/defi-route-nav";
import { CinematicRouteHero } from "@/components/ui/cinematic-route-hero";
import {
  formatTradingCost,
  formatTradingReward,
  formatTradingWindow,
  getTradingCompetitionPosture,
  type TradingCompetitionRead,
} from "@/lib/trading/trading-arena";

type CompetitionsResponse = {
  ok?: boolean;
  items?: TradingCompetitionRead[];
  competitions?: TradingCompetitionRead[];
  error?: string;
};

const TRADING_HERO_IMAGE = "/assets/trading/trading-arena-hero.webp";

function getItems(payload: CompetitionsResponse | null) {
  return payload?.items ?? payload?.competitions ?? [];
}

function statusLabel(value: string) {
  return value.replace(/_/g, " ");
}

function ArenaCard({ arena }: { arena: TradingCompetitionRead }) {
  const posture = getTradingCompetitionPosture({
    status: arena.status,
    trackingMode: arena.trackingMode,
    costStatus: arena.costStatus,
    leaderboardCount: 0,
    flagsCount: 0,
  });

  return (
    <Link
      href={`/trading-arena/${arena.id}`}
      className="group relative min-h-[310px] overflow-hidden rounded-[30px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,17,22,0.98),rgba(6,7,10,0.99))] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:border-sky-300/20 hover:bg-white/[0.045]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute -bottom-28 left-8 h-48 w-48 rounded-full bg-lime-300/8 blur-3xl" />
      </div>

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-sky-300/12 bg-sky-300/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-sky-100">
            {arena.trackingMode === "live" ? "Live tracking" : "Snapshot"}
          </span>
          <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
            {statusLabel(arena.status)}
          </span>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-sky-200" />
      </div>

      <div className="relative z-10 mt-8">
        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-lime-300">
          Trading Arena
        </p>
        <h3 className="mt-3 text-[1.75rem] font-black leading-none tracking-[-0.055em] text-white">
          {arena.title}
        </h3>
        <p className="mt-4 line-clamp-3 text-[13px] leading-6 text-slate-400">
          {arena.description || "Trade the selected pair, climb the live board and compete for project rewards."}
        </p>
      </div>

      <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[20px] border border-white/6 bg-black/20 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Reward</p>
          <p className="mt-2 text-sm font-black text-white">{formatTradingReward(arena.rewards)}</p>
        </div>
        <div className="rounded-[20px] border border-white/6 bg-black/20 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Window</p>
          <p className="mt-2 text-sm font-black text-white">
            {formatTradingWindow(arena.startsAt, arena.endsAt)}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex items-center justify-between gap-4 border-t border-white/6 pt-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            {posture.label}
          </p>
          <p className="mt-1 text-[12px] leading-5 text-slate-400">{posture.nextAction}</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
          {arena.chain}
        </span>
      </div>
    </Link>
  );
}

export function TradingArenaScreen() {
  const [payload, setPayload] = useState<CompetitionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/trading/competitions?limit=24", { cache: "no-store" });
        const data = (await response.json().catch(() => null)) as CompetitionsResponse | null;

        if (!response.ok || data?.ok === false) {
          throw new Error(data?.error || "Trading Arena could not be loaded.");
        }

        if (!cancelled) {
          setPayload(data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Trading Arena could not be loaded.");
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
  }, []);

  const arenas = getItems(payload);
  const liveCount = arenas.filter((arena) => arena.status === "live").length;
  const trackedCount = arenas.filter((arena) => arena.trackingMode === "live").length;
  const estimatedCost = arenas.reduce((sum, arena) => sum + arena.currentCostCents, 0);

  return (
    <div className="space-y-5">
      <CinematicRouteHero
        chips={["Live board", "Cost capped", "No custody"]}
        description="Enter competitive DeFi arenas where verified wallets, trading windows, cost controls and reward settlement stay visible before members join the board."
        imagePosition="center"
        imageSrc={TRADING_HERO_IMAGE}
        panelIcon={Trophy}
        panelStats={[
          { label: "Live", value: String(liveCount), sub: "arenas now" },
          { label: "Tracked", value: String(trackedCount), sub: "premium mode" },
          { label: "Usage", value: formatTradingCost(estimatedCost), sub: "metered cost" },
          { label: "Custody", value: "None", sub: "wallet-owned" },
        ]}
        panelText="Trading Arena is the competition layer for projects that want real activity, visible rules and a clean route into reward settlement."
        panelTitle={liveCount > 0 ? "Arena pressure is live." : "Arena layer is ready."}
        primaryCta={{ href: "#arena-board", label: "Open arenas", icon: <Trophy className="h-4 w-4" /> }}
        secondaryCta={{ href: "#arena-rules", label: "View modes", icon: <BarChart3 className="h-4 w-4" /> }}
        stats={[
          { label: "Live now", value: String(liveCount) },
          { label: "Tracking", value: String(trackedCount) },
          { label: "Cost", value: formatTradingCost(estimatedCost) },
        ]}
        title="Trading Arena"
        tone="violet"
      />

      <DefiRouteNav compact />

      <section id="arena-rules" className="scroll-mt-28 grid gap-4 xl:grid-cols-3">
        <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,17,22,0.98),rgba(7,9,12,0.99))] p-5">
          <Wallet className="h-5 w-5 text-lime-200" />
          <h3 className="mt-4 text-xl font-black tracking-[-0.04em] text-white">Snapshot mode</h3>
          <p className="mt-2 text-[13px] leading-6 text-slate-400">
            Low-cost competitions take start/end or cadence snapshots and rebuild the leaderboard
            without constant log scanning.
          </p>
        </div>
        <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,17,22,0.98),rgba(7,9,12,0.99))] p-5">
          <Clock3 className="h-5 w-5 text-sky-200" />
          <h3 className="mt-4 text-xl font-black tracking-[-0.04em] text-white">Live tracking</h3>
          <p className="mt-2 text-[13px] leading-6 text-slate-400">
            Premium mode imports verified on-chain events, tracks usage cost and keeps project teams
            aware before budget pressure becomes a surprise.
          </p>
        </div>
        <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,17,22,0.98),rgba(7,9,12,0.99))] p-5">
          <Trophy className="h-5 w-5 text-amber-200" />
          <h3 className="mt-4 text-xl font-black tracking-[-0.04em] text-white">Reward settlement</h3>
          <p className="mt-2 text-[13px] leading-6 text-slate-400">
            Final ranks can settle into reward distributions, while flags and cost status stay
            visible before winners are published.
          </p>
        </div>
      </section>

      {error ? (
        <section className="rounded-[28px] border border-amber-300/12 bg-amber-300/6 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Service read</p>
          <p className="mt-2 text-sm font-semibold text-white">{error}</p>
        </section>
      ) : null}

      <section id="arena-board" className="scroll-mt-28">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-lime-300">
              Active arenas
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">Compete on-chain</h3>
          </div>
          {loading ? (
            <span className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Loading
            </span>
          ) : null}
        </div>

        {arenas.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {arenas.map((arena) => (
              <ArenaCard key={arena.id} arena={arena} />
            ))}
          </div>
        ) : (
          <div className="rounded-[30px] border border-dashed border-white/10 bg-white/[0.025] p-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-500">
              No public arena yet
            </p>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.05em] text-white">
              The product layer is ready for the first project competition.
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Once a project creates a Trading Arena from the portal, it will appear here with
              reward, duration, pair and leaderboard state.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
