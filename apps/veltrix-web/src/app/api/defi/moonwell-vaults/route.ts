import { Contract, JsonRpcProvider, isAddress } from "ethers";
import { NextResponse } from "next/server";
import {
  MOONWELL_BASE_RPC_FALLBACK_URL,
  MOONWELL_BASE_VAULTS,
  buildMoonwellVaultPositionRead,
  isEvmAddress,
  type MoonwellVaultConfig,
  type MoonwellVaultPositionRead,
} from "@/lib/defi/moonwell-vaults";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ERC4626_VAULT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function asset() view returns (address)",
  "function maxWithdraw(address owner) view returns (uint256)",
  "function totalAssets() view returns (uint256)",
] as const;

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
] as const;

function getBaseRpcUrl() {
  return (
    process.env.BASE_RPC_URL ??
    process.env.NEXT_PUBLIC_BASE_RPC_URL ??
    MOONWELL_BASE_RPC_FALLBACK_URL
  );
}

function toNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  return fallback;
}

function fallbackAssetDecimals(vault: MoonwellVaultConfig) {
  if (vault.assetSymbol === "USDC" || vault.assetSymbol === "EURC") {
    return 6;
  }

  if (vault.assetSymbol === "cbBTC") {
    return 8;
  }

  return 18;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Vault read failed.";
}

async function readVaultPosition(params: {
  provider: JsonRpcProvider;
  wallet: string;
  vault: MoonwellVaultConfig;
}): Promise<MoonwellVaultPositionRead> {
  const vaultContract = new Contract(params.vault.address, ERC4626_VAULT_ABI, params.provider);

  try {
    const [shareBalanceRaw, shareDecimalsRaw, assetAddressRaw, totalAssetsRaw] = await Promise.all([
      vaultContract.balanceOf(params.wallet) as Promise<bigint>,
      vaultContract.decimals() as Promise<unknown>,
      vaultContract.asset() as Promise<string>,
      vaultContract.totalAssets() as Promise<bigint>,
    ]);

    const assetAddress = isAddress(assetAddressRaw) ? assetAddressRaw : null;
    const assetContract = assetAddress
      ? new Contract(assetAddress, ERC20_ABI, params.provider)
      : null;

    const [assetDecimalsRaw, assetSymbolRaw, underlyingRaw, maxWithdrawRaw] = await Promise.all([
      assetContract
        ? (assetContract.decimals() as Promise<unknown>)
        : Promise.resolve(fallbackAssetDecimals(params.vault)),
      assetContract
        ? (assetContract.symbol() as Promise<string>)
        : Promise.resolve(params.vault.assetSymbol),
      shareBalanceRaw > BigInt(0)
        ? (vaultContract.convertToAssets(shareBalanceRaw) as Promise<bigint>)
        : Promise.resolve(BigInt(0)),
      vaultContract.maxWithdraw(params.wallet) as Promise<bigint>,
    ]);

    return buildMoonwellVaultPositionRead({
      vault: params.vault,
      wallet: params.wallet,
      shareBalanceRaw,
      shareDecimals: toNumber(shareDecimalsRaw, 18),
      assetAddress,
      assetSymbol: assetSymbolRaw,
      assetDecimals: toNumber(assetDecimalsRaw, fallbackAssetDecimals(params.vault)),
      underlyingRaw,
      maxWithdrawRaw,
      totalAssetsRaw,
    });
  } catch (error) {
    return buildMoonwellVaultPositionRead({
      vault: params.vault,
      wallet: params.wallet,
      shareBalanceRaw: "0",
      shareDecimals: 18,
      assetAddress: null,
      assetSymbol: params.vault.assetSymbol,
      assetDecimals: fallbackAssetDecimals(params.vault),
      underlyingRaw: "0",
      maxWithdrawRaw: "0",
      totalAssetsRaw: "0",
      readFailed: true,
      error: errorMessage(error),
    });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const wallet = url.searchParams.get("wallet")?.trim() ?? "";

  if (!isEvmAddress(wallet) || !isAddress(wallet)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Valid EVM wallet address is required.",
      },
      { status: 400 }
    );
  }

  const provider = new JsonRpcProvider(getBaseRpcUrl());
  const vaults = await Promise.all(
    MOONWELL_BASE_VAULTS.map((vault) =>
      readVaultPosition({
        provider,
        wallet,
        vault,
      })
    )
  );

  return NextResponse.json(
    {
      ok: true,
      wallet,
      chain: "Base",
      vaults,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
