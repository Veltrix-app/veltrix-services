export function getLootboxOpenAvailability(params: {
  busy: boolean;
  priceShards: number;
  shardBalance: number;
  eligibility: { unlocked: boolean; reason: string | null };
}) {
  if (!params.eligibility.unlocked) {
    return {
      canOpen: false,
      cta: "Locked",
      helperText: params.eligibility.reason ?? "Lootbox tier is locked.",
      shortfall: 0,
    };
  }

  const shortfall = Math.max(0, params.priceShards - params.shardBalance);
  if (shortfall > 0) {
    return {
      canOpen: false,
      cta: "Need shards",
      helperText: `Need ${shortfall.toLocaleString()} more shards.`,
      shortfall,
    };
  }

  return {
    canOpen: !params.busy,
    cta: params.busy ? "Opening..." : "Open box",
    helperText: "Ready to open.",
    shortfall: 0,
  };
}
