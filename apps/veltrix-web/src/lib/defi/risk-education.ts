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

export type BorrowPreflightStatus = "blocked" | "setup" | "watch" | "ready";

export type BorrowPreflightMetric = {
  label: string;
  value: string;
};

export type BorrowPreflightRead = {
  status: BorrowPreflightStatus;
  label: string;
  headline: string;
  description: string;
  primaryMove: string;
  metrics: BorrowPreflightMetric[];
};

export type BorrowPreflightInput = {
  walletReady: boolean;
  marketStatus: "ready" | "read-error";
  hasSupplyPosition: boolean;
  collateralEnabled: boolean;
  hasBorrowPosition: boolean;
  accountLiquidityRaw: string;
  accountShortfallRaw: string;
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

export function buildBorrowPreflightRead(input: BorrowPreflightInput): BorrowPreflightRead {
  const liquidity = toSafeBigInt(input.accountLiquidityRaw);
  const shortfall = toSafeBigInt(input.accountShortfallRaw);
  const baseMetrics = (posture: string): BorrowPreflightMetric[] => [
    { label: "Credit remaining", value: formatUsdRiskAmount(liquidity) },
    { label: "Shortfall", value: formatUsdRiskAmount(shortfall) },
    { label: "Posture", value: posture },
  ];

  if (!input.walletReady) {
    return {
      status: "blocked",
      label: "Wallet needed",
      headline: "Connect wallet before borrow risk can be read.",
      description:
        "Borrowing depends on personal collateral and credit remaining, so the wallet must be connected before any safe next move is shown.",
      primaryMove: "Connect wallet",
      metrics: baseMetrics("Unknown"),
    };
  }

  if (input.marketStatus === "read-error") {
    return {
      status: "blocked",
      label: "Read blocked",
      headline: "Market risk read is unavailable.",
      description:
        "Do not continue into borrow actions while the market or account read is stale or unavailable.",
      primaryMove: "Refresh market reads",
      metrics: baseMetrics("Needs read"),
    };
  }

  if (shortfall > BigInt(0)) {
    return {
      status: "blocked",
      label: "Shortfall",
      headline: "Shortfall detected before a new borrow.",
      description:
        "The account is already past the safe borrow lane. Repay debt or add collateral before taking any new exposure.",
      primaryMove: "Repay or add collateral",
      metrics: baseMetrics("Blocked"),
    };
  }

  if (!input.hasSupplyPosition) {
    return {
      status: "setup",
      label: "Supply first",
      headline: "No supplied collateral base detected.",
      description:
        "Borrowing should not start from an empty account. Supply an asset first, then review whether it should become collateral.",
      primaryMove: "Supply before borrow",
      metrics: baseMetrics("Setup"),
    };
  }

  if (!input.collateralEnabled) {
    return {
      status: "setup",
      label: "Collateral needed",
      headline: "Collateral is not enabled yet.",
      description:
        "The supplied asset is visible, but it is not backing borrow power until collateral is deliberately enabled.",
      primaryMove: "Enable collateral",
      metrics: baseMetrics("Setup"),
    };
  }

  if (liquidity <= BigInt(0)) {
    return {
      status: "blocked",
      label: "No credit",
      headline: "No credit remaining is available.",
      description:
        "Borrowing with no credit remaining leaves no breathing room. Add collateral or repay debt before a borrow action.",
      primaryMove: "Add collateral or repay",
      metrics: baseMetrics("Blocked"),
    };
  }

  if (input.hasBorrowPosition) {
    return {
      status: "watch",
      label: "Borrow watch",
      headline: "Borrow exposure is already open.",
      description:
        "Monitor credit remaining and use repay before increasing exposure. Existing debt should stay easier to exit than to expand.",
      primaryMove: "Monitor and repay",
      metrics: baseMetrics("Watch"),
    };
  }

  return {
    status: "ready",
    label: "Ready with caution",
    headline: "Collateral is ready, but borrow should stay small.",
    description:
      "Credit remaining is available, so the safest route is a small borrow with a clear repay plan and room for price movement.",
    primaryMove: "Borrow small",
    metrics: baseMetrics("Caution"),
  };
}

function toSafeBigInt(value: string) {
  try {
    return BigInt(value || "0");
  } catch {
    return BigInt(0);
  }
}

function formatUsdRiskAmount(rawValue: bigint) {
  if (rawValue <= BigInt(0)) {
    return "$0";
  }

  const scale = BigInt(10) ** BigInt(18);
  const whole = rawValue / scale;
  const cents = (rawValue % scale) / (BigInt(10) ** BigInt(16));

  return `$${whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${cents
    .toString()
    .padStart(2, "0")}`;
}
