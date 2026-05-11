import type { DefiActivityTimeline } from "./defi-activity";
import type { DefiPortfolioRead, DefiPortfolioTone } from "./defi-portfolio";

export type DefiActionConsoleTone = DefiPortfolioTone | "danger";

export type DefiActionConsoleRoute = {
  href: string;
  label: string;
  eyebrow: string;
  detail: string;
  state: string;
  tone: DefiActionConsoleTone;
};

export type DefiActionConsoleMetric = {
  label: string;
  value: string;
  detail: string;
  tone: DefiActionConsoleTone;
};

export type DefiActionConsoleActivity = {
  id: string;
  label: string;
  detail: string;
  status: string;
  tone: DefiActionConsoleTone;
  href: string | null;
};

export type DefiActionConsoleRead = {
  status: "wallet-needed" | "ready" | "attention" | "risk-watch" | "read-error";
  tone: DefiActionConsoleTone;
  kicker: string;
  headline: string;
  description: string;
  primaryAction: {
    href: string;
    label: string;
  };
  walletSignal: string;
  safetySignal: string;
  routeSignal: string;
  metrics: DefiActionConsoleMetric[];
  routes: DefiActionConsoleRoute[];
  activity: DefiActionConsoleActivity[];
  safetyRail: DefiActionConsoleMetric[];
};

export function buildDefiActionConsoleRead(input: {
  walletReady: boolean;
  portfolio: DefiPortfolioRead;
  activity: DefiActivityTimeline;
}): DefiActionConsoleRead {
  const status = getConsoleStatus(input);
  const tone = getConsoleTone(status);
  const primaryAction = getPrimaryAction(input.portfolio, input.activity);
  const hasPending = input.activity.summary.pendingTransactions > 0;
  const hasFailed = input.activity.summary.failedTransactions > 0;

  return {
    status,
    tone,
    kicker: getKicker(status),
    headline: getHeadline(input.portfolio, input.activity),
    description: getDescription(input.portfolio, input.activity),
    primaryAction,
    walletSignal: input.walletReady ? "Wallet linked" : "Wallet needed",
    safetySignal: getSafetySignal(input.portfolio.status, hasFailed),
    routeSignal: hasPending ? "Pending route" : "Routes clear",
    metrics: [
      {
        label: "Wallet",
        value: input.walletReady ? "Linked" : "Needed",
        detail: input.walletReady ? "Live Base reads enabled" : "Connect before route reads",
        tone: input.walletReady ? "positive" : "default",
      },
      {
        label: "Positions",
        value: String(
          input.portfolio.totals.activeVaults + input.portfolio.totals.suppliedMarkets
        ),
        detail: `${input.portfolio.totals.activeVaults} vault / ${input.portfolio.totals.suppliedMarkets} supplied`,
        tone:
          input.portfolio.totals.activeVaults + input.portfolio.totals.suppliedMarkets > 0
            ? "positive"
            : "info",
      },
      {
        label: "Borrow",
        value: String(input.portfolio.totals.borrowedMarkets),
        detail:
          input.portfolio.totals.borrowedMarkets > 0
            ? "Repay and collateral first"
            : "No borrow exposure detected",
        tone: input.portfolio.totals.borrowedMarkets > 0 ? "warning" : "positive",
      },
      {
        label: "Claimable XP",
        value: `${input.portfolio.totals.claimableXp} XP`,
        detail: `${input.portfolio.totals.completedXp} completed XP tracked`,
        tone: input.portfolio.totals.claimableXp > 0 ? "positive" : "info",
      },
    ],
    routes: buildRoutes(input.portfolio),
    activity: input.activity.items.slice(0, 4).map((item) => ({
      id: item.id,
      label: item.title,
      detail: item.description,
      status: item.status,
      tone: normalizeTone(item.tone),
      href: item.href,
    })),
    safetyRail: [
      {
        label: input.portfolio.health.label,
        value: input.portfolio.status === "risk-watch" ? "Watch" : "Clear",
        detail: input.portfolio.health.copy,
        tone: normalizeTone(input.portfolio.health.tone),
      },
      {
        label: "Recent proof",
        value: String(input.activity.summary.totalItems),
        detail: `${input.activity.summary.confirmedTransactions} confirmed / ${input.activity.summary.pendingTransactions} pending`,
        tone: hasFailed ? "danger" : hasPending ? "warning" : "positive",
      },
      {
        label: "Next safe action",
        value: "Queued",
        detail: input.portfolio.nextSafeAction,
        tone,
      },
    ],
  };
}

function getConsoleStatus(input: {
  walletReady: boolean;
  portfolio: DefiPortfolioRead;
  activity: DefiActivityTimeline;
}): DefiActionConsoleRead["status"] {
  if (!input.walletReady || input.portfolio.status === "wallet-needed") return "wallet-needed";
  if (input.portfolio.status === "risk-watch") return "risk-watch";
  if (input.portfolio.status === "read-error") return "read-error";
  if (input.activity.summary.failedTransactions > 0) return "attention";
  return "ready";
}

function getConsoleTone(status: DefiActionConsoleRead["status"]): DefiActionConsoleTone {
  if (status === "risk-watch" || status === "read-error" || status === "attention") {
    return "warning";
  }
  if (status === "ready") return "positive";
  return "default";
}

function getKicker(status: DefiActionConsoleRead["status"]) {
  if (status === "wallet-needed") return "Wallet gate";
  if (status === "risk-watch") return "Risk rail";
  if (status === "read-error") return "Read check";
  if (status === "attention") return "Action review";
  return "Route clear";
}

function getHeadline(portfolio: DefiPortfolioRead, activity: DefiActivityTimeline) {
  if (portfolio.status === "wallet-needed") return "Connect wallet before moving capital.";
  if (portfolio.status === "risk-watch") return "Resolve borrow exposure before growth routes.";
  if (portfolio.status === "read-error") return "Refresh reads before signing the next action.";
  if (portfolio.totals.claimableXp > 0) return "Claim XP before opening a new DeFi move.";
  if (activity.summary.pendingTransactions > 0) return "Wait for pending activity to settle.";
  return "Your DeFi routes are ready for the next move.";
}

function getDescription(portfolio: DefiPortfolioRead, activity: DefiActivityTimeline) {
  if (activity.summary.totalItems > 0) {
    return `${activity.summary.totalItems} recent proof events are connected to this wallet. ${portfolio.nextSafeAction}.`;
  }

  return `${portfolio.description} ${portfolio.nextSafeAction}.`;
}

function getPrimaryAction(portfolio: DefiPortfolioRead, activity: DefiActivityTimeline) {
  if (portfolio.status === "wallet-needed") {
    return { href: "/profile", label: "Connect wallet" };
  }
  if (portfolio.status === "risk-watch") {
    return { href: "/defi/borrow-lending", label: "Open risk rail" };
  }
  if (portfolio.status === "read-error") {
    return { href: "/defi/portfolio", label: "Refresh portfolio" };
  }
  if (portfolio.totals.claimableXp > 0) {
    return { href: "/defi/portfolio", label: "Claim DeFi XP" };
  }
  if (activity.summary.pendingTransactions > 0) {
    return { href: "/defi/activity", label: "Review activity" };
  }
  if (portfolio.totals.activeVaults === 0 && portfolio.totals.suppliedMarkets === 0) {
    return { href: "/defi/vaults", label: "Open first vault" };
  }

  return { href: "/defi/swap", label: "Open swap" };
}

function getSafetySignal(status: DefiPortfolioRead["status"], hasFailed: boolean) {
  if (status === "risk-watch") return "Borrow watch";
  if (status === "read-error" || hasFailed) return "Needs review";
  if (status === "wallet-needed") return "No wallet";
  return "Safety clear";
}

function buildRoutes(portfolio: DefiPortfolioRead): DefiActionConsoleRoute[] {
  return [
    {
      href: "/defi/swap",
      label: "Swap",
      eyebrow: "Route",
      detail: "Move into the right asset before vault or market actions.",
      state: portfolio.status === "risk-watch" ? "Wait" : "Ready",
      tone: portfolio.status === "risk-watch" ? "warning" : "info",
    },
    {
      href: "/defi/vaults",
      label: "Vaults",
      eyebrow: "Yield",
      detail: `${portfolio.totals.activeVaults} active vault positions detected.`,
      state: portfolio.totals.activeVaults > 0 ? "Active" : "Open",
      tone: portfolio.totals.activeVaults > 0 ? "positive" : "default",
    },
    {
      href: "/defi/borrow-lending",
      label: "Borrow / lending",
      eyebrow: "Risk",
      detail: `${portfolio.totals.suppliedMarkets} supplied / ${portfolio.totals.borrowedMarkets} borrowed markets.`,
      state: portfolio.totals.borrowedMarkets > 0 ? "Watch" : "Clear",
      tone: portfolio.totals.borrowedMarkets > 0 ? "warning" : "positive",
    },
    {
      href: "/defi/portfolio",
      label: "Portfolio",
      eyebrow: "Read",
      detail: portfolio.health.copy,
      state: portfolio.health.label,
      tone: normalizeTone(portfolio.health.tone),
    },
    {
      href: "/defi/activity",
      label: "Activity",
      eyebrow: "Proof",
      detail: "Vault, lending, swap and XP history in one wallet timeline.",
      state: "Proof",
      tone: "info",
    },
  ];
}

function normalizeTone(tone: DefiPortfolioTone | "danger" | string): DefiActionConsoleTone {
  if (
    tone === "positive" ||
    tone === "warning" ||
    tone === "danger" ||
    tone === "info" ||
    tone === "default"
  ) {
    return tone;
  }

  return "default";
}
