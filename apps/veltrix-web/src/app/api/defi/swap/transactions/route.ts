import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";
import { isEvmAddress } from "@/lib/defi/vyntro-swap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SwapTransactionBody = {
  intentId?: string;
  txHash?: string;
  status?: "submitted" | "confirmed" | "failed";
  errorMessage?: string | null;
};

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function isTxHash(value: string | null | undefined): value is string {
  return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value.trim());
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as SwapTransactionBody | null;

    if (!body?.intentId) {
      return NextResponse.json({ ok: false, error: "Missing swap intent." }, { status: 400 });
    }

    if (!isTxHash(body.txHash)) {
      return NextResponse.json(
        { ok: false, error: "Valid transaction hash is required." },
        { status: 400 }
      );
    }
    const txHash = body.txHash.trim().toLowerCase();

    if (
      body.status !== "submitted" &&
      body.status !== "confirmed" &&
      body.status !== "failed"
    ) {
      return NextResponse.json({ ok: false, error: "Unknown transaction status." }, { status: 400 });
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

    const { data: intent, error: intentError } = await serviceSupabase
      .from("defi_swap_intents")
      .select(
        "id, auth_user_id, wallet_address, chain_id, sell_token_symbol, buy_token_symbol, sell_amount_raw, platform_fee_bps, platform_fee_recipient"
      )
      .eq("id", body.intentId)
      .eq("auth_user_id", user.id)
      .single();

    if (intentError || !intent) {
      return NextResponse.json(
        { ok: false, error: intentError?.message ?? "Swap intent not found." },
        { status: 404 }
      );
    }

    const walletAddress = String(intent.wallet_address ?? "").toLowerCase();
    if (!isEvmAddress(walletAddress)) {
      return NextResponse.json({ ok: false, error: "Swap intent wallet is invalid." }, { status: 400 });
    }

    const { data: walletLink, error: walletError } = await serviceSupabase
      .from("wallet_links")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("wallet_address", walletAddress)
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
    const updateRow: Record<string, unknown> = {
      tx_hash: txHash,
      status: body.status,
      error_message: body.errorMessage ?? null,
      updated_at: timestamp,
    };

    if (body.status === "submitted") updateRow.submitted_at = timestamp;
    if (body.status === "confirmed") updateRow.confirmed_at = timestamp;
    if (body.status === "failed") updateRow.failed_at = timestamp;

    const { error: updateError } = await serviceSupabase
      .from("defi_swap_intents")
      .update(updateRow)
      .eq("id", intent.id)
      .eq("auth_user_id", user.id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    const platformFeeBps = Number(intent.platform_fee_bps ?? 0);
    if (platformFeeBps > 0) {
      const { error: feeError } = await serviceSupabase.from("defi_swap_fee_ledger").upsert(
        {
          intent_id: intent.id,
          auth_user_id: user.id,
          wallet_address: walletAddress,
          chain_id: Number(intent.chain_id ?? 8453),
          fee_bps: platformFeeBps,
          fee_recipient: intent.platform_fee_recipient ?? null,
          sell_token_symbol: intent.sell_token_symbol,
          buy_token_symbol: intent.buy_token_symbol,
          sell_amount_raw: intent.sell_amount_raw,
          estimated_fee_raw: "0",
          tx_hash: txHash,
          status:
            body.status === "confirmed"
              ? "collected"
              : body.status === "failed"
                ? "failed"
                : "pending",
          metadata: { source: "vyntro_swap" },
          updated_at: timestamp,
        },
        { onConflict: "intent_id" }
      );

      if (feeError) {
        return NextResponse.json({ ok: false, error: feeError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      txHash,
      status: body.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Swap transaction logging failed.",
      },
      { status: 500 }
    );
  }
}
