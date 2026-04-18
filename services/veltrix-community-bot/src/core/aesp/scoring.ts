import type { SupportedOnchainEventType } from "../../types/aesp.js";

const ACTION_MULTIPLIER_BY_EVENT: Record<SupportedOnchainEventType, number> = {
  buy: 1.2,
  hold: 0.7,
  transfer_in: 0.5,
  transfer_out: 0.1,
  stake: 1.35,
  unstake: 0.2,
  lp_add: 1.4,
  lp_remove: 0.2,
  contract_call: 1,
};

export function getDefaultBaseValue(eventType: SupportedOnchainEventType, usdValue?: number | null) {
  if (typeof usdValue === "number" && Number.isFinite(usdValue) && usdValue > 0) {
    return usdValue;
  }

  switch (eventType) {
    case "buy":
      return 25;
    case "stake":
      return 30;
    case "lp_add":
      return 35;
    case "hold":
      return 10;
    case "contract_call":
      return 15;
    case "transfer_in":
      return 8;
    case "transfer_out":
      return 2;
    case "unstake":
      return 4;
    case "lp_remove":
      return 3;
    default:
      return 10;
  }
}

export function getDefaultActionMultiplier(eventType: SupportedOnchainEventType) {
  return ACTION_MULTIPLIER_BY_EVENT[eventType] ?? 1;
}

export function getTrustMultiplierFromScore(score: number | null | undefined) {
  const normalizedScore = typeof score === "number" && Number.isFinite(score) ? score : 50;

  if (normalizedScore >= 90) return 1.25;
  if (normalizedScore >= 75) return 1.1;
  if (normalizedScore >= 50) return 1;
  if (normalizedScore >= 30) return 0.8;
  return 0.6;
}

export function calculateEffectiveXp(input: {
  baseValue: number;
  qualityMultiplier?: number | null;
  trustMultiplier?: number | null;
  actionMultiplier?: number | null;
}) {
  const qualityMultiplier =
    typeof input.qualityMultiplier === "number" && Number.isFinite(input.qualityMultiplier)
      ? input.qualityMultiplier
      : 1;
  const trustMultiplier =
    typeof input.trustMultiplier === "number" && Number.isFinite(input.trustMultiplier)
      ? input.trustMultiplier
      : 1;
  const actionMultiplier =
    typeof input.actionMultiplier === "number" && Number.isFinite(input.actionMultiplier)
      ? input.actionMultiplier
      : 1;

  const effectiveXp = input.baseValue * qualityMultiplier * trustMultiplier * actionMultiplier;

  return {
    qualityMultiplier,
    trustMultiplier,
    actionMultiplier,
    effectiveXp,
  };
}
