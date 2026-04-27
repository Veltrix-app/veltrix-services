"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Flame, RefreshCw, ShieldCheck, WalletCards, Zap } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusChip } from "@/components/ui/status-chip";
import { useDefiXpEligibility } from "@/hooks/use-defi-xp-eligibility";
import { useLiveUserData } from "@/hooks/use-live-user-data";
import { useMoonwellMarkets } from "@/hooks/use-moonwell-markets";
import { useMoonwellVaultPositions } from "@/hooks/use-moonwell-vault-positions";
import { buildDefiPortfolioRead } from "@/lib/defi/defi-portfolio";
import type { DefiXpMissionSlug } from "@/lib/defi/defi-xp-eligibility";
import {
  buildXpCockpitRead,
  type XpCockpitGuardrail,
  type XpCockpitSourceLane,
  type XpCockpitStatus,
} from "@/lib/xp/xp-cockpit";
import { XP_ECONOMY_V1_POLICY } from "@/lib/xp/xp-economy";

function getStatusTone(status: XpCockpitStatus) {
  if (status === "claim-ready" || status === "growth-ready") return "positive";
  if (status === "review-watch") return "warning";
  return "default";
}

export function XpCockpitScreen() {
  const { session, profile, reloadProfile } = useAuth();
  const live = useLiveUserData({
    datasets: ["quests", "raids", "rewards", "rewardDistributions"],
  });
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
  const read = buildXpCockpitRead({
    walletReady,
    totalXp: profile?.xp ?? 0,
    activeXp: profile?.activeXp ?? profile?.xp ?? 0,
    level: profile?.level ?? 1,
    streak: profile?.streak ?? 0,
    trustScore: profile?.trustScore ?? 50,
    sybilScore: profile?.sybilScore ?? 0,
    contributionTier: profile?.contributionTier ?? "explorer",
    questsCompleted: profile?.questsCompleted ?? live.approvedQuestCount,
    raidsCompleted: profile?.raidsCompleted ?? 0,
    rewardsClaimed: profile?.rewardsClaimed ?? 0,
    openQuestCount: live.quests.length,
    pendingQuestCount: live.pendingQuestCount,
    approvedQuestCount: live.approvedQuestCount,
    liveRaidCount: live.raids.length,
    claimableRewardCount: live.claimableRewardCount + live.claimableDistributionCount,
    claimableDefiXp: defiXp.snapshot.claimableXp,
    claimedDefiXp: defiXp.snapshot.claimedXp,
    completedDefiXp: defiXp.snapshot.completedXp,
    defiStatus: defiXp.snapshot.status,
    nextDefiAction: defiXp.snapshot.nextSafeAction,
  });
  const claimableMissions = defiXp.snapshot.missions.filter(
    (mission) => mission.claimState === "claimable"
  );
  const systemNotice = live.error || vaults.error || markets.error || defiXp.error || defiXp.warning;

  function refreshAll() {
    void live.reload();
    vaults.refresh();
    markets.refresh();
    defiXp.refresh();
  }

  async function claimMission(missionSlug: DefiXpMissionSlug) {
    const result = await defiXp.claimMission(missionSlug);
    if (result.ok) {
      await Promise.all([reloadProfile(), live.reload()]);
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative overflow-hidden rounded-[30px] border border-white/6 bg-[radial-gradient(circle_at_15%_0%,rgba(190,255,74,0.15),transparent_26%),radial-gradient(circle_at_82%_14%,rgba(74,217,255,0.13),transparent_30%),linear-gradient(180deg,rgba(13,15,19,0.99),rgba(6,7,10,0.995))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035),transparent_34%)]" />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-4xl">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-lime-300">
                XP economy v1
              </p>
              <h2 className="mt-4 max-w-3xl text-[clamp(1.7rem,2.8vw,3.4rem)] font-black leading-[0.94] tracking-[-0.05em] text-white">
                One economy for quests, raids, DeFi and streaks.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
                This cockpit turns scattered XP signals into one progression read: claimable XP,
                level progress, safe earning routes, portfolio posture and anti-abuse rules.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:border-white/12 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total XP" value={read.levelRead.totalXp.toLocaleString()} />
            <MetricCard label="Level" value={read.levelRead.levelLabel} />
            <MetricCard label="Claimable" value={String(read.metrics.claimableXp)} />
            <MetricCard label="Tier" value={profile?.contributionTier ?? read.levelRead.contributionTier} />
          </div>

          <div className="relative z-10 mt-5 rounded-[20px] border border-white/8 bg-black/22 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Progress to next level
                </p>
                <p className="mt-2 text-[1rem] font-black text-white">
                  {read.levelRead.currentLevelXp.toLocaleString()} /{" "}
                  {read.levelRead.nextLevelXp.toLocaleString()} XP
                </p>
              </div>
              <StatusChip label={`${read.levelRead.progressPercent}%`} tone="info" />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-lime-300"
                style={{ width: `${read.levelRead.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <aside className="rounded-[28px] border border-lime-300/10 bg-[radial-gradient(circle_at_100%_0%,rgba(190,255,74,0.12),transparent_34%),linear-gradient(180deg,rgba(13,16,18,0.98),rgba(7,9,12,0.995))] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
                Command read
              </p>
              <h3 className="mt-3 text-[1.2rem] font-black tracking-[-0.04em] text-white">
                {read.headline}
              </h3>
            </div>
            <StatusChip label={read.status} tone={getStatusTone(read.status)} />
          </div>
          <p className="mt-3 text-[12px] leading-6 text-slate-400">{read.description}</p>
          <div className="mt-4 rounded-[18px] border border-white/6 bg-black/22 p-3.5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
              Next safe action
            </p>
            <p className="mt-2 text-[12px] font-semibold leading-5 text-white">
              {read.nextAction}
            </p>
          </div>
          <Link
            href={read.nextActionHref}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-300 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-black transition hover:bg-lime-200"
          >
            Open next move
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-3 md:grid-cols-2">
          {read.sourceLanes.map((lane) => (
            <SourceLaneCard key={lane.key} lane={lane} />
          ))}
        </div>

        <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,18,23,0.98),rgba(7,9,12,0.99))] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
                Portfolio bridge
              </p>
              <h3 className="mt-2 text-[1.05rem] font-black tracking-[-0.035em] text-white">
                {portfolio.headline}
              </h3>
            </div>
            <StatusChip label={portfolio.status} tone={portfolio.status === "risk-watch" ? "warning" : "info"} />
          </div>
          <p className="mt-3 text-[12px] leading-6 text-slate-400">{portfolio.description}</p>
          <div className="mt-4 grid gap-2">
            <MiniRead label="Vaults" value={String(portfolio.totals.activeVaults)} />
            <MiniRead label="Supplied markets" value={String(portfolio.totals.suppliedMarkets)} />
            <MiniRead label="Borrowed markets" value={String(portfolio.totals.borrowedMarkets)} />
            <MiniRead label="Claimable DeFi XP" value={String(portfolio.totals.claimableXp)} />
          </div>
          <Link
            href="/defi/portfolio"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:border-lime-300/16 hover:text-lime-100"
          >
            Open portfolio
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-[28px] border border-lime-300/10 bg-[radial-gradient(circle_at_100%_0%,rgba(190,255,74,0.1),transparent_34%),linear-gradient(180deg,rgba(15,18,23,0.98),rgba(7,9,12,0.99))] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
                Claim center
              </p>
              <h3 className="mt-2 text-[1.05rem] font-black tracking-[-0.035em] text-white">
                Verified DeFi XP claims
              </h3>
            </div>
            <StatusChip label={`${defiXp.snapshot.claimableXp} XP`} tone={defiXp.snapshot.claimableXp > 0 ? "positive" : "default"} />
          </div>

          <div className="mt-4 grid gap-2">
            {claimableMissions.length > 0 ? (
              claimableMissions.map((mission) => (
                <div key={mission.slug} className="rounded-[18px] border border-white/6 bg-black/20 p-3.5">
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
                      disabled={defiXp.claimStatus === "claiming"}
                      onClick={() => void claimMission(mission.slug)}
                      className="rounded-full bg-lime-300 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-slate-500"
                    >
                      {defiXp.claimingSlug === mission.slug ? "Claiming..." : `Claim ${mission.xp} XP`}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[18px] border border-white/6 bg-black/20 p-3 text-[12px] leading-6 text-slate-400">
                No DeFi XP is claimable right now. Complete a safe vault, supply or repay mission first.
              </p>
            )}
          </div>

          {defiXp.claimMessage || defiXp.error || defiXp.warning ? (
            <p className="mt-3 rounded-[16px] border border-amber-300/12 bg-amber-300/[0.055] px-3 py-2 text-[11px] leading-5 text-amber-100">
              {defiXp.claimMessage || defiXp.error || defiXp.warning}
            </p>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,18,23,0.98),rgba(7,9,12,0.99))] p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/14 bg-amber-300/10 text-amber-100">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">
                Risk and education
              </p>
              <h3 className="mt-2 text-[1.05rem] font-black tracking-[-0.035em] text-white">
                Safe earning beats farming.
              </h3>
            </div>
          </div>
          <p className="mt-4 text-[12px] leading-6 text-slate-400">
            Borrowing remains separate from yield missions. Project points can stay local, but
            global VYNTRO XP is calculated centrally from quest type, proof strength and caps.
          </p>
          <div className="mt-4 grid gap-2">
            <MiniRead label="Policy" value={XP_ECONOMY_V1_POLICY.version} />
            <MiniRead
              label="Global quest max"
              value={`${XP_ECONOMY_V1_POLICY.questRewards.maxGlobalQuestXp}/quest`}
            />
            <MiniRead
              label="Project points"
              value={XP_ECONOMY_V1_POLICY.questRewards.projectManagedPoints ? "Local only" : "Disabled"}
            />
            <MiniRead
              label="Quest cap"
              value={`${XP_ECONOMY_V1_POLICY.sources.quest.maxDailyXp}/day`}
            />
            <MiniRead
              label="Raid cap"
              value={`${XP_ECONOMY_V1_POLICY.sources.raid.maxDailyXp}/day`}
            />
            <MiniRead
              label="DeFi cap"
              value={`${XP_ECONOMY_V1_POLICY.sources.defi.maxDailyXp}/day`}
            />
          </div>
          <Link
            href="/defi/risk-guide"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-300/14 bg-amber-300/[0.08] px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-300/[0.12]"
          >
            Open risk guide
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {read.guardrails.map((guardrail) => (
          <GuardrailCard key={guardrail.key} guardrail={guardrail} />
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {XP_ECONOMY_V1_POLICY.compliance.map((note) => (
          <div key={note} className="rounded-[20px] border border-white/6 bg-white/[0.025] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
              Policy note
            </p>
            <p className="mt-2 text-[12px] leading-6 text-slate-400">{note}</p>
          </div>
        ))}
      </section>

      {systemNotice ? (
        <section className="rounded-[22px] border border-amber-300/14 bg-amber-300/[0.055] p-4 text-[12px] leading-6 text-amber-100">
          {systemNotice}
        </section>
      ) : null}
    </div>
  );
}

function SourceLaneCard({ lane }: { lane: XpCockpitSourceLane }) {
  return (
    <Link
      href={lane.href}
      className="group rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,18,23,0.98),rgba(7,9,12,0.99))] p-4 transition hover:border-lime-300/16 hover:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-lime-200">
          <LaneIcon laneKey={lane.key} />
        </span>
        <StatusChip label={lane.value} tone={lane.tone} />
      </div>
      <p className="mt-4 text-[1rem] font-black tracking-[-0.035em] text-white">{lane.title}</p>
      <p className="mt-2 text-[12px] leading-6 text-slate-400">{lane.copy}</p>
      <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          Open source
        </span>
        <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-lime-200" />
      </div>
    </Link>
  );
}

function LaneIcon({ laneKey }: { laneKey: XpCockpitSourceLane["key"] }) {
  if (laneKey === "quests") {
    return <BadgeCheck className="h-4 w-4" />;
  }

  if (laneKey === "raids") {
    return <Zap className="h-4 w-4" />;
  }

  if (laneKey === "defi") {
    return <WalletCards className="h-4 w-4" />;
  }

  return <Flame className="h-4 w-4" />;
}

function GuardrailCard({ guardrail }: { guardrail: XpCockpitGuardrail }) {
  return (
    <div className="rounded-[22px] border border-white/6 bg-white/[0.025] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">
            Guardrail
          </p>
          <h3 className="mt-2 text-[0.95rem] font-black tracking-[-0.025em] text-white">
            {guardrail.title}
          </h3>
        </div>
        <StatusChip label={guardrail.tone} tone={guardrail.tone} />
      </div>
      <p className="mt-3 text-[12px] leading-6 text-slate-400">{guardrail.copy}</p>
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

function MiniRead({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-white/6 bg-black/20 px-3 py-2.5">
      <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <span className="text-[12px] font-semibold text-white">{value}</span>
    </div>
  );
}
