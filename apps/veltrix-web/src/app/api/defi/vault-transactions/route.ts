import { NextRequest, NextResponse } from "next/server";
import {
  buildMoonwellVaultTransactionLog,
  getMoonwellVaultBySlug,
  type MoonwellVaultTransactionKind,
  type MoonwellVaultTransactionLifecycleStatus,
} from "@/lib/defi/moonwell-vaults";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | {
          wallet?: string;
          vaultSlug?: string;
          kind?: MoonwellVaultTransactionKind;
          status?: MoonwellVaultTransactionLifecycleStatus;
          amountRaw?: string;
          assetSymbol?: string;
          txHash?: string;
          errorMessage?: string | null;
        }
      | null;

    const vault = getMoonwellVaultBySlug(body?.vaultSlug ?? "");
    if (!vault) {
      return NextResponse.json({ ok: false, error: "Unknown vault." }, { status: 400 });
    }

    if (body?.kind !== "deposit" && body?.kind !== "withdraw") {
      return NextResponse.json({ ok: false, error: "Unknown vault action." }, { status: 400 });
    }

    if (
      body?.status !== "submitted" &&
      body?.status !== "confirmed" &&
      body?.status !== "failed"
    ) {
      return NextResponse.json({ ok: false, error: "Unknown transaction status." }, { status: 400 });
    }

    const log = buildMoonwellVaultTransactionLog({
      wallet: body.wallet,
      vault,
      kind: body.kind,
      status: body.status,
      amountRaw: body.amountRaw ?? "",
      assetSymbol: body.assetSymbol ?? vault.assetSymbol,
      txHash: body.txHash,
      errorMessage: body.errorMessage,
    });

    if (!log.ok) {
      return NextResponse.json({ ok: false, error: log.error }, { status: 400 });
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
      .eq("wallet_address", log.record.walletAddress.toLowerCase())
      .eq("verified", true)
      .maybeSingle();

    if (walletError) {
      return NextResponse.json({ ok: false, error: walletError.message }, { status: 500 });
    }

    if (!walletLink) {
      return NextResponse.json(
        { ok: false, error: "Vault transaction wallet is not verified on this account." },
        { status: 403 }
      );
    }

    const timestamp = new Date().toISOString();
    const row = {
      auth_user_id: user.id,
      wallet_address: log.record.walletAddress.toLowerCase(),
      chain_id: log.record.chainId,
      vault_slug: log.record.vaultSlug,
      vault_address: log.record.vaultAddress.toLowerCase(),
      asset_symbol: log.record.assetSymbol,
      action: log.record.kind,
      amount_raw: log.record.amountRaw,
      tx_hash: log.record.txHash.toLowerCase(),
      status: log.record.status,
      error_message: log.record.errorMessage,
      submitted_at: log.record.status === "submitted" ? timestamp : undefined,
      confirmed_at: log.record.status === "confirmed" ? timestamp : undefined,
      failed_at: log.record.status === "failed" ? timestamp : undefined,
      metadata: {
        source: "vyntro_vault_ui",
        protocol: "moonwell",
      },
      updated_at: timestamp,
    };

    const { error: upsertError } = await serviceSupabase
      .from("defi_vault_transactions")
      .upsert(row, { onConflict: "tx_hash" });

    if (upsertError) {
      return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      txHash: log.record.txHash,
      status: log.record.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Vault transaction logging failed.",
      },
      { status: 500 }
    );
  }
}
