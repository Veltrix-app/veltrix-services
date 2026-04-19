"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { prependLiveUserNotification } from "@/hooks/use-live-user-data";
import type { LiveCommunityJourneySnapshot } from "@/types/live";

type UseCommunityJourneyOptions = {
  projectId?: string | null;
};

type CommunityJourneyCacheEntry = {
  snapshot: LiveCommunityJourneySnapshot | null;
};

const communityJourneyCache = new Map<string, CommunityJourneyCacheEntry>();

function buildCacheKey(authUserId: string | null, projectId?: string | null) {
  return authUserId ? `${authUserId}:${projectId?.trim() || "primary"}` : "";
}

const emptyJourneySnapshot: LiveCommunityJourneySnapshot = {
  projectId: "",
  projectName: "No community selected",
  projectChain: null,
  lane: "onboarding",
  status: "active",
  currentStepKey: "",
  lastEventType: "",
  lastEventAt: "",
  completedStepsCount: 0,
  nudgesSentCount: 0,
  milestonesUnlockedCount: 0,
  streakDays: 0,
  linkedProvidersCount: 0,
  walletVerified: false,
  joinedProjectsCount: 0,
  unreadSignals: 0,
  openMissionCount: 0,
  claimableRewards: 0,
  recognitionLabel: "Explorer",
  contributionStatus: "No community rail is active yet.",
  nextUnlockLabel: "Join a project world to unlock your community journey.",
  headline: "Community rail is standing by",
  supportingCopy: "As soon as a project lane is active for your account, Veltrix will prioritize the next best move here.",
  nextBestAction: null,
  actions: [],
};

export function clearCommunityJourneyCache(authUserId?: string | null) {
  if (!authUserId) {
    communityJourneyCache.clear();
    return;
  }

  for (const key of [...communityJourneyCache.keys()]) {
    if (key.startsWith(`${authUserId}:`)) {
      communityJourneyCache.delete(key);
    }
  }
}

export function useCommunityJourney(options?: UseCommunityJourneyOptions) {
  const { authConfigured, authUserId, initialized, session } = useAuth();
  const cacheKey = useMemo(
    () => buildCacheKey(authUserId, options?.projectId),
    [authUserId, options?.projectId]
  );
  const cachedSnapshot = cacheKey ? communityJourneyCache.get(cacheKey)?.snapshot ?? null : null;
  const [snapshot, setSnapshot] = useState<LiveCommunityJourneySnapshot>(
    cachedSnapshot ?? emptyJourneySnapshot
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!authConfigured || !authUserId || !session?.access_token) {
      if (cacheKey) {
        communityJourneyCache.delete(cacheKey);
      }
      setSnapshot(emptyJourneySnapshot);
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return;
    }

    const cached = cacheKey ? communityJourneyCache.get(cacheKey)?.snapshot ?? null : null;
    if (cached) {
      setSnapshot(cached);
      setLoading(false);
      setRefreshing(true);
    } else {
      setLoading(true);
      setRefreshing(false);
    }
    setError(null);

    const url = options?.projectId?.trim()
      ? `/api/community/journey?projectId=${encodeURIComponent(options.projectId.trim())}`
      : "/api/community/journey";
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      setError(payload?.error || "Could not load community journey.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const nextSnapshot =
      payload.snapshot && typeof payload.snapshot === "object"
        ? (payload.snapshot as LiveCommunityJourneySnapshot)
        : emptyJourneySnapshot;

    if (cacheKey) {
      communityJourneyCache.set(cacheKey, { snapshot: nextSnapshot });
    }
    setSnapshot(nextSnapshot);
    setLoading(false);
    setRefreshing(false);
  }

  async function advance(input: {
    actionKey: string;
    lane?: "onboarding" | "active" | "comeback";
  }) {
    if (!authConfigured || !authUserId || !session?.access_token) {
      return { ok: false, error: "You must be signed in to advance this community rail." };
    }

    const response = await fetch("/api/community/journey/advance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        actionKey: input.actionKey,
        projectId: options?.projectId?.trim() || undefined,
        lane: input.lane,
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        error: payload?.error || "Could not advance this community journey step.",
      };
    }

    const nextSnapshot =
      payload.snapshot && typeof payload.snapshot === "object"
        ? (payload.snapshot as LiveCommunityJourneySnapshot)
        : snapshot;

    if (cacheKey) {
      communityJourneyCache.set(cacheKey, { snapshot: nextSnapshot });
    }
    setSnapshot(nextSnapshot);
    prependLiveUserNotification(authUserId, {
      id: `local-community-${input.actionKey}-${Date.now()}`,
      title: "Community rail advanced",
      body: `${nextSnapshot.projectName} moved your ${nextSnapshot.lane} lane forward.`,
      read: false,
      type: "community",
      createdAt: new Date().toISOString(),
    });
    return { ok: true, advanced: payload.advanced === true, snapshot: nextSnapshot };
  }

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (cachedSnapshot) {
      setSnapshot(cachedSnapshot);
      setLoading(false);
      setRefreshing(true);
    } else {
      setLoading(true);
      setRefreshing(false);
    }

    void reload();
  }, [initialized, cacheKey, session?.access_token]);

  return {
    snapshot,
    loading,
    refreshing,
    error,
    reload,
    advance,
  };
}
