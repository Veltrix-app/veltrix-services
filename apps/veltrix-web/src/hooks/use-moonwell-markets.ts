"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  buildMoonwellMarketsReadUrl,
  type MoonwellMarketRead,
  type MoonwellPortfolioRead,
} from "@/lib/defi/moonwell-markets";

type MoonwellMarketsStatus = "loading" | "ready" | "error";

type MoonwellMarketsState = {
  status: MoonwellMarketsStatus;
  wallet: string | null;
  markets: MoonwellMarketRead[];
  portfolio: MoonwellPortfolioRead | null;
  error: string | null;
  readUrl: string;
};

type MoonwellMarketsPayload = {
  ok: boolean;
  wallet?: string | null;
  markets?: MoonwellMarketRead[];
  portfolio?: MoonwellPortfolioRead;
  error?: string;
};

export function useMoonwellMarkets() {
  const { profile } = useAuth();
  const wallet = profile?.wallet ?? null;
  const readUrl = buildMoonwellMarketsReadUrl(wallet);
  const [refreshToken, setRefreshToken] = useState(0);
  const [remoteState, setRemoteState] = useState<MoonwellMarketsState>({
    status: "loading",
    wallet: null,
    markets: [],
    portfolio: null,
    error: null,
    readUrl,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadMarkets() {
      setRemoteState((current) => ({
        ...current,
        status: "loading",
        wallet,
        error: null,
        readUrl,
      }));

      try {
        const response = await fetch(readUrl, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as
          | MoonwellMarketsPayload
          | null;

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Could not read Moonwell markets.");
        }

        setRemoteState({
          status: "ready",
          wallet: payload.wallet ?? null,
          markets: Array.isArray(payload.markets) ? payload.markets : [],
          portfolio: payload.portfolio ?? null,
          error: null,
          readUrl,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setRemoteState({
          status: "error",
          wallet,
          markets: [],
          portfolio: null,
          error: error instanceof Error ? error.message : "Could not read Moonwell markets.",
          readUrl,
        });
      }
    }

    void loadMarkets();

    return () => {
      controller.abort();
    };
  }, [readUrl, refreshToken, wallet]);

  function refresh() {
    setRefreshToken((current) => current + 1);
  }

  if (remoteState.readUrl !== readUrl) {
    return {
      status: "loading",
      wallet,
      markets: [],
      portfolio: null,
      error: null,
      refresh,
    };
  }

  return {
    status: remoteState.status,
    wallet: remoteState.wallet,
    markets: remoteState.markets,
    portfolio: remoteState.portfolio,
    error: remoteState.error,
    refresh,
  };
}
