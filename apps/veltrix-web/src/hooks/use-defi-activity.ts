"use client";

import { useEffect, useState } from "react";
import {
  buildDefiActivityTimeline,
  type DefiActivityTimeline,
} from "@/lib/defi/defi-activity";

type DefiActivityStatus = "wallet-missing" | "loading" | "ready" | "error";

type DefiActivityPayload = {
  ok: boolean;
  wallet?: string;
  activity?: DefiActivityTimeline;
  warning?: string | null;
  error?: string;
};

type DefiActivityState = {
  status: DefiActivityStatus;
  wallet: string | null;
  activity: DefiActivityTimeline;
  warning: string | null;
  error: string | null;
};

const emptyActivity = buildDefiActivityTimeline({
  vaultTransactions: [],
  marketTransactions: [],
  xpEvents: [],
});

export function useDefiActivity(input: {
  accessToken?: string | null;
  wallet?: string | null;
}) {
  const accessToken = input.accessToken ?? null;
  const wallet = input.wallet ?? null;
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<DefiActivityState>({
    status: "wallet-missing",
    wallet: null,
    activity: emptyActivity,
    warning: null,
    error: null,
  });

  useEffect(() => {
    if (!wallet || !accessToken) {
      setState({
        status: "wallet-missing",
        wallet: null,
        activity: emptyActivity,
        warning: null,
        error: null,
      });
      return;
    }

    const controller = new AbortController();
    const walletAddress = wallet;

    setState((current) => ({
      ...current,
      status: "loading",
      wallet: walletAddress,
      error: null,
    }));

    async function loadActivity() {
      try {
        const response = await fetch(
          `/api/defi/activity?wallet=${encodeURIComponent(walletAddress)}`,
          {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          }
        );
        const payload = (await response.json().catch(() => null)) as DefiActivityPayload | null;

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Could not read DeFi activity.");
        }

        setState({
          status: "ready",
          wallet: payload.wallet ?? walletAddress,
          activity: payload.activity ?? emptyActivity,
          warning: payload.warning ?? null,
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          wallet: walletAddress,
          activity: emptyActivity,
          warning: null,
          error: error instanceof Error ? error.message : "Could not read DeFi activity.",
        });
      }
    }

    void loadActivity();

    return () => {
      controller.abort();
    };
  }, [accessToken, refreshToken, wallet]);

  return {
    ...state,
    refresh: () => setRefreshToken((current) => current + 1),
  };
}
