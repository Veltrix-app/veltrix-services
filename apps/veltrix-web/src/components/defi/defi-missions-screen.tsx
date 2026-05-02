"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Gem,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  type DefiXpEligibilitySnapshot,
  type DefiXpMissionState,
  type DefiXpMissionSlug,
} from "@/lib/defi/defi-xp-eligibility";
import {
  buildMoonwellMarketExpansion,
  buildDefiMissionOverview,
  getPrimaryVaultMission,
  type DefiVaultMission,
  type MoonwellMarketOpportunity,
  type MoonwellPortfolioPosture,
} from "@/lib/defi/defi-missions-read-model";
import type {
  MoonwellMarketRead,
  MoonwellPortfolioRead,
} from "@/lib/defi/moonwell-markets";
import {
  type MoonwellVaultPositionRead,
  type MoonwellVaultTransactionKind,
} from "@/lib/defi/moonwell-vaults";
import { DefiSafetyPanel } from "@/components/defi/defi-safety-panel";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusChip } from "@/components/ui/status-chip";
import { useDefiXpEligibility } from "@/hooks/use-defi-xp-eligibility";
import { useMoonwellMarkets } from "@/hooks/use-moonwell-markets";
import { useMoonwellVaultPositions } from "@/hooks/use-moonwell-vault-positions";
import { useMoonwellVaultTransactions } from "@/hooks/use-moonwell-vault-transactions";

const overview = buildDefiMissionOverview();
const primaryVault = getPrimaryVaultMission();

const accentStyles = {
  lime: {
    text: "text-lime-200",
    softText: "text-lime-300",
    border: "border-lime-300/16",
    bg: "bg-lime-300/10",
    glow: "rgba(190,255,74,0.2)",
    gradient:
      "radial-gradient(circle_at_18%_12%,rgba(190,255,74,0.18),transparent_28%),linear-gradient(180deg,rgba(13,16,18,0.99),rgba(7,9,12,0.99))",
  },
  cyan: {
    text: "text-cyan-100",
    softText: "text-cyan-200",
    border: "border-cyan-300/16",
    bg: "bg-cyan-300/10",
    glow: "rgba(103,232,249,0.18)",
    gradient:
      "radial-gradient(circle_at_18%_12%,rgba(74,217,255,0.16),transparent_28%),linear-gradient(180deg,rgba(13,16,18,0.99),rgba(7,9,12,0.99))",
  },
  violet: {
    text: "text-violet-100",
    softText: "text-violet-200",
    border: "border-violet-300/16",
    bg: "bg-violet-300/10",
    glow: "rgba(167,139,250,0.18)",
    gradient:
      "radial-gradient(circle_at_18%_12%,rgba(167,139,250,0.16),transparent_28%),linear-gradient(180deg,rgba(13,16,18,0.99),rgba(7,9,12,0.99))",
  },
  amber: {
    text: "text-amber-100",
    softText: "text-amber-200",
    border: "border-amber-300/16",
    bg: "bg-amber-300/10",
    glow: "rgba(251,191,36,0.16)",
    gradient:
      "radial-gradient(circle_at_18%_12%,rgba(251,191,36,0.14),transparent_28%),linear-gradient(180deg,rgba(13,16,18,0.99),rgba(7,9,12,0.99))",
  },
} satisfies Record<DefiVaultMission["accent"], Record<string, string>>;

function shortenWallet(address?: string | null) {
  if (!address) return "Not connected";
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function DefiMissionsScreen() {
  const { session, profile, reloadProfile } = useAuth();
  const vaultPositions = useMoonwellVaultPositions();
  const liveMarkets = useMoonwellMarkets();
  const defiXp = useDefiXpEligibility({
    accessToken: session?.access_token,
    wallet: profile?.wallet,
    vaultPositions: vaultPositions.positions,
    markets: liveMarkets.markets,
  });
  const vaultTransactions = useMoonwellVaultTransactions({
    accessToken: session?.access_token,
    wallet: profile?.wallet,
    onConfirmed: () => {
      vaultPositions.refresh();
      defiXp.refresh();
    },
  });
  const [selectedSlug, setSelectedSlug] = useState(primaryVault.slug);
  const [flowPreviewOpen, setFlowPreviewOpen] = useState(false);
  const [vaultAction, setVaultAction] = useState<MoonwellVaultTransactionKind>("deposit");
  const [vaultAmount, setVaultAmount] = useState("");

  const selectedVault = useMemo(
    () => overview.vaults.find((vault) => vault.slug === selectedSlug) ?? primaryVault,
    [selectedSlug]
  );
  const walletReady = Boolean(profile?.wallet);
  const selectedAccent = accentStyles[selectedVault.accent];
  const selectedPosition =
    vaultPositions.positions.find((position) => position.vault.slug === selectedVault.slug) ??
    null;
  const detectedPositions = vaultPositions.positions.filter(
    (position) => position.status === "position-detected"
  ).length;
  const marketExpansion = buildMoonwellMarketExpansion({
    walletReady,
    readStatus: vaultPositions.status,
    vaultPositions: vaultPositions.positions,
  });
  const readyLiveMarkets = liveMarkets.markets.filter((market) => market.status === "ready")
    .length;
  const hasLiveMarketRows = readyLiveMarkets > 0;
  const displayedMarkets = hasLiveMarketRows ? liveMarkets.markets : marketExpansion.markets;
  const displayedPortfolio =
    hasLiveMarketRows && liveMarkets.portfolio ? liveMarkets.portfolio : marketExpansion.portfolio;
  const liveMarketUnavailable =
    liveMarkets.status === "error" ||
    (liveMarkets.status === "ready" &&
      liveMarkets.markets.length > 0 &&
      readyLiveMarkets === 0);
  const marketReadLabel =
    liveMarkets.status === "ready" && hasLiveMarketRows
      ? `${readyLiveMarkets}/${liveMarkets.markets.length} live`
      : liveMarkets.status === "error"
        ? "Fallback read"
        : "Reading Base";
  const readStatusLabel = getReadStatusLabel({
    status: vaultPositions.status,
    walletReady,
    detectedPositions,
    totalVaults: overview.vaults.length,
  });

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_320px]">
        <div className="relative overflow-hidden rounded-[28px] border border-white/6 bg-[radial-gradient(circle_at_12%_4%,rgba(190,255,74,0.13),transparent_22%),radial-gradient(circle_at_84%_12%,rgba(74,217,255,0.12),transparent_24%),linear-gradient(180deg,rgba(13,15,19,0.995),rgba(6,7,10,0.995))] p-4 shadow-[0_22px_72px_rgba(0,0,0,0.36)] sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025),transparent_34%)]" />

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-300">
                {overview.productName}
              </p>
              <h2 className="mt-4 max-w-3xl text-[clamp(1.45rem,2.4vw,2.7rem)] font-black leading-[0.98] tracking-[-0.045em] text-white">
                {overview.heroTitle}
              </h2>
              <p className="mt-4 max-w-3xl text-[13px] leading-6 text-slate-400 sm:text-sm">
                {overview.heroDescription}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <HeroMetric label="Vaults" value={String(overview.vaults.length)} />
              <HeroMetric label="Mode" value="Tracked tx" />
              <HeroMetric label="Custody" value="None" />
            </div>
          </div>

          <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {overview.vaults.map((vault) => {
              const active = vault.slug === selectedVault.slug;
              const accent = accentStyles[vault.accent];
              const position =
                vaultPositions.positions.find((read) => read.vault.slug === vault.slug) ?? null;
              const vaultStatus = getVaultStatusBadge({
                position,
                readStatus: vaultPositions.status,
                walletReady,
              });

              return (
                <button
                  key={vault.slug}
                  type="button"
                  onClick={() => {
                    setSelectedSlug(vault.slug);
                    setVaultAmount("");
                    vaultTransactions.resetVaultTransaction();
                  }}
                  className={`group rounded-[22px] border p-3.5 text-left transition ${
                    active
                      ? `${accent.border} ${accent.bg} shadow-[0_18px_48px_rgba(0,0,0,0.28)]`
                      : "border-white/6 bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-black/24 ${accent.text}`}
                    >
                      <Gem className="h-4 w-4" />
                    </span>
                    <StatusChip label={vaultStatus.label} tone={vaultStatus.tone} />
                  </div>
                  <p className="mt-4 text-[0.96rem] font-semibold tracking-[-0.02em] text-white">
                    {vault.title}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-400">
                    {vault.intent}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {position?.status === "position-detected"
                        ? position.underlyingLabel
                        : vault.chain}
                    </span>
                    <ArrowRight
                      className={`h-4 w-4 transition ${
                        active ? accent.softText : "text-slate-500 group-hover:text-white"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="relative z-10 mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedSlug(primaryVault.slug)}
              className="rounded-full bg-lime-300 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-lime-200"
            >
              {overview.primaryCta}
            </button>
            <a
              href="#risk-notes"
              className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300 transition hover:border-white/12 hover:text-white"
            >
              {overview.secondaryCta}
            </a>
          </div>
        </div>

        <aside className="rounded-[26px] border border-white/6 bg-[radial-gradient(circle_at_bottom_right,rgba(190,255,74,0.12),transparent_28%),linear-gradient(180deg,rgba(13,15,18,0.99),rgba(7,9,12,0.99))] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
            Wallet posture
          </p>
          <p className="mt-3 text-[1rem] font-semibold text-white">
            {walletReady ? "Reading Base vaults" : session ? "Wallet needed" : "Preview mode"}
          </p>
          <p className="mt-2 text-[12px] leading-5 text-slate-400">
            {walletReady
              ? `${shortenWallet(profile?.wallet)} is checked read-only against the Base vaults.`
              : "Connect a wallet before we can verify vault shares or hold duration."}
          </p>

          <div className="mt-4 space-y-2.5">
            <WalletRead label="Access" value={session ? "Signed in" : "Preview"} icon={Wallet} />
            <WalletRead label="Network" value="Base live" icon={Layers3} />
            <WalletRead label="Vault read" value={readStatusLabel} icon={Gem} />
            <WalletRead label="Safety" value="Non-custodial" icon={ShieldCheck} />
          </div>

          <Link
            href="/profile/edit"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-lime-300/18 bg-lime-300/12 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-lime-100 transition hover:bg-lime-300/18"
          >
            {walletReady ? "Manage wallet" : "Connect wallet"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.38fr)_360px]">
        <div
          className={`relative overflow-hidden rounded-[28px] border ${selectedAccent.border} p-4 shadow-[0_22px_64px_rgba(0,0,0,0.3)] sm:p-5`}
          style={{ background: selectedAccent.gradient }}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl"
            style={{ backgroundColor: selectedAccent.glow }}
          />

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${selectedAccent.softText}`}>
                Selected mission
              </p>
              <h3 className="mt-3 text-[1.28rem] font-semibold tracking-[-0.035em] text-white sm:text-[1.55rem]">
                {selectedVault.title}
              </h3>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-400">
                {selectedVault.intent}
              </p>
            </div>
            <StatusChip label={selectedVault.chain} tone="positive" />
          </div>

          <div className="relative z-10 mt-5 grid gap-3 md:grid-cols-4">
            <MissionMetric label="Detected" value={getPositionValueLabel({
              position: selectedPosition,
              readStatus: vaultPositions.status,
              walletReady,
            })} />
            <MissionMetric label="Shares" value={getShareValueLabel({
              position: selectedPosition,
              readStatus: vaultPositions.status,
              walletReady,
            })} />
            <MissionMetric label="Withdrawable" value={getWithdrawableValueLabel({
              position: selectedPosition,
              readStatus: vaultPositions.status,
              walletReady,
            })} />
            <MissionMetric label="Yield" value={selectedVault.apyLabel} />
          </div>

          <VaultMoveFundsPanel
            action={vaultAction}
            amount={vaultAmount}
            busy={vaultTransactions.busy}
            error={vaultTransactions.error}
            message={vaultTransactions.message}
            onActionChange={(nextAction) => {
              setVaultAction(nextAction);
              vaultTransactions.resetVaultTransaction();
            }}
            onAmountChange={(nextAmount) => {
              setVaultAmount(nextAmount);
              vaultTransactions.resetVaultTransaction();
            }}
            onSubmit={() =>
              void vaultTransactions.executeVaultTransaction({
                kind: vaultAction,
                amount: vaultAmount,
                position: selectedPosition,
              })
            }
            position={selectedPosition}
            status={vaultTransactions.status}
            txHash={vaultTransactions.txHash}
            walletReady={walletReady}
          />

          <div className="relative z-10 mt-5 grid gap-3 md:grid-cols-4">
            {selectedVault.steps.map((step, index) => (
              <div
                key={step.label}
                className={`rounded-[20px] border p-3.5 ${
                  step.state === "ready"
                    ? "border-lime-300/18 bg-lime-300/10"
                    : step.state === "next"
                      ? "border-white/10 bg-white/[0.04]"
                      : "border-white/6 bg-black/18"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    0{index + 1}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      step.state === "ready"
                        ? "bg-lime-300"
                        : step.state === "next"
                          ? "bg-cyan-200"
                          : "bg-white/18"
                    }`}
                  />
                </div>
                <p className="mt-3 text-[13px] font-semibold text-white">{step.label}</p>
                <p className="mt-2 text-[11px] leading-5 text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-black/22 p-3.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Launch action
              </p>
              <p className="mt-1.5 text-[13px] font-semibold text-white">{selectedVault.actionLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setFlowPreviewOpen((current) => !current)}
              className="rounded-full bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-lime-200"
            >
              {flowPreviewOpen ? "Hide flow" : "Preview flow"}
            </button>
          </div>

          {flowPreviewOpen ? (
            <div className="relative z-10 mt-3 grid gap-2 rounded-[20px] border border-white/8 bg-black/20 p-3.5 sm:grid-cols-3">
              <FlowPreviewStep
                label="Now"
                value="Move funds"
                description="Users can deposit or withdraw with their own wallet while VYNTRO records tx posture for future XP eligibility."
              />
              <FlowPreviewStep
                label="Next"
                value="On-chain verify"
                description="We turn vault shares and duration into eligibility for DeFi missions."
              />
              <FlowPreviewStep
                label="Then"
                value="XP economy"
                description="Hold time, tiers and sponsored reward pools become the growth layer."
              />
            </div>
          ) : null}
        </div>

        <aside id="risk-notes" className="space-y-4">
          <DefiSafetyPanel compact route="vaults" />

          <div className="rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,15,18,0.99),rgba(7,9,12,0.99))] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-300">
              Reward layer
            </p>
            <p className="mt-3 text-[1rem] font-semibold text-white">
              {selectedVault.rewardPreview.label}
            </p>
            <p className="mt-2 text-[12px] leading-5 text-slate-400">
              {selectedVault.rewardPreview.description}
            </p>
            <div className="mt-4 rounded-[18px] border border-lime-300/10 bg-lime-300/[0.045] p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-lime-300">
                Live vault read
              </p>
              <p className="mt-2 text-[13px] font-semibold text-white">
                {getSelectedPositionSummary({
                  position: selectedPosition,
                  readStatus: vaultPositions.status,
                  walletReady,
                })}
              </p>
            </div>
            <div className="mt-3 rounded-[18px] border border-white/6 bg-white/[0.03] p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Status
              </p>
              <p className="mt-2 text-[13px] font-semibold text-white">
                {selectedVault.rewardPreview.phase}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,15,18,0.99),rgba(7,9,12,0.99))] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-200">
              Risk note
            </p>
            <p className="mt-3 text-[13px] font-semibold text-white">{selectedVault.riskLabel}</p>
            <p className="mt-2 text-[12px] leading-5 text-slate-400">
              {overview.disclosure}
            </p>
            <p className="mt-3 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {selectedVault.subtleProtocolLabel}
            </p>
          </div>
        </aside>
      </section>

      <DefiXpEligibilityPanel
        claimMessage={defiXp.claimMessage}
        claimingSlug={defiXp.claimingSlug}
        claimStatus={defiXp.claimStatus}
        error={defiXp.error}
        onClaim={async (missionSlug) => {
          const result = await defiXp.claimMission(missionSlug);
          if (result.ok) {
            await reloadProfile();
          }
        }}
        onRefresh={defiXp.refresh}
        snapshot={defiXp.snapshot}
        status={defiXp.status}
        trackingReady={defiXp.trackingReady}
        warning={defiXp.warning}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="rounded-[26px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,15,18,0.985),rgba(7,9,12,0.99))] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-300">
                Market read mode
              </p>
              <h3 className="mt-3 text-[1.35rem] font-black tracking-[-0.04em] text-white">
                {marketExpansion.title}
              </h3>
              <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-400">
                {marketExpansion.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-lime-300/12 bg-lime-300/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-lime-200">
                {marketReadLabel}
              </span>
              <button
                type="button"
                onClick={liveMarkets.refresh}
                className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:border-white/14 hover:text-white"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {displayedMarkets.map((market) => (
              <MoonwellMarketCard key={market.slug} market={market} />
            ))}
          </div>

          {liveMarketUnavailable ? (
            <p className="mt-3 rounded-[18px] border border-amber-300/12 bg-amber-300/[0.055] px-3.5 py-3 text-[12px] leading-5 text-amber-100">
              Live market reads are temporarily unavailable, so this section is showing the safe
              product fallback.
            </p>
          ) : null}
        </div>

        <aside className="space-y-4">
          <MoonwellPortfolioCard portfolio={displayedPortfolio} />

          <div className="rounded-[24px] border border-amber-300/10 bg-[linear-gradient(180deg,rgba(18,16,10,0.72),rgba(8,9,12,0.98))] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-200">
              {marketExpansion.borrowRail.label}
            </p>
            <p className="mt-3 text-[0.98rem] font-semibold text-white">Keep leverage locked</p>
            <p className="mt-2 text-[12px] leading-5 text-slate-400">
              {marketExpansion.borrowRail.description}
            </p>
          </div>

          <div className="grid gap-2">
            {marketExpansion.nextRails.map((rail) => (
              <div
                key={rail.label}
                className="rounded-[18px] border border-white/6 bg-white/[0.025] px-3.5 py-3"
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {rail.label}
                </p>
                <p className="mt-1.5 text-[13px] font-semibold text-white">{rail.value}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">{rail.description}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {overview.productRails.map((rail) => (
          <div
            key={rail.label}
            className="rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,15,18,0.98),rgba(7,9,12,0.98))] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  {rail.label}
                </p>
                <p className="mt-2 text-[0.96rem] font-semibold text-white">{rail.value}</p>
              </div>
              <Sparkles className="h-4 w-4 text-lime-200" />
            </div>
            <p className="mt-3 text-[12px] leading-5 text-slate-400">{rail.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

type MoonwellMarketCardModel = MoonwellMarketOpportunity | MoonwellMarketRead;
type MoonwellPortfolioCardModel = MoonwellPortfolioPosture | MoonwellPortfolioRead;

function MoonwellMarketCard({ market }: { market: MoonwellMarketCardModel }) {
  const accent = accentStyles[market.accent];
  const live = isLiveMarketRead(market);

  return (
    <div
      className={`rounded-[22px] border ${accent.border} bg-white/[0.025] p-4`}
      style={{
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 44px ${accent.glow}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {market.chain} / {market.asset}
          </p>
          <h4 className="mt-2 text-[1rem] font-bold tracking-[-0.03em] text-white">
            {market.title}
          </h4>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${accent.bg} ${accent.softText}`}>
          {live ? "live" : market.mode}
        </span>
      </div>
      <p className="mt-3 text-[12px] leading-5 text-slate-400">{market.description}</p>
      {live && market.status === "read-error" ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <MiniSignal label="Status" value="Read retry" />
          <MiniSignal label="Risk" value={market.riskLabel} />
        </div>
      ) : live ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <MiniSignal label="Supply APY" value={market.supplyApyLabel} />
          <MiniSignal label="Borrow APY" value={market.borrowApyLabel} />
          <MiniSignal label="Liquidity" value={market.liquidityLabel} />
          <MiniSignal label="Collateral" value={market.collateralFactorLabel} />
          <MiniSignal label="Supplied" value={market.userSuppliedLabel} />
          <MiniSignal label="Borrowed" value={market.userBorrowedLabel} />
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <MiniSignal label="Signal" value={market.signal} />
          <MiniSignal label="Risk" value={market.riskLabel} />
        </div>
      )}
      <p className={`mt-4 text-[10px] font-black uppercase tracking-[0.16em] ${accent.softText}`}>
        {market.primaryAction}
      </p>
    </div>
  );
}

function MoonwellPortfolioCard({ portfolio }: { portfolio: MoonwellPortfolioCardModel }) {
  const statusLabel = portfolio.status.replace("-", " ");
  const live = isLivePortfolioRead(portfolio);
  const primaryCount = live ? portfolio.suppliedMarkets : portfolio.activeVaults;
  const primaryLabel = live ? "Supplied markets" : "Active vaults";

  return (
    <div className="rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,15,18,0.99),rgba(7,9,12,0.99))] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200">
            Portfolio posture
          </p>
          <p className="mt-3 text-[0.98rem] font-semibold text-white">{portfolio.headline}</p>
        </div>
        <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-300">
          {statusLabel}
        </span>
      </div>
      <p className="mt-2 text-[12px] leading-5 text-slate-400">{portfolio.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniSignal label={primaryLabel} value={String(primaryCount)} />
        <MiniSignal
          label="Assets"
          value={portfolio.detectedAssets.length ? portfolio.detectedAssets.join(", ") : "None"}
        />
        {live ? <MiniSignal label="Borrowed markets" value={String(portfolio.borrowedMarkets)} /> : null}
      </div>
      <div className="mt-3 rounded-[18px] border border-lime-300/10 bg-lime-300/[0.045] p-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-lime-300">
          Next safe action
        </p>
        <p className="mt-2 text-[12px] font-semibold leading-5 text-white">
          {portfolio.nextSafeAction}
        </p>
      </div>
    </div>
  );
}

function DefiXpEligibilityPanel({
  claimMessage,
  claimingSlug,
  claimStatus,
  error,
  onClaim,
  onRefresh,
  snapshot,
  status,
  trackingReady,
  warning,
}: {
  claimMessage: string | null;
  claimingSlug: DefiXpMissionSlug | null;
  claimStatus: "idle" | "claiming" | "claimed" | "error";
  error: string | null;
  onClaim: (missionSlug: DefiXpMissionSlug) => Promise<void>;
  onRefresh: () => void;
  snapshot: DefiXpEligibilitySnapshot;
  status: "wallet-missing" | "loading" | "ready" | "error";
  trackingReady: boolean;
  warning: string | null;
}) {
  const statusLabel =
    status === "loading"
      ? "Reading tx log"
      : status === "error"
        ? "Tracking fallback"
        : trackingReady
          ? "Eligibility live"
          : "Tracking warming up";

  return (
    <section className="rounded-[28px] border border-white/6 bg-[radial-gradient(circle_at_90%_10%,rgba(190,255,74,0.12),transparent_28%),linear-gradient(180deg,rgba(13,15,18,0.99),rgba(7,9,12,0.995))] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-300">
            XP eligibility preview
          </p>
          <h3 className="mt-3 text-[1.35rem] font-black tracking-[-0.04em] text-white">
            {snapshot.headline}
          </h3>
          <p className="mt-2 text-[13px] leading-6 text-slate-400">{snapshot.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-lime-300/12 bg-lime-300/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-lime-200">
            {statusLabel}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:border-white/14 hover:text-white"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-[22px] border border-lime-300/10 bg-lime-300/[0.045] p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-lime-300">
            Preview XP
          </p>
          <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
            {snapshot.claimedXp}
            <span className="text-sm font-semibold text-slate-500"> / {snapshot.previewXp}</span>
          </p>
          <p className="mt-2 text-[12px] leading-5 text-slate-400">
            {snapshot.completedMissions}/{snapshot.totalMissions} missions eligible, with{" "}
            {snapshot.claimableXp} XP ready to claim when proof checks pass.
          </p>
          <div className="mt-4 rounded-[18px] border border-white/8 bg-black/20 p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Next safe action
            </p>
            <p className="mt-2 text-[12px] font-semibold leading-5 text-white">
              {snapshot.nextSafeAction}
            </p>
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-5">
          {snapshot.missions.map((mission) => (
            <div
              key={mission.slug}
              className={`rounded-[20px] border p-3.5 ${getDefiXpMissionClasses(mission.state)}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {mission.xp > 0 ? `${mission.xp} XP` : "Guard"}
                </span>
                <span className="rounded-full border border-white/8 bg-black/18 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-300">
                  {mission.state}
                </span>
              </div>
              <p className="mt-3 text-[13px] font-semibold leading-5 text-white">
                {mission.title}
              </p>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                {mission.description}
              </p>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {mission.progressLabel}
              </p>
              {mission.claimState === "claimable" ? (
                <button
                  type="button"
                  disabled={claimStatus === "claiming"}
                  onClick={() => void onClaim(mission.slug)}
                  className="mt-3 w-full rounded-full bg-lime-300 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-slate-500"
                >
                  {claimingSlug === mission.slug ? "Claiming..." : `Claim ${mission.xp} XP`}
                </button>
              ) : mission.claimState === "claimed" ? (
                <p className="mt-3 rounded-full border border-lime-300/12 bg-lime-300/[0.07] px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-lime-200">
                  Claimed
                </p>
              ) : (
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-lime-200">
                  {mission.actionLabel}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {claimMessage || warning || error ? (
        <p className="mt-3 rounded-[18px] border border-amber-300/12 bg-amber-300/[0.055] px-3.5 py-3 text-[12px] leading-5 text-amber-100">
          {claimMessage || warning || error}
        </p>
      ) : null}
    </section>
  );
}

function getDefiXpMissionClasses(state: DefiXpMissionState) {
  if (state === "completed") {
    return "border-lime-300/14 bg-lime-300/[0.055]";
  }

  if (state === "warning") {
    return "border-amber-300/14 bg-amber-300/[0.055]";
  }

  if (state === "eligible" || state === "active") {
    return "border-cyan-300/12 bg-cyan-300/[0.045]";
  }

  return "border-white/6 bg-white/[0.025]";
}

function isLiveMarketRead(market: MoonwellMarketCardModel): market is MoonwellMarketRead {
  return market.mode === "live-read";
}

function isLivePortfolioRead(
  portfolio: MoonwellPortfolioCardModel
): portfolio is MoonwellPortfolioRead {
  return "suppliedMarkets" in portfolio;
}

function MiniSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[15px] border border-white/6 bg-black/20 px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-[12px] font-semibold text-white">{value}</p>
    </div>
  );
}

type VaultReadStatus = "wallet-missing" | "loading" | "ready" | "error";
type StatusTone = "default" | "positive" | "warning" | "danger" | "info";
type VaultTransactionStatus =
  | "idle"
  | "checking"
  | "approving"
  | "depositing"
  | "withdrawing"
  | "confirmed"
  | "error";

function getReadStatusLabel({
  status,
  walletReady,
  detectedPositions,
  totalVaults,
}: {
  status: VaultReadStatus;
  walletReady: boolean;
  detectedPositions: number;
  totalVaults: number;
}) {
  if (!walletReady) {
    return "Connect wallet";
  }

  if (status === "loading") {
    return "Reading...";
  }

  if (status === "error") {
    return "Read error";
  }

  return `${detectedPositions}/${totalVaults} detected`;
}

function getVaultStatusBadge({
  position,
  readStatus,
  walletReady,
}: {
  position: MoonwellVaultPositionRead | null;
  readStatus: VaultReadStatus;
  walletReady: boolean;
}): { label: string; tone: StatusTone } {
  if (!walletReady) {
    return { label: "Connect", tone: "default" };
  }

  if (readStatus === "loading") {
    return { label: "Reading", tone: "info" };
  }

  if (readStatus === "error" || position?.status === "read-error") {
    return { label: "Read error", tone: "warning" };
  }

  if (position?.status === "position-detected") {
    return { label: "Position", tone: "positive" };
  }

  return { label: "No position", tone: "default" };
}

function getPositionValueLabel({
  position,
  readStatus,
  walletReady,
}: {
  position: MoonwellVaultPositionRead | null;
  readStatus: VaultReadStatus;
  walletReady: boolean;
}) {
  if (!walletReady) {
    return "Connect wallet";
  }

  if (readStatus === "loading") {
    return "Reading...";
  }

  if (readStatus === "error" || position?.status === "read-error") {
    return "Read error";
  }

  if (position?.status === "position-detected") {
    return position.underlyingLabel;
  }

  return "No position";
}

function getShareValueLabel({
  position,
  readStatus,
  walletReady,
}: {
  position: MoonwellVaultPositionRead | null;
  readStatus: VaultReadStatus;
  walletReady: boolean;
}) {
  if (!walletReady) {
    return "Connect wallet";
  }

  if (readStatus === "loading") {
    return "Reading...";
  }

  if (readStatus === "error" || position?.status === "read-error") {
    return "Unavailable";
  }

  return position?.shareBalanceLabel ?? "0 shares";
}

function getWithdrawableValueLabel({
  position,
  readStatus,
  walletReady,
}: {
  position: MoonwellVaultPositionRead | null;
  readStatus: VaultReadStatus;
  walletReady: boolean;
}) {
  if (!walletReady) {
    return "Connect wallet";
  }

  if (readStatus === "loading") {
    return "Reading...";
  }

  if (readStatus === "error" || position?.status === "read-error") {
    return "Unavailable";
  }

  return position?.maxWithdrawLabel ?? "0";
}

function getSelectedPositionSummary({
  position,
  readStatus,
  walletReady,
}: {
  position: MoonwellVaultPositionRead | null;
  readStatus: VaultReadStatus;
  walletReady: boolean;
}) {
  if (!walletReady) {
    return "Connect wallet to read this vault.";
  }

  if (readStatus === "loading") {
    return "Reading the connected wallet on Base.";
  }

  if (readStatus === "error" || position?.status === "read-error") {
    return "The read route could not finish yet.";
  }

  if (position?.status === "position-detected") {
    return `${position.underlyingLabel} detected, ${position.maxWithdrawLabel} withdrawable.`;
  }

  return "No current position detected for this vault.";
}

function getVaultActionDisabledReason({
  action,
  position,
  walletReady,
}: {
  action: MoonwellVaultTransactionKind;
  position: MoonwellVaultPositionRead | null;
  walletReady: boolean;
}) {
  if (!walletReady) {
    return "Connect wallet first";
  }

  if (!position?.assetAddress) {
    return "Vault route loading";
  }

  if (action === "withdraw" && BigInt(position.maxWithdrawRaw || "0") <= BigInt(0)) {
    return "Nothing withdrawable";
  }

  return null;
}

function getVaultActionButtonLabel({
  action,
  busy,
  disabledReason,
  status,
}: {
  action: MoonwellVaultTransactionKind;
  busy: boolean;
  disabledReason: string | null;
  status: VaultTransactionStatus;
}) {
  if (busy) {
    if (status === "checking") return "Checking wallet...";
    if (status === "approving") return "Approving...";
    if (status === "withdrawing") return "Withdrawing...";
    return "Depositing...";
  }

  if (disabledReason) {
    return disabledReason;
  }

  return action === "deposit" ? "Deposit into vault" : "Withdraw from vault";
}

function VaultMoveFundsPanel({
  action,
  amount,
  busy,
  error,
  message,
  onActionChange,
  onAmountChange,
  onSubmit,
  position,
  status,
  txHash,
  walletReady,
}: {
  action: MoonwellVaultTransactionKind;
  amount: string;
  busy: boolean;
  error: string | null;
  message: string | null;
  onActionChange: (action: MoonwellVaultTransactionKind) => void;
  onAmountChange: (amount: string) => void;
  onSubmit: () => void;
  position: MoonwellVaultPositionRead | null;
  status: VaultTransactionStatus;
  txHash: string | null;
  walletReady: boolean;
}) {
  const assetSymbol = position?.assetSymbol ?? "asset";
  const disabledReason = getVaultActionDisabledReason({
    action,
    position,
    walletReady,
  });
  const buttonDisabled = busy || Boolean(disabledReason);
  const buttonLabel = getVaultActionButtonLabel({
    action,
    busy,
    disabledReason,
    status,
  });

  return (
    <div className="relative z-10 mt-5 rounded-[24px] border border-lime-300/10 bg-black/24 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-lime-300">
            Move funds
          </p>
          <p className="mt-2 text-[13px] leading-6 text-slate-400">
            Deposit or withdraw directly with your wallet. VYNTRO never takes custody, never
            guarantees yield, and records only the transaction posture needed for future XP
            eligibility.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-white/8 bg-white/[0.035] p-1">
          {(["deposit", "withdraw"] as const).map((nextAction) => (
            <button
              key={nextAction}
              type="button"
              onClick={() => onActionChange(nextAction)}
              className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                action === nextAction
                  ? "bg-lime-300 text-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {nextAction}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="rounded-[18px] border border-white/8 bg-white/[0.035] px-3.5 py-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Amount in {assetSymbol}
          </span>
          <input
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="mt-2 w-full bg-transparent text-lg font-semibold tracking-[-0.02em] text-white outline-none placeholder:text-slate-600"
          />
        </label>
        <button
          type="button"
          onClick={onSubmit}
          disabled={buttonDisabled}
          className="inline-flex min-w-[180px] items-center justify-center rounded-[18px] bg-lime-300 px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-slate-500"
        >
          {buttonLabel}
        </button>
      </div>

      <div className="mt-3 grid gap-2 text-[11px] leading-5 text-slate-400 sm:grid-cols-3">
        <div className="rounded-[15px] border border-white/6 bg-white/[0.025] px-3 py-2">
          <span className="font-bold uppercase tracking-[0.14em] text-slate-500">Asset</span>
          <p className="mt-1 font-semibold text-white">{assetSymbol}</p>
        </div>
        <div className="rounded-[15px] border border-white/6 bg-white/[0.025] px-3 py-2">
          <span className="font-bold uppercase tracking-[0.14em] text-slate-500">Available</span>
          <p className="mt-1 font-semibold text-white">
            {action === "withdraw" ? position?.maxWithdrawLabel ?? "0" : "Wallet balance checked"}
          </p>
        </div>
        <div className="rounded-[15px] border border-white/6 bg-white/[0.025] px-3 py-2">
          <span className="font-bold uppercase tracking-[0.14em] text-slate-500">Network</span>
          <p className="mt-1 font-semibold text-white">Base</p>
        </div>
      </div>

      <p className="mt-3 rounded-[16px] border border-white/6 bg-white/[0.025] px-3 py-2 text-[11px] leading-5 text-slate-400">
        Check the amount, network and vault before signing. ERC-20 deposits may ask for an
        approval first; ETH deposits use the native router and do not need token approval.
      </p>

      {position?.vault.slug === "eth-vault" ? (
        <p className="mt-3 rounded-[16px] border border-amber-300/12 bg-amber-300/[0.06] px-3 py-2 text-[11px] leading-5 text-amber-100">
          ETH deposits use Moonwell&apos;s native ETH router. Withdrawals are sent through the
          underlying vault contract from your own wallet.
        </p>
      ) : null}

      {message ? (
        <p className="mt-3 rounded-[16px] border border-lime-300/12 bg-lime-300/[0.06] px-3 py-2 text-[11px] leading-5 text-lime-100">
          {message}
        </p>
      ) : null}

      {txHash ? (
        <a
          href={`https://basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300 transition hover:text-white"
        >
          View transaction
        </a>
      ) : null}

      {status === "confirmed" ? (
        <p className="mt-3 rounded-[16px] border border-cyan-300/12 bg-cyan-300/[0.06] px-3 py-2 text-[11px] leading-5 text-cyan-100">
          Confirmed. Your vault read is refreshing from Base.
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-[16px] border border-rose-300/14 bg-rose-300/[0.06] px-3 py-2 text-[11px] leading-5 text-rose-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-black/20 px-3 py-2.5 text-right">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-[12px] font-semibold text-white">{value}</p>
    </div>
  );
}

function WalletRead({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[17px] border border-white/6 bg-white/[0.03] px-3 py-2.5">
      <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-[11px] font-semibold text-white">{value}</span>
    </div>
  );
}

function MissionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-black/20 px-3.5 py-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-[13px] font-semibold text-white">{value}</p>
    </div>
  );
}

function FlowPreviewStep({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-white/[0.03] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-[12px] font-semibold text-white">{value}</p>
      <p className="mt-1.5 text-[10px] leading-4 text-slate-400">{description}</p>
    </div>
  );
}
