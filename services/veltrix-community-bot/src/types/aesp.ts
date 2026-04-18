export type SupportedChain = "evm";

export type SupportedOnchainEventType =
  | "buy"
  | "hold"
  | "transfer_in"
  | "transfer_out"
  | "stake"
  | "unstake"
  | "lp_add"
  | "lp_remove"
  | "contract_call";

export type XpSourceType = "quest" | "raid" | "onchain_event";

export type TrustSnapshotRow = {
  score: number | null;
  reasons: Record<string, unknown> | null;
};

export type LedgerProjectionTarget = {
  authUserId: string;
  projectId?: string | null;
};

export type OnchainIngressEvent = {
  chain: SupportedChain;
  walletAddress: string;
  txHash: string;
  occurredAt: string;
  eventType: SupportedOnchainEventType;
  contractAddress: string;
  tokenAddress?: string | null;
  usdValue?: number | null;
  metadata?: Record<string, unknown>;
  baseValue?: number | null;
  qualityMultiplier?: number | null;
  trustMultiplier?: number | null;
  actionMultiplier?: number | null;
  campaignId?: string | null;
};
