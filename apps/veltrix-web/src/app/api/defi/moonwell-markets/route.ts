import { Contract, JsonRpcProvider, isAddress } from "ethers";
import { NextResponse } from "next/server";
import {
  MOONWELL_BASE_COMPTROLLER_ADDRESS,
  MOONWELL_BASE_CORE_MARKETS,
  buildMoonwellMarketRead,
  buildMoonwellPortfolioRead,
  type MoonwellMarketConfig,
  type MoonwellMarketRead,
} from "@/lib/defi/moonwell-markets";
import { getBaseRpcUrls, isEvmAddress } from "@/lib/defi/moonwell-vaults";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MTOKEN_ABI = [
  "function supplyRatePerTimestamp() view returns (uint256)",
  "function borrowRatePerTimestamp() view returns (uint256)",
  "function getCash() view returns (uint256)",
  "function totalBorrowsCurrent() returns (uint256)",
  "function totalBorrows() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function exchangeRateStored() view returns (uint256)",
  "function balanceOfUnderlying(address owner) returns (uint256)",
  "function borrowBalanceCurrent(address account) returns (uint256)",
] as const;

const COMPTROLLER_ABI = [
  "function markets(address mToken) view returns (bool isListed, uint256 collateralFactorMantissa, bool isComped)",
  "function checkMembership(address account, address mToken) view returns (bool)",
  "function getAccountLiquidity(address account) view returns (uint256 error, uint256 liquidity, uint256 shortfall)",
] as const;

function getConfiguredBaseRpcUrls() {
  return getBaseRpcUrls(
    process.env.BASE_RPC_URLS ??
      process.env.BASE_RPC_URL ??
      process.env.NEXT_PUBLIC_BASE_RPC_URL ??
      ""
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Market read failed.";
}

async function readTotalBorrows(mToken: Contract) {
  try {
    return (await mToken.totalBorrowsCurrent()) as bigint;
  } catch {
    return (await mToken.totalBorrows()) as bigint;
  }
}

async function readUserSupply(mToken: Contract, wallet: string | null) {
  if (!wallet) {
    return BigInt(0);
  }

  try {
    return (await mToken.balanceOfUnderlying(wallet)) as bigint;
  } catch {
    return BigInt(0);
  }
}

async function readUserBorrow(mToken: Contract, wallet: string | null) {
  if (!wallet) {
    return BigInt(0);
  }

  try {
    return (await mToken.borrowBalanceCurrent(wallet)) as bigint;
  } catch {
    return BigInt(0);
  }
}

function getCollateralFactor(marketsResult: unknown) {
  if (marketsResult !== null && (Array.isArray(marketsResult) || typeof marketsResult === "object")) {
    const result = marketsResult as { [key: number]: unknown };
    const collateralFactor = result[1];

    if (
      typeof collateralFactor === "bigint" ||
      typeof collateralFactor === "string" ||
      typeof collateralFactor === "number"
    ) {
      return collateralFactor;
    }
  }

  return BigInt(0);
}

function getTupleBigInt(result: unknown, index: number) {
  if (result !== null && (Array.isArray(result) || typeof result === "object")) {
    const tuple = result as { [key: number]: unknown };
    const value = tuple[index];

    if (typeof value === "bigint") {
      return value;
    }

    if (typeof value === "string" || typeof value === "number") {
      try {
        return BigInt(value);
      } catch {
        return BigInt(0);
      }
    }
  }

  return BigInt(0);
}

async function readCollateralMembership(params: {
  comptroller: Contract;
  wallet: string | null;
  mTokenAddress: string;
}) {
  if (!params.wallet) {
    return false;
  }

  try {
    return (await params.comptroller.checkMembership(
      params.wallet,
      params.mTokenAddress
    )) as boolean;
  } catch {
    return false;
  }
}

async function readAccountLiquidity(params: {
  comptroller: Contract;
  wallet: string | null;
}) {
  if (!params.wallet) {
    return {
      liquidityRaw: BigInt(0),
      shortfallRaw: BigInt(0),
    };
  }

  try {
    const result = await params.comptroller.getAccountLiquidity(params.wallet);
    return {
      liquidityRaw: getTupleBigInt(result, 1),
      shortfallRaw: getTupleBigInt(result, 2),
    };
  } catch {
    return {
      liquidityRaw: BigInt(0),
      shortfallRaw: BigInt(0),
    };
  }
}

function buildFailedMarketRead(market: MoonwellMarketConfig, error: unknown) {
  return buildMoonwellMarketRead({
    market,
    supplyRatePerSecondRaw: "0",
    borrowRatePerSecondRaw: "0",
    cashRaw: "0",
    totalBorrowsRaw: "0",
    totalSupplyRaw: "0",
    exchangeRateRaw: "0",
    collateralFactorRaw: "0",
    suppliedUnderlyingRaw: "0",
    borrowedUnderlyingRaw: "0",
    readFailed: true,
    error: errorMessage(error),
  });
}

async function readMarket(params: {
  provider: JsonRpcProvider;
  market: MoonwellMarketConfig;
  wallet: string | null;
}): Promise<MoonwellMarketRead> {
  const mToken = new Contract(params.market.mTokenAddress, MTOKEN_ABI, params.provider);
  const comptroller = new Contract(
    MOONWELL_BASE_COMPTROLLER_ADDRESS,
    COMPTROLLER_ABI,
    params.provider
  );

  try {
    const [
      supplyRatePerSecondRaw,
      borrowRatePerSecondRaw,
      cashRaw,
      totalBorrowsRaw,
      totalSupplyRaw,
      exchangeRateRaw,
      marketConfigRaw,
      suppliedUnderlyingRaw,
      borrowedUnderlyingRaw,
      collateralEnabled,
      accountLiquidity,
    ] = await Promise.all([
      mToken.supplyRatePerTimestamp() as Promise<bigint>,
      mToken.borrowRatePerTimestamp() as Promise<bigint>,
      mToken.getCash() as Promise<bigint>,
      readTotalBorrows(mToken),
      mToken.totalSupply() as Promise<bigint>,
      mToken.exchangeRateStored() as Promise<bigint>,
      comptroller.markets(params.market.mTokenAddress) as Promise<unknown>,
      readUserSupply(mToken, params.wallet),
      readUserBorrow(mToken, params.wallet),
      readCollateralMembership({
        comptroller,
        wallet: params.wallet,
        mTokenAddress: params.market.mTokenAddress,
      }),
      readAccountLiquidity({
        comptroller,
        wallet: params.wallet,
      }),
    ]);

    return buildMoonwellMarketRead({
      market: params.market,
      supplyRatePerSecondRaw,
      borrowRatePerSecondRaw,
      cashRaw,
      totalBorrowsRaw,
      totalSupplyRaw,
      exchangeRateRaw,
      collateralFactorRaw: getCollateralFactor(marketConfigRaw),
      suppliedUnderlyingRaw,
      borrowedUnderlyingRaw,
      collateralEnabled,
      accountLiquidityRaw: accountLiquidity.liquidityRaw,
      accountShortfallRaw: accountLiquidity.shortfallRaw,
    });
  } catch (error) {
    return buildFailedMarketRead(params.market, error);
  }
}

async function readMarketWithFallback(params: {
  rpcUrls: string[];
  market: MoonwellMarketConfig;
  wallet: string | null;
}) {
  let lastRead: MoonwellMarketRead | null = null;

  for (const rpcUrl of params.rpcUrls) {
    const provider = new JsonRpcProvider(rpcUrl);
    const read = await readMarket({
      provider,
      market: params.market,
      wallet: params.wallet,
    });

    if (read.status !== "read-error") {
      return read;
    }

    lastRead = read;
  }

  return lastRead ?? buildFailedMarketRead(params.market, "All Base RPC reads failed.");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const walletParam = url.searchParams.get("wallet")?.trim() ?? "";

  if (walletParam && (!isEvmAddress(walletParam) || !isAddress(walletParam))) {
    return NextResponse.json(
      {
        ok: false,
        error: "Valid EVM wallet address is required.",
      },
      { status: 400 }
    );
  }

  const wallet = walletParam || null;
  const rpcUrls = getConfiguredBaseRpcUrls();
  const markets: MoonwellMarketRead[] = [];

  for (const market of MOONWELL_BASE_CORE_MARKETS) {
    markets.push(
      await readMarketWithFallback({
        rpcUrls,
        market,
        wallet,
      })
    );
  }

  return NextResponse.json(
    {
      ok: true,
      wallet,
      chain: "Base",
      markets,
      portfolio: buildMoonwellPortfolioRead({
        walletReady: Boolean(wallet),
        markets,
      }),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
