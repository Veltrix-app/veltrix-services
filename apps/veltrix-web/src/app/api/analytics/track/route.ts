import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  readGrowthAnalyticsContextFromRequest,
  type GrowthAnalyticsContext,
} from "@/lib/analytics/attribution";

const allowedEventTypes = new Set([
  "anonymous_visit",
  "pricing_view",
  "signup_started",
  "signup_completed",
  "workspace_created",
  "first_project_created",
  "provider_connected",
  "first_campaign_live",
  "checkout_started",
  "paid_converted",
  "renewal_succeeded",
  "renewal_failed",
  "expanded",
  "downgraded",
  "churned",
  "member_joined",
  "member_completed_first_quest",
  "member_returned",
  "reward_claimed",
]);

const funnelStageByEventType: Partial<Record<string, string>> = {
  anonymous_visit: "anonymous_visit",
  pricing_view: "pricing_view",
  signup_started: "signup_started",
  signup_completed: "signup_completed",
  workspace_created: "workspace_created",
  first_project_created: "first_project_created",
  provider_connected: "first_provider_connected",
  first_campaign_live: "first_campaign_live",
  checkout_started: "checkout_started",
  paid_converted: "paid_converted",
  expanded: "expanded",
  downgraded: "downgraded",
  churned: "churned",
};

function sanitizeNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTouch(touch: GrowthAnalyticsContext["firstTouch"]) {
  if (!touch) {
    return null;
  }

  return {
    source: sanitizeNullableString(touch.source),
    medium: sanitizeNullableString(touch.medium),
    campaign: sanitizeNullableString(touch.campaign),
    term: sanitizeNullableString(touch.term),
    content: sanitizeNullableString(touch.content),
    referrer: sanitizeNullableString(touch.referrer),
    landingPath: sanitizeNullableString(touch.landingPath),
    capturedAt: sanitizeNullableString(touch.capturedAt),
  };
}

async function refreshGrowthFunnelStageMetric(params: {
  supabase: ReturnType<typeof createSupabaseServiceClient>;
  eventType: string;
}) {
  const funnelStage = funnelStageByEventType[params.eventType];
  if (!funnelStage) {
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const usesDistinctAccounts = new Set([
    "workspace_created",
    "first_project_created",
    "provider_connected",
    "first_campaign_live",
    "paid_converted",
    "expanded",
    "downgraded",
    "churned",
  ]).has(params.eventType);

  const { data, error } = await params.supabase
    .from("growth_analytics_events")
    .select(usesDistinctAccounts ? "customer_account_id" : "id")
    .gte("occurred_at", `${today}T00:00:00.000Z`)
    .lt("occurred_at", `${today}T23:59:59.999Z`)
    .eq("event_type", params.eventType);

  if (error) {
    throw new Error(error.message || "Failed to refresh growth funnel stage metric.");
  }

  const metricValue = usesDistinctAccounts
    ? new Set(
        ((data ?? []) as Array<{ customer_account_id?: string | null }>)
          .map((row) => row.customer_account_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      ).size
    : (data ?? []).length;

  const upsertResult = await params.supabase.from("growth_funnel_snapshots").upsert(
    {
      snapshot_date: today,
      funnel_stage: funnelStage,
      metric_value: metricValue,
      conversion_rate: null,
      metadata: {
        source: "event_sync",
        eventType: params.eventType,
      },
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "snapshot_date,funnel_stage",
    }
  );

  if (upsertResult.error) {
    throw new Error(upsertResult.error.message || "Failed to upsert growth funnel metric.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          eventType?: string;
          eventPayload?: Record<string, unknown>;
          analyticsContext?: GrowthAnalyticsContext | null;
        }
      | null;

    const eventType = sanitizeNullableString(body?.eventType);
    if (!eventType || !allowedEventTypes.has(eventType)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unsupported growth analytics event type.",
        },
        { status: 400 }
      );
    }

    const analyticsContext =
      body?.analyticsContext ?? readGrowthAnalyticsContextFromRequest(request);
    const firstTouch = normalizeTouch(analyticsContext?.firstTouch ?? null);
    const latestTouch = normalizeTouch(analyticsContext?.latestTouch ?? null);
    const supabase = createSupabaseServiceClient();

    const insertResult = await supabase.from("growth_analytics_events").insert({
      event_type: eventType,
      event_source: "webapp",
      session_id: sanitizeNullableString(analyticsContext?.sessionId),
      anonymous_id: sanitizeNullableString(analyticsContext?.anonymousId),
      utm_source: latestTouch?.source ?? null,
      utm_medium: latestTouch?.medium ?? null,
      utm_campaign: latestTouch?.campaign ?? null,
      utm_term: latestTouch?.term ?? null,
      utm_content: latestTouch?.content ?? null,
      referrer: latestTouch?.referrer ?? null,
      landing_path: latestTouch?.landingPath ?? null,
      first_touch_source: firstTouch?.source ?? null,
      first_touch_medium: firstTouch?.medium ?? null,
      first_touch_campaign: firstTouch?.campaign ?? null,
      first_touch_term: firstTouch?.term ?? null,
      first_touch_content: firstTouch?.content ?? null,
      first_touch_referrer: firstTouch?.referrer ?? null,
      first_touch_landing_path: firstTouch?.landingPath ?? null,
      first_touch_captured_at: firstTouch?.capturedAt ?? null,
      latest_touch_source: latestTouch?.source ?? null,
      latest_touch_medium: latestTouch?.medium ?? null,
      latest_touch_campaign: latestTouch?.campaign ?? null,
      latest_touch_term: latestTouch?.term ?? null,
      latest_touch_content: latestTouch?.content ?? null,
      latest_touch_referrer: latestTouch?.referrer ?? null,
      latest_touch_landing_path: latestTouch?.landingPath ?? null,
      latest_touch_captured_at: latestTouch?.capturedAt ?? null,
      event_payload:
        body?.eventPayload && typeof body.eventPayload === "object"
          ? body.eventPayload
          : {},
    });

    if (insertResult.error) {
      throw new Error(insertResult.error.message || "Failed to write growth analytics event.");
    }

    await refreshGrowthFunnelStageMetric({
      supabase,
      eventType,
    });

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Growth analytics track request failed.",
      },
      { status: 500 }
    );
  }
}
