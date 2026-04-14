import { supabaseAdmin } from "../lib/supabase.js";
import { verifyDiscordQuestMembership } from "../providers/discord/verification.js";
import { verifyTelegramQuestMembership } from "../providers/telegram/verification.js";

type RetryCommunityVerificationOptions = {
  limit?: number;
};

type RetryCommunityVerificationResult = {
  ok: true;
  processed: number;
  approved: number;
  stillPending: number;
  skipped: number;
  failures: Array<{
    authUserId: string;
    questId: string;
    provider: string;
    error: string;
  }>;
};

export async function retryPendingCommunityVerifications(
  options: RetryCommunityVerificationOptions = {}
): Promise<RetryCommunityVerificationResult> {
  const limit = options.limit ?? 25;

  const { data: pendingRuns, error } = await supabaseAdmin
    .from("quest_verification_runs")
    .select("auth_user_id, quest_id, provider, created_at")
    .eq("result", "pending")
    .in("provider", ["discord", "telegram"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || "Failed to load pending community verification runs.");
  }

  const latestKeys = new Set<string>();
  const queue =
    pendingRuns?.filter((run) => {
      const key = `${run.provider}:${run.auth_user_id}:${run.quest_id}`;
      if (latestKeys.has(key)) return false;
      latestKeys.add(key);
      return true;
    }) ?? [];

  let approved = 0;
  let stillPending = 0;
  let skipped = 0;
  const failures: RetryCommunityVerificationResult["failures"] = [];

  for (const run of queue) {
    try {
      if (run.provider === "discord") {
        const result = await verifyDiscordQuestMembership({
          authUserId: run.auth_user_id,
          questId: run.quest_id
        });

        if (result.status === "approved") {
          approved += 1;
        } else {
          stillPending += 1;
        }
        continue;
      }

      if (run.provider === "telegram") {
        const result = await verifyTelegramQuestMembership({
          authUserId: run.auth_user_id,
          questId: run.quest_id
        });

        if (result.status === "approved") {
          approved += 1;
        } else {
          stillPending += 1;
        }
        continue;
      }

      skipped += 1;
    } catch (jobError) {
      failures.push({
        authUserId: run.auth_user_id,
        questId: run.quest_id,
        provider: run.provider,
        error: jobError instanceof Error ? jobError.message : "Unknown retry failure."
      });
    }
  }

  return {
    ok: true,
    processed: queue.length,
    approved,
    stillPending,
    skipped,
    failures
  };
}
