export type BorrowLendingRiskTopicSlug =
  | "no-custody"
  | "collateral"
  | "liquidation"
  | "repay"
  | "safe-order";

export type BorrowLendingRiskTone = "positive" | "neutral" | "warning";

export type BorrowLendingRiskTopic = {
  slug: BorrowLendingRiskTopicSlug;
  eyebrow: string;
  title: string;
  summary: string;
  detail: string;
  userAction: string;
  tone: BorrowLendingRiskTone;
};

export type RiskEducationChecklistItem = {
  label: string;
  description: string;
  signal: string;
};

export const borrowLendingRiskTopics: BorrowLendingRiskTopic[] = [
  {
    slug: "no-custody",
    eyebrow: "Wallet control",
    title: "VYNTRO never takes custody",
    summary:
      "Every supply, borrow, repay or withdraw action is signed from the user's own wallet.",
    detail:
      "VYNTRO adds the product layer, proof tracking and education around the market. Funds move only when the wallet signs an on-chain transaction.",
    userAction: "Check the wallet prompt and chain before signing. Never treat a page state as custody.",
    tone: "positive",
  },
  {
    slug: "collateral",
    eyebrow: "Borrow power",
    title: "Collateral creates the borrow lane",
    summary:
      "Borrowing starts after a supplied asset is deliberately enabled as collateral.",
    detail:
      "Collateral is the asset backing the debt. More collateral can increase available credit, while price moves or new debt can reduce credit remaining.",
    userAction: "Supply first, enable collateral second, then keep credit remaining comfortably above danger.",
    tone: "neutral",
  },
  {
    slug: "liquidation",
    eyebrow: "Downside guard",
    title: "Liquidation starts when credit runs out",
    summary:
      "If credit remaining reaches $0 or the account moves into shortfall, collateral can be liquidated by the market.",
    detail:
      "Liquidation risk rises when borrowed value grows, collateral value falls, interest accrues or the position is already close to 0% breathing room.",
    userAction: "Repay debt or add collateral before the position reaches a shortfall state.",
    tone: "warning",
  },
  {
    slug: "repay",
    eyebrow: "Risk reduction",
    title: "Repay is the cleanest safety move",
    summary:
      "Repaying reduces debt, slows liquidation pressure and keeps the position easier to understand.",
    detail:
      "Borrow interest can continue to accrue until the debt is closed. A partial repay can still improve the position before a full exit.",
    userAction: "Use repay before adding new borrow exposure, especially when credit remaining is falling.",
    tone: "positive",
  },
  {
    slug: "safe-order",
    eyebrow: "Operator flow",
    title: "The safest route is sequential",
    summary:
      "The flow should stay simple: supply, enable collateral, borrow small, monitor and repay.",
    detail:
      "VYNTRO does not reward aggressive borrowing. The product should make conservative position management feel like the default path.",
    userAction: "Pause when a step feels unclear; do not borrow just to complete a mission.",
    tone: "neutral",
  },
];

export function getBorrowLendingRiskTopic(slug: BorrowLendingRiskTopicSlug) {
  return borrowLendingRiskTopics.find((topic) => topic.slug === slug) ?? null;
}

export function getRiskEducationChecklist(): RiskEducationChecklistItem[] {
  return [
    {
      label: "Supply first",
      description: "Start with an asset you understand and keep wallet control visible.",
      signal: "No custody",
    },
    {
      label: "Enable collateral deliberately",
      description: "Only turn collateral on when you understand it backs future debt.",
      signal: "Borrow power",
    },
    {
      label: "Borrow small",
      description: "Keep credit remaining high enough to survive price moves and interest.",
      signal: "Breathing room",
    },
    {
      label: "Monitor and repay",
      description: "Repay or add collateral before credit remaining gets close to zero.",
      signal: "Lower risk",
    },
  ];
}

export function getBorrowLendingRiskSummary() {
  return {
    headline: "Understand the position before money moves.",
    copy:
      "Borrow/lending is non-custodial, but it is not passive. Collateral, liquidation and repay behavior should stay visible before every borrow action.",
    primaryAction: "Review risk guide",
  };
}
