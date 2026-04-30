import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";
import { isEvmAddress, type NormalizedSwapQuote, type SwapToken } from "@/lib/defi/vyntro-swap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SwapIntentBody = {
  request?: {
    wallet?: string;
    chainId?: number;
    sellToken?: SwapToken;
    buyToken?: SwapToken;
    sellAmountRaw?: string;
    slippageBps?: number;
  };
  recommended?: NormalizedSwapQuote;
  config?: {
    platformFeeBps?: number;
    platformFeeRecipient?: string | null;
  };
  safeToSign?: boolean;
  safety?: {
    status?: string;
  };
};

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function validateIntentBody(body: SwapIntentBody | null) {
  const wallet = body?.request?.wallet?.trim().toLowerCase() ?? "";
  const recommended = body?.recommended;
  const sellToken = body?.request?.sellToken;
  const buyToken = body?.request?.buyToken;
  const transaction = recommended?.transaction;

  if (!body?.safeToSign || body.safety?.status === "danger") {
    return { ok: false as const, error: "This swap route is outside the safety range." };
  }

  if (!isEvmAddress(wallet)) {
    return { ok: false as const, error: "A verified wallet is required." };
  }

  if (!sellToken?.symbol || !buyToken?.symbol || !body.request?.sellAmountRaw) {
    return { ok: false as const, error: "Swap request is incomplete." };
  }

  if (!recommended || recommended.status !== "ok" || !transaction) {
    return { ok: false as const, error: "Swap route is not ready to sign." };
  }

  if (!isEvmAddress(transaction.to) || !transaction.data.startsWith("0x")) {
    return { ok: false as const, error: "Swap transaction payload is invalid." };
  }

  return {
    ok: true as const,
    wallet,
    sellToken,
    buyToken,
    recommended,
  };
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as SwapIntentBody | null;
    const validation = validateIntentBody(body);

    if (!validation.ok) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const userSupabase = createSupabaseUserServerClient(accessToken);
    const serviceSupabase = createSupabaseServiceClient();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const { data: walletLink, error: walletError } = await serviceSupabase
      .from("wallet_links")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("wallet_address", validation.wallet)
      .eq("verified", true)
      .maybeSingle();

    if (walletError) {
      return NextResponse.json({ ok: false, error: walletError.message }, { status: 500 });
    }

    if (!walletLink) {
      return NextResponse.json(
        { ok: false, error: "Swap wallet is not verified on this account." },
        { status: 403 }
      );
    }

    const timestamp = new Date().toISOString();
    const row = {
      auth_user_id: user.id,
      wallet_address: validation.wallet,
      chain_id: body?.request?.chainId ?? 8453,
      sell_token_address: validation.sellToken.address.toLowerCase(),
      sell_token_symbol: validation.sellToken.symbol,
      buy_token_address: validation.buyToken.address.toLowerCase(),
      buy_token_symbol: validation.buyToken.symbol,
      sell_amount_raw: body?.request?.sellAmountRaw ?? "0",
      expected_buy_amount_raw: validation.recommended.buyAmountRaw,
      provider: validation.recommended.provider,
      route_summary: validation.recommended.routeSummary,
      slippage_bps: body?.request?.slippageBps ?? 50,
      platform_fee_bps: body?.config?.platformFeeBps ?? 0,
      platform_fee_recipient: body?.config?.platformFeeRecipient ?? null,
      status: "quoted",
      quote_payload: {
        quotes: body?.recommended ? [body.recommended] : [],
        safety: body?.safety ?? null,
      },
      transaction_payload: validation.recommended.transaction ?? {},
      metadata: {
        source: "vyntro_swap_ui",
        provider: validation.recommended.provider,
      },
      updated_at: timestamp,
    };

    const { data, error: insertError } = await serviceSupabase
      .from("defi_swap_intents")
      .insert(row)
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      intentId: data.id,
      transaction: validation.recommended.transaction,
      provider: validation.recommended.provider,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Swap intent creation failed.",
      },
      { status: 500 }
    );
  }
}
