"use client";

import { useEffect, useMemo, useState } from "react";
import type { MoonwellMarketRead } from "@/lib/defi/moonwell-markets";
import type { MoonwellVaultPositionRead } from "@/lib/defi/moonwell-vaults";
import {
  buildDefiVaultTransactionSummary,
  buildDefiXpEligibilitySnapshot,
  type DefiVaultTransactionSummary,
  type DefiXpEligibilitySnapshot,
} from "@/lib/defi/defi-xp-eligibility";

type DefiXpTrackingStatus = "wallet-missing" | "loading" | "ready" | "error";

type DefiXpEligibilityPayload = {
  ok: boolean;
  wallet?: string;
  trackingReady?: boolean;
  transactions?: DefiVaultTransactionSummary;
  warning?: string;
  error?: string;
};

type DefiXpEligibilityState = {
  status: DefiXpTrackingStatus;
  wallet: string | null;
  transactions: DefiVaultTransactionSummary;
  trackingReady: boolean;
  error: string | null;
  warning: string | null;
};

export function useDefiXpEligibility(input: {
  accessToken?: string | null;
  wallet?: string | null;
  vaultPositions: MoonwellVaultPositionRead[];
  markets: MoonwellMarketRead[];
}) {
  const wallet = input.wallet ?? null;
  const accessToken = input.accessToken ?? null;
  const [refreshToken, setRefreshToken] = useState(0);
  const [remoteState, setRemoteState] = useState<DefiXpEligibilityState>({
    status: "wallet-missing",
    wallet: null,
    transactions: buildDefiVaultTransactionSummary([]),
    trackingReady: false,
    error: null,
    warning: null,
  });

  useEffect(() => {
    if (!wallet || !accessToken) {
      setRemoteState({
        status: "wallet-missing",
        wallet: null,
        transactions: buildDefiVaultTransactionSummary([]),
        trackingReady: false,
        error: null,
        warning: null,
      });
      return;
    }

    const walletAddress = wallet;
    const controller = new AbortController();

    setRemoteState((current) => ({
      ...current,
      status: "loading",
      wallet: walletAddress,
      error: null,
    }));

    async function loadEligibility() {
      try {
        const response = await fetch(
          `/api/defi/xp-eligibility?wallet=${encodeURIComponent(walletAddress)}`,
          {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          }
        );
        const payload = (await response.json().catch(() => null)) as
          | DefiXpEligibilityPayload
          | null;

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Could not read DeFi XP eligibility.");
        }

        setRemoteState({
          status: "ready",
          wallet: payload.wallet ?? walletAddress,
          transactions: payload.transactions ?? buildDefiVaultTransactionSummary([]),
          trackingReady: payload.trackingReady !== false,
          error: null,
          warning: payload.warning ?? null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setRemoteState({
          status: "error",
          wallet: walletAddress,
          transactions: buildDefiVaultTransactionSummary([]),
          trackingReady: false,
          error: error instanceof Error ? error.message : "Could not read DeFi XP eligibility.",
          warning: null,
        });
      }
    }

    void loadEligibility();

    return () => {
      controller.abort();
    };
  }, [accessToken, refreshToken, wallet]);

  const snapshot = useMemo<DefiXpEligibilitySnapshot>(
    () =>
      buildDefiXpEligibilitySnapshot({
        walletReady: Boolean(wallet),
        vaultPositions: input.vaultPositions,
        markets: input.markets,
        transactions: remoteState.transactions,
      }),
    [input.markets, input.vaultPositions, remoteState.transactions, wallet]
  );

  function refresh() {
    setRefreshToken((current) => current + 1);
  }

  return {
    ...remoteState,
    snapshot,
    refresh,
  };
}
