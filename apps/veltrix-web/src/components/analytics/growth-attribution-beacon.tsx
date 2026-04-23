"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureGrowthAttributionFromWindow } from "@/lib/analytics/attribution";
import {
  trackGrowthEvent,
  type GrowthAnalyticsEventType,
} from "@/lib/analytics/growth-events";

type GrowthAttributionBeaconProps = {
  eventType: GrowthAnalyticsEventType;
  eventPayload?: Record<string, unknown>;
};

export function GrowthAttributionBeacon({
  eventType,
  eventPayload,
}: GrowthAttributionBeaconProps) {
  const pathname = usePathname();

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const dedupeKey = `veltrix-growth:${eventType}:${pathname}:${search}`;

    if (typeof window !== "undefined" && window.sessionStorage.getItem(dedupeKey)) {
      return;
    }

    const analyticsContext = captureGrowthAttributionFromWindow();
    void trackGrowthEvent({
      eventType,
      analyticsContext,
      eventPayload: {
        ...(eventPayload ?? {}),
        pathname,
        search,
      },
    });

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(dedupeKey, "1");
    }
  }, [eventPayload, eventType, pathname]);

  return null;
}
