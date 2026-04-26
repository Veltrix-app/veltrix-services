"use client";

import { useEffect, useMemo, useState } from "react";
import type { MoonwellMarketRead } from "@/lib/defi/moonwell-markets";
import type { MoonwellVaultPositionRead } from "@/lib/defi/moonwell-vaults";
import {
  buildDefiVaultTransactionSummary,
  buildDefiXpEligibilitySnapshot,
  type DefiVaultTransactionSummary,
  type DefiXpEligibilitySnapshot,
  type DefiXpMissionSlug,
} from "@/lib/defi/defi-xp-eligibility";

type DefiXpTrackingStatus = "wallet-missing" | "loading" | "ready" | "error";
type DefiXpClaimStatus = "idle" | "claiming" | "claimed" | "error";

type DefiXpClaimRecord = {
  sourceRef: string;
  xp: number;
  claimedAt: string | null;
};

type DefiXpEligibilityPayload = {
  ok: boolean;
  wallet?: string;
  trackingReady?: boolean;
  transactions?: DefiVaultTransactionSummary;
  claimedSourceRefs?: string[];
  claims?: DefiXpClaimRecord[];
  warning?: string;
  error?: string;
};

type DefiXpClaimPayload = {
  ok: boolean;
  alreadyClaimed?: boolean;
  sourceRef?: string;
  xpAwarded?: number;
  totalXp?: number;
  error?: string;
};

type DefiXpEligibilityState = {
  status: DefiXpTrackingStatus;
  wallet: string | null;
  transactions: DefiVaultTransactionSummary;
  claimedSourceRefs: string[];
  claims: DefiXpClaimRecord[];
  trackingReady: boolean;
  error: string | null;
  warning: string | null;
  claimStatus: DefiXpClaimStatus;
  claimingSlug: DefiXpMissionSlug | null;
  claimMessage: string | null;
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
    claimedSourceRefs: [],
    claims: [],
    trackingReady: false,
    error: null,
    warning: null,
    claimStatus: "idle",
    claimingSlug: null,
    claimMessage: null,
  });

  useEffect(() => {
    if (!wallet || !accessToken) {
      setRemoteState({
        status: "wallet-missing",
        wallet: null,
        transactions: buildDefiVaultTransactionSummary([]),
        claimedSourceRefs: [],
        claims: [],
        trackingReady: false,
        error: null,
        warning: null,
        claimStatus: "idle",
        claimingSlug: null,
        claimMessage: null,
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
      claimMessage: null,
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
          claimedSourceRefs: Array.isArray(payload.claimedSourceRefs)
            ? payload.claimedSourceRefs
            : [],
          claims: Array.isArray(payload.claims) ? payload.claims : [],
          trackingReady: payload.trackingReady !== false,
          error: null,
          warning: payload.warning ?? null,
          claimStatus: "idle",
          claimingSlug: null,
          claimMessage: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setRemoteState({
          status: "error",
          wallet: walletAddress,
          transactions: buildDefiVaultTransactionSummary([]),
          claimedSourceRefs: [],
          claims: [],
          trackingReady: false,
          error: error instanceof Error ? error.message : "Could not read DeFi XP eligibility.",
          warning: null,
          claimStatus: "error",
          claimingSlug: null,
          claimMessage: null,
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
        claimedSourceRefs: remoteState.claimedSourceRefs,
        vaultPositions: input.vaultPositions,
        markets: input.markets,
        transactions: remoteState.transactions,
      }),
    [
      input.markets,
      input.vaultPositions,
      remoteState.claimedSourceRefs,
      remoteState.transactions,
      wallet,
    ]
  );

  function refresh() {
    setRefreshToken((current) => current + 1);
  }

  async function claimMission(missionSlug: DefiXpMissionSlug) {
    if (!wallet || !accessToken) {
      setRemoteState((current) => ({
        ...current,
        claimStatus: "error",
        claimingSlug: null,
        claimMessage: "Connect wallet before claiming DeFi XP.",
      }));
      return { ok: false, error: "Connect wallet before claiming DeFi XP." };
    }

    setRemoteState((current) => ({
      ...current,
      claimStatus: "claiming",
      claimingSlug: missionSlug,
      claimMessage: null,
    }));

    try {
      const response = await fetch(
        `/api/defi/xp-eligibility?wallet=${encodeURIComponent(wallet)}`,
        {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ missionSlug }),
        }
      );
      const payload = (await response.json().catch(() => null)) as DefiXpClaimPayload | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not claim DeFi XP.");
      }

      setRemoteState((current) => ({
        ...current,
        claimedSourceRefs: payload.sourceRef
          ? Array.from(new Set([...current.claimedSourceRefs, payload.sourceRef]))
          : current.claimedSourceRefs,
        claimStatus: "claimed",
        claimingSlug: null,
        claimMessage: payload.alreadyClaimed
          ? "This DeFi XP mission was already claimed."
          : `Claimed ${payload.xpAwarded ?? 0} XP.`,
      }));
      refresh();

      return { ok: true, payload };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not claim DeFi XP.";
      setRemoteState((current) => ({
        ...current,
        claimStatus: "error",
        claimingSlug: null,
        claimMessage: message,
      }));
      return { ok: false, error: message };
    }
  }

  return {
    ...remoteState,
    snapshot,
    refresh,
    claimMission,
  };
}
