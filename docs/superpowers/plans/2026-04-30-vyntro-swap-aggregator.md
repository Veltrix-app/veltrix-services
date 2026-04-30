# VYNTRO Swap Aggregator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VYNTRO-native swap experience at `/defi/swap` with 0x as the primary quote/execution provider, Uniswap as a configured fallback/comparator, transparent fee posture, wallet signing, and DeFi activity tracking.

**Architecture:** Keep the swap product modular: pure TypeScript domain logic in `src/lib/defi`, provider adapters behind server-only API routes, a client hook for quote/submit state, and a focused UI component. Start with 0 bps platform fee and record intents/transactions so XP and portfolio logic can be layered safely.

**Tech Stack:** Next.js App Router, React 19, TypeScript, ethers v6, Supabase, node:test, Tailwind CSS, 0x Swap API, Uniswap Trading API.

---

## File Structure

- Create: `apps/veltrix-web/src/lib/defi/vyntro-swap.ts`
- Create: `apps/veltrix-web/src/lib/defi/vyntro-swap.test.ts`
- Create: `apps/veltrix-web/src/lib/defi/swap-providers.ts`
- Create: `apps/veltrix-web/src/lib/defi/swap-providers.test.ts`
- Create: `apps/veltrix-web/src/app/api/defi/swap/tokens/route.ts`
- Create: `apps/veltrix-web/src/app/api/defi/swap/quote/route.ts`
- Create: `apps/veltrix-web/src/app/api/defi/swap/intent/route.ts`
- Create: `apps/veltrix-web/src/app/api/defi/swap/transactions/route.ts`
- Create: `apps/veltrix-web/src/hooks/use-vyntro-swap.ts`
- Create: `apps/veltrix-web/src/components/defi/swap-screen.tsx`
- Create: `apps/veltrix-web/src/app/defi/swap/page.tsx`
- Modify: `apps/veltrix-web/src/components/defi/defi-landing-screen.tsx`
- Modify: `apps/veltrix-web/src/components/layout/app-shell.tsx`
- Modify: `apps/veltrix-web/src/lib/defi/defi-activity.ts`
- Modify: `apps/veltrix-web/src/lib/defi/defi-activity.test.ts`
- Modify: `apps/veltrix-web/src/app/api/defi/activity/route.ts`
- Modify: `apps/veltrix-web/.env.example`
- Create: `database/migrations/vyntro_defi_swap_transactions.sql`

## Task 1: Core Swap Domain

**Files:**
- Create: `apps/veltrix-web/src/lib/defi/vyntro-swap.test.ts`
- Create: `apps/veltrix-web/src/lib/defi/vyntro-swap.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";

import {
  BASE_SWAP_TOKENS,
  VYNTRO_SWAP_CHAIN_ID,
  buildSwapQuoteRequest,
  chooseRecommendedSwapQuote,
  classifySwapQuoteSafety,
  formatSwapTokenAmount,
  getSwapTokenBySymbol,
  normalizeSwapConfig,
  parseSwapAmount,
} from "./vyntro-swap";

test("base swap token list includes the launch assets used by VYNTRO DeFi", () => {
  assert.equal(VYNTRO_SWAP_CHAIN_ID, 8453);
  assert.deepEqual(
    BASE_SWAP_TOKENS.map((token) => token.symbol),
    ["ETH", "USDC", "EURC", "cbBTC", "WELL"]
  );
  assert.equal(getSwapTokenBySymbol("usdc")?.address, "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
});

test("swap amount parser rejects unsafe input and preserves token decimals", () => {
  assert.deepEqual(parseSwapAmount("12.345678", 6), { ok: true, raw: "12345678" });
  assert.deepEqual(parseSwapAmount("0.000001", 6), { ok: true, raw: "1" });
  assert.equal(parseSwapAmount("", 6).ok, false);
  assert.equal(parseSwapAmount("0", 6).ok, false);
  assert.equal(parseSwapAmount("-1", 6).ok, false);
  assert.equal(parseSwapAmount("1.0000001", 6).ok, false);
});

test("swap quote request validates wallet, tokens, amount and slippage", () => {
  const request = buildSwapQuoteRequest({
    wallet: "0x1234567890abcdef1234567890abcdef12345678",
    sellTokenSymbol: "USDC",
    buyTokenSymbol: "ETH",
    sellAmount: "25.5",
    slippageBps: 50,
  });

  assert.equal(request.ok, true);
  if (request.ok) {
    assert.equal(request.chainId, 8453);
    assert.equal(request.sellAmountRaw, "25500000");
    assert.equal(request.slippageBps, 50);
  }

  assert.equal(buildSwapQuoteRequest({ wallet: "", sellTokenSymbol: "USDC", buyTokenSymbol: "ETH", sellAmount: "1", slippageBps: 50 }).ok, false);
  assert.equal(buildSwapQuoteRequest({ wallet: "0x1234567890abcdef1234567890abcdef12345678", sellTokenSymbol: "USDC", buyTokenSymbol: "USDC", sellAmount: "1", slippageBps: 50 }).ok, false);
  assert.equal(buildSwapQuoteRequest({ wallet: "0x1234567890abcdef1234567890abcdef12345678", sellTokenSymbol: "USDC", buyTokenSymbol: "ETH", sellAmount: "1", slippageBps: 5000 }).ok, false);
});

test("swap config defaults to fee-off and clamps unsafe fee bps", () => {
  assert.deepEqual(normalizeSwapConfig({ feeBps: "", feeRecipient: "" }), {
    platformFeeBps: 0,
    platformFeeRecipient: null,
    maxSlippageBps: 300,
    dangerPriceImpactBps: 500,
  });
  assert.equal(
    normalizeSwapConfig({
      feeBps: "25",
      feeRecipient: "0x1234567890abcdef1234567890abcdef12345678",
    }).platformFeeBps,
    25
  );
  assert.equal(normalizeSwapConfig({ feeBps: "9999", feeRecipient: "0x1234567890abcdef1234567890abcdef12345678" }).platformFeeBps, 0);
});

test("quote recommendation picks best safe output and respects safety gates", () => {
  const recommended = chooseRecommendedSwapQuote([
    {
      provider: "0x",
      status: "ok",
      buyAmountRaw: "980000",
      estimatedGas: "120000",
      priceImpactBps: 12,
      transaction: { to: "0x1111111111111111111111111111111111111111", data: "0xabcdef", value: "0" },
      routeSummary: "0x route",
      expiresAt: "2026-04-30T12:00:00.000Z",
    },
    {
      provider: "uniswap",
      status: "ok",
      buyAmountRaw: "1000000",
      estimatedGas: "160000",
      priceImpactBps: 20,
      transaction: { to: "0x2222222222222222222222222222222222222222", data: "0xabcdef", value: "0" },
      routeSummary: "Uniswap route",
      expiresAt: "2026-04-30T12:00:00.000Z",
    },
  ]);

  assert.equal(recommended?.provider, "uniswap");
  assert.equal(classifySwapQuoteSafety({ priceImpactBps: 650, maxSlippageBps: 50, dangerPriceImpactBps: 500 }).status, "danger");
  assert.equal(formatSwapTokenAmount("1234500", 6, "USDC"), "1.2345 USDC");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```powershell
node --test apps/veltrix-web/src/lib/defi/vyntro-swap.test.ts
```

Expected: FAIL because `./vyntro-swap` does not exist.

- [ ] **Step 3: Implement the core domain file**

```ts
import { isAddress } from "ethers";

export const VYNTRO_SWAP_CHAIN_ID = 8453;
export const VYNTRO_SWAP_CHAIN_NAME = "Base";

export type SwapProvider = "0x" | "uniswap";

export type SwapToken = {
  symbol: string;
  label: string;
  address: `0x${string}` | "native";
  decimals: number;
  chainId: typeof VYNTRO_SWAP_CHAIN_ID;
};

export const BASE_SWAP_TOKENS: SwapToken[] = [
  { symbol: "ETH", label: "Ether", address: "native", decimals: 18, chainId: VYNTRO_SWAP_CHAIN_ID },
  { symbol: "USDC", label: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, chainId: VYNTRO_SWAP_CHAIN_ID },
  { symbol: "EURC", label: "Euro Coin", address: "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42", decimals: 6, chainId: VYNTRO_SWAP_CHAIN_ID },
  { symbol: "cbBTC", label: "Coinbase Wrapped BTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8, chainId: VYNTRO_SWAP_CHAIN_ID },
  { symbol: "WELL", label: "Moonwell", address: "0xA88594D404727625A9437C3f886C7643872296AE", decimals: 18, chainId: VYNTRO_SWAP_CHAIN_ID },
];

export type SwapAmountParseResult = { ok: true; raw: string } | { ok: false; error: string };

export type SwapQuoteRequest =
  | {
      ok: true;
      chainId: typeof VYNTRO_SWAP_CHAIN_ID;
      wallet: `0x${string}`;
      sellToken: SwapToken;
      buyToken: SwapToken;
      sellAmountRaw: string;
      slippageBps: number;
    }
  | { ok: false; error: string };

export type NormalizedSwapQuote = {
  provider: SwapProvider;
  status: "ok" | "error";
  buyAmountRaw: string;
  estimatedGas: string | null;
  priceImpactBps: number | null;
  transaction: { to: `0x${string}`; data: `0x${string}`; value: string } | null;
  routeSummary: string;
  expiresAt: string | null;
  error?: string;
};

export function getSwapTokenBySymbol(symbol: string) {
  return BASE_SWAP_TOKENS.find((token) => token.symbol.toLowerCase() === symbol.trim().toLowerCase()) ?? null;
}

export function parseSwapAmount(value: string, decimals: number): SwapAmountParseResult {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return { ok: false, error: "Enter a valid positive amount." };
  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) return { ok: false, error: `This token supports ${decimals} decimals.` };
  const raw = BigInt(whole + fraction.padEnd(decimals, "0")).toString();
  if (BigInt(raw) <= 0n) return { ok: false, error: "Amount must be greater than zero." };
  return { ok: true, raw };
}

export function formatSwapTokenAmount(rawValue: string, decimals: number, symbol: string) {
  const raw = BigInt(rawValue || "0");
  const scale = 10n ** BigInt(decimals);
  const whole = raw / scale;
  const fraction = (raw % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole.toString()}${fraction ? `.${fraction}` : ""} ${symbol}`;
}

export function normalizeSwapConfig(input: { feeBps?: string | null; feeRecipient?: string | null; maxSlippageBps?: string | null; dangerPriceImpactBps?: string | null }) {
  const feeBps = Number.parseInt(input.feeBps ?? "0", 10);
  const feeRecipient = input.feeRecipient?.trim() ?? "";
  return {
    platformFeeBps: Number.isInteger(feeBps) && feeBps >= 0 && feeBps <= 100 && isAddress(feeRecipient) ? feeBps : 0,
    platformFeeRecipient: isAddress(feeRecipient) ? feeRecipient.toLowerCase() : null,
    maxSlippageBps: Math.min(Math.max(Number.parseInt(input.maxSlippageBps ?? "300", 10) || 300, 1), 300),
    dangerPriceImpactBps: Math.min(Math.max(Number.parseInt(input.dangerPriceImpactBps ?? "500", 10) || 500, 100), 1500),
  };
}

export function buildSwapQuoteRequest(input: { wallet?: string | null; sellTokenSymbol: string; buyTokenSymbol: string; sellAmount: string; slippageBps: number }): SwapQuoteRequest {
  if (!input.wallet || !isAddress(input.wallet)) return { ok: false, error: "Connect a verified wallet first." };
  const sellToken = getSwapTokenBySymbol(input.sellTokenSymbol);
  const buyToken = getSwapTokenBySymbol(input.buyTokenSymbol);
  if (!sellToken || !buyToken) return { ok: false, error: "Unsupported token pair." };
  if (sellToken.symbol === buyToken.symbol) return { ok: false, error: "Choose two different tokens." };
  if (!Number.isInteger(input.slippageBps) || input.slippageBps < 1 || input.slippageBps > 300) return { ok: false, error: "Slippage must be between 0.01% and 3%." };
  const parsed = parseSwapAmount(input.sellAmount, sellToken.decimals);
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    chainId: VYNTRO_SWAP_CHAIN_ID,
    wallet: input.wallet.toLowerCase() as `0x${string}`,
    sellToken,
    buyToken,
    sellAmountRaw: parsed.raw,
    slippageBps: input.slippageBps,
  };
}

export function classifySwapQuoteSafety(input: { priceImpactBps: number | null; maxSlippageBps: number; dangerPriceImpactBps: number }) {
  if (input.priceImpactBps !== null && input.priceImpactBps >= input.dangerPriceImpactBps) {
    return { status: "danger" as const, message: "Price impact is high. Refresh or use a smaller amount." };
  }
  if (input.maxSlippageBps > 100) {
    return { status: "warning" as const, message: "Slippage is above 1%. Review carefully before signing." };
  }
  return { status: "ok" as const, message: "Route is inside the configured safety range." };
}

export function chooseRecommendedSwapQuote(quotes: NormalizedSwapQuote[]) {
  return quotes
    .filter((quote) => quote.status === "ok" && quote.transaction)
    .sort((a, b) => BigInt(b.buyAmountRaw || "0") > BigInt(a.buyAmountRaw || "0") ? 1 : -1)[0] ?? null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```powershell
node --test apps/veltrix-web/src/lib/defi/vyntro-swap.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/veltrix-web/src/lib/defi/vyntro-swap.ts apps/veltrix-web/src/lib/defi/vyntro-swap.test.ts
git commit -m "Add VYNTRO swap domain model"
```

## Task 2: Swap Database Migration

**Files:**
- Create: `database/migrations/vyntro_defi_swap_transactions.sql`

- [ ] **Step 1: Add the migration**

```sql
create table if not exists public.defi_swap_intents (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  wallet_address text not null,
  chain_id integer not null,
  sell_token_address text not null,
  sell_token_symbol text not null,
  buy_token_address text not null,
  buy_token_symbol text not null,
  sell_amount_raw text not null,
  expected_buy_amount_raw text not null default '0',
  provider text not null,
  route_summary text not null default '',
  slippage_bps integer not null default 50,
  platform_fee_bps integer not null default 0,
  platform_fee_recipient text,
  status text not null default 'quoted' check (status in ('quoted', 'submitted', 'confirmed', 'failed', 'expired')),
  tx_hash text unique,
  error_message text,
  quote_payload jsonb not null default '{}'::jsonb,
  transaction_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  confirmed_at timestamptz,
  failed_at timestamptz
);

create table if not exists public.defi_swap_fee_ledger (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid references public.defi_swap_intents(id) on delete set null,
  auth_user_id uuid not null,
  wallet_address text not null,
  chain_id integer not null,
  fee_bps integer not null default 0,
  fee_recipient text,
  sell_token_symbol text not null,
  buy_token_symbol text not null,
  sell_amount_raw text not null,
  estimated_fee_raw text not null default '0',
  tx_hash text,
  status text not null default 'pending' check (status in ('pending', 'collected', 'waived', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists defi_swap_intents_user_wallet_created_idx
  on public.defi_swap_intents(auth_user_id, wallet_address, created_at desc);

create index if not exists defi_swap_intents_tx_hash_idx
  on public.defi_swap_intents(tx_hash);

create index if not exists defi_swap_fee_ledger_intent_idx
  on public.defi_swap_fee_ledger(intent_id);

alter table public.defi_swap_intents enable row level security;
alter table public.defi_swap_fee_ledger enable row level security;

drop policy if exists "swap intents are service managed" on public.defi_swap_intents;
create policy "swap intents are service managed"
  on public.defi_swap_intents
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "swap fees are service managed" on public.defi_swap_fee_ledger;
create policy "swap fees are service managed"
  on public.defi_swap_fee_ledger
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
```

- [ ] **Step 2: Verify the migration file has the required tables**

Run:

```powershell
Select-String -LiteralPath database\migrations\vyntro_defi_swap_transactions.sql -Pattern "defi_swap_intents","defi_swap_fee_ledger","enable row level security"
```

Expected: output contains all three patterns.

- [ ] **Step 3: Commit**

```powershell
git add database/migrations/vyntro_defi_swap_transactions.sql
git commit -m "Add VYNTRO swap database migration"
```

## Task 3: Provider Quote Adapters

**Files:**
- Create: `apps/veltrix-web/src/lib/defi/swap-providers.test.ts`
- Create: `apps/veltrix-web/src/lib/defi/swap-providers.ts`

- [ ] **Step 1: Write provider adapter tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { buildZeroXQuoteUrl, normalizeZeroXQuote, normalizeUniswapQuote } from "./swap-providers";
import { buildSwapQuoteRequest, normalizeSwapConfig } from "./vyntro-swap";

const request = buildSwapQuoteRequest({
  wallet: "0x1234567890abcdef1234567890abcdef12345678",
  sellTokenSymbol: "USDC",
  buyTokenSymbol: "ETH",
  sellAmount: "25",
  slippageBps: 50,
});

test("0x quote URL includes Base chain, taker, slippage and optional fee", () => {
  assert.equal(request.ok, true);
  if (!request.ok) return;
  const url = buildZeroXQuoteUrl({
    request,
    config: normalizeSwapConfig({
      feeBps: "20",
      feeRecipient: "0x9999999999999999999999999999999999999999",
    }),
  });

  assert.equal(url.hostname, "api.0x.org");
  assert.equal(url.searchParams.get("chainId"), "8453");
  assert.equal(url.searchParams.get("sellAmount"), "25000000");
  assert.equal(url.searchParams.get("swapFeeBps"), "20");
});

test("0x quote normalization returns transaction payload for wallet signing", () => {
  const quote = normalizeZeroXQuote({
    buyAmount: "10000000000000000",
    gas: "160000",
    priceImpactBps: "25",
    transaction: {
      to: "0x1111111111111111111111111111111111111111",
      data: "0xabcdef",
      value: "0",
    },
    route: { fills: [{ source: "Uniswap_V3" }] },
  });

  assert.equal(quote.provider, "0x");
  assert.equal(quote.status, "ok");
  assert.equal(quote.transaction?.to, "0x1111111111111111111111111111111111111111");
  assert.match(quote.routeSummary, /Uniswap_V3/);
});

test("Uniswap quote normalization handles missing transaction as unavailable route", () => {
  const quote = normalizeUniswapQuote({ quote: { output: { amount: "42" } } });
  assert.equal(quote.provider, "uniswap");
  assert.equal(quote.status, "error");
  assert.match(quote.error ?? "", /transaction/i);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
node --test apps/veltrix-web/src/lib/defi/swap-providers.test.ts
```

Expected: FAIL because `swap-providers.ts` does not exist.

- [ ] **Step 3: Implement provider adapters**

```ts
import type { NormalizedSwapQuote, SwapQuoteRequest } from "./vyntro-swap";

type SwapConfig = {
  platformFeeBps: number;
  platformFeeRecipient: string | null;
  maxSlippageBps: number;
  dangerPriceImpactBps: number;
};

export function tokenAddressForProvider(address: string) {
  return address === "native" ? "ETH" : address;
}

export function buildZeroXQuoteUrl(input: { request: Extract<SwapQuoteRequest, { ok: true }>; config: SwapConfig }) {
  const url = new URL("https://api.0x.org/swap/permit2/quote");
  url.searchParams.set("chainId", String(input.request.chainId));
  url.searchParams.set("sellToken", tokenAddressForProvider(input.request.sellToken.address));
  url.searchParams.set("buyToken", tokenAddressForProvider(input.request.buyToken.address));
  url.searchParams.set("sellAmount", input.request.sellAmountRaw);
  url.searchParams.set("taker", input.request.wallet);
  url.searchParams.set("slippageBps", String(input.request.slippageBps));
  if (input.config.platformFeeBps > 0 && input.config.platformFeeRecipient) {
    url.searchParams.set("swapFeeBps", String(input.config.platformFeeBps));
    url.searchParams.set("swapFeeRecipient", input.config.platformFeeRecipient);
    url.searchParams.set("swapFeeToken", tokenAddressForProvider(input.request.buyToken.address));
  }
  return url;
}

function asRecord(value: unknown) {
  return typeof value === "object" && value ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function normalizeZeroXQuote(payload: unknown): NormalizedSwapQuote {
  const value = asRecord(payload);
  const transaction = asRecord(value.transaction);
  const to = asString(transaction.to);
  const data = asString(transaction.data);
  const buyAmountRaw = asString(value.buyAmount);
  if (!to || !data || !buyAmountRaw) {
    return {
      provider: "0x",
      status: "error",
      buyAmountRaw: "0",
      estimatedGas: null,
      priceImpactBps: null,
      transaction: null,
      routeSummary: "0x unavailable",
      expiresAt: null,
      error: "0x did not return a complete transaction.",
    };
  }
  const fills = Array.isArray(asRecord(value.route).fills) ? (asRecord(value.route).fills as Array<Record<string, unknown>>) : [];
  return {
    provider: "0x",
    status: "ok",
    buyAmountRaw,
    estimatedGas: asString(value.gas) || null,
    priceImpactBps: Number.parseInt(asString(value.priceImpactBps) || "0", 10),
    transaction: { to: to as `0x${string}`, data: data as `0x${string}`, value: asString(transaction.value) || "0" },
    routeSummary: fills.map((fill) => asString(fill.source)).filter(Boolean).join(" / ") || "0x best route",
    expiresAt: new Date(Date.now() + 45_000).toISOString(),
  };
}

export function normalizeUniswapQuote(payload: unknown): NormalizedSwapQuote {
  const value = asRecord(payload);
  const quote = asRecord(value.quote);
  const tx = asRecord(value.transaction ?? value.swap);
  const to = asString(tx.to);
  const data = asString(tx.data);
  const output = asRecord(quote.output);
  const buyAmountRaw = asString(output.amount) || asString(quote.amountOut);
  if (!to || !data || !buyAmountRaw) {
    return {
      provider: "uniswap",
      status: "error",
      buyAmountRaw: "0",
      estimatedGas: null,
      priceImpactBps: null,
      transaction: null,
      routeSummary: "Uniswap unavailable",
      expiresAt: null,
      error: "Uniswap did not return a complete transaction.",
    };
  }
  return {
    provider: "uniswap",
    status: "ok",
    buyAmountRaw,
    estimatedGas: asString(value.gasFee) || asString(quote.gasUseEstimate) || null,
    priceImpactBps: Number.parseInt(asString(quote.priceImpactBps) || "0", 10),
    transaction: { to: to as `0x${string}`, data: data as `0x${string}`, value: asString(tx.value) || "0" },
    routeSummary: asString(quote.routeString) || "Uniswap route",
    expiresAt: new Date(Date.now() + 45_000).toISOString(),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```powershell
node --test apps/veltrix-web/src/lib/defi/swap-providers.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/veltrix-web/src/lib/defi/swap-providers.ts apps/veltrix-web/src/lib/defi/swap-providers.test.ts
git commit -m "Add swap provider quote adapters"
```

## Task 4: Swap API Routes

**Files:**
- Create: `apps/veltrix-web/src/app/api/defi/swap/tokens/route.ts`
- Create: `apps/veltrix-web/src/app/api/defi/swap/quote/route.ts`
- Create: `apps/veltrix-web/src/app/api/defi/swap/intent/route.ts`
- Create: `apps/veltrix-web/src/app/api/defi/swap/transactions/route.ts`

- [ ] **Step 1: Create the token route**

```ts
import { NextResponse } from "next/server";
import { BASE_SWAP_TOKENS } from "@/lib/defi/vyntro-swap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    chainId: 8453,
    tokens: BASE_SWAP_TOKENS,
  });
}
```

- [ ] **Step 2: Create the quote route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildZeroXQuoteUrl, normalizeUniswapQuote, normalizeZeroXQuote } from "@/lib/defi/swap-providers";
import { buildSwapQuoteRequest, chooseRecommendedSwapQuote, normalizeSwapConfig } from "@/lib/defi/vyntro-swap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { wallet?: string; sellTokenSymbol?: string; buyTokenSymbol?: string; sellAmount?: string; slippageBps?: number }
    | null;

  const quoteRequest = buildSwapQuoteRequest({
    wallet: body?.wallet,
    sellTokenSymbol: body?.sellTokenSymbol ?? "",
    buyTokenSymbol: body?.buyTokenSymbol ?? "",
    sellAmount: body?.sellAmount ?? "",
    slippageBps: body?.slippageBps ?? 50,
  });

  if (!quoteRequest.ok) {
    return NextResponse.json({ ok: false, error: quoteRequest.error }, { status: 400 });
  }

  const config = normalizeSwapConfig({
    feeBps: process.env.SWAP_PLATFORM_FEE_BPS,
    feeRecipient: process.env.SWAP_PLATFORM_FEE_RECIPIENT,
    maxSlippageBps: process.env.SWAP_MAX_SLIPPAGE_BPS,
    dangerPriceImpactBps: process.env.SWAP_DANGER_PRICE_IMPACT_BPS,
  });

  const quotes = [];
  const zeroXKey = process.env.ZEROX_API_KEY;
  if (zeroXKey) {
    const zeroXResponse = await fetch(buildZeroXQuoteUrl({ request: quoteRequest, config }), {
      headers: { "0x-api-key": zeroXKey, "0x-version": "v2" },
      cache: "no-store",
    });
    quotes.push(zeroXResponse.ok ? normalizeZeroXQuote(await zeroXResponse.json()) : { provider: "0x", status: "error", buyAmountRaw: "0", estimatedGas: null, priceImpactBps: null, transaction: null, routeSummary: "0x unavailable", expiresAt: null, error: `0x request failed with ${zeroXResponse.status}` });
  }

  if (process.env.UNISWAP_API_KEY) {
    quotes.push(normalizeUniswapQuote({ error: "Uniswap integration is configured but not yet enabled in Phase 1." }));
  }

  const recommended = chooseRecommendedSwapQuote(quotes);
  if (!recommended) {
    return NextResponse.json({ ok: false, error: "No safe swap route found.", quotes }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    request: quoteRequest,
    quotes,
    recommended,
    config,
  });
}
```

- [ ] **Step 3: Create the intent route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient, createSupabaseUserServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const userSupabase = createSupabaseUserServerClient(accessToken);
  const serviceSupabase = createSupabaseServiceClient();
  const { data: { user }, error: userError } = await userSupabase.auth.getUser(accessToken);
  if (userError || !user) return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });

  const row = {
    auth_user_id: user.id,
    wallet_address: String(body?.wallet ?? "").toLowerCase(),
    chain_id: Number(body?.chainId ?? 8453),
    sell_token_address: String(body?.sellTokenAddress ?? ""),
    sell_token_symbol: String(body?.sellTokenSymbol ?? ""),
    buy_token_address: String(body?.buyTokenAddress ?? ""),
    buy_token_symbol: String(body?.buyTokenSymbol ?? ""),
    sell_amount_raw: String(body?.sellAmountRaw ?? "0"),
    expected_buy_amount_raw: String(body?.expectedBuyAmountRaw ?? "0"),
    provider: String(body?.provider ?? ""),
    route_summary: String(body?.routeSummary ?? ""),
    slippage_bps: Number(body?.slippageBps ?? 50),
    platform_fee_bps: Number(body?.platformFeeBps ?? 0),
    platform_fee_recipient: body?.platformFeeRecipient ? String(body.platformFeeRecipient).toLowerCase() : null,
    status: "quoted",
    quote_payload: body?.quotePayload ?? {},
    transaction_payload: body?.transactionPayload ?? {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await serviceSupabase.from("defi_swap_intents").insert(row).select("id").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, intentId: data.id });
}
```

- [ ] **Step 4: Create the transaction logging route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient, createSupabaseUserServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { intentId?: string; txHash?: string; status?: "submitted" | "confirmed" | "failed"; errorMessage?: string | null }
    | null;

  if (!body?.intentId) return NextResponse.json({ ok: false, error: "Missing swap intent." }, { status: 400 });
  if (!body?.txHash || !/^0x[a-fA-F0-9]{64}$/.test(body.txHash)) return NextResponse.json({ ok: false, error: "Valid transaction hash is required." }, { status: 400 });
  if (body.status !== "submitted" && body.status !== "confirmed" && body.status !== "failed") {
    return NextResponse.json({ ok: false, error: "Unknown transaction status." }, { status: 400 });
  }

  const userSupabase = createSupabaseUserServerClient(accessToken);
  const serviceSupabase = createSupabaseServiceClient();
  const { data: { user }, error: userError } = await userSupabase.auth.getUser(accessToken);
  if (userError || !user) return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });

  const { data: intent, error: intentError } = await serviceSupabase
    .from("defi_swap_intents")
    .select("id, auth_user_id, wallet_address, chain_id, sell_token_symbol, buy_token_symbol, sell_amount_raw, platform_fee_bps, platform_fee_recipient")
    .eq("id", body.intentId)
    .eq("auth_user_id", user.id)
    .single();

  if (intentError || !intent) {
    return NextResponse.json({ ok: false, error: intentError?.message ?? "Swap intent not found." }, { status: 404 });
  }

  const { data: walletLink, error: walletError } = await serviceSupabase
    .from("wallet_links")
    .select("id")
    .eq("auth_user_id", user.id)
    .eq("wallet_address", String(intent.wallet_address).toLowerCase())
    .eq("verified", true)
    .maybeSingle();

  if (walletError) return NextResponse.json({ ok: false, error: walletError.message }, { status: 500 });
  if (!walletLink) return NextResponse.json({ ok: false, error: "Swap wallet is not verified on this account." }, { status: 403 });

  const timestamp = new Date().toISOString();
  const updateRow = {
    tx_hash: body.txHash.toLowerCase(),
    status: body.status,
    error_message: body.errorMessage ?? null,
    submitted_at: body.status === "submitted" ? timestamp : undefined,
    confirmed_at: body.status === "confirmed" ? timestamp : undefined,
    failed_at: body.status === "failed" ? timestamp : undefined,
    updated_at: timestamp,
  };

  const { error: updateError } = await serviceSupabase
    .from("defi_swap_intents")
    .update(updateRow)
    .eq("id", intent.id)
    .eq("auth_user_id", user.id);

  if (updateError) return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });

  if (Number(intent.platform_fee_bps ?? 0) > 0) {
    await serviceSupabase.from("defi_swap_fee_ledger").upsert(
      {
        intent_id: intent.id,
        auth_user_id: user.id,
        wallet_address: String(intent.wallet_address).toLowerCase(),
        chain_id: Number(intent.chain_id),
        fee_bps: Number(intent.platform_fee_bps),
        fee_recipient: intent.platform_fee_recipient,
        sell_token_symbol: intent.sell_token_symbol,
        buy_token_symbol: intent.buy_token_symbol,
        sell_amount_raw: intent.sell_amount_raw,
        estimated_fee_raw: "0",
        tx_hash: body.txHash.toLowerCase(),
        status: body.status === "confirmed" ? "collected" : body.status === "failed" ? "failed" : "pending",
        metadata: { source: "vyntro_swap" },
        updated_at: timestamp,
      },
      { onConflict: "intent_id" }
    );
  }

  return NextResponse.json({ ok: true, txHash: body.txHash.toLowerCase(), status: body.status });
}
```

- [ ] **Step 5: Run typecheck**

Run:

```powershell
npm run typecheck --workspace vyntro-web
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add apps/veltrix-web/src/app/api/defi/swap database/migrations/vyntro_defi_swap_transactions.sql
git commit -m "Add VYNTRO swap API routes"
```

## Task 5: Client Hook and Wallet Execution

**Files:**
- Create: `apps/veltrix-web/src/hooks/use-vyntro-swap.ts`

- [ ] **Step 1: Implement the hook**

```ts
"use client";

import { useState } from "react";
import { BrowserProvider } from "ethers";
import type { Eip1193Provider } from "ethers";
import { VYNTRO_SWAP_CHAIN_ID } from "@/lib/defi/vyntro-swap";

const BASE_CHAIN_HEX = `0x${VYNTRO_SWAP_CHAIN_ID.toString(16)}`;

type SwapState = {
  status: "idle" | "quoting" | "ready" | "signing" | "submitted" | "confirmed" | "error";
  message: string | null;
  error: string | null;
  quote: Record<string, unknown> | null;
  txHash: string | null;
};

async function ensureBaseNetwork(ethereum: Eip1193Provider) {
  try {
    await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BASE_CHAIN_HEX }] });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
    if (code !== "4902") throw error;
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{ chainId: BASE_CHAIN_HEX, chainName: "Base", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: ["https://mainnet.base.org"], blockExplorerUrls: ["https://basescan.org"] }],
    });
  }
}

export function useVyntroSwap({ accessToken, wallet }: { accessToken?: string | null; wallet?: string | null }) {
  const [state, setState] = useState<SwapState>({ status: "idle", message: null, error: null, quote: null, txHash: null });

  async function quote(input: { sellTokenSymbol: string; buyTokenSymbol: string; sellAmount: string; slippageBps: number }) {
    setState({ status: "quoting", message: "Finding the best safe route...", error: null, quote: null, txHash: null });
    const response = await fetch("/api/defi/swap/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, ...input }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setState({ status: "error", message: null, error: payload.error ?? "No swap route found.", quote: null, txHash: null });
      return null;
    }
    setState({ status: "ready", message: "Route ready. Review before signing.", error: null, quote: payload, txHash: null });
    return payload;
  }

  async function execute(payload: Record<string, unknown>) {
    if (!accessToken) throw new Error("Sign in again before swapping.");
    if (!wallet) throw new Error("Connect a verified wallet first.");
    if (typeof window === "undefined" || !window.ethereum) throw new Error("No browser wallet was found.");

    setState((current) => ({ ...current, status: "signing", message: "Waiting for wallet signature...", error: null }));
    const ethereum = window.ethereum as Eip1193Provider;
    await ensureBaseNetwork(ethereum);
    const recommended = payload.recommended as { transaction?: { to: string; data: string; value: string } } | undefined;
    if (!recommended?.transaction) throw new Error("Swap transaction is not available.");

    const intentResponse = await fetch("/api/defi/swap/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });
    const intent = await intentResponse.json();
    if (!intentResponse.ok || !intent.ok) throw new Error(intent.error ?? "Could not create swap intent.");

    const provider = new BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const tx = await signer.sendTransaction(recommended.transaction);
    setState((current) => ({ ...current, status: "submitted", message: "Swap submitted. Waiting for confirmation...", txHash: tx.hash }));
    await fetch("/api/defi/swap/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ intentId: intent.intentId, txHash: tx.hash, status: "submitted" }),
    });
    await tx.wait();
    await fetch("/api/defi/swap/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ intentId: intent.intentId, txHash: tx.hash, status: "confirmed" }),
    });
    setState((current) => ({ ...current, status: "confirmed", message: "Swap confirmed.", txHash: tx.hash }));
  }

  return { ...state, quote, execute };
}
```

- [ ] **Step 2: Run typecheck**

Run:

```powershell
npm run typecheck --workspace vyntro-web
```

Expected: PASS.

- [ ] **Step 3: Commit**

```powershell
git add apps/veltrix-web/src/hooks/use-vyntro-swap.ts
git commit -m "Add VYNTRO swap wallet hook"
```

## Task 6: Swap Page UI and Navigation

**Files:**
- Create: `apps/veltrix-web/src/components/defi/swap-screen.tsx`
- Create: `apps/veltrix-web/src/app/defi/swap/page.tsx`
- Modify: `apps/veltrix-web/src/components/defi/defi-landing-screen.tsx`
- Modify: `apps/veltrix-web/src/components/layout/app-shell.tsx`

- [ ] **Step 1: Create the page wrapper**

```tsx
import { SwapScreen } from "@/components/defi/swap-screen";

export default function DefiSwapPage() {
  return <SwapScreen />;
}
```

- [ ] **Step 2: Create the swap screen**

```tsx
"use client";

import { useState } from "react";
import { ArrowDownUp, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { BASE_SWAP_TOKENS, formatSwapTokenAmount } from "@/lib/defi/vyntro-swap";
import { useVyntroSwap } from "@/hooks/use-vyntro-swap";

export function SwapScreen() {
  const { session, profile } = useAuth();
  const [sellTokenSymbol, setSellTokenSymbol] = useState("USDC");
  const [buyTokenSymbol, setBuyTokenSymbol] = useState("ETH");
  const [sellAmount, setSellAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);
  const swap = useVyntroSwap({ accessToken: session?.access_token, wallet: profile?.wallet });

  const recommended = swap.quote?.recommended as { buyAmountRaw?: string; provider?: string; routeSummary?: string } | undefined;
  const buyToken = BASE_SWAP_TOKENS.find((token) => token.symbol === buyTokenSymbol) ?? BASE_SWAP_TOKENS[0];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[30px] border border-white/6 bg-[radial-gradient(circle_at_16%_0%,rgba(74,217,255,0.16),transparent_28%),linear-gradient(180deg,rgba(13,15,19,0.99),rgba(6,7,10,0.995))] p-5 sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">VYNTRO Swap</p>
          <h1 className="mt-3 text-[clamp(1.8rem,3vw,3.4rem)] font-black leading-[0.94] tracking-[-0.05em] text-white">Move into the right asset before the next DeFi action.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">Swap through a VYNTRO-native interface while routes are powered by external liquidity providers. You approve and sign from your wallet; VYNTRO never takes custody.</p>
        </div>
        <aside className="rounded-[26px] border border-lime-300/10 bg-lime-300/[0.055] p-5">
          <ShieldCheck className="h-6 w-6 text-lime-200" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">Safety read</p>
          <p className="mt-2 text-lg font-black text-white">No custody. Review route. Sign only what you expect.</p>
          <p className="mt-3 text-[12px] leading-6 text-slate-400">Output can change before confirmation. Start with small swaps while fees are disabled for launch testing.</p>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-[30px] border border-white/6 bg-white/[0.035] p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
            <SwapTokenField label="Sell" token={sellTokenSymbol} amount={sellAmount} onAmountChange={setSellAmount} onTokenChange={setSellTokenSymbol} />
            <button type="button" className="flex h-12 w-12 items-center justify-center self-end rounded-full border border-white/8 bg-black/30 text-cyan-100" onClick={() => { setSellTokenSymbol(buyTokenSymbol); setBuyTokenSymbol(sellTokenSymbol); }}>
              <ArrowDownUp className="h-4 w-4" />
            </button>
            <SwapTokenField label="Buy" token={buyTokenSymbol} amount={recommended?.buyAmountRaw ? formatSwapTokenAmount(recommended.buyAmountRaw, buyToken.decimals, buyToken.symbol) : "Route pending"} readOnly onTokenChange={setBuyTokenSymbol} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <select value={slippageBps} onChange={(event) => setSlippageBps(Number(event.target.value))} className="rounded-full border border-white/8 bg-black/30 px-4 py-3 text-xs font-bold text-white">
              <option value={30}>0.30% slippage</option>
              <option value={50}>0.50% slippage</option>
              <option value={100}>1.00% slippage</option>
            </select>
            <button type="button" onClick={() => swap.quote({ sellTokenSymbol, buyTokenSymbol, sellAmount, slippageBps })} className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black">
              <RefreshCw className="h-4 w-4" /> Find route
            </button>
            <button type="button" disabled={!swap.quote || swap.status === "signing"} onClick={() => swap.quote && swap.execute(swap.quote)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white disabled:opacity-40">
              <Sparkles className="h-4 w-4" /> Sign swap
            </button>
          </div>
          {swap.message ? <p className="mt-4 text-sm text-cyan-100">{swap.message}</p> : null}
          {swap.error ? <p className="mt-4 text-sm text-rose-200">{swap.error}</p> : null}
        </div>
        <aside className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Route detail</p>
          <p className="mt-3 text-xl font-black text-white">{recommended?.provider ? `${recommended.provider} route ready` : "No quote yet"}</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">{recommended?.routeSummary ?? "Enter an amount to compare available routes."}</p>
        </aside>
      </section>
    </div>
  );
}

function SwapTokenField({ label, token, amount, readOnly, onAmountChange, onTokenChange }: { label: string; token: string; amount: string; readOnly?: boolean; onAmountChange?: (value: string) => void; onTokenChange: (value: string) => void }) {
  return (
    <label className="rounded-[24px] border border-white/6 bg-black/25 p-4">
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</span>
      <input readOnly={readOnly} value={amount} onChange={(event) => onAmountChange?.(event.target.value)} placeholder="0.00" className="mt-4 w-full bg-transparent text-3xl font-black text-white outline-none placeholder:text-slate-700" />
      <select value={token} onChange={(event) => onTokenChange(event.target.value)} className="mt-4 rounded-full border border-white/8 bg-black/40 px-3 py-2 text-xs font-bold text-white">
        {BASE_SWAP_TOKENS.map((item) => <option key={item.symbol} value={item.symbol}>{item.symbol}</option>)}
      </select>
    </label>
  );
}
```

- [ ] **Step 3: Add Swap to DeFi landing cards**

Modify `defiRoutes` in `apps/veltrix-web/src/components/defi/defi-landing-screen.tsx` by inserting:

```ts
{
  href: "/defi/swap",
  label: "Swap",
  eyebrow: "Asset route",
  icon: ArrowRightLeft,
  description:
    "Move into the right asset before vaults, lending or trading missions with a VYNTRO-native route finder.",
  stats: ["0x first", "Uniswap fallback", "No custody"],
},
```

Also import `ArrowRightLeft` from `lucide-react`.

- [ ] **Step 4: Add Swap to the DeFi dropdown**

Modify `primaryNavItems` in `apps/veltrix-web/src/components/layout/app-shell.tsx`:

```ts
{ href: "/defi/swap", label: "Swap" },
```

Place it after `Portfolio` and before `Vaults`.

- [ ] **Step 5: Run typecheck and build**

Run:

```powershell
npm run typecheck --workspace vyntro-web
npm run build --workspace vyntro-web
```

Expected: both PASS and `/defi/swap` appears in the route list.

- [ ] **Step 6: Commit**

```powershell
git add apps/veltrix-web/src/components/defi/swap-screen.tsx apps/veltrix-web/src/app/defi/swap/page.tsx apps/veltrix-web/src/components/defi/defi-landing-screen.tsx apps/veltrix-web/src/components/layout/app-shell.tsx
git commit -m "Add VYNTRO swap web experience"
```

## Task 7: Activity Timeline Integration

**Files:**
- Modify: `apps/veltrix-web/src/lib/defi/defi-activity.ts`
- Modify: `apps/veltrix-web/src/lib/defi/defi-activity.test.ts`
- Modify: `apps/veltrix-web/src/app/api/defi/activity/route.ts`

- [ ] **Step 1: Extend activity tests**

Add to `defi-activity.test.ts`:

```ts
test("swap transactions appear as DeFi activity items", () => {
  const timeline = buildDefiActivityTimeline({
    vaultTransactions: [],
    marketTransactions: [],
    swapTransactions: [
      {
        status: "confirmed",
        action: "swap",
        sell_token_symbol: "USDC",
        buy_token_symbol: "ETH",
        sell_amount_raw: "25000000",
        expected_buy_amount_raw: "10000000000000000",
        tx_hash: "0xabc",
        submitted_at: null,
        confirmed_at: "2026-04-30T12:00:00.000Z",
        failed_at: null,
        created_at: "2026-04-30T11:59:00.000Z",
        error_message: null,
      },
    ],
    xpEvents: [],
  });

  assert.equal(timeline[0].type, "swap");
  assert.match(timeline[0].title, /Swap USDC to ETH/);
});
```

- [ ] **Step 2: Update activity model types**

Add:

```ts
export type DefiActivitySwapTransactionRow = {
  status: string | null;
  action: string | null;
  sell_token_symbol: string | null;
  buy_token_symbol: string | null;
  sell_amount_raw: string | null;
  expected_buy_amount_raw: string | null;
  tx_hash: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  failed_at: string | null;
  created_at: string | null;
  error_message: string | null;
};
```

Extend `buildDefiActivityTimeline` input with `swapTransactions`, then map swap rows to a timeline item:

```ts
const swapItems = input.swapTransactions.map((row) => ({
  id: `swap-${row.tx_hash ?? row.created_at}`,
  type: "swap" as const,
  title: `Swap ${row.sell_token_symbol ?? "token"} to ${row.buy_token_symbol ?? "token"}`,
  description: row.error_message ?? "VYNTRO Swap route signed from the user's wallet.",
  status: row.status ?? "submitted",
  txHash: row.tx_hash,
  timestamp: row.confirmed_at ?? row.submitted_at ?? row.created_at,
}));
```

- [ ] **Step 3: Update activity route query**

In `apps/veltrix-web/src/app/api/defi/activity/route.ts`, add a fourth query:

```ts
context.serviceSupabase
  .from("defi_swap_intents")
  .select("status, sell_token_symbol, buy_token_symbol, sell_amount_raw, expected_buy_amount_raw, tx_hash, submitted_at, confirmed_at, failed_at, created_at, error_message")
  .eq("auth_user_id", context.user.id)
  .eq("wallet_address", context.wallet)
  .order("created_at", { ascending: false })
  .limit(100)
```

Pass normalized rows into `buildDefiActivityTimeline({ swapTransactions })`.

- [ ] **Step 4: Run tests**

Run:

```powershell
node --test apps/veltrix-web/src/lib/defi/defi-activity.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/veltrix-web/src/lib/defi/defi-activity.ts apps/veltrix-web/src/lib/defi/defi-activity.test.ts apps/veltrix-web/src/app/api/defi/activity/route.ts
git commit -m "Add swap activity timeline support"
```

## Task 8: Environment and Production Rollout

**Files:**
- Modify: `apps/veltrix-web/.env.example`

- [ ] **Step 1: Add environment variables**

```env
ZEROX_API_KEY=your_0x_api_key_here
UNISWAP_API_KEY=optional_uniswap_api_key_here
SWAP_PLATFORM_FEE_BPS=0
SWAP_PLATFORM_FEE_RECIPIENT=
SWAP_MAX_SLIPPAGE_BPS=300
SWAP_DANGER_PRICE_IMPACT_BPS=500
```

- [ ] **Step 2: Run full verification**

Run:

```powershell
node --test apps/veltrix-web/src/lib/defi/vyntro-swap.test.ts apps/veltrix-web/src/lib/defi/swap-providers.test.ts apps/veltrix-web/src/lib/defi/defi-activity.test.ts
npm run typecheck --workspace vyntro-web
npm run build --workspace vyntro-web
```

Expected: all commands PASS.

- [ ] **Step 3: Commit**

```powershell
git add apps/veltrix-web/.env.example
git commit -m "Document VYNTRO swap environment"
```

- [ ] **Step 4: Production setup checklist**

Before pushing to production:

```text
1. Run database/migrations/vyntro_defi_swap_transactions.sql in Supabase.
2. Add ZEROX_API_KEY to Vercel Production and Preview for veltrix-web.
3. Keep SWAP_PLATFORM_FEE_BPS=0 for first live test.
4. Deploy webapp to production.
5. Test a tiny Base swap with a wallet that can afford gas.
6. Confirm /defi/activity shows the swap.
7. Only after that, set SWAP_PLATFORM_FEE_BPS between 10 and 30 and redeploy.
```

## Self-Review

- Spec coverage: The plan covers `/defi/swap`, 0x-first routing, Uniswap fallback structure, server-held API keys, fee config, wallet signing, Supabase persistence, activity timeline, nav, env and production rollout.
- Placeholder scan: No `TODO`, `TBD`, or unresolved placeholders remain. The Uniswap adapter is planned as a fallback/comparator hook, while Phase 1 explicitly keeps 0x as the active provider.
- Type consistency: `SwapQuoteRequest`, `NormalizedSwapQuote`, provider names, route paths and database table names are consistent across tasks.
