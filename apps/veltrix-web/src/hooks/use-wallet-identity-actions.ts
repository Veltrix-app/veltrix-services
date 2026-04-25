"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

type WalletActionResult = {
  ok: boolean;
  error?: string;
  walletAddress?: string;
};

export function useWalletIdentityActions() {
  const { session, verifyWallet, unlinkWallet } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [action, setAction] = useState<"connect" | "disconnect" | null>(null);

  async function connectWallet(): Promise<WalletActionResult> {
    setMessage(null);

    if (!session?.access_token) {
      const error = "Sign in before connecting a wallet.";
      setMessage(error);
      return { ok: false, error };
    }

    if (typeof window === "undefined" || !window.ethereum) {
      const error = "No browser wallet was found. Install or unlock MetaMask first.";
      setMessage(error);
      return { ok: false, error };
    }

    setAction("connect");

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      const nextWallet = Array.isArray(accounts) && accounts[0] ? String(accounts[0]) : "";

      if (!nextWallet) {
        const error = "No wallet account was returned.";
        setMessage(error);
        return { ok: false, error };
      }

      setMessage("Requesting a signed wallet verification challenge...");

      const nonceResponse = await fetch("/api/identity/wallet/nonce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          walletAddress: nextWallet,
          chain: "evm",
        }),
      });

      const noncePayload = await nonceResponse.json().catch(() => null);

      if (!nonceResponse.ok || !noncePayload?.ok || typeof noncePayload?.message !== "string") {
        throw new Error(noncePayload?.error || "Could not create a wallet verification challenge.");
      }

      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [noncePayload.message, nextWallet],
      })) as string;

      const verification = await verifyWallet({
        walletAddress: nextWallet,
        chain: "evm",
        signature,
      });

      if (!verification.ok) {
        throw new Error(verification.error || "Wallet verification failed.");
      }

      setMessage("Wallet verified and set as your primary identity wallet.");
      return { ok: true, walletAddress: verification.walletAddress ?? nextWallet };
    } catch (nextError) {
      const error = nextError instanceof Error ? nextError.message : "Could not connect your wallet.";
      setMessage(error);
      return { ok: false, error };
    } finally {
      setAction(null);
    }
  }

  async function disconnectWallet(): Promise<WalletActionResult> {
    setMessage(null);

    if (!session?.access_token) {
      const error = "Sign in before disconnecting a wallet.";
      setMessage(error);
      return { ok: false, error };
    }

    setAction("disconnect");

    try {
      const result = await unlinkWallet();
      if (!result.ok) {
        throw new Error(result.error || "Could not unlink your wallet.");
      }

      setMessage("Wallet disconnected from your Veltrix identity.");
      return { ok: true };
    } catch (nextError) {
      const error =
        nextError instanceof Error ? nextError.message : "Could not disconnect your wallet.";
      setMessage(error);
      return { ok: false, error };
    } finally {
      setAction(null);
    }
  }

  return {
    message,
    clearMessage: () => setMessage(null),
    connectWallet,
    disconnectWallet,
    connecting: action === "connect",
    disconnecting: action === "disconnect",
    busy: action !== null,
  };
}
