export const DEFI_SAFETY_ROUTES = [
  "overview",
  "portfolio",
  "swap",
  "vaults",
  "borrow-lending",
  "activity",
  "risk-guide",
] as const;

export type DefiSafetyRoute = (typeof DEFI_SAFETY_ROUTES)[number];

export type DefiSafetyTone = "positive" | "neutral" | "warning" | "danger";

export type DefiSafetyCheck = {
  label: string;
  copy: string;
  tone: DefiSafetyTone;
};

export type DefiSafetySurface = {
  route: DefiSafetyRoute;
  eyebrow: string;
  headline: string;
  copy: string;
  primaryMove: string;
  tone: DefiSafetyTone;
  checks: DefiSafetyCheck[];
};

export type DefiGlobalSafetyContract = {
  headline: string;
  copy: string;
  invariants: string[];
};

export function getDefiGlobalSafetyContract(): DefiGlobalSafetyContract {
  return {
    headline: "Discovery first, wallet signatures second.",
    copy:
      "VYNTRO never takes custody. The wallet signs every on-chain move, yield is variable and XP is based on verified proof instead of aggressive position size.",
    invariants: [
      "VYNTRO never takes custody of user funds.",
      "The connected wallet signs every approval, deposit, withdraw, supply, borrow, repay or swap.",
      "Yield is variable and never guaranteed.",
      "XP can only follow confirmed proof; it should never reward borrow volume directly.",
      "Borrowing must keep collateral, liquidation risk and repay discipline visible before signing.",
    ],
  };
}

const SAFETY_SURFACES = {
  overview: {
    route: "overview",
    eyebrow: "Safety posture",
    headline: "Choose the route before money moves.",
    copy:
      "The DeFi command center separates discovery, proof and transaction routes so users understand the next safe action before signing.",
    primaryMove: "Review the route, then open the specific DeFi surface.",
    tone: "positive",
    checks: [
      {
        label: "No custody",
        copy: "VYNTRO never takes custody; users keep wallet control across every route.",
        tone: "positive",
      },
      {
        label: "Route separation",
        copy: "Swap, vaults, borrow/lending, portfolio and proof history stay visibly separate.",
        tone: "neutral",
      },
      {
        label: "Proof before XP",
        copy: "XP follows verified activity proof, not vague balances or risky leverage.",
        tone: "positive",
      },
    ],
  },
  portfolio: {
    route: "portfolio",
    eyebrow: "Portfolio safety",
    headline: "Read exposure before adding exposure.",
    copy:
      "Portfolio keeps vaults, supplied markets, borrowed markets, claimable XP and the next safe action in one wallet-scoped read.",
    primaryMove: "Follow the next safe action before opening a new DeFi move.",
    tone: "positive",
    checks: [
      {
        label: "Next safe action",
        copy: "If debt or shortfall exists, repay or add collateral takes priority over new XP moves.",
        tone: "warning",
      },
      {
        label: "Proof scoped",
        copy: "Rows are tied to the verified wallet so proof history does not blur across accounts.",
        tone: "positive",
      },
      {
        label: "Yield is variable",
        copy: "Vault and supply values are reads, not guaranteed returns.",
        tone: "neutral",
      },
    ],
  },
  swap: {
    route: "swap",
    eyebrow: "Swap safety",
    headline: "Review the route before signing.",
    copy:
      "Swaps are non-custodial, but output can move. Confirm provider route, approval target and slippage before signing.",
    primaryMove: "Find route, check slippage and provider, then sign only the expected transaction.",
    tone: "warning",
    checks: [
      {
        label: "Slippage",
        copy: "Keep slippage low; high slippage should trigger a smaller amount or refresh.",
        tone: "warning",
      },
      {
        label: "Approval",
        copy: "ERC-20 swaps can require approval before the swap transaction.",
        tone: "neutral",
      },
      {
        label: "Provider route",
        copy: "0x or Uniswap route details should be checked before signing.",
        tone: "positive",
      },
    ],
  },
  vaults: {
    route: "vaults",
    eyebrow: "Vault safety",
    headline: "Simple deposits, clear withdrawals.",
    copy:
      "Vault missions keep deposit and withdraw flows separate, show approval posture and remind users that yield is variable.",
    primaryMove: "Start small, confirm the vault and keep the withdrawal path visible.",
    tone: "positive",
    checks: [
      {
        label: "Deposit path",
        copy: "ERC-20 deposits may ask for approval before funds move.",
        tone: "neutral",
      },
      {
        label: "Withdraw path",
        copy: "Withdrawable balance should stay visible before users add more vault exposure.",
        tone: "positive",
      },
      {
        label: "Yield is variable",
        copy: "Vault returns depend on the underlying protocol and are never guaranteed by VYNTRO.",
        tone: "warning",
      },
    ],
  },
  "borrow-lending": {
    route: "borrow-lending",
    eyebrow: "Borrow safety",
    headline: "Supply first. Borrow small. Repay early.",
    copy:
      "Borrow/lending is advanced DeFi. Collateral, liquidation risk, credit remaining and repay behavior must stay visible before borrow actions.",
    primaryMove: "Borrow small only after wallet, supply, collateral and credit checks are clear.",
    tone: "warning",
    checks: [
      {
        label: "Collateral",
        copy: "Borrow power starts only after supplied assets are deliberately enabled as collateral.",
        tone: "neutral",
      },
      {
        label: "Liquidation",
        copy: "If credit remaining runs out or shortfall appears, collateral can be liquidated.",
        tone: "danger",
      },
      {
        label: "Repay",
        copy: "Repay lowers debt pressure and should come before adding new borrow exposure.",
        tone: "positive",
      },
    ],
  },
  activity: {
    route: "activity",
    eyebrow: "Proof safety",
    headline: "Trust the timeline, not the memory.",
    copy:
      "Activity proof keeps vault, market, swap and XP records in one wallet-scoped audit trail before rewards scale.",
    primaryMove: "Use confirmed Basescan proof before treating a DeFi action as complete.",
    tone: "positive",
    checks: [
      {
        label: "Confirmed tx",
        copy: "Confirmed on-chain transactions are the safest proof source.",
        tone: "positive",
      },
      {
        label: "Pending states",
        copy: "Pending and failed actions should not unlock XP until proof is clear.",
        tone: "warning",
      },
      {
        label: "Wallet scope",
        copy: "History is scoped to the verified wallet to reduce account mixups.",
        tone: "neutral",
      },
    ],
  },
  "risk-guide": {
    route: "risk-guide",
    eyebrow: "Risk guide",
    headline: "Keep the scary parts understandable.",
    copy:
      "The guide explains wallet control, collateral, liquidation, repay and safe order in short language users can act on.",
    primaryMove: "Read the guide before opening advanced borrow/lending actions.",
    tone: "positive",
    checks: [
      {
        label: "Wallet control",
        copy: "The wallet signs each move and VYNTRO stays non-custodial.",
        tone: "positive",
      },
      {
        label: "Liquidation clarity",
        copy: "Users should understand how debt, price movement and shortfall connect.",
        tone: "warning",
      },
      {
        label: "Safe sequence",
        copy: "Supply, enable collateral, borrow small, monitor and repay.",
        tone: "neutral",
      },
    ],
  },
} satisfies Record<DefiSafetyRoute, DefiSafetySurface>;

export function getDefiSafetySurface(route: DefiSafetyRoute): DefiSafetySurface {
  return SAFETY_SURFACES[route];
}

export function getDefiSafetySurfaces(routes: DefiSafetyRoute[]) {
  return routes.map((route) => getDefiSafetySurface(route));
}
