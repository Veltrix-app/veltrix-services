import { env } from "../../config/env.js";
import { writeAdminAuditLog } from "../ops/admin-audit.js";

type ConfirmPayload = {
  authUserId: string;
  questId: string;
  provider: "discord" | "telegram" | "x";
  eventType: string;
  projectId?: string | null;
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
  let failureLogged = false;

  try {
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
      const errorMessage = getErrorMessage(data);
      await writeAdminAuditLog({
        authUserId: payload.authUserId,
        projectId: payload.projectId ?? null,
        sourceTable: "quest_verifications",
        sourceId: payload.questId,
        action: "verification_callback_failed",
        summary: errorMessage,
        metadata: {
          provider: payload.provider,
          eventType: payload.eventType,
          externalRef: payload.externalRef ?? null,
          callbackUrl: env.VERIFICATION_CALLBACK_URL,
          responseStatus: response.status,
          responseBody: data,
          payloadMetadata: payload.metadata ?? {},
        },
      });
      failureLogged = true;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Verification callback failed.";

    if (!failureLogged) {
      await writeAdminAuditLog({
        authUserId: payload.authUserId,
        projectId: payload.projectId ?? null,
        sourceTable: "quest_verifications",
        sourceId: payload.questId,
        action: "verification_callback_failed",
        summary: message,
        metadata: {
          provider: payload.provider,
          eventType: payload.eventType,
          externalRef: payload.externalRef ?? null,
          callbackUrl: env.VERIFICATION_CALLBACK_URL,
          payloadMetadata: payload.metadata ?? {},
        },
      });
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(message);
  }
}
