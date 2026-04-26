"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Gem, RefreshCw, ShieldAlert, WalletCards } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusChip } from "@/components/ui/status-chip";
import { useDefiXpEligibility } from "@/hooks/use-defi-xp-eligibility";
import { useMoonwellMarkets } from "@/hooks/use-moonwell-markets";
import { useMoonwellVaultPositions } from "@/hooks/use-moonwell-vault-positions";
import {
  buildDefiPortfolioRead,
  type DefiPortfolioRead,
  type DefiPortfolioRow,
} from "@/lib/defi/defi-portfolio";
import type { DefiXpMissionSlug } from "@/lib/defi/defi-xp-eligibility";

function getPortfolioTone(status: DefiPortfolioRead["status"]) {
  if (status === "risk-watch" || status === "read-error") return "warning";
  if (status === "active") return "positive";
  if (status === "wallet-needed") return "default";
  return "info";
}

export function DefiPortfolioScreen() {
  const { session, profile, reloadProfile } = useAuth();
  const vaults = useMoonwellVaultPositions();
  const markets = useMoonwellMarkets();
  const defiXp = useDefiXpEligibility({
    accessToken: session?.access_token,
    wallet: profile?.wallet,
    vaultPositions: vaults.positions,
    markets: markets.markets,
  });
  const walletReady = Boolean(profile?.wallet);
  const portfolio = buildDefiPortfolioRead({
    walletReady,
    vaultPositions: vaults.positions,
    markets: markets.markets,
    xpSnapshot: defiXp.snapshot,
  });
  const claimableMissions = defiXp.snapshot.missions.filter(
    (mission) => mission.claimState === "claimable"
  );

  function refreshAll() {
    vaults.refresh();
    markets.refresh();
    defiXp.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative overflow-hidden rounded-[30px] border border-white/6 bg-[radial-gradient(circle_at_12%_0%,rgba(190,255,74,0.14),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(74,217,255,0.12),transparent_28%),linear-gradient(180deg,rgba(13,15,19,0.99),rgba(6,7,10,0.995))] p-5">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035),transparent_35%)]" />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-4xl">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-lime-300">
                Portfolio dashboard
              </p>
              <h2 className="mt-4 max-w-3xl text-[clamp(1.65rem,2.8vw,3.2rem)] font-black leading-[0.95] tracking-[-0.05em] text-white">
                Your DeFi position in one calm read.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
                Vaults, supplied markets, borrowed markets, claimable XP and the next safe action
                now sit together before users add more exposure.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:border-white/12 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh all
            </button>
          </div>

          <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Vault positions" value={String(portfolio.totals.activeVaults)} />
            <MetricCard label="Supplied markets" value={String(portfolio.totals.suppliedMarkets)} />
            <MetricCard label="Borrowed markets" value={String(portfolio.totals.borrowedMarkets)} />
            <MetricCard label="Claimable XP" value={String(portfolio.totals.claimableXp)} />
          </div>
        </div>

        <aside className="rounded-[28px] border border-lime-300/10 bg-[radial-gradient(circle_at_100%_0%,rgba(190,255,74,0.12),transparent_34%),linear-gradient(180deg,rgba(13,16,18,0.98),rgba(7,9,12,0.995))] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
                Next safe action
              </p>
              <h3 className="mt-3 text-[1.2rem] font-black tracking-[-0.04em] text-white">
                {portfolio.headline}
              </h3>
            </div>
            <StatusChip label={portfolio.status} tone={getPortfolioTone(portfolio.status)} />
          </div>
          <p className="mt-3 text-[12px] leading-6 text-slate-400">{portfolio.description}</p>
          <div className="mt-4 rounded-[18px] border border-white/6 bg-black/22 p-3.5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
              Recommended move
            </p>
            <p className="mt-2 text-[12px] font-semibold leading-5 text-white">
              {portfolio.nextSafeAction}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <RoutePill href="/defi/vaults" label="Vaults" />
            <RoutePill href="/defi/borrow-lending" label="Borrow/lending" />
            <RoutePill href="/defi/activity" label="Activity" />
          </div>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <PortfolioLane
          emptyText="No vault positions detected yet."
          icon={Gem}
          rows={portfolio.vaultRows}
          title="Vaults"
        />
        <PortfolioLane
          emptyText="No supplied lending markets detected yet."
          icon={WalletCards}
          rows={portfolio.supplyRows}
          title="Supplied"
        />
        <PortfolioLane
          emptyText="No borrow exposure detected."
          icon={ShieldAlert}
          rows={portfolio.borrowRows}
          title="Borrowed"
        />
        <XpLane
          claimableMissions={claimableMissions}
          claimStatus={defiXp.claimStatus}
          claimingSlug={defiXp.claimingSlug}
          onClaim={async (missionSlug) => {
            const result = await defiXp.claimMission(missionSlug);
            if (result.ok) {
              await reloadProfile();
            }
          }}
          totals={portfolio.totals}
        />
      </section>

      {vaults.error || markets.error || defiXp.error || defiXp.warning ? (
        <section className="rounded-[24px] border border-amber-300/14 bg-amber-300/[0.055] p-4 text-[12px] leading-6 text-amber-100">
          {vaults.error || markets.error || defiXp.error || defiXp.warning}
        </section>
      ) : null}
    </div>
  );
}

function PortfolioLane({
  emptyText,
  icon: Icon,
  rows,
  title,
}: {
  emptyText: string;
  icon: typeof Gem;
  rows: DefiPortfolioRow[];
  title: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,18,23,0.98),rgba(7,9,12,0.99))] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-lime-200">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
              {title}
            </p>
            <p className="mt-1 text-[12px] text-slate-500">{rows.length} active rows</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {rows.length > 0 ? (
          rows.map((row) => <PortfolioRowCard key={`${row.label}-${row.value}`} row={row} />)
        ) : (
          <p className="rounded-[18px] border border-white/6 bg-black/20 p-3 text-[12px] leading-6 text-slate-400">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function PortfolioRowCard({ row }: { row: DefiPortfolioRow }) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-black/20 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-black tracking-[-0.025em] text-white">{row.label}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">{row.detail}</p>
        </div>
        <StatusChip label={row.value} tone={row.tone} />
      </div>
    </div>
  );
}

function XpLane({
  claimableMissions,
  claimStatus,
  claimingSlug,
  onClaim,
  totals,
}: {
  claimableMissions: Array<{
    slug: DefiXpMissionSlug;
    title: string;
    xp: number;
    progressLabel: string;
  }>;
  claimStatus: string;
  claimingSlug: DefiXpMissionSlug | null;
  onClaim: (missionSlug: DefiXpMissionSlug) => Promise<void>;
  totals: DefiPortfolioRead["totals"];
}) {
  return (
    <div className="rounded-[28px] border border-lime-300/10 bg-[radial-gradient(circle_at_100%_0%,rgba(190,255,74,0.1),transparent_34%),linear-gradient(180deg,rgba(15,18,23,0.98),rgba(7,9,12,0.99))] p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-lime-300/14 bg-lime-300/10 text-lime-200">
          <BadgeCheck className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
            Claimable XP
          </p>
          <p className="mt-1 text-[12px] text-slate-500">
            {totals.claimedXp} claimed / {totals.completedXp} completed
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {claimableMissions.length > 0 ? (
          claimableMissions.map((mission) => (
            <div
              key={mission.slug}
              className="rounded-[18px] border border-white/6 bg-black/20 p-3.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-black tracking-[-0.025em] text-white">
                    {mission.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400">
                    {mission.progressLabel}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={claimStatus === "claiming"}
                  onClick={() => void onClaim(mission.slug)}
                  className="rounded-full bg-lime-300 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-slate-500"
                >
                  {claimingSlug === mission.slug ? "Claiming..." : `Claim ${mission.xp} XP`}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-[18px] border border-white/6 bg-black/20 p-3 text-[12px] leading-6 text-slate-400">
            No claimable XP right now. Complete safe DeFi actions first.
          </p>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-black/22 px-3.5 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-[1.05rem] font-black text-white">{value}</p>
    </div>
  );
}

function RoutePill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:border-lime-300/16 hover:text-lime-100"
    >
      {label}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}
