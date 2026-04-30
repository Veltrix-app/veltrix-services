"use client";

import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import type { Eip1193Provider } from "ethers";
import {
  VYNTRO_SWAP_CHAIN_ID,
  VYNTRO_SWAP_CHAIN_NAME,
  type NormalizedSwapQuote,
  type SwapToken,
} from "@/lib/defi/vyntro-swap";

const BASE_CHAIN_HEX = `0x${VYNTRO_SWAP_CHAIN_ID.toString(16)}`;

const ERC20_TRANSACTION_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
] as const;

type VyntroSwapQuotePayload = {
  ok: true;
  request: {
    wallet: `0x${string}`;
    chainId: typeof VYNTRO_SWAP_CHAIN_ID;
    sellToken: SwapToken;
    buyToken: SwapToken;
    sellAmountRaw: string;
    slippageBps: number;
  };
  quotes: NormalizedSwapQuote[];
  recommended: NormalizedSwapQuote;
  safety: {
    status: "ok" | "warning" | "danger";
    message: string;
  };
  safeToSign: boolean;
  config: {
    platformFeeBps: number;
    platformFeeRecipient: string | null;
    maxSlippageBps: number;
    dangerPriceImpactBps: number;
  };
};

type SwapState = {
  status:
    | "idle"
    | "quoting"
    | "ready"
    | "approving"
    | "signing"
    | "submitted"
    | "confirmed"
    | "error";
  message: string | null;
  error: string | null;
  quotePayload: VyntroSwapQuotePayload | null;
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

  return "Swap failed.";
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
          chainName: VYNTRO_SWAP_CHAIN_NAME,
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: ["https://mainnet.base.org"],
          blockExplorerUrls: ["https://basescan.org"],
        },
      ],
    });
  }
}

async function syncSwapTransaction(params: {
  accessToken: string;
  intentId: string;
  txHash: string;
  status: "submitted" | "confirmed" | "failed";
  errorMessage?: string | null;
}) {
  await fetch("/api/defi/swap/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      intentId: params.intentId,
      txHash: params.txHash,
      status: params.status,
      errorMessage: params.errorMessage ?? null,
    }),
  }).catch(() => null);
}

export function useVyntroSwap({
  accessToken,
  wallet,
  onConfirmed,
}: {
  accessToken?: string | null;
  wallet: string | null | undefined;
  onConfirmed?: () => void;
}) {
  const [state, setState] = useState<SwapState>({
    status: "idle",
    message: null,
    error: null,
    quotePayload: null,
    txHash: null,
  });

  async function quote(input: {
    sellTokenSymbol: string;
    buyTokenSymbol: string;
    sellAmount: string;
    slippageBps: number;
  }) {
    setState({
      status: "quoting",
      message: "Finding the best safe route...",
      error: null,
      quotePayload: null,
      txHash: null,
    });

    try {
      const response = await fetch("/api/defi/swap/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, ...input }),
      });
      const payload = (await response.json().catch(() => null)) as
        | VyntroSwapQuotePayload
        | { ok?: false; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        const error = payload && "error" in payload ? payload.error : null;
        throw new Error(error || "No swap route found.");
      }

      setState({
        status: "ready",
        message: payload.safeToSign
          ? "Route ready. Review before signing."
          : "Route found, but safety checks blocked signing.",
        error: null,
        quotePayload: payload,
        txHash: null,
      });
      return payload;
    } catch (error) {
      setState({
        status: "error",
        message: null,
        error: getErrorMessage(error),
        quotePayload: null,
        txHash: null,
      });
      return null;
    }
  }

  async function execute(payload?: VyntroSwapQuotePayload | null) {
    const quotePayload = payload ?? state.quotePayload;
    let intentId: string | null = null;
    let submittedTxHash: string | null = null;

    try {
      if (!accessToken) {
        throw new Error("Sign in again before swapping.");
      }

      if (!wallet) {
        throw new Error("Connect a verified wallet first.");
      }

      if (!quotePayload?.recommended.transaction || !quotePayload.safeToSign) {
        throw new Error("Refresh and review a safe swap route first.");
      }

      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No browser wallet was found. Install or unlock MetaMask first.");
      }

      setState((current) => ({
        ...current,
        status: "signing",
        message: "Preparing wallet transaction...",
        error: null,
      }));

      const ethereum = window.ethereum as Eip1193Provider;
      await ensureBaseNetwork(ethereum);
      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      if (normalizeAddress(signerAddress) !== normalizeAddress(wallet)) {
        throw new Error("Your browser wallet does not match the verified VYNTRO wallet.");
      }

      const intentResponse = await fetch("/api/defi/swap/intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(quotePayload),
      });
      const intent = (await intentResponse.json().catch(() => null)) as
        | { ok: true; intentId: string }
        | { ok?: false; error?: string }
        | null;

      if (!intentResponse.ok || !intent?.ok) {
        throw new Error(
          intent && "error" in intent ? intent.error ?? "Could not create swap intent." : "Could not create swap intent."
        );
      }
      intentId = intent.intentId;

      const sellToken = quotePayload.request.sellToken;
      const allowanceTarget = quotePayload.recommended.allowanceTarget;

      if (sellToken.address !== "native" && allowanceTarget) {
        const token = new Contract(sellToken.address, ERC20_TRANSACTION_ABI, signer);
        const allowance = (await token.allowance(signerAddress, allowanceTarget)) as bigint;
        const sellAmount = BigInt(quotePayload.request.sellAmountRaw);

        if (allowance < sellAmount) {
          setState((current) => ({
            ...current,
            status: "approving",
            message: `Approving ${sellToken.symbol} for the selected route...`,
            error: null,
          }));
          const approvalTx = (await token.approve(allowanceTarget, sellAmount)) as TransactionLike;
          await approvalTx.wait();
        }
      }

      setState((current) => ({
        ...current,
        status: "signing",
        message: "Waiting for swap signature...",
        error: null,
      }));

      const tx = (await signer.sendTransaction({
        to: quotePayload.recommended.transaction.to,
        data: quotePayload.recommended.transaction.data,
        value: BigInt(quotePayload.recommended.transaction.value || "0"),
      })) as TransactionLike;

      if (!tx.hash) {
        throw new Error("Wallet did not return a transaction hash.");
      }

      submittedTxHash = tx.hash;
      setState((current) => ({
        ...current,
        status: "submitted",
        message: "Swap submitted. Waiting for confirmation...",
        txHash: tx.hash ?? null,
      }));
      await syncSwapTransaction({
        accessToken,
        intentId,
        txHash: tx.hash,
        status: "submitted",
      });
      await tx.wait();
      await syncSwapTransaction({
        accessToken,
        intentId,
        txHash: tx.hash,
        status: "confirmed",
      });
      setState((current) => ({
        ...current,
        status: "confirmed",
        message: "Swap confirmed.",
        txHash: tx.hash ?? null,
      }));
      onConfirmed?.();
    } catch (error) {
      const message = getErrorMessage(error);

      if (accessToken && intentId && submittedTxHash) {
        await syncSwapTransaction({
          accessToken,
          intentId,
          txHash: submittedTxHash,
          status: "failed",
          errorMessage: message,
        });
      }

      setState((current) => ({
        ...current,
        status: "error",
        message: null,
        error: message,
      }));
    }
  }

  return {
    ...state,
    quote,
    execute,
  };
}
