export const MOONWELL_BASE_CHAIN_ID = 8453;
export const MOONWELL_BASE_CHAIN_NAME = "Base";
export const MOONWELL_BASE_RPC_FALLBACK_URL = "https://mainnet.base.org";

export type MoonwellVaultSlug = "usdc-vault" | "eth-vault" | "eurc-vault" | "cbbtc-vault";

export type MoonwellVaultConfig = {
  slug: MoonwellVaultSlug;
  label: string;
  assetSymbol: string;
  chainId: typeof MOONWELL_BASE_CHAIN_ID;
  chainName: typeof MOONWELL_BASE_CHAIN_NAME;
  address: `0x${string}`;
};

export type MoonwellVaultPositionStatus =
  | "wallet-missing"
  | "no-position"
  | "position-detected"
  | "read-error";

export type MoonwellVaultPositionRead = {
  vault: MoonwellVaultConfig;
  status: MoonwellVaultPositionStatus;
  shareBalanceRaw: string;
  shareDecimals: number;
  shareBalanceLabel: string;
  assetAddress: string | null;
  assetSymbol: string;
  assetDecimals: number;
  underlyingRaw: string;
  underlyingLabel: string;
  maxWithdrawRaw: string;
  maxWithdrawLabel: string;
  totalAssetsRaw: string;
  totalAssetsLabel: string;
  error?: string;
};

export const MOONWELL_BASE_VAULTS: MoonwellVaultConfig[] = [
  {
    slug: "usdc-vault",
    label: "USDC Vault",
    assetSymbol: "USDC",
    chainId: MOONWELL_BASE_CHAIN_ID,
    chainName: MOONWELL_BASE_CHAIN_NAME,
    address: "0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca",
  },
  {
    slug: "eth-vault",
    label: "ETH Vault",
    assetSymbol: "ETH",
    chainId: MOONWELL_BASE_CHAIN_ID,
    chainName: MOONWELL_BASE_CHAIN_NAME,
    address: "0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1",
  },
  {
    slug: "eurc-vault",
    label: "EURC Vault",
    assetSymbol: "EURC",
    chainId: MOONWELL_BASE_CHAIN_ID,
    chainName: MOONWELL_BASE_CHAIN_NAME,
    address: "0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026",
  },
  {
    slug: "cbbtc-vault",
    label: "cbBTC Vault",
    assetSymbol: "cbBTC",
    chainId: MOONWELL_BASE_CHAIN_ID,
    chainName: MOONWELL_BASE_CHAIN_NAME,
    address: "0x543257ef2161176d7c8cd90ba65c2d4caef5a796",
  },
];

export function getMoonwellVaultBySlug(slug: string) {
  return MOONWELL_BASE_VAULTS.find((vault) => vault.slug === slug) ?? null;
}

export function isEvmAddress(value: string | null | undefined): value is string {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function buildMoonwellVaultReadUrl(wallet: string | null | undefined) {
  if (!isEvmAddress(wallet)) {
    return null;
  }

  return `/api/defi/moonwell-vaults?wallet=${encodeURIComponent(wallet.trim())}`;
}

export function classifyMoonwellVaultPosition(input: {
  wallet: string | null | undefined;
  sharesRaw: bigint | string | number | null | undefined;
  readFailed?: boolean;
}): MoonwellVaultPositionStatus {
  if (!isEvmAddress(input.wallet)) {
    return "wallet-missing";
  }

  if (input.readFailed) {
    return "read-error";
  }

  try {
    return BigInt(input.sharesRaw ?? 0) > BigInt(0) ? "position-detected" : "no-position";
  } catch {
    return "read-error";
  }
}

export function formatVaultTokenAmount(
  rawValue: bigint | string | number | null | undefined,
  decimals: number,
  symbol: string
) {
  let raw: bigint;

  try {
    raw = BigInt(rawValue ?? 0);
  } catch {
    raw = BigInt(0);
  }

  const safeDecimals = Number.isInteger(decimals) && decimals > 0 ? decimals : 0;

  if (safeDecimals === 0) {
    return `${raw.toString()} ${symbol}`;
  }

  const scale = BigInt(10) ** BigInt(safeDecimals);
  const whole = raw / scale;
  const fraction = raw % scale;

  if (fraction === BigInt(0)) {
    return `${whole.toString()} ${symbol}`;
  }

  const fractionText = fraction
    .toString()
    .padStart(safeDecimals, "0")
    .replace(/0+$/, "");

  return `${whole.toString()}.${fractionText} ${symbol}`;
}

export function buildMoonwellVaultPositionRead(input: {
  vault: MoonwellVaultConfig;
  wallet: string | null | undefined;
  shareBalanceRaw: bigint | string | number | null | undefined;
  shareDecimals: number;
  assetAddress: string | null;
  assetSymbol: string | null | undefined;
  assetDecimals: number;
  underlyingRaw: bigint | string | number | null | undefined;
  maxWithdrawRaw: bigint | string | number | null | undefined;
  totalAssetsRaw: bigint | string | number | null | undefined;
  readFailed?: boolean;
  error?: string;
}): MoonwellVaultPositionRead {
  const assetSymbol = input.assetSymbol || input.vault.assetSymbol;
  const shareSymbol = `mw${input.vault.assetSymbol}`;

  return {
    vault: input.vault,
    status: classifyMoonwellVaultPosition({
      wallet: input.wallet,
      sharesRaw: input.shareBalanceRaw,
      readFailed: input.readFailed,
    }),
    shareBalanceRaw: String(input.shareBalanceRaw ?? "0"),
    shareDecimals: input.shareDecimals,
    shareBalanceLabel: formatVaultTokenAmount(input.shareBalanceRaw, input.shareDecimals, shareSymbol),
    assetAddress: input.assetAddress,
    assetSymbol,
    assetDecimals: input.assetDecimals,
    underlyingRaw: String(input.underlyingRaw ?? "0"),
    underlyingLabel: formatVaultTokenAmount(input.underlyingRaw, input.assetDecimals, assetSymbol),
    maxWithdrawRaw: String(input.maxWithdrawRaw ?? "0"),
    maxWithdrawLabel: formatVaultTokenAmount(input.maxWithdrawRaw, input.assetDecimals, assetSymbol),
    totalAssetsRaw: String(input.totalAssetsRaw ?? "0"),
    totalAssetsLabel: formatVaultTokenAmount(input.totalAssetsRaw, input.assetDecimals, assetSymbol),
    error: input.error,
  };
}
