"use client";

import { useState } from "react";
import {
  ArrowDownUp,
  BadgeDollarSign,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useVyntroSwap } from "@/hooks/use-vyntro-swap";
import {
  BASE_SWAP_TOKENS,
  formatSwapTokenAmount,
  getQuoteExpiryLabel,
  type SwapToken,
} from "@/lib/defi/vyntro-swap";

const accentStyles: Record<SwapToken["accent"], string> = {
  cyan: "border-cyan-300/14 bg-cyan-300/10 text-cyan-100",
  lime: "border-lime-300/14 bg-lime-300/10 text-lime-100",
  amber: "border-amber-300/14 bg-amber-300/10 text-amber-100",
  violet: "border-violet-300/14 bg-violet-300/10 text-violet-100",
  blue: "border-blue-300/14 bg-blue-300/10 text-blue-100",
};

function getToken(symbol: string) {
  return BASE_SWAP_TOKENS.find((token) => token.symbol === symbol) ?? BASE_SWAP_TOKENS[0];
}

function formatBps(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Unknown";
  return `${(value / 100).toFixed(2)}%`;
}

export function SwapScreen() {
  const { session, profile } = useAuth();
  const [sellTokenSymbol, setSellTokenSymbol] = useState("USDC");
  const [buyTokenSymbol, setBuyTokenSymbol] = useState("ETH");
  const [sellAmount, setSellAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);
  const swap = useVyntroSwap({
    accessToken: session?.access_token,
    wallet: profile?.wallet,
  });
  const walletReady = Boolean(profile?.wallet);
  const sellToken = getToken(sellTokenSymbol);
  const buyToken = getToken(buyTokenSymbol);
  const recommended = swap.quotePayload?.recommended ?? null;
  const quotedBuyAmount = recommended
    ? formatSwapTokenAmount(recommended.buyAmountRaw, buyToken.decimals, buyToken.symbol)
    : "Route pending";
  const busy =
    swap.status === "quoting" ||
    swap.status === "approving" ||
    swap.status === "signing" ||
    swap.status === "submitted";
  const canSign = Boolean(swap.quotePayload?.safeToSign && recommended?.transaction && walletReady);

  async function handleQuote() {
    await swap.quote({
      sellTokenSymbol,
      buyTokenSymbol,
      sellAmount,
      slippageBps,
    });
  }

  function flipPair() {
    setSellTokenSymbol(buyTokenSymbol);
    setBuyTokenSymbol(sellTokenSymbol);
    setSellAmount("");
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="relative overflow-hidden rounded-[30px] border border-white/6 bg-[radial-gradient(circle_at_14%_0%,rgba(74,217,255,0.17),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(190,255,74,0.1),transparent_24%),linear-gradient(180deg,rgba(13,15,20,0.99),rgba(6,7,10,0.995))] p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04),transparent_38%)]" />
          <div className="relative z-10 max-w-4xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
              VYNTRO Swap
            </p>
            <h1 className="mt-4 max-w-4xl text-[clamp(1.75rem,3vw,3.35rem)] font-black leading-[0.94] tracking-[-0.05em] text-white">
              Move into the right asset before the next DeFi action.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              Swap through a VYNTRO-native interface while routes are powered by external liquidity.
              You approve and sign from your wallet; VYNTRO never takes custody.
            </p>
          </div>
        </div>

        <aside className="rounded-[28px] border border-lime-300/10 bg-[radial-gradient(circle_at_100%_0%,rgba(190,255,74,0.12),transparent_34%),linear-gradient(180deg,rgba(13,16,18,0.98),rgba(7,9,12,0.995))] p-5">
          <ShieldCheck className="h-6 w-6 text-lime-200" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">
            Safety read
          </p>
          <p className="mt-2 text-[1.2rem] font-black tracking-[-0.04em] text-white">
            No custody. Review route. Sign only what you expect.
          </p>
          <p className="mt-3 text-[12px] leading-6 text-slate-400">
            Output can change before confirmation. Start with small swaps while platform fees are
            disabled for launch testing.
          </p>
          <div className="mt-4 grid gap-2">
            <SafetyLine label="Wallet" value={walletReady ? "Verified" : "Connect first"} />
            <SafetyLine
              label="Provider"
              value={recommended ? recommended.provider : "0x first / Uniswap fallback"}
            />
            <SafetyLine
              label="Fee"
              value={`${swap.quotePayload?.config.platformFeeBps ?? 0} bps`}
            />
          </div>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="rounded-[30px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,18,23,0.98),rgba(7,9,12,0.99))] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.32)] sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)]">
            <SwapTokenField
              amount={sellAmount}
              label="Sell"
              onAmountChange={setSellAmount}
              onTokenChange={setSellTokenSymbol}
              token={sellToken}
            />
            <button
              type="button"
              onClick={flipPair}
              className="flex h-14 w-14 items-center justify-center self-center justify-self-center rounded-full border border-white/8 bg-black/30 text-cyan-100 transition hover:border-cyan-300/20 hover:bg-cyan-300/10"
            >
              <ArrowDownUp className="h-4 w-4" />
            </button>
            <SwapTokenField
              amount={quotedBuyAmount}
              label="Buy"
              onTokenChange={setBuyTokenSymbol}
              readOnly
              token={buyToken}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/6 bg-black/20 p-3">
            <div className="flex flex-wrap gap-2">
              {[30, 50, 100].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSlippageBps(value)}
                  className={`rounded-full border px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                    slippageBps === value
                      ? "border-lime-300/20 bg-lime-300 text-black"
                      : "border-white/8 bg-white/[0.035] text-slate-300 hover:border-white/12 hover:text-white"
                  }`}
                >
                  {formatBps(value)}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-semibold text-slate-500">Max slippage</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleQuote}
              disabled={busy || !walletReady}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-300 px-5 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <RefreshCw className="h-4 w-4" />
              {swap.status === "quoting" ? "Finding route" : walletReady ? "Find route" : "Connect wallet"}
            </button>
            <button
              type="button"
              disabled={busy || !canSign}
              onClick={() => swap.execute()}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:border-cyan-300/18 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              {swap.status === "approving"
                ? "Approving"
                : swap.status === "submitted"
                  ? "Confirming"
                  : "Sign swap"}
            </button>
          </div>

          {swap.message || swap.error ? (
            <div
              className={`mt-4 rounded-[20px] border p-4 text-[13px] font-semibold leading-6 ${
                swap.error
                  ? "border-rose-300/14 bg-rose-300/[0.06] text-rose-100"
                  : "border-cyan-300/14 bg-cyan-300/[0.06] text-cyan-100"
              }`}
            >
              {swap.error ?? swap.message}
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              Route detail
            </p>
            <p className="mt-3 text-xl font-black tracking-[-0.04em] text-white">
              {recommended ? `${recommended.provider} route ready` : "No quote yet"}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {recommended?.routeSummary ?? "Enter an amount to compare configured routes."}
            </p>
            <div className="mt-4 grid gap-2">
              <RouteMetric label="Estimated receive" value={recommended ? quotedBuyAmount : "-"} />
              <RouteMetric label="Price impact" value={formatBps(recommended?.priceImpactBps)} />
              <RouteMetric label="Gas estimate" value={recommended?.estimatedGas ?? "Unknown"} />
              <RouteMetric label="Quote status" value={getQuoteExpiryLabel(recommended?.expiresAt)} />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5">
            <div className="flex items-start gap-3">
              <BadgeDollarSign className="mt-1 h-5 w-5 text-lime-200" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">
                  Fee posture
                </p>
                <p className="mt-2 text-[13px] leading-6 text-slate-400">
                  Launch mode keeps VYNTRO fees at 0 bps until real Base test swaps are proven.
                  When enabled, the fee is shown here before signature.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function SwapTokenField({
  amount,
  label,
  onAmountChange,
  onTokenChange,
  readOnly,
  token,
}: {
  amount: string;
  label: string;
  onAmountChange?: (value: string) => void;
  onTokenChange: (value: string) => void;
  readOnly?: boolean;
  token: SwapToken;
}) {
  return (
    <label className="rounded-[26px] border border-white/6 bg-black/25 p-4">
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
        {label}
      </span>
      <input
        readOnly={readOnly}
        value={amount}
        onChange={(event) => onAmountChange?.(event.target.value)}
        placeholder="0.00"
        className="mt-4 w-full bg-transparent text-3xl font-black tracking-[-0.045em] text-white outline-none placeholder:text-slate-700"
      />
      <div className="mt-4 flex items-center justify-between gap-3">
        <select
          value={token.symbol}
          onChange={(event) => onTokenChange(event.target.value)}
          className="rounded-full border border-white/8 bg-[#080a0e] px-3 py-2 text-xs font-bold text-white outline-none"
        >
          {BASE_SWAP_TOKENS.map((item) => (
            <option key={item.symbol} value={item.symbol}>
              {item.symbol}
            </option>
          ))}
        </select>
        <span
          className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${accentStyles[token.accent]}`}
        >
          Base
        </span>
      </div>
    </label>
  );
}

function SafetyLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-white/6 bg-black/20 px-3 py-2.5">
      <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <span className="text-[11px] font-black text-white">{value}</span>
    </div>
  );
}

function RouteMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-black/20 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-[12px] font-black text-white">{value}</p>
    </div>
  );
}
