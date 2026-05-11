type RaidVerificationRow = {
  source_provider: string | null;
  source_url: string | null;
  source_external_id: string | null;
};

export type RaidAutoVerificationRequirement =
  | {
      required: true;
      provider: "x";
      sourcePostId: string;
      sourceUrl: string | null;
    }
  | {
      required: false;
      reason: string;
    };

export type RaidAutoVerificationPayload =
  | {
      ok: true;
      status: "approved" | "pending";
      message?: string;
      evidencePostId?: string;
    }
  | {
      ok?: false;
      status?: string;
      error?: string;
      message?: string;
    };

function extractXPostIdFromUrl(value: string | null) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (hostname !== "x.com" && hostname !== "twitter.com") {
      return "";
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 3 || parts[1] !== "status") {
      return "";
    }

    return /^[0-9]+$/.test(parts[2] ?? "") ? parts[2] : "";
  } catch {
    return "";
  }
}

export function getRaidAutoVerificationRequirement(
  raid: RaidVerificationRow
): RaidAutoVerificationRequirement {
  const provider = (raid.source_provider ?? "").toLowerCase();
  const sourceUrl = raid.source_url ?? null;
  const postId =
    typeof raid.source_external_id === "string" && /^[0-9]+$/.test(raid.source_external_id.trim())
      ? raid.source_external_id.trim()
      : extractXPostIdFromUrl(sourceUrl);
  const xBacked =
    provider.includes("x") ||
    provider.includes("twitter") ||
    Boolean(extractXPostIdFromUrl(sourceUrl));

  if (xBacked && postId) {
    return {
      required: true,
      provider: "x",
      sourcePostId: postId,
      sourceUrl,
    };
  }

  return {
    required: false,
    reason:
      "This raid does not have automatic verification configured yet. VYNTRO will not award XP or shards from self confirmation.",
  };
}

export function getRaidAutoVerificationUrl(communityBotUrl: string) {
  return `${communityBotUrl.replace(/\/+$/, "")}/webhooks/x/verify-raid`;
}

export function isApprovedRaidVerification(payload: RaidAutoVerificationPayload | null) {
  return Boolean(payload?.ok && payload.status === "approved");
}
