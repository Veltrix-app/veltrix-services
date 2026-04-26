import type { PublicUserXpAwardSourceType } from "./xp-awards";

export type UserXpAwardResponse = {
  ok: boolean;
  alreadyClaimed?: boolean;
  sourceRef?: string;
  xpAwarded?: number;
  totalXp?: number;
  activeXp?: number;
  level?: number;
  contributionTier?: string;
  error?: string;
};

export async function claimUserXpAward(input: {
  accessToken: string;
  sourceType: PublicUserXpAwardSourceType;
  sourceId: string;
  baseXp: number;
  projectId?: string | null;
  campaignId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<UserXpAwardResponse> {
  const response = await fetch("/api/xp/award", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      baseXp: input.baseXp,
      projectId: input.projectId,
      campaignId: input.campaignId,
      metadata: input.metadata,
    }),
  });
  const payload = (await response.json().catch(() => null)) as UserXpAwardResponse | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "VYNTRO could not issue XP for this action.");
  }

  return payload;
}

export function describeXpAward(payload: UserXpAwardResponse | null, fallback: string) {
  if (!payload) {
    return fallback;
  }

  if (payload.alreadyClaimed) {
    return `${fallback} XP was already credited for this action.`;
  }

  const xpAwarded = Number(payload.xpAwarded ?? 0);
  if (xpAwarded > 0) {
    return `${fallback} +${xpAwarded} XP credited.`;
  }

  return fallback;
}
