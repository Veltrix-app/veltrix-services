import { Contract, JsonRpcProvider, isAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import {
  DEFI_XP_SOURCE_TYPE,
  buildDefiMarketTransactionSummary,
  buildDefiXpClaimPlan,
  buildDefiXpEligibilitySnapshot,
  buildDefiVaultTransactionSummary,
  type DefiMarketTransactionRow,
  type DefiMarketTransactionSummary,
  type DefiVaultTransactionSummary,
  type DefiVaultTransactionRow,
  type DefiXpMarketInput,
  type DefiXpMissionSlug,
  type DefiXpVaultPositionInput,
} from "@/lib/defi/defi-xp-eligibility";
import {
  MOONWELL_BASE_COMPTROLLER_ADDRESS,
  MOONWELL_BASE_CORE_MARKETS,
} from "@/lib/defi/moonwell-markets";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";
import { applyUserXpAward } from "@/lib/xp/xp-award-server";
import {
  MOONWELL_BASE_VAULTS,
  getBaseRpcUrls,
  isEvmAddress,
} from "@/lib/defi/moonwell-vaults";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VAULT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
] as const;

const MTOKEN_ABI = [
  "function supplyRatePerTimestamp() view returns (uint256)",
  "function balanceOfUnderlying(address owner) returns (uint256)",
  "function borrowBalanceCurrent(address account) returns (uint256)",
] as const;

const COMPTROLLER_ABI = [
  "function checkMembership(address account, address mToken) view returns (bool)",
] as const;

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

function normalizeMarketTransactionRows(rows: unknown): DefiMarketTransactionRow[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    const value = row as Record<string, unknown>;

    return {
      status: typeof value.status === "string" ? value.status : null,
      action: typeof value.action === "string" ? value.action : null,
      market_slug: typeof value.market_slug === "string" ? value.market_slug : null,
      asset_symbol: typeof value.asset_symbol === "string" ? value.asset_symbol : null,
      tx_hash: typeof value.tx_hash === "string" ? value.tx_hash : null,
      confirmed_at: typeof value.confirmed_at === "string" ? value.confirmed_at : null,
    };
  });
}

function getConfiguredBaseRpcUrls() {
  return getBaseRpcUrls(
    process.env.BASE_RPC_URLS ??
      process.env.BASE_RPC_URL ??
      process.env.NEXT_PUBLIC_BASE_RPC_URL ??
      ""
  );
}

function safeNumber(value: unknown, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

async function readVaultPositionForXp(params: {
  rpcUrls: string[];
  wallet: string;
  vault: (typeof MOONWELL_BASE_VAULTS)[number];
}): Promise<DefiXpVaultPositionInput> {
  for (const rpcUrl of params.rpcUrls) {
    try {
      const provider = new JsonRpcProvider(rpcUrl);
      const vaultContract = new Contract(params.vault.address, VAULT_ABI, provider);
      const shares = (await vaultContract.balanceOf(params.wallet)) as bigint;
      const underlying =
        shares > BigInt(0)
          ? ((await vaultContract.convertToAssets(shares)) as bigint)
          : BigInt(0);

      return {
        vault: {
          slug: params.vault.slug,
          label: params.vault.label,
        },
        status: shares > BigInt(0) ? "position-detected" : "no-position",
        underlyingRaw: underlying.toString(),
        assetSymbol: params.vault.assetSymbol,
      };
    } catch {
      continue;
    }
  }

  return {
    vault: {
      slug: params.vault.slug,
      label: params.vault.label,
    },
    status: "read-error",
    underlyingRaw: "0",
    assetSymbol: params.vault.assetSymbol,
  };
}

async function readMarketForXp(params: {
  rpcUrls: string[];
  wallet: string;
  market: (typeof MOONWELL_BASE_CORE_MARKETS)[number];
}): Promise<DefiXpMarketInput> {
  for (const rpcUrl of params.rpcUrls) {
    try {
      const provider = new JsonRpcProvider(rpcUrl);
      const marketContract = new Contract(params.market.mTokenAddress, MTOKEN_ABI, provider);
      const comptroller = new Contract(
        MOONWELL_BASE_COMPTROLLER_ADDRESS,
        COMPTROLLER_ABI,
        provider
      );
      const [, suppliedRaw, borrowedRaw, collateralEnabled] = await Promise.all([
        marketContract.supplyRatePerTimestamp() as Promise<bigint>,
        marketContract.balanceOfUnderlying(params.wallet).catch(() => BigInt(0)) as Promise<bigint>,
        marketContract.borrowBalanceCurrent(params.wallet).catch(() => BigInt(0)) as Promise<bigint>,
        comptroller
          .checkMembership(params.wallet, params.market.mTokenAddress)
          .catch(() => false) as Promise<boolean>,
      ]);

      return {
        slug: params.market.slug,
        title: params.market.title,
        status: "ready",
        asset: params.market.assetSymbol,
        hasSupplyPosition: suppliedRaw > BigInt(0),
        hasBorrowPosition: borrowedRaw > BigInt(0),
        collateralEnabled,
      };
    } catch {
      continue;
    }
  }

  return {
    slug: params.market.slug,
    title: params.market.title,
    status: "read-error",
    asset: params.market.assetSymbol,
    hasSupplyPosition: false,
    hasBorrowPosition: false,
    collateralEnabled: false,
  };
}

async function buildServerDefiXpSnapshot(params: {
  wallet: string;
  transactions: DefiVaultTransactionSummary;
  marketTransactions: DefiMarketTransactionSummary;
  claimedSourceRefs: string[];
}) {
  const rpcUrls = getConfiguredBaseRpcUrls();
  const vaultPositions: DefiXpVaultPositionInput[] = [];
  const markets: DefiXpMarketInput[] = [];

  for (const vault of MOONWELL_BASE_VAULTS) {
    vaultPositions.push(
      await readVaultPositionForXp({
        rpcUrls,
        wallet: params.wallet,
        vault,
      })
    );
  }

  for (const market of MOONWELL_BASE_CORE_MARKETS) {
    markets.push(
      await readMarketForXp({
        rpcUrls,
        wallet: params.wallet,
        market,
      })
    );
  }

  return buildDefiXpEligibilitySnapshot({
    walletReady: true,
    claimedSourceRefs: params.claimedSourceRefs,
    vaultPositions,
    markets,
    transactions: params.transactions,
    marketTransactions: params.marketTransactions,
  });
}

async function loadDefiXpClaims(serviceSupabase: ReturnType<typeof createSupabaseServiceClient>, authUserId: string) {
  const { data, error } = await serviceSupabase
    .from("xp_events")
    .select("source_ref, effective_xp, created_at")
    .eq("auth_user_id", authUserId)
    .eq("source_type", DEFI_XP_SOURCE_TYPE)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const claims = (data ?? []).map((row) => ({
    sourceRef: typeof row.source_ref === "string" ? row.source_ref : "",
    xp: safeNumber(row.effective_xp),
    claimedAt: typeof row.created_at === "string" ? row.created_at : null,
  }));

  return {
    claims,
    claimedSourceRefs: claims.map((claim) => claim.sourceRef).filter(Boolean),
  };
}

async function loadVaultTransactionSummary(params: {
  serviceSupabase: ReturnType<typeof createSupabaseServiceClient>;
  authUserId: string;
  wallet: string;
}) {
  const { data: transactions, error: transactionError } = await params.serviceSupabase
    .from("defi_vault_transactions")
    .select("status, action, vault_slug, asset_symbol, tx_hash, confirmed_at")
    .eq("auth_user_id", params.authUserId)
    .eq("wallet_address", params.wallet)
    .order("created_at", { ascending: false })
    .limit(50);

  if (transactionError) {
    return {
      trackingReady: false,
      transactions: buildDefiVaultTransactionSummary([]),
      warning: transactionError.message,
    };
  }

  return {
    trackingReady: true,
    transactions: buildDefiVaultTransactionSummary(normalizeTransactionRows(transactions)),
    warning: null,
  };
}

async function loadMarketTransactionSummary(params: {
  serviceSupabase: ReturnType<typeof createSupabaseServiceClient>;
  authUserId: string;
  wallet: string;
}) {
  const { data: transactions, error: transactionError } = await params.serviceSupabase
    .from("defi_market_transactions")
    .select("status, action, market_slug, asset_symbol, tx_hash, confirmed_at")
    .eq("auth_user_id", params.authUserId)
    .eq("wallet_address", params.wallet)
    .order("created_at", { ascending: false })
    .limit(75);

  if (transactionError) {
    return {
      trackingReady: false,
      transactions: buildDefiMarketTransactionSummary([]),
      warning: transactionError.message,
    };
  }

  return {
    trackingReady: true,
    transactions: buildDefiMarketTransactionSummary(normalizeMarketTransactionRows(transactions)),
    warning: null,
  };
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
          error: error instanceof Error ? error.message : "DeFi XP eligibility read failed.",
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
    const [transactionRead, marketTransactionRead, claimsRead] = await Promise.all([
      loadVaultTransactionSummary({
        serviceSupabase: context.serviceSupabase,
        authUserId: context.user.id,
        wallet: context.wallet,
      }),
      loadMarketTransactionSummary({
        serviceSupabase: context.serviceSupabase,
        authUserId: context.user.id,
        wallet: context.wallet,
      }),
      loadDefiXpClaims(context.serviceSupabase, context.user.id),
    ]);
    const warnings = [transactionRead.warning, marketTransactionRead.warning].filter(Boolean);

    return NextResponse.json(
      {
        ok: true,
        wallet: context.wallet,
        trackingReady: transactionRead.trackingReady && marketTransactionRead.trackingReady,
        transactions: transactionRead.transactions,
        marketTransactions: marketTransactionRead.transactions,
        claims: claimsRead.claims,
        claimedSourceRefs: claimsRead.claimedSourceRefs,
        warning: warnings.length ? warnings.join(" / ") : null,
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

export async function POST(request: NextRequest) {
  const context = await resolveRequestContext(request);
  if (!context.ok) {
    return context.response;
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | {
          missionSlug?: DefiXpMissionSlug;
        }
      | null;
    const missionSlug = body?.missionSlug;

    if (
      missionSlug !== "connect-wallet" &&
      missionSlug !== "market-scout" &&
      missionSlug !== "first-vault-tx" &&
      missionSlug !== "active-vault-position" &&
      missionSlug !== "first-market-supply" &&
      missionSlug !== "collateral-ready" &&
      missionSlug !== "repay-discipline" &&
      missionSlug !== "borrow-safety"
    ) {
      return NextResponse.json({ ok: false, error: "Unknown DeFi XP mission." }, { status: 400 });
    }

    const [transactionRead, marketTransactionRead, claimsRead] = await Promise.all([
      loadVaultTransactionSummary({
        serviceSupabase: context.serviceSupabase,
        authUserId: context.user.id,
        wallet: context.wallet,
      }),
      loadMarketTransactionSummary({
        serviceSupabase: context.serviceSupabase,
        authUserId: context.user.id,
        wallet: context.wallet,
      }),
      loadDefiXpClaims(context.serviceSupabase, context.user.id),
    ]);
    const snapshot = await buildServerDefiXpSnapshot({
      wallet: context.wallet,
      transactions: transactionRead.transactions,
      marketTransactions: marketTransactionRead.transactions,
      claimedSourceRefs: claimsRead.claimedSourceRefs,
    });
    const claimPlan = buildDefiXpClaimPlan({
      snapshot,
      missionSlug,
    });

    if (!claimPlan.ok) {
      return NextResponse.json(
        {
          ok: claimPlan.alreadyClaimed,
          alreadyClaimed: claimPlan.alreadyClaimed,
          error: claimPlan.error,
        },
        { status: claimPlan.alreadyClaimed ? 200 : 409 }
      );
    }

    const award = await applyUserXpAward({
      serviceSupabase: context.serviceSupabase,
      authUserId: context.user.id,
      sourceType: claimPlan.event.sourceType,
      sourceId: claimPlan.mission.slug,
      baseXp: claimPlan.event.xpAmount,
      metadata: {
        source: "vyntro_defi_xp",
        walletAddress: context.wallet,
        missionSlug: claimPlan.mission.slug,
        missionTitle: claimPlan.mission.title,
        trackingReady: transactionRead.trackingReady && marketTransactionRead.trackingReady,
      },
    });

    if (!award.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: award.error,
          reason: award.reason,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      alreadyClaimed: award.alreadyClaimed,
      eventId: award.eventId,
      missionSlug,
      sourceRef: award.sourceRef,
      xpAwarded: award.xpAwarded,
      totalXp: award.totalXp,
      activeXp: award.activeXp,
      level: award.level,
      contributionTier: award.contributionTier,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "DeFi XP claim failed.",
      },
      { status: 500 }
    );
  }
}
