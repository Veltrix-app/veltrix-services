"use client";

import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import type { Eip1193Provider } from "ethers";
import {
  MOONWELL_BASE_ETH_ROUTER_ADDRESS,
  MOONWELL_BASE_CHAIN_ID,
  MOONWELL_BASE_RPC_FALLBACK_URL,
  buildMoonwellVaultTransactionLog,
  buildMoonwellVaultTransactionIntent,
  parseVaultActionAmount,
  type MoonwellVaultPositionRead,
  type MoonwellVaultTransactionKind,
  type MoonwellVaultTransactionLifecycleStatus,
} from "@/lib/defi/moonwell-vaults";

const BASE_CHAIN_HEX = `0x${MOONWELL_BASE_CHAIN_ID.toString(16)}`;

const ERC20_TRANSACTION_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
] as const;

const ERC4626_TRANSACTION_ABI = [
  "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)",
] as const;

const ETH_ROUTER_TRANSACTION_ABI = [
  "function deposit(address vault, address to, uint256 amount, uint256 minSharesOut) payable returns (uint256 sharesOut)",
] as const;

type VaultTransactionStatus =
  | "idle"
  | "checking"
  | "approving"
  | "depositing"
  | "withdrawing"
  | "confirmed"
  | "error";

type VaultTransactionState = {
  status: VaultTransactionStatus;
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

export function useMoonwellVaultTransactions({
  accessToken,
  wallet,
  onConfirmed,
}: {
  accessToken?: string | null;
  wallet: string | null | undefined;
  onConfirmed?: () => void;
}) {
  const [state, setState] = useState<VaultTransactionState>({
    status: "idle",
    message: null,
    error: null,
    txHash: null,
  });

  async function syncVaultTransaction(params: {
    kind: MoonwellVaultTransactionKind;
    status: MoonwellVaultTransactionLifecycleStatus;
    amountRaw: string;
    position: MoonwellVaultPositionRead;
    txHash: string;
    errorMessage?: string | null;
  }) {
    if (!accessToken || !wallet) {
      return;
    }

    const log = buildMoonwellVaultTransactionLog({
      wallet,
      vault: params.position.vault,
      kind: params.kind,
      status: params.status,
      amountRaw: params.amountRaw,
      assetSymbol: params.position.assetSymbol,
      txHash: params.txHash,
      errorMessage: params.errorMessage,
    });

    if (!log.ok) {
      return;
    }

    await fetch("/api/defi/vault-transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        wallet,
        vaultSlug: params.position.vault.slug,
        kind: params.kind,
        status: params.status,
        amountRaw: params.amountRaw,
        assetSymbol: params.position.assetSymbol,
        txHash: params.txHash,
        errorMessage: params.errorMessage ?? null,
      }),
    }).catch(() => null);
  }

  async function executeVaultTransaction(input: {
    kind: MoonwellVaultTransactionKind;
    amount: string;
    position: MoonwellVaultPositionRead | null;
  }) {
    let submittedTxHash: string | null = null;
    let submittedAmountRaw: string | null = null;
    let trackedPosition: MoonwellVaultPositionRead | null = null;

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
        throw new Error("Sign in again before moving vault funds.");
      }

      if (!input.position?.assetAddress) {
        throw new Error("Vault asset route is not available yet.");
      }
      trackedPosition = input.position;

      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No browser wallet was found. Install or unlock MetaMask first.");
      }

      const parsedAmount = parseVaultActionAmount(input.amount, input.position.assetDecimals);

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

      const token = new Contract(input.position.assetAddress, ERC20_TRANSACTION_ABI, signer);
      const vault = new Contract(input.position.vault.address, ERC4626_TRANSACTION_ABI, signer);
      const amountRaw = BigInt(parsedAmount.raw);

      if (input.kind === "deposit") {
        const nativeEthDeposit = input.position.vault.depositMode === "native-eth";
        const [allowanceRaw, assetBalanceRaw] = nativeEthDeposit
          ? [BigInt(0), await provider.getBalance(signerAddress)]
          : await Promise.all([
              token.allowance(signerAddress, input.position.vault.address) as Promise<bigint>,
              token.balanceOf(signerAddress) as Promise<bigint>,
            ]);
        const intent = buildMoonwellVaultTransactionIntent({
          kind: "deposit",
          vault: input.position.vault,
          amountRaw: parsedAmount.raw,
          assetSymbol: input.position.assetSymbol,
          assetDecimals: input.position.assetDecimals,
          allowanceRaw: allowanceRaw.toString(),
          assetBalanceRaw: assetBalanceRaw.toString(),
          maxWithdrawRaw: input.position.maxWithdrawRaw,
        });

        if (!intent.ok) {
          throw new Error(intent.error);
        }

        if (intent.needsApproval && !nativeEthDeposit) {
          setState({
            status: "approving",
            message: intent.approvalLabel ?? "Approving token spend...",
            error: null,
            txHash: null,
          });

          const approveTransaction = (await token.approve(
            input.position.vault.address,
            amountRaw
          )) as TransactionLike;

          setState((current) => ({
            ...current,
            txHash: approveTransaction.hash ?? null,
          }));
          await approveTransaction.wait();
        }

        setState({
          status: "depositing",
          message: intent.actionLabel,
          error: null,
          txHash: null,
        });

        const depositTransaction = nativeEthDeposit
          ? ((await new Contract(
              input.position.vault.depositRouterAddress ?? MOONWELL_BASE_ETH_ROUTER_ADDRESS,
              ETH_ROUTER_TRANSACTION_ABI,
              signer
            ).deposit(input.position.vault.address, signerAddress, amountRaw, BigInt(0), {
              value: amountRaw,
            })) as TransactionLike)
          : ((await vault.deposit(amountRaw, signerAddress)) as TransactionLike);

        submittedTxHash = depositTransaction.hash ?? null;
        setState((current) => ({
          ...current,
          txHash: submittedTxHash,
        }));
        if (submittedTxHash) {
          await syncVaultTransaction({
            kind: input.kind,
            status: "submitted",
            amountRaw: parsedAmount.raw,
            position: input.position,
            txHash: submittedTxHash,
          });
        }
        await depositTransaction.wait();
      } else {
        const intent = buildMoonwellVaultTransactionIntent({
          kind: "withdraw",
          vault: input.position.vault,
          amountRaw: parsedAmount.raw,
          assetSymbol: input.position.assetSymbol,
          assetDecimals: input.position.assetDecimals,
          allowanceRaw: "0",
          maxWithdrawRaw: input.position.maxWithdrawRaw,
        });

        if (!intent.ok) {
          throw new Error(intent.error);
        }

        setState({
          status: "withdrawing",
          message: intent.actionLabel,
          error: null,
          txHash: null,
        });

        const withdrawTransaction = (await vault.withdraw(
          amountRaw,
          signerAddress,
          signerAddress
        )) as TransactionLike;

        submittedTxHash = withdrawTransaction.hash ?? null;
        setState((current) => ({
          ...current,
          txHash: submittedTxHash,
        }));
        if (submittedTxHash) {
          await syncVaultTransaction({
            kind: input.kind,
            status: "submitted",
            amountRaw: parsedAmount.raw,
            position: input.position,
            txHash: submittedTxHash,
          });
        }
        await withdrawTransaction.wait();
      }

      if (submittedTxHash) {
        await syncVaultTransaction({
          kind: input.kind,
          status: "confirmed",
          amountRaw: parsedAmount.raw,
          position: input.position,
          txHash: submittedTxHash,
        });
      }

      setState({
        status: "confirmed",
        message: "Transaction confirmed. Refreshing your vault position...",
        error: null,
        txHash: submittedTxHash,
      });
      onConfirmed?.();
      return { ok: true };
    } catch (error) {
      const message = getErrorMessage(error);
      if (submittedTxHash && submittedAmountRaw && trackedPosition) {
        await syncVaultTransaction({
          kind: input.kind,
          status: "failed",
          amountRaw: submittedAmountRaw,
          position: trackedPosition,
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
      state.status === "depositing" ||
      state.status === "withdrawing",
    executeVaultTransaction,
    resetVaultTransaction: () =>
      setState({
        status: "idle",
        message: null,
        error: null,
        txHash: null,
      }),
  };
}
