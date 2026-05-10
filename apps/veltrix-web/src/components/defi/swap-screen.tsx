"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDownUp,
  ArrowRight,
  BadgeDollarSign,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { DefiSafetyPanel } from "@/components/defi/defi-safety-panel";
import { useAuth } from "@/components/providers/auth-provider";
import { useVyntroSwap } from "@/hooks/use-vyntro-swap";
import {
  formatSwapTokenAmount,
  getQuoteExpiryLabel,
  getAllSwapTokens,
  getSwapTokenByAddress,
  type SwapToken,
} from "@/lib/defi/vyntro-swap";
import { DefiRouteNav } from "@/components/defi/defi-route-nav";

const DEFAULT_SWAP_TOKENS = getAllSwapTokens();
const SWAP_HERO_IMAGE = "/assets/defi/swap-hero.webp";

function toBackgroundImage(value: string) {
  return `url("${value.replaceAll('"', '\\"')}")`;
}

const accentStyles: Record<SwapToken["accent"], string> = {
  cyan: "border-cyan-300/14 bg-cyan-300/10 text-cyan-100",
  lime: "border-lime-300/14 bg-lime-300/10 text-lime-100",
  amber: "border-amber-300/14 bg-amber-300/10 text-amber-100",
  violet: "border-violet-300/14 bg-violet-300/10 text-violet-100",
  blue: "border-blue-300/14 bg-blue-300/10 text-blue-100",
};

function getToken(symbol: string, tokens: SwapToken[]) {
  return tokens.find((token) => token.symbol === symbol) ?? tokens[0] ?? DEFAULT_SWAP_TOKENS[0];
}

function getTokenByAddressFromList(address: string | null, tokens: SwapToken[]) {
  const normalized = (address ?? "").trim().toLowerCase();
  if (!normalized) return null;

  if (normalized === "native") {
    return tokens.find((token) => token.symbol === "ETH") ?? null;
  }

  return (
    tokens.find(
      (token) => token.address !== "native" && token.address.toLowerCase() === normalized
    ) ?? null
  );
}

function resolveInitialTokenSymbol(value: string | null, fallback: string, tokens: SwapToken[]) {
  if (!value) return fallback;

  const bySymbol = tokens.find(
    (token) => token.symbol.toLowerCase() === value.trim().toLowerCase()
  );

  if (bySymbol) return bySymbol.symbol;

  return getTokenByAddressFromList(value, tokens)?.symbol ?? getSwapTokenByAddress(value)?.symbol ?? fallback;
}

function formatBps(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Unknown";
  return `${(value / 100).toFixed(2)}%`;
}

export function SwapScreen() {
  const searchParams = useSearchParams();
  const { session, profile } = useAuth();
  const projectTokenAddress = searchParams.get("projectToken");
  const initialBuyValue = searchParams.get("buy") ?? projectTokenAddress;
  const [swapTokens, setSwapTokens] = useState(DEFAULT_SWAP_TOKENS);
  const unsupportedProjectToken = Boolean(
    projectTokenAddress && !getTokenByAddressFromList(projectTokenAddress, swapTokens)
  );
  const [sellTokenSymbol, setSellTokenSymbol] = useState(() =>
    resolveInitialTokenSymbol(searchParams.get("sell"), "USDC", DEFAULT_SWAP_TOKENS)
  );
  const [buyTokenSymbol, setBuyTokenSymbol] = useState(() =>
    resolveInitialTokenSymbol(initialBuyValue, "ETH", DEFAULT_SWAP_TOKENS)
  );
  const [sellAmount, setSellAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);
  const swap = useVyntroSwap({
    accessToken: session?.access_token,
    wallet: profile?.wallet,
  });
  const walletReady = Boolean(profile?.wallet);
  useEffect(() => {
    let cancelled = false;

    async function loadTokens() {
      const response = await fetch("/api/defi/swap/tokens");
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            tokens?: SwapToken[];
          }
        | null;

      if (cancelled || !response.ok || !Array.isArray(payload?.tokens)) return;

      setSwapTokens(payload.tokens);

      const nextBuySymbol = resolveInitialTokenSymbol(
        initialBuyValue,
        buyTokenSymbol,
        payload.tokens
      );
      if (nextBuySymbol !== buyTokenSymbol) {
        setBuyTokenSymbol(nextBuySymbol);
      }
    }

    void loadTokens().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [buyTokenSymbol, initialBuyValue]);

  const sellToken = getToken(sellTokenSymbol, swapTokens);
  const buyToken = getToken(buyTokenSymbol, swapTokens);
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
      <SwapHero
        buyToken={buyToken}
        feeBps={swap.quotePayload?.config.platformFeeBps ?? 0}
        provider={recommended?.provider ?? "0x first / Uniswap fallback"}
        sellToken={sellToken}
        slippageBps={slippageBps}
        walletReady={walletReady}
      />

      <DefiRouteNav compact />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div
          id="swap-panel"
          className="rounded-[30px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,18,23,0.98),rgba(7,9,12,0.99))] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.32)] sm:p-5"
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)]">
            <SwapTokenField
              amount={sellAmount}
              label="Sell"
              onAmountChange={setSellAmount}
              onTokenChange={setSellTokenSymbol}
              token={sellToken}
              tokens={swapTokens}
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
              tokens={swapTokens}
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
          <DefiSafetyPanel
            route="swap"
            actionSlot={
              <div className="grid gap-2">
                <SafetyLine label="Wallet" value={walletReady ? "Verified" : "Connect first"} />
                <SafetyLine label="Provider" value={recommended ? recommended.provider : "0x first / Uniswap fallback"} />
                <SafetyLine label="Fee" value={`${swap.quotePayload?.config.platformFeeBps ?? 0} bps`} />
              </div>
            }
          />

          <div id="route-detail" className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              Route detail
            </p>
            <p className="mt-3 text-xl font-black tracking-[-0.04em] text-white">
              {recommended ? `${recommended.provider} route ready` : "No quote yet"}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {recommended?.routeSummary ?? "Enter an amount to compare configured routes."}
            </p>
            {unsupportedProjectToken ? (
              <div className="mt-4 rounded-[18px] border border-amber-300/14 bg-amber-300/[0.055] p-3 text-[12px] font-semibold leading-5 text-amber-100">
                This project token is known on the showcase, but it is not in the launch swap
                token list yet. Add it to the route registry before enabling one-click swaps.
              </div>
            ) : null}
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

function SwapHero({
  buyToken,
  feeBps,
  provider,
  sellToken,
  slippageBps,
  walletReady,
}: {
  buyToken: SwapToken;
  feeBps: number;
  provider: string;
  sellToken: SwapToken;
  slippageBps: number;
  walletReady: boolean;
}) {
  return (
    <section className="motion-surface motion-light-sweep relative overflow-hidden rounded-[34px] border border-white/7 bg-[#05080b] shadow-[0_32px_110px_rgba(0,0,0,0.38)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.98] brightness-[0.96] contrast-110 saturate-125"
        style={{ backgroundImage: toBackgroundImage(SWAP_HERO_IMAGE) }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_25%,rgba(168,85,247,0.16),transparent_32%),radial-gradient(circle_at_80%_48%,rgba(190,255,74,0.14),transparent_28%),linear-gradient(90deg,rgba(1,3,7,0.9),rgba(2,4,10,0.66)_35%,rgba(3,4,10,0.22)_62%,rgba(3,5,9,0.72)),linear-gradient(180deg,rgba(4,6,10,0.04),rgba(3,5,8,0.76))]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#050608] to-transparent" />

      <div className="relative z-10 grid min-h-[540px] gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_410px] xl:items-end">
        <div className="max-w-4xl self-end pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <SwapHeroChip tone="violet">Route finder</SwapHeroChip>
            <SwapHeroChip tone="lime">Wallet signs</SwapHeroChip>
            <SwapHeroChip tone="cyan">Quote before swap</SwapHeroChip>
          </div>

          <h1 className="mt-7 max-w-[11ch] text-[4rem] font-black leading-[0.88] tracking-normal text-white [text-shadow:0_18px_70px_rgba(0,0,0,0.72)] sm:text-[5.4rem] xl:text-[7rem]">
            Swap route
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-100 sm:text-[1rem]">
            Move into the right asset before the next DeFi action. VYNTRO compares the route, shows the safety posture and keeps custody in your wallet.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#swap-panel"
              className="motion-press inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-lime-200"
            >
              <ArrowDownUp className="h-4 w-4" />
              Open swap panel
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#route-detail"
              className="motion-press inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl transition hover:border-cyan-300/24 hover:bg-cyan-300/10"
            >
              Route detail
              <WalletCards className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-6 grid max-w-3xl gap-2.5 sm:grid-cols-3">
            <SwapHeroSignal label="Pair" value={`${sellToken.symbol} -> ${buyToken.symbol}`} />
            <SwapHeroSignal label="Slippage" value={formatBps(slippageBps)} />
            <SwapHeroSignal label="Custody" value="Never held" />
          </div>
        </div>

        <div className="motion-surface relative overflow-hidden rounded-[28px] border border-white/9 bg-black/48 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(190,255,74,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_45%)]" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">Quote posture</p>
                <h2 className="mt-2 text-[1.35rem] font-black text-white">
                  {walletReady ? "Wallet ready for route discovery." : "Connect wallet before signing."}
                </h2>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-lime-300/18 bg-lime-300/10 text-lime-100">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#c4b5fd,#74f7ff,#beff4a)] shadow-[0_0_24px_rgba(190,255,74,0.28)]"
                style={{ width: walletReady ? "84%" : "42%" }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <SwapHeroPanelMetric label="Provider" value={provider} sub="Best available route" />
              <SwapHeroPanelMetric label="Fee" value={`${feeBps} bps`} sub="Shown before signature" />
              <SwapHeroPanelMetric label="Sell" value={sellToken.symbol} sub={sellToken.label} />
              <SwapHeroPanelMetric label="Buy" value={buyToken.symbol} sub={buyToken.label} />
            </div>

            <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.04] p-3.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Safe signing rule</p>
              <p className="mt-2 text-[13px] font-black leading-5 text-white">
                Quote first, review impact, then sign from your wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SwapHeroChip({ children, tone }: { children: string; tone: "lime" | "cyan" | "violet" }) {
  const toneClass =
    tone === "lime"
      ? "border-lime-300/18 bg-lime-300/14 text-lime-100"
      : tone === "cyan"
        ? "border-cyan-300/18 bg-cyan-300/12 text-cyan-100"
        : "border-violet-300/18 bg-violet-300/12 text-violet-100";

  return (
    <span className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] backdrop-blur-xl ${toneClass}`}>
      {children}
    </span>
  );
}

function SwapHeroSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/26 px-3.5 py-3 backdrop-blur-md">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1.5 truncate text-[13px] font-black text-white">{value}</p>
    </div>
  );
}

function SwapHeroPanelMetric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/28 p-3.5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 truncate text-[1.05rem] font-black text-white">{value}</p>
      <p className="mt-1 truncate text-[10px] font-bold text-slate-400">{sub}</p>
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
  tokens,
}: {
  amount: string;
  label: string;
  onAmountChange?: (value: string) => void;
  onTokenChange: (value: string) => void;
  readOnly?: boolean;
  token: SwapToken;
  tokens: SwapToken[];
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
          {tokens.map((item) => (
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
