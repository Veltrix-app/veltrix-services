export const MOONWELL_BASE_CHAIN_ID = 8453;
export const MOONWELL_BASE_CHAIN_NAME = "Base";
export const MOONWELL_BASE_RPC_FALLBACK_URL = "https://mainnet.base.org";
export const MOONWELL_BASE_ETH_ROUTER_ADDRESS = "0xc095cb1A6B41A5Cd7dAaF993a904afDD74758D71";

export type MoonwellVaultSlug = "usdc-vault" | "eth-vault" | "eurc-vault" | "cbbtc-vault";

export type MoonwellVaultConfig = {
  slug: MoonwellVaultSlug;
  label: string;
  assetSymbol: string;
  chainId: typeof MOONWELL_BASE_CHAIN_ID;
  chainName: typeof MOONWELL_BASE_CHAIN_NAME;
  address: `0x${string}`;
  depositMode: "erc20" | "native-eth";
  depositRouterAddress?: `0x${string}`;
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

export type MoonwellVaultTransactionKind = "deposit" | "withdraw";
export type MoonwellVaultTransactionLifecycleStatus = "submitted" | "confirmed" | "failed";

export type VaultActionAmountParseResult =
  | {
      ok: true;
      raw: string;
    }
  | {
      ok: false;
      error: string;
    };

export type MoonwellVaultTransactionIntent =
  | {
      ok: true;
      kind: MoonwellVaultTransactionKind;
      vault: MoonwellVaultConfig;
      amountRaw: string;
      amountLabel: string;
      needsApproval: boolean;
      approvalLabel: string | null;
      actionLabel: string;
    }
  | {
      ok: false;
      kind: MoonwellVaultTransactionKind;
      vault: MoonwellVaultConfig;
      amountRaw: string;
      amountLabel: string;
      needsApproval: false;
      approvalLabel: null;
      actionLabel: string;
      error: string;
    };

export type MoonwellVaultTransactionLogResult =
  | {
      ok: true;
      record: {
        walletAddress: string;
        vaultSlug: MoonwellVaultSlug;
        vaultAddress: `0x${string}`;
        chainId: typeof MOONWELL_BASE_CHAIN_ID;
        kind: MoonwellVaultTransactionKind;
        status: MoonwellVaultTransactionLifecycleStatus;
        amountRaw: string;
        assetSymbol: string;
        txHash: `0x${string}`;
        errorMessage: string | null;
      };
    }
  | {
      ok: false;
      error: string;
    };

export const MOONWELL_BASE_VAULTS: MoonwellVaultConfig[] = [
  {
    slug: "usdc-vault",
    label: "USDC Vault",
    assetSymbol: "USDC",
    chainId: MOONWELL_BASE_CHAIN_ID,
    chainName: MOONWELL_BASE_CHAIN_NAME,
    address: "0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca",
    depositMode: "erc20",
  },
  {
    slug: "eth-vault",
    label: "ETH Vault",
    assetSymbol: "ETH",
    chainId: MOONWELL_BASE_CHAIN_ID,
    chainName: MOONWELL_BASE_CHAIN_NAME,
    address: "0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1",
    depositMode: "native-eth",
    depositRouterAddress: MOONWELL_BASE_ETH_ROUTER_ADDRESS,
  },
  {
    slug: "eurc-vault",
    label: "EURC Vault",
    assetSymbol: "EURC",
    chainId: MOONWELL_BASE_CHAIN_ID,
    chainName: MOONWELL_BASE_CHAIN_NAME,
    address: "0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026",
    depositMode: "erc20",
  },
  {
    slug: "cbbtc-vault",
    label: "cbBTC Vault",
    assetSymbol: "cbBTC",
    chainId: MOONWELL_BASE_CHAIN_ID,
    chainName: MOONWELL_BASE_CHAIN_NAME,
    address: "0x543257ef2161176d7c8cd90ba65c2d4caef5a796",
    depositMode: "erc20",
  },
];

export function getBaseRpcUrls(configuredValue?: string | null) {
  const configuredUrls = (configuredValue ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  return Array.from(new Set([...configuredUrls, MOONWELL_BASE_RPC_FALLBACK_URL]));
}

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

export function parseVaultActionAmount(
  value: string,
  decimals: number
): VaultActionAmountParseResult {
  const trimmed = value.trim();
  const safeDecimals = Number.isInteger(decimals) && decimals >= 0 ? decimals : 0;

  if (!trimmed) {
    return { ok: false, error: "Enter an amount first." };
  }

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, error: "Use a positive decimal amount." };
  }

  const [wholePart, fractionPart = ""] = trimmed.split(".");

  if (fractionPart.length > safeDecimals) {
    return {
      ok: false,
      error: `This token supports ${safeDecimals} decimal places.`,
    };
  }

  const raw =
    BigInt(wholePart || "0") * (BigInt(10) ** BigInt(safeDecimals)) +
    BigInt((fractionPart || "").padEnd(safeDecimals, "0") || "0");

  if (raw <= BigInt(0)) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  return { ok: true, raw: raw.toString() };
}

export function buildMoonwellVaultTransactionIntent(input: {
  kind: MoonwellVaultTransactionKind;
  vault: MoonwellVaultConfig;
  amountRaw: string;
  assetSymbol: string;
  assetDecimals: number;
  allowanceRaw: string;
  assetBalanceRaw?: string;
  maxWithdrawRaw: string;
}): MoonwellVaultTransactionIntent {
  const amountLabel = formatVaultTokenAmount(
    input.amountRaw,
    input.assetDecimals,
    input.assetSymbol
  );
  const actionVerb = input.kind === "deposit" ? "Deposit" : "Withdraw";
  const baseIntent = {
    kind: input.kind,
    vault: input.vault,
    amountRaw: input.amountRaw,
    amountLabel,
    needsApproval: false as const,
    approvalLabel: null,
    actionLabel: `${actionVerb} ${amountLabel}`,
  };

  let amount: bigint;

  try {
    amount = BigInt(input.amountRaw);
  } catch {
    return {
      ...baseIntent,
      ok: false,
      error: "Invalid amount.",
    };
  }

  if (amount <= BigInt(0)) {
    return {
      ...baseIntent,
      ok: false,
      error: "Amount must be greater than zero.",
    };
  }

  if (input.kind === "deposit" && input.assetBalanceRaw !== undefined) {
    const assetBalance = BigInt(input.assetBalanceRaw || "0");

    if (amount > assetBalance) {
      return {
        ...baseIntent,
        ok: false,
        error:
          input.vault.depositMode === "native-eth"
            ? "Amount is higher than your ETH balance."
            : "Amount is higher than your token balance.",
      };
    }
  }

  if (input.kind === "withdraw") {
    const maxWithdraw = BigInt(input.maxWithdrawRaw || "0");

    if (amount > maxWithdraw) {
      return {
        ...baseIntent,
        ok: false,
        error: "Amount is higher than your withdrawable balance.",
      };
    }

    return {
      ...baseIntent,
      ok: true,
    };
  }

  if (input.vault.depositMode === "native-eth") {
    return {
      ...baseIntent,
      ok: true,
    };
  }

  const allowance = BigInt(input.allowanceRaw || "0");
  const needsApproval = allowance < amount;

  return {
    ...baseIntent,
    ok: true,
    needsApproval,
    approvalLabel: needsApproval ? `Approve ${amountLabel}` : null,
  };
}

export function isTransactionHash(value: string | null | undefined): value is `0x${string}` {
  return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value.trim());
}

export function buildMoonwellVaultTransactionLog(input: {
  wallet: string | null | undefined;
  vault: MoonwellVaultConfig;
  kind: MoonwellVaultTransactionKind;
  status: MoonwellVaultTransactionLifecycleStatus;
  amountRaw: string;
  assetSymbol: string;
  txHash: string | null | undefined;
  errorMessage?: string | null;
}): MoonwellVaultTransactionLogResult {
  if (!isEvmAddress(input.wallet)) {
    return { ok: false, error: "Valid wallet is required." };
  }

  if (!isTransactionHash(input.txHash)) {
    return { ok: false, error: "Valid transaction hash is required." };
  }

  try {
    if (BigInt(input.amountRaw) <= BigInt(0)) {
      return { ok: false, error: "Amount must be greater than zero." };
    }
  } catch {
    return { ok: false, error: "Valid amount is required." };
  }

  return {
    ok: true,
    record: {
      walletAddress: input.wallet.trim(),
      vaultSlug: input.vault.slug,
      vaultAddress: input.vault.address,
      chainId: input.vault.chainId,
      kind: input.kind,
      status: input.status,
      amountRaw: input.amountRaw,
      assetSymbol: input.assetSymbol,
      txHash: input.txHash.trim() as `0x${string}`,
      errorMessage: input.errorMessage?.trim() || null,
    },
  };
}
