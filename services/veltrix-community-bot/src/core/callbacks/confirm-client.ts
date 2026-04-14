import { env } from "../../config/env.js";

type ConfirmPayload = {
  authUserId: string;
  questId: string;
  provider: "discord" | "telegram" | "x";
  eventType: string;
  externalRef?: string | null;
  metadata?: Record<string, unknown>;
};

function getErrorMessage(data: unknown) {
  if (typeof data === "object" && data !== null && "error" in data) {
    const errorValue = (data as { error?: unknown }).error;
    if (typeof errorValue === "string" && errorValue.trim().length > 0) {
      return errorValue;
    }
  }

  return "Verification callback failed.";
}

export async function sendVerificationConfirm(payload: ConfirmPayload) {
  const response = await fetch(env.VERIFICATION_CALLBACK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-verification-secret": env.VERIFICATION_CALLBACK_SECRET
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
}
