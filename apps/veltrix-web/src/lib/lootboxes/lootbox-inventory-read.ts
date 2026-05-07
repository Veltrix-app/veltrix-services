export type LootboxInventoryStatus = "owned" | "pending_review" | "claimed" | "expired";

export type LootboxInventoryAuditRow = {
  id: string;
  action: string;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type LootboxInventoryReadRow = {
  id: string;
  item_type: string;
  rarity: string;
  label: string;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string | null;
  auditTrail?: LootboxInventoryAuditRow[];
};

export type LootboxInventoryClaimAuditItem = {
  id: string;
  auth_user_id: string;
  label: string;
  status: string | null;
};

export type LootboxFulfillmentTimelineStep = {
  label: string;
  state: "complete" | "current" | "pending";
};

export type LootboxFulfillmentEvent = {
  id: string;
  label: string;
  detail: string;
  tone: "default" | "success" | "warning" | "danger";
  note: string | null;
  reference: string | null;
  createdAt: string;
};

export type LootboxFulfillmentNote = {
  note: string;
  reference: string | null;
  createdAt: string;
};

export function buildLootboxInventoryRead(rows: LootboxInventoryReadRow[]) {
  const items = rows
    .map((row) => {
      const canRequestClaim = canRequestLootboxInventoryClaim(row);
      const statusRead = getInventoryStatusRead(row, canRequestClaim);
      const fulfillmentEvents = buildFulfillmentEvents(row.auditTrail);
      const fulfillment = {
        ...statusRead.fulfillment,
        timeline: buildFulfillmentTimeline(row, canRequestClaim),
        events: fulfillmentEvents.slice(0, 3),
        latestNote: getLatestFulfillmentNote(fulfillmentEvents),
      };

      return {
        id: row.id,
        label: row.label || "Lootbox reward",
        itemType: row.item_type || "unknown",
        rarity: row.rarity || "common",
        payloadSummary: summarizeInventoryPayload(row.payload),
        payloadEntries: formatInventoryPayloadEntries(row.payload),
        status: normalizeInventoryStatus(row.status),
        statusLabel: statusRead.label,
        statusTone: statusRead.tone,
        primaryActionLabel: statusRead.primaryActionLabel,
        canRequestClaim,
        fulfillment,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    })
    .sort((left, right) => compareInventoryReadItems(left, right));

  return {
    summary: {
      total: rows.length,
      claimable: items.filter((item) => item.canRequestClaim).length,
      pendingReview: items.filter((item) => item.status === "pending_review").length,
      claimed: items.filter((item) => item.status === "claimed").length,
      highRarity: items.filter((item) => isHighRarity(item.rarity)).length,
      autoApplied: rows.filter((row) => isAutoAppliedInventoryItem(row.item_type)).length,
    },
    items,
  };
}

export function canRequestLootboxInventoryClaim(params: {
  status: string | null | undefined;
  item_type: string | null | undefined;
}) {
  return (
    normalizeInventoryStatus(params.status) === "owned" &&
    !isAutoAppliedInventoryItem(params.item_type)
  );
}

export function buildLootboxInventoryClaimPatch(now = new Date().toISOString()) {
  return {
    status: "pending_review" as const,
    updated_at: now,
  };
}

export function buildLootboxInventoryClaimAuditPayload(params: {
  authUserId: string;
  inventoryItem: LootboxInventoryClaimAuditItem;
}) {
  return {
    auth_user_id: params.authUserId,
    project_id: null,
    source_table: "user_inventory",
    source_id: params.inventoryItem.id,
    action: "lootbox_inventory_claim_requested",
    summary: `Member requested fulfillment for ${params.inventoryItem.label}.`,
    metadata: {
      inventoryItemId: params.inventoryItem.id,
      targetAuthUserId: params.inventoryItem.auth_user_id,
      previousStatus: params.inventoryItem.status ?? "owned",
      nextStatus: "pending_review",
      origin: "webapp",
    },
  };
}

function getInventoryStatusRead(
  row: LootboxInventoryReadRow,
  canRequestClaim: boolean
) {
  const status = normalizeInventoryStatus(row.status);

  if (isAutoAppliedInventoryItem(row.item_type) && status === "owned") {
    return {
      label: "Applied",
      tone: "success" as const,
      primaryActionLabel: "Refund applied",
      fulfillment: {
        label: "Auto-applied",
        nextStep: "Shard refund was applied instantly.",
      },
    };
  }

  if (canRequestClaim) {
    return {
      label: "Ready to claim",
      tone: "success" as const,
      primaryActionLabel: "Request fulfillment",
      fulfillment: {
        label: "Ready for operator queue",
        nextStep: "Send this reward to the operator queue when you are ready.",
      },
    };
  }

  switch (status) {
    case "pending_review":
      return {
        label: "In review",
        tone: "warning" as const,
        primaryActionLabel: "Queued",
        fulfillment: {
          label: "Operator review",
          nextStep: "VYNTRO operators are validating this reward before fulfillment.",
        },
      };
    case "claimed":
      return {
        label: "Claimed",
        tone: "success" as const,
        primaryActionLabel: "Fulfilled",
        fulfillment: {
          label: "Fulfilled",
          nextStep: "Reward has been fulfilled.",
        },
      };
    case "expired":
      return {
        label: "Expired",
        tone: "danger" as const,
        primaryActionLabel: "Closed",
        fulfillment: {
          label: "Closed",
          nextStep: "This reward is no longer available for fulfillment.",
        },
      };
    case "owned":
    default:
      return {
        label: "Stored",
        tone: "default" as const,
        primaryActionLabel: "In vault",
        fulfillment: {
          label: "Stored in vault",
          nextStep: "Reward is stored in your inventory vault.",
        },
      };
  }
}

function buildFulfillmentTimeline(
  row: LootboxInventoryReadRow,
  canRequestClaim: boolean
): LootboxFulfillmentTimelineStep[] {
  const status = normalizeInventoryStatus(row.status);

  if (isAutoAppliedInventoryItem(row.item_type) && status === "owned") {
    return [
      { label: "Unlocked", state: "complete" },
      { label: "Applied", state: "complete" },
    ];
  }

  switch (status) {
    case "pending_review":
      return [
        { label: "Unlocked", state: "complete" },
        { label: "Queued", state: "current" },
        { label: "Fulfilled", state: "pending" },
      ];
    case "claimed":
      return [
        { label: "Unlocked", state: "complete" },
        { label: "Queued", state: "complete" },
        { label: "Fulfilled", state: "complete" },
      ];
    case "expired":
      return [
        { label: "Unlocked", state: "complete" },
        { label: "Queued", state: "complete" },
        { label: "Closed", state: "complete" },
      ];
    case "owned":
    default:
      return [
        { label: "Unlocked", state: "complete" },
        { label: canRequestClaim ? "Ready" : "Stored", state: "current" },
        { label: "Fulfilled", state: "pending" },
      ];
  }
}

function buildFulfillmentEvents(
  auditTrail: LootboxInventoryAuditRow[] | null | undefined
): LootboxFulfillmentEvent[] {
  return [...(auditTrail ?? [])]
    .map(formatFulfillmentEvent)
    .filter((event): event is LootboxFulfillmentEvent => Boolean(event))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function formatFulfillmentEvent(row: LootboxInventoryAuditRow) {
  const metadata = normalizeAuditMetadata(row.metadata);
  const note = readAuditString(metadata.note);
  const reference = readAuditString(metadata.reference);
  const summary = typeof row.summary === "string" && row.summary.trim() ? row.summary.trim() : null;

  switch (row.action) {
    case "lootbox_inventory_claim_requested":
      return {
        id: row.id,
        label: "Claim requested",
        detail: summary ?? "Member moved this reward into operator review.",
        tone: "warning" as const,
        note: null,
        reference: null,
        createdAt: row.created_at,
      };
    case "lootbox_inventory_note_added":
      return {
        id: row.id,
        label: "Operator note",
        detail: note ?? summary ?? "Operator added a fulfillment update.",
        tone: "default" as const,
        note,
        reference,
        createdAt: row.created_at,
      };
    case "lootbox_inventory_status_changed": {
      const nextStatus = normalizeInventoryStatus(readAuditString(metadata.nextStatus));
      return {
        id: row.id,
        label: getFulfillmentStatusEventLabel(nextStatus),
        detail: summary ?? `Reward moved to ${getFulfillmentStatusEventLabel(nextStatus).toLowerCase()}.`,
        tone: getFulfillmentStatusEventTone(nextStatus),
        note,
        reference,
        createdAt: row.created_at,
      };
    }
    default:
      return null;
  }
}

function getLatestFulfillmentNote(
  events: LootboxFulfillmentEvent[]
): LootboxFulfillmentNote | null {
  const event = events.find((item) => item.note || item.reference);
  if (!event?.note) {
    return null;
  }

  return {
    note: event.note,
    reference: event.reference,
    createdAt: event.createdAt,
  };
}

function getFulfillmentStatusEventLabel(status: LootboxInventoryStatus) {
  switch (status) {
    case "pending_review":
      return "Queued for review";
    case "claimed":
      return "Fulfilled";
    case "expired":
      return "Closed";
    case "owned":
    default:
      return "Returned to vault";
  }
}

function getFulfillmentStatusEventTone(status: LootboxInventoryStatus) {
  switch (status) {
    case "claimed":
      return "success" as const;
    case "pending_review":
      return "warning" as const;
    case "expired":
      return "danger" as const;
    case "owned":
    default:
      return "default" as const;
  }
}

function compareInventoryReadItems(
  left: ReturnType<typeof buildLootboxInventoryRead>["items"][number],
  right: ReturnType<typeof buildLootboxInventoryRead>["items"][number]
) {
  const leftPriority = getInventoryReadPriority(left.status, left.canRequestClaim, left.itemType);
  const rightPriority = getInventoryReadPriority(
    right.status,
    right.canRequestClaim,
    right.itemType
  );

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function getInventoryReadPriority(
  status: LootboxInventoryStatus,
  canRequestClaim: boolean,
  itemType: string
) {
  if (status === "pending_review") {
    return 0;
  }

  if (canRequestClaim) {
    return 1;
  }

  if (status === "owned" && isAutoAppliedInventoryItem(itemType)) {
    return 2;
  }

  if (status === "claimed") {
    return 3;
  }

  if (status === "expired") {
    return 4;
  }

  return 5;
}

function normalizeInventoryStatus(status: string | null | undefined): LootboxInventoryStatus {
  switch (status) {
    case "pending_review":
    case "claimed":
    case "expired":
    case "owned":
      return status;
    default:
      return "owned";
  }
}

function isAutoAppliedInventoryItem(itemType: string | null | undefined) {
  return itemType === "shard_refund_percent";
}

function isHighRarity(rarity: string) {
  return ["legendary", "mythic"].includes(rarity.toLowerCase());
}

function summarizeInventoryPayload(payload: Record<string, unknown>) {
  if (!payload || Object.keys(payload).length === 0) {
    return "No payload";
  }

  if (typeof payload.title === "string") {
    return `Title: ${payload.title}`;
  }

  if (typeof payload.cosmetic === "string") {
    return `Cosmetic: ${payload.cosmetic}`;
  }

  if (typeof payload.refundPercent === "number" || typeof payload.refundPercent === "string") {
    return `Refund: ${payload.refundPercent}%`;
  }

  if (typeof payload.uses === "number" || typeof payload.uses === "string") {
    return `Uses: ${payload.uses}`;
  }

  if (typeof payload.window === "string") {
    return `Window: ${payload.window}`;
  }

  const [key, value] = Object.entries(payload)[0] ?? ["payload", "available"];
  return `${formatPayloadLabel(key)}: ${formatPayloadValue(value)}`;
}

function formatInventoryPayloadEntries(payload: Record<string, unknown>) {
  if (!payload || Object.keys(payload).length === 0) {
    return [{ label: "Payload", value: "No payload" }];
  }

  return Object.entries(payload).map(([label, value]) => ({
    label: formatPayloadLabel(label),
    value: formatPayloadValue(value),
  }));
}

function formatPayloadLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPayloadValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} items`;
  }

  if (value && typeof value === "object") {
    return "Configured";
  }

  return "Available";
}

function normalizeAuditMetadata(value: Record<string, unknown> | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function readAuditString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
