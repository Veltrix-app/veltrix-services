"use client";

import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import type { Eip1193Provider } from "ethers";
import {
  buildMoonwellMarketTransactionIntent,
  buildMoonwellMarketTransactionLog,
  parseMarketActionAmount,
  type MoonwellMarketTransactionKind,
  type MoonwellMarketTransactionLifecycleStatus,
} from "@/lib/defi/moonwell-market-transactions";
import {
  MOONWELL_BASE_COMPTROLLER_ADDRESS,
  type MoonwellMarketRead,
} from "@/lib/defi/moonwell-markets";
import {
  MOONWELL_BASE_CHAIN_ID,
  MOONWELL_BASE_RPC_FALLBACK_URL,
} from "@/lib/defi/moonwell-vaults";

const BASE_CHAIN_HEX = `0x${MOONWELL_BASE_CHAIN_ID.toString(16)}`;

const ERC20_TRANSACTION_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
] as const;

const MTOKEN_TRANSACTION_ABI = [
  "function underlying() view returns (address)",
  "function mint(uint256 mintAmount) returns (uint256)",
  "function redeemUnderlying(uint256 redeemAmount) returns (uint256)",
  "function borrow(uint256 borrowAmount) returns (uint256)",
  "function repayBorrow(uint256 repayAmount) returns (uint256)",
] as const;

const COMPTROLLER_TRANSACTION_ABI = [
  "function enterMarkets(address[] mTokens) returns (uint256[] memory)",
] as const;

type MarketTransactionStatus =
  | "idle"
  | "checking"
  | "approving"
  | "supplying"
  | "withdrawing"
  | "enabling"
  | "borrowing"
  | "repaying"
  | "confirmed"
  | "error";

type MarketTransactionState = {
  status: MarketTransactionStatus;
  message: string | null;
  error: string | null;
  txHash: string | null;
};

type TransactionLike = {
  hash?: string;
  wait: () => Promise<unknown>;
};

function normalizeAddress(value: string) {
  return value.trim().toLowerCase();
}

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "number" || typeof code === "string" ? String(code) : null;
  }

  return null;
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "shortMessage" in error) {
    const shortMessage = (error as { shortMessage?: unknown }).shortMessage;
    if (typeof shortMessage === "string") {
      return shortMessage;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Transaction failed.";
}

async function ensureBaseNetwork(ethereum: Eip1193Provider) {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_HEX }],
    });
  } catch (error) {
    if (getErrorCode(error) !== "4902") {
      throw error;
    }

    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: BASE_CHAIN_HEX,
          chainName: "Base",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: [MOONWELL_BASE_RPC_FALLBACK_URL],
          blockExplorerUrls: ["https://basescan.org"],
        },
      ],
    });
  }
}

function getActionStatus(kind: MoonwellMarketTransactionKind): MarketTransactionStatus {
  if (kind === "supply") return "supplying";
  if (kind === "withdraw") return "withdrawing";
  if (kind === "enable-collateral") return "enabling";
  if (kind === "borrow") return "borrowing";
  return "repaying";
}

export function useMoonwellMarketTransactions({
  accessToken,
  wallet,
  onConfirmed,
}: {
  accessToken?: string | null;
  wallet: string | null | undefined;
  onConfirmed?: () => void;
}) {
  const [state, setState] = useState<MarketTransactionState>({
    status: "idle",
    message: null,
    error: null,
    txHash: null,
  });

  async function syncMarketTransaction(params: {
    kind: MoonwellMarketTransactionKind;
    status: MoonwellMarketTransactionLifecycleStatus;
    amountRaw: string;
    market: MoonwellMarketRead;
    txHash: string;
    errorMessage?: string | null;
  }) {
    if (!accessToken || !wallet) {
      return;
    }

    const log = buildMoonwellMarketTransactionLog({
      wallet,
      market: {
        slug: params.market.slug,
        title: params.market.title,
        assetSymbol: params.market.asset,
        chain: params.market.chain,
        mTokenAddress: params.market.mTokenAddress,
        defaultDecimals: params.market.assetDecimals,
        accent: params.market.accent,
        riskLabel: params.market.riskLabel,
        description: params.market.description,
      },
      kind: params.kind,
      status: params.status,
      amountRaw: params.amountRaw,
      assetSymbol: params.market.asset,
      txHash: params.txHash,
      errorMessage: params.errorMessage,
    });

    if (!log.ok) {
      return;
    }

    await fetch("/api/defi/market-transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        wallet,
        marketSlug: params.market.slug,
        kind: params.kind,
        status: params.status,
        amountRaw: params.amountRaw,
        assetSymbol: params.market.asset,
        txHash: params.txHash,
        errorMessage: params.errorMessage ?? null,
      }),
    }).catch(() => null);
  }

  async function executeMarketTransaction(input: {
    kind: MoonwellMarketTransactionKind;
    amount: string;
    market: MoonwellMarketRead | null;
    riskAccepted?: boolean;
  }) {
    let submittedTxHash: string | null = null;
    let submittedAmountRaw: string | null = null;
    let trackedMarket: MoonwellMarketRead | null = null;

    setState({
      status: "checking",
      message: "Preparing wallet transaction...",
      error: null,
      txHash: null,
    });

    try {
      if (!wallet) {
        throw new Error("Connect a verified wallet first.");
      }

      if (!accessToken) {
        throw new Error("Sign in again before moving market funds.");
      }

      if (!input.market) {
        throw new Error("Market route is not available yet.");
      }
      trackedMarket = input.market;

      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No browser wallet was found. Install or unlock MetaMask first.");
      }

      const parsedAmount =
        input.kind === "enable-collateral"
          ? { ok: true as const, raw: "0" }
          : parseMarketActionAmount(input.amount, input.market.assetDecimals);

      if (!parsedAmount.ok) {
        throw new Error(parsedAmount.error);
      }
      submittedAmountRaw = parsedAmount.raw;

      const ethereum = window.ethereum as Eip1193Provider;
      await ensureBaseNetwork(ethereum);

      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      if (normalizeAddress(signerAddress) !== normalizeAddress(wallet)) {
        throw new Error("Your browser wallet does not match the verified VYNTRO wallet.");
      }

      const mToken = new Contract(
        input.market.mTokenAddress,
        MTOKEN_TRANSACTION_ABI,
        signer
      );
      const comptroller = new Contract(
        MOONWELL_BASE_COMPTROLLER_ADDRESS,
        COMPTROLLER_TRANSACTION_ABI,
        signer
      );
      const underlyingAddress = (await mToken.underlying()) as string;
      const token = new Contract(underlyingAddress, ERC20_TRANSACTION_ABI, signer);
      const amountRaw = BigInt(parsedAmount.raw);
      const [allowanceRaw, walletAssetBalanceRaw] =
        input.kind === "supply" || input.kind === "repay"
          ? await Promise.all([
              token.allowance(signerAddress, input.market.mTokenAddress) as Promise<bigint>,
              token.balanceOf(signerAddress) as Promise<bigint>,
            ])
          : [BigInt(0), BigInt(0)];

      const intent = buildMoonwellMarketTransactionIntent({
        kind: input.kind,
        market: {
          slug: input.market.slug,
          title: input.market.title,
          assetSymbol: input.market.asset,
          chain: input.market.chain,
          mTokenAddress: input.market.mTokenAddress,
          defaultDecimals: input.market.assetDecimals,
          accent: input.market.accent,
          riskLabel: input.market.riskLabel,
          description: input.market.description,
        },
        amountRaw: parsedAmount.raw,
        assetSymbol: input.market.asset,
        assetDecimals: input.market.assetDecimals,
        allowanceRaw: allowanceRaw.toString(),
        walletAssetBalanceRaw: walletAssetBalanceRaw.toString(),
        suppliedUnderlyingRaw: input.market.suppliedUnderlyingRaw,
        borrowedUnderlyingRaw: input.market.borrowedUnderlyingRaw,
        collateralEnabled: input.market.collateralEnabled,
        marketLiquidityRaw: input.market.marketLiquidityRaw,
        riskAccepted: Boolean(input.riskAccepted),
        shortfallRaw: input.market.accountShortfallRaw,
      });

      if (!intent.ok) {
        throw new Error(intent.error);
      }

      if (intent.needsApproval) {
        setState({
          status: "approving",
          message: intent.approvalLabel ?? "Approving token spend...",
          error: null,
          txHash: null,
        });

        const approveTransaction = (await token.approve(
          input.market.mTokenAddress,
          amountRaw
        )) as TransactionLike;

        setState((current) => ({
          ...current,
          txHash: approveTransaction.hash ?? null,
        }));
        await approveTransaction.wait();
      }

      setState({
        status: getActionStatus(input.kind),
        message: intent.actionLabel,
        error: null,
        txHash: null,
      });

      const transaction =
        input.kind === "supply"
          ? ((await mToken.mint(amountRaw)) as TransactionLike)
          : input.kind === "withdraw"
            ? ((await mToken.redeemUnderlying(amountRaw)) as TransactionLike)
            : input.kind === "enable-collateral"
              ? ((await comptroller.enterMarkets([input.market.mTokenAddress])) as TransactionLike)
              : input.kind === "borrow"
                ? ((await mToken.borrow(amountRaw)) as TransactionLike)
                : ((await mToken.repayBorrow(amountRaw)) as TransactionLike);

      submittedTxHash = transaction.hash ?? null;
      setState((current) => ({
        ...current,
        txHash: submittedTxHash,
      }));

      if (submittedTxHash) {
        await syncMarketTransaction({
          kind: input.kind,
          status: "submitted",
          amountRaw: parsedAmount.raw,
          market: input.market,
          txHash: submittedTxHash,
        });
      }

      await transaction.wait();

      if (submittedTxHash) {
        await syncMarketTransaction({
          kind: input.kind,
          status: "confirmed",
          amountRaw: parsedAmount.raw,
          market: input.market,
          txHash: submittedTxHash,
        });
      }

      setState({
        status: "confirmed",
        message: "Transaction confirmed. Refreshing your market position...",
        error: null,
        txHash: submittedTxHash,
      });
      onConfirmed?.();
      return { ok: true };
    } catch (error) {
      const message = getErrorMessage(error);
      if (submittedTxHash && submittedAmountRaw && trackedMarket) {
        await syncMarketTransaction({
          kind: input.kind,
          status: "failed",
          amountRaw: submittedAmountRaw,
          market: trackedMarket,
          txHash: submittedTxHash,
          errorMessage: message,
        });
      }
      setState({
        status: "error",
        message: null,
        error: message,
        txHash: null,
      });
      return { ok: false, error: message };
    }
  }

  return {
    ...state,
    busy:
      state.status === "checking" ||
      state.status === "approving" ||
      state.status === "supplying" ||
      state.status === "withdrawing" ||
      state.status === "enabling" ||
      state.status === "borrowing" ||
      state.status === "repaying",
    executeMarketTransaction,
    resetMarketTransaction: () =>
      setState({
        status: "idle",
        message: null,
        error: null,
        txHash: null,
      }),
  };
}
