import type { NextRequest } from "next/server";

export const GROWTH_ATTRIBUTION_COOKIE = "veltrix_growth_attribution_v1";
const GROWTH_ATTRIBUTION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export type GrowthAttributionTouch = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
  referrer: string | null;
  landingPath: string | null;
  capturedAt: string;
};

export type GrowthAnalyticsContext = {
  sessionId: string;
  anonymousId: string;
  firstTouch: GrowthAttributionTouch | null;
  latestTouch: GrowthAttributionTouch | null;
};

function sanitizeNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeTouch(value: unknown): GrowthAttributionTouch | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const capturedAt =
    sanitizeNullableString(record.capturedAt) ?? new Date().toISOString();

  return {
    source: sanitizeNullableString(record.source),
    medium: sanitizeNullableString(record.medium),
    campaign: sanitizeNullableString(record.campaign),
    term: sanitizeNullableString(record.term),
    content: sanitizeNullableString(record.content),
    referrer: sanitizeNullableString(record.referrer),
    landingPath: sanitizeNullableString(record.landingPath),
    capturedAt,
  };
}

function sanitizeContext(value: unknown): GrowthAnalyticsContext | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const sessionId = sanitizeNullableString(record.sessionId);
  const anonymousId = sanitizeNullableString(record.anonymousId);

  if (!sessionId || !anonymousId) {
    return null;
  }

  return {
    sessionId,
    anonymousId,
    firstTouch: sanitizeTouch(record.firstTouch),
    latestTouch: sanitizeTouch(record.latestTouch),
  };
}

function readCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  return match ? match.slice(prefix.length) : null;
}

function writeCookieValue(name: string, value: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${value}; Path=/; Max-Age=${GROWTH_ATTRIBUTION_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function buildCurrentTouchFromWindow(): GrowthAttributionTouch | null {
  if (typeof window === "undefined") {
    return null;
  }

  const currentUrl = new URL(window.location.href);
  const searchParams = currentUrl.searchParams;
  const landingPath = `${currentUrl.pathname}${currentUrl.search}`;

  return {
    source: sanitizeNullableString(searchParams.get("utm_source")),
    medium: sanitizeNullableString(searchParams.get("utm_medium")),
    campaign: sanitizeNullableString(searchParams.get("utm_campaign")),
    term: sanitizeNullableString(searchParams.get("utm_term")),
    content: sanitizeNullableString(searchParams.get("utm_content")),
    referrer: sanitizeNullableString(document.referrer),
    landingPath,
    capturedAt: new Date().toISOString(),
  };
}

function ensureClientIdentifier(existingValue: string | null | undefined) {
  if (existingValue && existingValue.trim().length > 0) {
    return existingValue;
  }

  return crypto.randomUUID();
}

export function parseGrowthAttributionCookieValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(value);
    return sanitizeContext(JSON.parse(decoded));
  } catch {
    return null;
  }
}

export function loadStoredGrowthAttribution() {
  return parseGrowthAttributionCookieValue(readCookieValue(GROWTH_ATTRIBUTION_COOKIE));
}

export function captureGrowthAttributionFromWindow() {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = loadStoredGrowthAttribution();
  const currentTouch = buildCurrentTouchFromWindow();
  const nextContext: GrowthAnalyticsContext = {
    sessionId: ensureClientIdentifier(existing?.sessionId),
    anonymousId: ensureClientIdentifier(existing?.anonymousId),
    firstTouch: existing?.firstTouch ?? currentTouch,
    latestTouch: currentTouch ?? existing?.latestTouch ?? null,
  };

  writeCookieValue(
    GROWTH_ATTRIBUTION_COOKIE,
    encodeURIComponent(JSON.stringify(nextContext))
  );

  return nextContext;
}

export function readGrowthAnalyticsContextFromRequest(request: NextRequest) {
  return parseGrowthAttributionCookieValue(
    request.cookies.get(GROWTH_ATTRIBUTION_COOKIE)?.value ?? null
  );
}
