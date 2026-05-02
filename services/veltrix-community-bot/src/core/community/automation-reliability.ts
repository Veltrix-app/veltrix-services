export const AUTOMATION_RUN_LOCK_MINUTES = 10;
export const AUTOMATION_STALE_RUN_MINUTES = 15;
export const AUTOMATION_RETRY_BACKOFF_MINUTES = [5, 15, 60, 180, 360] as const;

export type AutomationFailureCode =
  | "missing_configuration"
  | "provider_unavailable"
  | "rate_limited"
  | "schema_mismatch"
  | "x_api_auth"
  | "x_api_billing"
  | "x_api_permissions"
  | "transient_provider_error"
  | "unknown_failure";

export type AutomationReliabilityStatus = "healthy" | "retry_scheduled" | "needs_attention";

export type AutomationFailureClassification = {
  code: AutomationFailureCode;
  retryable: boolean;
  ownerSummary: string;
};

export type AutomationReliabilityState = {
  status: AutomationReliabilityStatus;
  failureCount: number;
  lastFailureCode: AutomationFailureCode | null;
  lastFailureAt: string | null;
  lastFailureSummary: string | null;
  nextRetryAt: string | null;
  retryable: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeFailureCode(value: unknown): AutomationFailureCode | null {
  const code = readString(value);
  if (
    code === "missing_configuration" ||
    code === "provider_unavailable" ||
    code === "rate_limited" ||
    code === "schema_mismatch" ||
    code === "x_api_auth" ||
    code === "x_api_billing" ||
    code === "x_api_permissions" ||
    code === "transient_provider_error" ||
    code === "unknown_failure"
  ) {
    return code;
  }

  return null;
}

function addMinutes(iso: string, minutes: number) {
  const date = new Date(iso);
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

export function getReadableAutomationError(error: unknown) {
  return error instanceof Error ? error.message : "Community automation execution failed.";
}

export function classifyAutomationError(error: unknown): AutomationFailureClassification {
  const message = getReadableAutomationError(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("column ") || normalized.includes("schema cache") || normalized.includes("not-null constraint")) {
    return {
      code: "schema_mismatch",
      retryable: false,
      ownerSummary: "The database schema is not aligned with the automation code. Run the latest migration before retrying.",
    };
  }

  if (normalized.includes("x api request failed with 402")) {
    return {
      code: "x_api_billing",
      retryable: false,
      ownerSummary: "X API credits or pay-per-use billing are missing for the app behind X_API_BEARER_TOKEN.",
    };
  }

  if (normalized.includes("x api request failed with 401")) {
    return {
      code: "x_api_auth",
      retryable: false,
      ownerSummary: "The X API bearer token is invalid or expired. Regenerate X_API_BEARER_TOKEN.",
    };
  }

  if (normalized.includes("x api request failed with 403")) {
    return {
      code: "x_api_permissions",
      retryable: false,
      ownerSummary: "The X API app is missing the required read permissions for tweet-to-raid automation.",
    };
  }

  if (normalized.includes("429") || normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return {
      code: "rate_limited",
      retryable: true,
      ownerSummary: "A provider rate limit was hit. VYNTRO will retry after a cooldown.",
    };
  }

  if (
    normalized.includes("not configured") ||
    normalized.includes("missing ") ||
    normalized.includes("no active ") ||
    normalized.includes("no connected ") ||
    normalized.includes("target channel") ||
    normalized.includes("target chat")
  ) {
    return {
      code: "missing_configuration",
      retryable: false,
      ownerSummary: "This automation needs project configuration before it can run reliably.",
    };
  }

  if (
    normalized.includes("not connected yet") ||
    normalized.includes("could not be reached") ||
    normalized.includes("temporarily unavailable")
  ) {
    return {
      code: "provider_unavailable",
      retryable: true,
      ownerSummary: "The provider is temporarily unavailable. VYNTRO will retry shortly.",
    };
  }

  if (
    normalized.includes("timeout") ||
    normalized.includes("fetch failed") ||
    normalized.includes("econn") ||
    normalized.includes("etimedout") ||
    normalized.includes("socket hang up") ||
    normalized.includes("5xx") ||
    normalized.includes(" 500") ||
    normalized.includes(" 502") ||
    normalized.includes(" 503") ||
    normalized.includes(" 504")
  ) {
    return {
      code: "transient_provider_error",
      retryable: true,
      ownerSummary: "A temporary network or provider failure happened. VYNTRO will retry automatically.",
    };
  }

  return {
    code: "unknown_failure",
    retryable: false,
    ownerSummary: "The automation failed unexpectedly and needs review before schedule retries it.",
  };
}

export function getAutomationReliabilityState(config: Record<string, unknown> | null | undefined): AutomationReliabilityState {
  const reliability = asRecord(asRecord(config).reliability);
  const status = readString(reliability.status);
  const normalizedStatus: AutomationReliabilityStatus =
    status === "retry_scheduled" || status === "needs_attention" ? status : "healthy";

  return {
    status: normalizedStatus,
    failureCount: Math.max(0, readNumber(reliability.failureCount)),
    lastFailureCode: normalizeFailureCode(reliability.lastFailureCode),
    lastFailureAt: readString(reliability.lastFailureAt),
    lastFailureSummary: readString(reliability.lastFailureSummary),
    nextRetryAt: readString(reliability.nextRetryAt),
    retryable: reliability.retryable === true,
  };
}

export function buildAutomationFailureReliabilityState(input: {
  config: Record<string, unknown> | null | undefined;
  failure: AutomationFailureClassification;
  nowIso: string;
  summary?: string;
}) {
  const config = { ...asRecord(input.config) };
  const previous = getAutomationReliabilityState(config);
  const failureCount = previous.failureCount + 1;
  const retryDelay = AUTOMATION_RETRY_BACKOFF_MINUTES[
    Math.min(failureCount - 1, AUTOMATION_RETRY_BACKOFF_MINUTES.length - 1)
  ];
  const nextRetryAt = input.failure.retryable ? addMinutes(input.nowIso, retryDelay) : null;

  config.reliability = {
    status: input.failure.retryable ? "retry_scheduled" : "needs_attention",
    failureCount,
    lastFailureCode: input.failure.code,
    lastFailureAt: input.nowIso,
    lastFailureSummary: input.summary ?? input.failure.ownerSummary,
    nextRetryAt,
    retryable: input.failure.retryable,
  };

  return {
    config,
    lastResult: "failed" as const,
    errorCode: input.failure.code,
    nextRunAt: nextRetryAt,
  };
}

export function clearAutomationReliabilityState<T extends Record<string, unknown>>(
  config: T | null | undefined
) {
  return {
    ...asRecord(config),
    reliability: {
      status: "healthy",
      failureCount: 0,
      lastFailureCode: null,
      lastFailureAt: null,
      lastFailureSummary: null,
      nextRetryAt: null,
      retryable: false,
    },
  } as T & { reliability: AutomationReliabilityState };
}

export function isAutomationRetryDue(input: {
  config: Record<string, unknown> | null | undefined;
  lastResult?: "success" | "failed" | "skipped" | null;
  nowIso?: string;
}) {
  if (input.lastResult !== "failed") {
    return false;
  }

  const state = getAutomationReliabilityState(input.config);
  if (state.status !== "retry_scheduled" || !state.nextRetryAt) {
    return false;
  }

  const now = new Date(input.nowIso ?? new Date().toISOString()).getTime();
  const retryAt = new Date(state.nextRetryAt).getTime();
  return Number.isFinite(now) && Number.isFinite(retryAt) && retryAt <= now;
}

export function getAutomationRunLockDecision(input: {
  runningStartedAt?: string | null;
  nowIso?: string;
}) {
  if (!input.runningStartedAt) {
    return { status: "available" as const };
  }

  const now = new Date(input.nowIso ?? new Date().toISOString()).getTime();
  const startedAt = new Date(input.runningStartedAt).getTime();
  if (!Number.isFinite(now) || !Number.isFinite(startedAt)) {
    return { status: "stale" as const };
  }

  const ageMinutes = (now - startedAt) / 60_000;
  if (ageMinutes >= AUTOMATION_STALE_RUN_MINUTES) {
    return { status: "stale" as const, ageMinutes };
  }

  if (ageMinutes < AUTOMATION_RUN_LOCK_MINUTES) {
    return { status: "locked" as const, ageMinutes };
  }

  return { status: "stale" as const, ageMinutes };
}

export function resolveAutomationCompletionStatus(input: {
  deliveries?: number | null;
  summary?: string | null;
}) {
  const summary = input.summary?.toLowerCase() ?? "";
  const deliveries = input.deliveries ?? 0;
  const noContent =
    summary.includes("no active campaign") ||
    summary.includes("no live raid") ||
    summary.includes("no newcomer") ||
    summary.includes("no comeback") ||
    summary.includes("no community targets") ||
    summary.includes("no targets");

  return deliveries === 0 && noContent ? ("skipped" as const) : ("success" as const);
}
