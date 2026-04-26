export type DefiActivityStatus = "submitted" | "confirmed" | "failed";
export type DefiActivityCategory = "vault" | "market" | "xp";
export type DefiActivityTone = "default" | "positive" | "warning" | "danger" | "info";

export type DefiActivityTransactionRow = {
  status: DefiActivityStatus | string | null;
  action: string | null;
  vault_slug?: string | null;
  market_slug?: string | null;
  asset_symbol: string | null;
  amount_raw: string | null;
  tx_hash: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  failed_at: string | null;
  created_at: string | null;
  error_message: string | null;
};

export type DefiActivityXpEventRow = {
  source_type: string | null;
  source_ref: string | null;
  effective_xp: number | string | null;
  created_at: string | null;
  metadata?: Record<string, unknown> | null;
};

export type DefiActivityItem = {
  id: string;
  category: DefiActivityCategory;
  routeLabel: string;
  actionLabel: string;
  title: string;
  description: string;
  status: DefiActivityStatus;
  tone: DefiActivityTone;
  assetSymbol: string | null;
  amountRaw: string | null;
  txHash: string | null;
  href: string | null;
  timestamp: string;
};

export type DefiActivitySummary = {
  totalItems: number;
  confirmedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  vaultTransactions: number;
  marketTransactions: number;
  xpClaims: number;
  borrowActions: number;
  latestAt: string | null;
};

export type DefiActivityTimeline = {
  summary: DefiActivitySummary;
  items: DefiActivityItem[];
};

const actionLabels: Record<string, string> = {
  deposit: "Deposit",
  withdraw: "Withdraw",
  supply: "Supply",
  "enable-collateral": "Enable collateral",
  borrow: "Borrow",
  repay: "Repay",
};

function safeStatus(value: string | null | undefined): DefiActivityStatus {
  if (value === "confirmed" || value === "failed" || value === "submitted") {
    return value;
  }

  return "submitted";
}

function getTransactionTimestamp(row: DefiActivityTransactionRow) {
  return row.confirmed_at || row.failed_at || row.submitted_at || row.created_at || "";
}

function getTone(params: {
  status: DefiActivityStatus;
  action: string | null | undefined;
}): DefiActivityTone {
  if (params.status === "failed") return "danger";
  if (params.action === "borrow") return "warning";
  if (params.status === "confirmed") return "positive";
  return "info";
}

function formatSourceRef(sourceRef: string) {
  return sourceRef
    .replace(/^defi:/, "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function getXpTitle(row: DefiActivityXpEventRow) {
  const xp = Number(row.effective_xp ?? 0);
  return `Claimed ${Number.isFinite(xp) ? xp : 0} XP`;
}

function getXpDescription(row: DefiActivityXpEventRow) {
  const title = row.metadata?.missionTitle;
  if (typeof title === "string" && title.trim()) {
    return title.trim();
  }

  return row.source_ref ? formatSourceRef(row.source_ref) : "DeFi XP mission";
}

function transactionToItem(
  category: "vault" | "market",
  row: DefiActivityTransactionRow
): DefiActivityItem {
  const status = safeStatus(row.status);
  const action = row.action || "transaction";
  const actionLabel = actionLabels[action] ?? action;
  const txHash = row.tx_hash?.trim() || null;
  const routeLabel = category === "vault" ? "Vault" : "Borrow / lending";
  const targetSlug = category === "vault" ? row.vault_slug : row.market_slug;
  const targetLabel = targetSlug?.replace(/-/g, " ") || "DeFi route";
  const timestamp = getTransactionTimestamp(row);
  const errorText = row.error_message?.trim();

  return {
    id: txHash ? `${category}:${txHash}` : `${category}:${action}:${timestamp}`,
    category,
    routeLabel,
    actionLabel,
    title: `${actionLabel} ${row.asset_symbol || "asset"}`,
    description: errorText
      ? `${targetLabel} / ${errorText}`
      : `${targetLabel} / ${status === "confirmed" ? "confirmed on Base" : status}`,
    status,
    tone: getTone({ status, action }),
    assetSymbol: row.asset_symbol,
    amountRaw: row.amount_raw,
    txHash,
    href: txHash ? `https://basescan.org/tx/${txHash}` : null,
    timestamp,
  };
}

function xpEventToItem(row: DefiActivityXpEventRow): DefiActivityItem {
  const sourceRef = row.source_ref?.trim() || "unknown";
  const timestamp = row.created_at || "";

  return {
    id: `xp:${sourceRef}:${timestamp}`,
    category: "xp",
    routeLabel: "XP",
    actionLabel: "XP claim",
    title: getXpTitle(row),
    description: getXpDescription(row),
    status: "confirmed",
    tone: "positive",
    assetSymbol: null,
    amountRaw: String(row.effective_xp ?? "0"),
    txHash: null,
    href: null,
    timestamp,
  };
}

export function buildDefiActivityTimeline(input: {
  vaultTransactions: DefiActivityTransactionRow[];
  marketTransactions: DefiActivityTransactionRow[];
  xpEvents: DefiActivityXpEventRow[];
}): DefiActivityTimeline {
  const vaultItems = input.vaultTransactions.map((row) => transactionToItem("vault", row));
  const marketItems = input.marketTransactions.map((row) => transactionToItem("market", row));
  const xpItems = input.xpEvents
    .filter((row) => row.source_type === "defi_mission")
    .map(xpEventToItem);
  const items = [...vaultItems, ...marketItems, ...xpItems].sort(
    (left, right) => Date.parse(right.timestamp || "0") - Date.parse(left.timestamp || "0")
  );
  const transactionItems = [...vaultItems, ...marketItems];

  return {
    summary: {
      totalItems: items.length,
      confirmedTransactions: transactionItems.filter((item) => item.status === "confirmed").length,
      pendingTransactions: transactionItems.filter((item) => item.status === "submitted").length,
      failedTransactions: transactionItems.filter((item) => item.status === "failed").length,
      vaultTransactions: vaultItems.length,
      marketTransactions: marketItems.length,
      xpClaims: xpItems.length,
      borrowActions: marketItems.filter((item) => item.actionLabel === "Borrow").length,
      latestAt: items[0]?.timestamp || null,
    },
    items,
  };
}
