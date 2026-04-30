import { NextRequest, NextResponse } from "next/server";
import {
  fetchUniswapQuote,
  fetchZeroXQuote,
} from "@/lib/defi/swap-providers";
import {
  buildSwapQuoteRequest,
  chooseRecommendedSwapQuote,
  classifySwapQuoteSafety,
  normalizeSwapConfig,
  type NormalizedSwapQuote,
} from "@/lib/defi/vyntro-swap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SwapQuoteBody = {
  wallet?: string;
  sellTokenSymbol?: string;
  buyTokenSymbol?: string;
  sellAmount?: string;
  slippageBps?: number;
};

function createProviderError(
  provider: NormalizedSwapQuote["provider"],
  error: string
): NormalizedSwapQuote {
  return {
    provider,
    status: "error",
    buyAmountRaw: "0",
    estimatedGas: null,
    priceImpactBps: null,
    transaction: null,
    routeSummary: `${provider} unavailable`,
    expiresAt: null,
    allowanceTarget: null,
    error,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as SwapQuoteBody | null;
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
    const zeroXApiKey = process.env.ZEROX_API_KEY?.trim();
    const uniswapApiKey = process.env.UNISWAP_API_KEY?.trim();
    const providerReads: Array<Promise<NormalizedSwapQuote>> = [];

    if (zeroXApiKey) {
      providerReads.push(
        fetchZeroXQuote({
          request: quoteRequest,
          config,
          apiKey: zeroXApiKey,
        })
      );
    } else {
      providerReads.push(Promise.resolve(createProviderError("0x", "ZEROX_API_KEY is not configured.")));
    }

    if (uniswapApiKey) {
      providerReads.push(
        fetchUniswapQuote({
          request: quoteRequest,
          config,
          apiKey: uniswapApiKey,
        })
      );
    }

    const quotes = await Promise.all(providerReads);
    const recommended = chooseRecommendedSwapQuote(quotes);

    if (!recommended) {
      return NextResponse.json(
        {
          ok: false,
          error: "No safe swap route found.",
          quotes,
        },
        { status: zeroXApiKey || uniswapApiKey ? 404 : 503 }
      );
    }

    const safety = classifySwapQuoteSafety({
      priceImpactBps: recommended.priceImpactBps,
      maxSlippageBps: quoteRequest.slippageBps,
      dangerPriceImpactBps: config.dangerPriceImpactBps,
    });

    return NextResponse.json(
      {
        ok: true,
        request: quoteRequest,
        quotes,
        recommended,
        safety,
        safeToSign: safety.status !== "danger",
        config,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Swap quote failed.",
      },
      { status: 500 }
    );
  }
}
