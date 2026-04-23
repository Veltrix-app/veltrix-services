export type BillingPlanKey = "free" | "starter" | "growth" | "enterprise";

export type BillingLimitKey =
  | "projects"
  | "campaigns"
  | "quests"
  | "raids"
  | "providers"
  | "seats";

export type BillingUsagePressure =
  | "comfortable"
  | "watching"
  | "upgrade_recommended"
  | "blocked";

export const BILLING_USAGE_THRESHOLDS = {
  info: 70,
  upgrade: 85,
  block: 100,
} as const;

export const CHECKOUT_ELIGIBLE_PLANS: BillingPlanKey[] = ["starter", "growth"];

export function isCheckoutEligiblePlan(planId: string): planId is "starter" | "growth" {
  return CHECKOUT_ELIGIBLE_PLANS.includes(planId as "starter" | "growth");
}

export function resolveNextSelfServePlan(planId: BillingPlanKey | string) {
  switch (planId) {
    case "free":
      return "starter" as const;
    case "starter":
      return "growth" as const;
    default:
      return null;
  }
}

export function calculateUsagePercent(current: number, limit: number) {
  if (limit <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((current / limit) * 100)));
}

export function resolveUsagePressure(current: number, limit: number): BillingUsagePressure {
  const percent = calculateUsagePercent(current, limit);

  if (percent >= BILLING_USAGE_THRESHOLDS.block) {
    return "blocked";
  }

  if (percent >= BILLING_USAGE_THRESHOLDS.upgrade) {
    return "upgrade_recommended";
  }

  if (percent >= BILLING_USAGE_THRESHOLDS.info) {
    return "watching";
  }

  return "comfortable";
}

export function resolveUpgradeBlocker(input: {
  currentPlanId: BillingPlanKey | string;
  limitKey: BillingLimitKey;
  current: number;
  limit: number;
  enterpriseManaged?: boolean;
}) {
  const nextPlanId = resolveNextSelfServePlan(input.currentPlanId);
  const usagePercent = calculateUsagePercent(input.current, input.limit);
  const pressure = resolveUsagePressure(input.current, input.limit);

  return {
    limitKey: input.limitKey,
    usagePercent,
    pressure,
    nextPlanId,
    canCheckout:
      !input.enterpriseManaged &&
      !!nextPlanId &&
      isCheckoutEligiblePlan(nextPlanId),
  };
}
