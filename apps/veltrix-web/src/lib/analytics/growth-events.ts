"use client";

import {
  captureGrowthAttributionFromWindow,
  type GrowthAnalyticsContext,
} from "@/lib/analytics/attribution";

export type GrowthAnalyticsEventType =
  | "anonymous_visit"
  | "pricing_view"
  | "signup_started"
  | "signup_completed"
  | "workspace_created"
  | "first_project_created"
  | "provider_connected"
  | "first_campaign_live"
  | "checkout_started"
  | "paid_converted"
  | "renewal_succeeded"
  | "renewal_failed"
  | "expanded"
  | "downgraded"
  | "churned"
  | "member_joined"
  | "member_completed_first_quest"
  | "member_returned"
  | "reward_claimed";

export type TrackGrowthEventInput = {
  eventType: GrowthAnalyticsEventType;
  eventPayload?: Record<string, unknown>;
  analyticsContext?: GrowthAnalyticsContext | null;
};

export async function trackGrowthEvent(input: TrackGrowthEventInput) {
  if (typeof window === "undefined") {
    return;
  }

  const analyticsContext =
    input.analyticsContext ?? captureGrowthAttributionFromWindow();
  const body = JSON.stringify({
    eventType: input.eventType,
    eventPayload: input.eventPayload ?? {},
    analyticsContext,
  });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const sent = navigator.sendBeacon(
        "/api/analytics/track",
        new Blob([body], { type: "application/json" })
      );
      if (sent) {
        return;
      }
    } catch {
      // Fall through to fetch below.
    }
  }

  await fetch("/api/analytics/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
    keepalive: true,
  }).catch(() => null);
}
