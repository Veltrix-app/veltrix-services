import { NextRequest, NextResponse } from "next/server";
import {
  buildDefiVaultTransactionSummary,
  type DefiVaultTransactionRow,
} from "@/lib/defi/defi-xp-eligibility";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";
import { isEvmAddress } from "@/lib/defi/moonwell-vaults";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function normalizeTransactionRows(rows: unknown): DefiVaultTransactionRow[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    const value = row as Record<string, unknown>;

    return {
      status: typeof value.status === "string" ? value.status : null,
      action: typeof value.action === "string" ? value.action : null,
      vault_slug: typeof value.vault_slug === "string" ? value.vault_slug : null,
      asset_symbol: typeof value.asset_symbol === "string" ? value.asset_symbol : null,
      tx_hash: typeof value.tx_hash === "string" ? value.tx_hash : null,
      confirmed_at: typeof value.confirmed_at === "string" ? value.confirmed_at : null,
    };
  });
}

export async function GET(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  const wallet = request.nextUrl.searchParams.get("wallet")?.trim() ?? "";
  if (!isEvmAddress(wallet)) {
    return NextResponse.json({ ok: false, error: "Valid wallet is required." }, { status: 400 });
  }

  try {
    const userSupabase = createSupabaseUserServerClient(accessToken);
    const serviceSupabase = createSupabaseServiceClient();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const normalizedWallet = wallet.toLowerCase();
    const { data: walletLink, error: walletError } = await serviceSupabase
      .from("wallet_links")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("wallet_address", normalizedWallet)
      .eq("verified", true)
      .maybeSingle();

    if (walletError) {
      return NextResponse.json({ ok: false, error: walletError.message }, { status: 500 });
    }

    if (!walletLink) {
      return NextResponse.json(
        { ok: false, error: "Wallet is not verified on this account." },
        { status: 403 }
      );
    }

    const { data: transactions, error: transactionError } = await serviceSupabase
      .from("defi_vault_transactions")
      .select("status, action, vault_slug, asset_symbol, tx_hash, confirmed_at")
      .eq("auth_user_id", user.id)
      .eq("wallet_address", normalizedWallet)
      .order("created_at", { ascending: false })
      .limit(50);

    if (transactionError) {
      return NextResponse.json(
        {
          ok: true,
          wallet: normalizedWallet,
          trackingReady: false,
          transactions: buildDefiVaultTransactionSummary([]),
          warning: transactionError.message,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        wallet: normalizedWallet,
        trackingReady: true,
        transactions: buildDefiVaultTransactionSummary(normalizeTransactionRows(transactions)),
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
        error: error instanceof Error ? error.message : "DeFi XP eligibility read failed.",
      },
      { status: 500 }
    );
  }
}
