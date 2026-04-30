import { isAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import {
  buildDefiActivityTimeline,
  type DefiActivitySwapTransactionRow,
  type DefiActivityTransactionRow,
  type DefiActivityXpEventRow,
} from "@/lib/defi/defi-activity";
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

function normalizeTransactionRows(rows: unknown): DefiActivityTransactionRow[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    const value = row as Record<string, unknown>;

    return {
      status: typeof value.status === "string" ? value.status : null,
      action: typeof value.action === "string" ? value.action : null,
      vault_slug: typeof value.vault_slug === "string" ? value.vault_slug : null,
      market_slug: typeof value.market_slug === "string" ? value.market_slug : null,
      asset_symbol: typeof value.asset_symbol === "string" ? value.asset_symbol : null,
      amount_raw: typeof value.amount_raw === "string" ? value.amount_raw : null,
      tx_hash: typeof value.tx_hash === "string" ? value.tx_hash : null,
      submitted_at: typeof value.submitted_at === "string" ? value.submitted_at : null,
      confirmed_at: typeof value.confirmed_at === "string" ? value.confirmed_at : null,
      failed_at: typeof value.failed_at === "string" ? value.failed_at : null,
      created_at: typeof value.created_at === "string" ? value.created_at : null,
      error_message: typeof value.error_message === "string" ? value.error_message : null,
    };
  });
}

function normalizeXpRows(rows: unknown): DefiActivityXpEventRow[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    const value = row as Record<string, unknown>;

    return {
      source_type: typeof value.source_type === "string" ? value.source_type : null,
      source_ref: typeof value.source_ref === "string" ? value.source_ref : null,
      effective_xp:
        typeof value.effective_xp === "string" || typeof value.effective_xp === "number"
          ? value.effective_xp
          : null,
      created_at: typeof value.created_at === "string" ? value.created_at : null,
      metadata:
        typeof value.metadata === "object" && value.metadata
          ? (value.metadata as Record<string, unknown>)
          : null,
    };
  });
}

function normalizeSwapRows(rows: unknown): DefiActivitySwapTransactionRow[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    const value = row as Record<string, unknown>;

    return {
      status: typeof value.status === "string" ? value.status : null,
      sell_token_symbol:
        typeof value.sell_token_symbol === "string" ? value.sell_token_symbol : null,
      buy_token_symbol: typeof value.buy_token_symbol === "string" ? value.buy_token_symbol : null,
      sell_amount_raw: typeof value.sell_amount_raw === "string" ? value.sell_amount_raw : null,
      expected_buy_amount_raw:
        typeof value.expected_buy_amount_raw === "string"
          ? value.expected_buy_amount_raw
          : null,
      provider: typeof value.provider === "string" ? value.provider : null,
      route_summary: typeof value.route_summary === "string" ? value.route_summary : null,
      tx_hash: typeof value.tx_hash === "string" ? value.tx_hash : null,
      submitted_at: typeof value.submitted_at === "string" ? value.submitted_at : null,
      confirmed_at: typeof value.confirmed_at === "string" ? value.confirmed_at : null,
      failed_at: typeof value.failed_at === "string" ? value.failed_at : null,
      created_at: typeof value.created_at === "string" ? value.created_at : null,
      error_message: typeof value.error_message === "string" ? value.error_message : null,
    };
  });
}

async function resolveRequestContext(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 }),
    };
  }

  const wallet = request.nextUrl.searchParams.get("wallet")?.trim() ?? "";
  if (!isEvmAddress(wallet) || !isAddress(wallet)) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Valid wallet is required." }, { status: 400 }),
    };
  }

  try {
    const userSupabase = createSupabaseUserServerClient(accessToken);
    const serviceSupabase = createSupabaseServiceClient();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return {
        ok: false as const,
        response: NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 }),
      };
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
      return {
        ok: false as const,
        response: NextResponse.json({ ok: false, error: walletError.message }, { status: 500 }),
      };
    }

    if (!walletLink) {
      return {
        ok: false as const,
        response: NextResponse.json(
          { ok: false, error: "Wallet is not verified on this account." },
          { status: 403 }
        ),
      };
    }

    return {
      ok: true as const,
      user,
      serviceSupabase,
      wallet: normalizedWallet,
    };
  } catch (error) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "DeFi activity read failed.",
        },
        { status: 500 }
      ),
    };
  }
}

export async function GET(request: NextRequest) {
  const context = await resolveRequestContext(request);
  if (!context.ok) {
    return context.response;
  }

  try {
    const [vaultRead, marketRead, swapRead, xpRead] = await Promise.all([
      context.serviceSupabase
        .from("defi_vault_transactions")
        .select(
          "status, action, vault_slug, asset_symbol, amount_raw, tx_hash, submitted_at, confirmed_at, failed_at, created_at, error_message"
        )
        .eq("auth_user_id", context.user.id)
        .eq("wallet_address", context.wallet)
        .order("created_at", { ascending: false })
        .limit(100),
      context.serviceSupabase
        .from("defi_market_transactions")
        .select(
          "status, action, market_slug, asset_symbol, amount_raw, tx_hash, submitted_at, confirmed_at, failed_at, created_at, error_message"
        )
        .eq("auth_user_id", context.user.id)
        .eq("wallet_address", context.wallet)
        .order("created_at", { ascending: false })
        .limit(100),
      context.serviceSupabase
        .from("defi_swap_intents")
        .select(
          "status, sell_token_symbol, buy_token_symbol, sell_amount_raw, expected_buy_amount_raw, provider, route_summary, tx_hash, submitted_at, confirmed_at, failed_at, created_at, error_message"
        )
        .eq("auth_user_id", context.user.id)
        .eq("wallet_address", context.wallet)
        .order("created_at", { ascending: false })
        .limit(100),
      context.serviceSupabase
        .from("xp_events")
        .select("source_type, source_ref, effective_xp, created_at, metadata")
        .eq("auth_user_id", context.user.id)
        .eq("source_type", "defi_mission")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    const warnings = [
      vaultRead.error?.message,
      marketRead.error?.message,
      swapRead.error?.message,
      xpRead.error?.message,
    ]
      .filter(Boolean)
      .join(" / ");

    return NextResponse.json(
      {
        ok: true,
        wallet: context.wallet,
        activity: buildDefiActivityTimeline({
          vaultTransactions: normalizeTransactionRows(vaultRead.data),
          marketTransactions: normalizeTransactionRows(marketRead.data),
          swapTransactions: normalizeSwapRows(swapRead.data),
          xpEvents: normalizeXpRows(xpRead.data),
        }),
        warning: warnings || null,
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
        error: error instanceof Error ? error.message : "DeFi activity read failed.",
      },
      { status: 500 }
    );
  }
}
