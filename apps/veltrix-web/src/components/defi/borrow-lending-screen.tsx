"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Layers3, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusChip } from "@/components/ui/status-chip";
import { useMoonwellMarketTransactions } from "@/hooks/use-moonwell-market-transactions";
import { useMoonwellMarkets } from "@/hooks/use-moonwell-markets";
import type {
  MoonwellMarketAccent,
  MoonwellMarketRead,
  MoonwellPortfolioRead,
} from "@/lib/defi/moonwell-markets";
import type { MoonwellMarketTransactionKind } from "@/lib/defi/moonwell-market-transactions";

const accentStyles = {
  lime: {
    border: "border-lime-300/16",
    bg: "bg-lime-300/[0.07]",
    text: "text-lime-200",
    dot: "bg-lime-300",
  },
  cyan: {
    border: "border-cyan-300/16",
    bg: "bg-cyan-300/[0.06]",
    text: "text-cyan-100",
    dot: "bg-cyan-300",
  },
  violet: {
    border: "border-violet-300/16",
    bg: "bg-violet-300/[0.06]",
    text: "text-violet-100",
    dot: "bg-violet-300",
  },
  amber: {
    border: "border-amber-300/16",
    bg: "bg-amber-300/[0.06]",
    text: "text-amber-100",
    dot: "bg-amber-300",
  },
} satisfies Record<MoonwellMarketAccent, Record<string, string>>;

const actionOptions: Array<{
  kind: MoonwellMarketTransactionKind;
  label: string;
  description: string;
}> = [
  {
    kind: "supply",
    label: "Supply",
    description: "Lend this asset into the market from your wallet.",
  },
  {
    kind: "withdraw",
    label: "Withdraw",
    description: "Redeem supplied underlying back to your wallet.",
  },
  {
    kind: "enable-collateral",
    label: "Collateral",
    description: "Allow supplied assets to secure borrowing power.",
  },
  {
    kind: "borrow",
    label: "Borrow",
    description: "Borrow against enabled collateral with liquidation risk.",
  },
  {
    kind: "repay",
    label: "Repay",
    description: "Reduce or close an active borrow balance.",
  },
];

function formatUsdLiquidity(rawValue: string) {
  let raw: bigint;

  try {
    raw = BigInt(rawValue || "0");
  } catch {
    raw = BigInt(0);
  }

  if (raw <= BigInt(0)) {
    return "$0";
  }

  const scale = BigInt(10) ** BigInt(18);
  const whole = raw / scale;
  const cents = (raw % scale) / (BigInt(10) ** BigInt(16));

  return `$${whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${cents
    .toString()
    .padStart(2, "0")}`;
}

function getPortfolioTone(status?: MoonwellPortfolioRead["status"]) {
  if (status === "borrow-watch" || status === "read-error") return "warning";
  if (status === "active") return "positive";
  return "default";
}

export function BorrowLendingScreen() {
  const { session, profile } = useAuth();
  const marketsRead = useMoonwellMarkets();
  const [selectedSlug, setSelectedSlug] = useState("usdc-market");
  const [action, setAction] = useState<MoonwellMarketTransactionKind>("supply");
  const [amount, setAmount] = useState("");
  const [riskAccepted, setRiskAccepted] = useState(false);
  const transaction = useMoonwellMarketTransactions({
    accessToken: session?.access_token,
    wallet: profile?.wallet,
    onConfirmed: marketsRead.refresh,
  });

  const selectedMarket = useMemo(() => {
    return (
      marketsRead.markets.find((market) => market.slug === selectedSlug) ??
      marketsRead.markets[0] ??
      null
    );
  }, [marketsRead.markets, selectedSlug]);

  const walletReady = Boolean(profile?.wallet);
  const actionDisabledReason = getActionDisabledReason({
    action,
    market: selectedMarket,
    walletReady,
  });
  const buttonDisabled = transaction.busy || Boolean(actionDisabledReason);
  const buttonLabel = getActionButtonLabel({
    action,
    busy: transaction.busy,
    disabledReason: actionDisabledReason,
    status: transaction.status,
  });

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="rounded-[28px] border border-white/6 bg-[radial-gradient(circle_at_18%_6%,rgba(190,255,74,0.12),transparent_26%),linear-gradient(180deg,rgba(13,15,19,0.99),rgba(7,9,12,0.995))] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-lime-300">
                Borrow / lending
              </p>
              <h2 className="mt-3 text-[clamp(1.55rem,2.4vw,2.8rem)] font-black leading-[0.98] tracking-[-0.045em] text-white">
                Supply first. Borrow only with clear collateral.
              </h2>
              <p className="mt-3 text-[13px] leading-6 text-slate-400">
                This route signs directly from your wallet on Base. VYNTRO tracks proof and UX
                posture, but Moonwell markets remain non-custodial and borrow positions can be
                liquidated.
              </p>
            </div>

            <button
              type="button"
              onClick={marketsRead.refresh}
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:border-white/12 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <MarketMetric
              label="Read mode"
              value={marketsRead.status === "loading" ? "Reading Base" : "Live markets"}
            />
            <MarketMetric
              label="Wallet"
              value={walletReady ? "Verified wallet" : "Connect to act"}
            />
            <MarketMetric
              label="Route"
              value="Supply / borrow / repay"
            />
          </div>
        </div>

        <PortfolioPostureCard portfolio={marketsRead.portfolio} walletReady={walletReady} />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {marketsRead.markets.map((market) => (
          <MarketCard
            key={market.slug}
            active={selectedMarket?.slug === market.slug}
            market={market}
            onSelect={() => {
              setSelectedSlug(market.slug);
              setAmount("");
              setRiskAccepted(false);
              transaction.resetMarketTransaction();
            }}
          />
        ))}
      </section>

      {marketsRead.status === "loading" ? (
        <section className="rounded-[26px] border border-white/6 bg-white/[0.025] p-5 text-[13px] leading-6 text-slate-400">
          Reading Moonwell markets from Base...
        </section>
      ) : null}

      {marketsRead.error ? (
        <section className="rounded-[26px] border border-amber-300/14 bg-amber-300/[0.055] p-5 text-[13px] leading-6 text-amber-100">
          {marketsRead.error}
        </section>
      ) : null}

      {selectedMarket ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-[30px] border border-lime-300/10 bg-[radial-gradient(circle_at_94%_0%,rgba(190,255,74,0.12),transparent_30%),linear-gradient(180deg,rgba(12,15,18,0.99),rgba(5,7,10,0.995))] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-lime-300">
                  Selected market
                </p>
                <h3 className="mt-3 text-[1.7rem] font-black tracking-[-0.05em] text-white">
                  {selectedMarket.asset} lending market
                </h3>
                <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-400">
                  {selectedMarket.description}
                </p>
              </div>
              <StatusChip
                label={selectedMarket.collateralEnabled ? "Collateral on" : "Collateral off"}
                tone={selectedMarket.collateralEnabled ? "positive" : "default"}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MarketMetric label="Supply APY" value={selectedMarket.supplyApyLabel} />
              <MarketMetric label="Borrow APY" value={selectedMarket.borrowApyLabel} />
              <MarketMetric label="Supplied" value={selectedMarket.userSuppliedLabel} />
              <MarketMetric label="Borrowed" value={selectedMarket.userBorrowedLabel} />
            </div>

            <div className="mt-5 rounded-[24px] border border-white/6 bg-black/22 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
                    Move funds
                  </p>
                  <p className="mt-2 max-w-2xl text-[12px] leading-6 text-slate-400">
                    Choose one action at a time. ERC-20 supply and repay may ask for token
                    approval before the market transaction.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {actionOptions.map((option) => (
                    <button
                      key={option.kind}
                      type="button"
                      onClick={() => {
                        setAction(option.kind);
                        setAmount("");
                        setRiskAccepted(false);
                        transaction.resetMarketTransaction();
                      }}
                      className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                        action === option.kind
                          ? "bg-lime-300 text-black"
                          : "border border-white/8 bg-white/[0.035] text-slate-400 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[18px] border border-white/6 bg-white/[0.025] p-3">
                <p className="text-[12px] font-semibold text-white">
                  {actionOptions.find((option) => option.kind === action)?.description}
                </p>
              </div>

              {action !== "enable-collateral" ? (
                <label className="mt-4 block rounded-[18px] border border-white/8 bg-white/[0.035] px-3.5 py-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Amount in {selectedMarket.asset}
                  </span>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="mt-2 w-full bg-transparent text-lg font-semibold tracking-[-0.02em] text-white outline-none placeholder:text-slate-600"
                  />
                </label>
              ) : (
                <div className="mt-4 rounded-[18px] border border-lime-300/10 bg-lime-300/[0.05] px-3.5 py-3">
                  <p className="text-[12px] leading-6 text-lime-100">
                    This will call the market controller to enable supplied {selectedMarket.asset} as
                    collateral. It does not move tokens by itself.
                  </p>
                </div>
              )}

              {action === "borrow" ? (
                <label className="mt-4 flex items-start gap-3 rounded-[18px] border border-amber-300/14 bg-amber-300/[0.06] p-3.5 text-[12px] leading-6 text-amber-100">
                  <input
                    type="checkbox"
                    checked={riskAccepted}
                    onChange={(event) => setRiskAccepted(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-lime-300"
                  />
                  <span>
                    I understand borrowing is over-collateralized, can be liquidated and should stay
                    well below my available liquidity.
                  </span>
                </label>
              ) : null}

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="grid gap-2 sm:grid-cols-3">
                  <MarketMetric label="Liquidity" value={selectedMarket.liquidityLabel} />
                  <MarketMetric label="Collateral factor" value={selectedMarket.collateralFactorLabel} />
                  <MarketMetric
                    label="Shortfall"
                    value={formatUsdLiquidity(selectedMarket.accountShortfallRaw)}
                  />
                </div>

                <button
                  type="button"
                  disabled={buttonDisabled}
                  onClick={() =>
                    void transaction.executeMarketTransaction({
                      kind: action,
                      amount,
                      market: selectedMarket,
                      riskAccepted,
                    })
                  }
                  className="inline-flex min-h-[4rem] items-center justify-center rounded-[18px] bg-lime-300 px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-slate-500"
                >
                  {buttonLabel}
                </button>
              </div>

              {transaction.message ? (
                <p className="mt-3 rounded-[16px] border border-lime-300/12 bg-lime-300/[0.06] px-3 py-2 text-[11px] leading-5 text-lime-100">
                  {transaction.message}
                </p>
              ) : null}

              {transaction.txHash ? (
                <a
                  href={`https://basescan.org/tx/${transaction.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300 transition hover:text-white"
                >
                  View transaction
                </a>
              ) : null}

              {transaction.error ? (
                <p className="mt-3 rounded-[16px] border border-rose-300/14 bg-rose-300/[0.06] px-3 py-2 text-[11px] leading-5 text-rose-100">
                  {transaction.error}
                </p>
              ) : null}
            </div>
          </div>

          <aside className="space-y-4">
            <RiskCard selectedMarket={selectedMarket} />
            <RouteCard />
          </aside>
        </section>
      ) : null}
    </div>
  );
}

function PortfolioPostureCard({
  portfolio,
  walletReady,
}: {
  portfolio: MoonwellPortfolioRead | null;
  walletReady: boolean;
}) {
  return (
    <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,17,22,0.98),rgba(7,9,12,0.99))] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
            Account posture
          </p>
          <h3 className="mt-3 text-[1.2rem] font-black tracking-[-0.04em] text-white">
            {portfolio?.headline ?? (walletReady ? "Reading wallet posture" : "Wallet needed")}
          </h3>
        </div>
        <StatusChip
          label={portfolio?.status ?? (walletReady ? "reading" : "connect")}
          tone={getPortfolioTone(portfolio?.status)}
        />
      </div>
      <p className="mt-3 text-[12px] leading-6 text-slate-400">
        {portfolio?.description ??
          "Connect a verified wallet to read supplied and borrowed markets."}
      </p>
      <div className="mt-4 grid gap-2">
        <MarketMetric label="Supplied markets" value={String(portfolio?.suppliedMarkets ?? 0)} />
        <MarketMetric label="Borrowed markets" value={String(portfolio?.borrowedMarkets ?? 0)} />
        <MarketMetric
          label="Next safe action"
          value={portfolio?.nextSafeAction ?? "Connect wallet before market actions"}
        />
      </div>
    </div>
  );
}

function MarketCard({
  active,
  market,
  onSelect,
}: {
  active: boolean;
  market: MoonwellMarketRead;
  onSelect: () => void;
}) {
  const accent = accentStyles[market.accent];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group rounded-[24px] border p-4 text-left transition ${
        active
          ? `${accent.border} ${accent.bg}`
          : "border-white/6 bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-black/20 text-lime-200">
          <Layers3 className="h-4 w-4" />
        </div>
        <ArrowRight
          className={`h-4 w-4 transition ${active ? accent.text : "text-slate-500 group-hover:text-white"}`}
        />
      </div>
      <p className="mt-4 text-[0.98rem] font-black tracking-[-0.035em] text-white">
        {market.asset} market
      </p>
      <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-400">
        {market.signal}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <MarketMetric label="Supplied" value={market.userSuppliedLabel} />
        <MarketMetric label="Borrowed" value={market.userBorrowedLabel} />
      </div>
    </button>
  );
}

function RiskCard({ selectedMarket }: { selectedMarket: MoonwellMarketRead }) {
  return (
    <div className="rounded-[26px] border border-amber-300/12 bg-amber-300/[0.045] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/16 bg-amber-300/10 text-amber-100">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">
            Borrow risk
          </p>
          <h3 className="mt-2 text-[1.05rem] font-black tracking-[-0.035em] text-white">
            Keep liquidation risk visible.
          </h3>
        </div>
      </div>
      <p className="mt-4 text-[12px] leading-6 text-amber-100/90">
        {selectedMarket.riskLabel}. Borrowing should stay conservative; if shortfall appears, repay
        or add collateral before opening new debt.
      </p>
      <div className="mt-4 grid gap-2">
        <MarketMetric
          label="Available liquidity"
          value={formatUsdLiquidity(selectedMarket.accountLiquidityRaw)}
        />
        <MarketMetric label="Market liquidity" value={selectedMarket.liquidityLabel} />
        <MarketMetric
          label="Collateral enabled"
          value={selectedMarket.collateralEnabled ? "Yes" : "No"}
        />
      </div>
    </div>
  );
}

function RouteCard() {
  return (
    <div className="rounded-[26px] border border-white/6 bg-white/[0.025] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-lime-300/14 bg-lime-300/10 text-lime-200">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
        Recommended order
      </p>
      <div className="mt-3 space-y-2">
        {["Supply", "Enable collateral", "Borrow small", "Repay before adding risk"].map(
          (step, index) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-[16px] border border-white/6 bg-black/18 px-3 py-2.5"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-300 text-[10px] font-black text-black">
                {index + 1}
              </span>
              <span className="text-[12px] font-semibold text-white">{step}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function MarketMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-black/20 px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1.5 break-words text-[12px] font-semibold text-white">{value}</p>
    </div>
  );
}

function getActionDisabledReason({
  action,
  market,
  walletReady,
}: {
  action: MoonwellMarketTransactionKind;
  market: MoonwellMarketRead | null;
  walletReady: boolean;
}) {
  if (!walletReady) {
    return "Connect wallet first";
  }

  if (!market || market.status === "read-error") {
    return "Market read unavailable";
  }

  const supplied = BigInt(market.suppliedUnderlyingRaw || "0");
  const borrowed = BigInt(market.borrowedUnderlyingRaw || "0");

  if (action === "withdraw" && supplied <= BigInt(0)) {
    return "Nothing supplied";
  }

  if (action === "repay" && borrowed <= BigInt(0)) {
    return "Nothing borrowed";
  }

  if (action === "enable-collateral") {
    if (supplied <= BigInt(0)) return "Supply first";
    if (market.collateralEnabled) return "Already enabled";
  }

  if (action === "borrow" && !market.collateralEnabled) {
    return "Enable collateral first";
  }

  if (action === "borrow" && BigInt(market.accountShortfallRaw || "0") > BigInt(0)) {
    return "Shortfall detected";
  }

  return null;
}

function getActionButtonLabel({
  action,
  busy,
  disabledReason,
  status,
}: {
  action: MoonwellMarketTransactionKind;
  busy: boolean;
  disabledReason: string | null;
  status: string;
}) {
  if (busy) {
    if (status === "checking") return "Checking wallet...";
    if (status === "approving") return "Approving...";
    if (status === "withdrawing") return "Withdrawing...";
    if (status === "enabling") return "Enabling...";
    if (status === "borrowing") return "Borrowing...";
    if (status === "repaying") return "Repaying...";
    return "Supplying...";
  }

  if (disabledReason) {
    return disabledReason;
  }

  if (action === "enable-collateral") return "Enable collateral";
  return action;
}
