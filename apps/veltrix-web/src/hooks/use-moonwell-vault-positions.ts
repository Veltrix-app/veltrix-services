"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  buildMoonwellVaultReadUrl,
  type MoonwellVaultPositionRead,
} from "@/lib/defi/moonwell-vaults";

type MoonwellVaultPositionsStatus = "wallet-missing" | "loading" | "ready" | "error";

type MoonwellVaultPositionsState = {
  status: MoonwellVaultPositionsStatus;
  wallet: string | null;
  positions: MoonwellVaultPositionRead[];
  error: string | null;
};

type MoonwellVaultPositionsPayload = {
  ok: boolean;
  wallet?: string;
  vaults?: MoonwellVaultPositionRead[];
  error?: string;
};

export function useMoonwellVaultPositions() {
  const { profile } = useAuth();
  const wallet = profile?.wallet ?? null;
  const readUrl = buildMoonwellVaultReadUrl(wallet);
  const [remoteState, setRemoteState] = useState<MoonwellVaultPositionsState>({
    status: "wallet-missing",
    wallet: null,
    positions: [],
    error: null,
  });

  useEffect(() => {
    if (!readUrl || !wallet) {
      return;
    }

    const vaultReadUrl = readUrl;
    const controller = new AbortController();

    async function loadVaultPositions() {
      try {
        const response = await fetch(vaultReadUrl, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as
          | MoonwellVaultPositionsPayload
          | null;

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Could not read vault positions.");
        }

        setRemoteState({
          status: "ready",
          wallet: payload.wallet ?? wallet,
          positions: Array.isArray(payload.vaults) ? payload.vaults : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setRemoteState({
          status: "error",
          wallet,
          positions: [],
          error: error instanceof Error ? error.message : "Could not read vault positions.",
        });
      }
    }

    void loadVaultPositions();

    return () => {
      controller.abort();
    };
  }, [readUrl, wallet]);

  if (!readUrl) {
    return {
      status: "wallet-missing",
      wallet: null,
      positions: [],
      error: null,
    } satisfies MoonwellVaultPositionsState;
  }

  if (remoteState.wallet !== wallet) {
    return {
      status: "loading",
      wallet,
      positions: [],
      error: null,
    } satisfies MoonwellVaultPositionsState;
  }

  return remoteState;
}
