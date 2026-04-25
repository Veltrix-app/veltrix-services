export type CommercialConversationMode = "demo" | "enterprise";

export type CommercialPlanPresentation = {
  id: "free" | "starter" | "growth" | "enterprise";
  bestFor: string;
  guidance: string;
  upgradeSignal: string;
};

export const commercialPlanPresentation: CommercialPlanPresentation[] = [
  {
    id: "free",
    bestFor: "Testing the operating model with one small live workspace.",
    guidance:
      "Use Free when you want to feel the product, prove first fit, and keep the first launch constrained.",
    upgradeSignal: "Move up when real team coordination or live campaign volume starts to show up.",
  },
  {
    id: "starter",
    bestFor: "A real launch team running campaigns, community rails and first recurring launches.",
    guidance:
      "Starter is the first paid tier for teams that need multiple campaigns, more seats and a cleaner live operating posture.",
    upgradeSignal: "Move up when project count, campaign pressure or team size stops fitting inside a small-team lane.",
  },
  {
    id: "growth",
    bestFor: "Serious operators who need more launch volume, more capacity and richer execution headroom.",
    guidance:
      "Growth is where VYNTRO becomes the daily operating layer for repeat launches, larger teams and heavier execution.",
    upgradeSignal: "Move up when you need custom commercial posture, custom controls or a more guided rollout motion.",
  },
  {
    id: "enterprise",
    bestFor: "Teams that need commercial review, custom limits, buyer review support and higher-touch onboarding.",
    guidance:
      "Enterprise is for custom pricing, stronger rollout help, security review, SSO posture and contracts that do not fit a standard self-serve lane.",
    upgradeSignal: "Use this when launch shape, governance, procurement or security review needs a real conversation.",
  },
];

export const commercialTeamSizeOptions = [
  "1-3 operators",
  "4-10 operators",
  "11-25 operators",
  "26-50 operators",
  "50+ operators",
] as const;

export const commercialUrgencyOptions = [
  "Just researching",
  "This month",
  "Next 30 days",
  "Next 7 days",
  "Urgent launch window",
] as const;

export const commercialLeadStateLabels = {
  new: "New",
  qualified: "Qualified",
  watching: "Watching",
  engaged: "Engaged",
  evaluation: "Evaluation",
  converted: "Converted",
  cooling_off: "Cooling off",
  lost: "Lost",
} as const;

export function resolveConversationMode(input: {
  plan?: string | null;
  intent?: string | null;
}) {
  if (input.plan === "enterprise" || input.intent === "enterprise_review") {
    return "enterprise" as const;
  }

  return "demo" as const;
}

export function getCommercialPlanPresentation(planId: string | null | undefined) {
  return commercialPlanPresentation.find((plan) => plan.id === planId);
}
