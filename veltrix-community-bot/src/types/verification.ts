export type PendingVerificationProvider = "discord" | "telegram" | "x";

export type PendingVerificationRequest = {
  authUserId: string;
  questId: string;
  provider: PendingVerificationProvider;
  externalRef?: string | null;
  metadata?: Record<string, unknown>;
};
