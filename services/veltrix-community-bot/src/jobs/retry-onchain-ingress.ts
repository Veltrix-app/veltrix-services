import { supabaseAdmin } from "../lib/supabase.js";
import { ingestOnchainEvents } from "../core/aesp/onchain.js";
import { writeAdminAuditLog } from "../core/ops/admin-audit.js";
import type { OnchainIngressEvent } from "../types/aesp.js";

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readRawEvent(metadata: Record<string, unknown>) {
  const rawEvent = asObject(metadata.rawEvent);
  if (!rawEvent.chain || !rawEvent.walletAddress || !rawEvent.txHash || !rawEvent.occurredAt) {
    return null;
  }

  return rawEvent as unknown as OnchainIngressEvent;
}

export async function retryOnchainIngressJob(input?: { limit?: number }) {
  const limit = Math.min(Math.max(input?.limit ?? 50, 1), 200);
  const { data, error } = await supabaseAdmin
    .from("admin_audit_logs")
    .select("id, project_id, source_id, action, metadata, created_at")
    .eq("source_table", "onchain_ingress")
    .in("action", ["onchain_ingress_rejected", "onchain_ingress_failed"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  let retried = 0;
  let completed = 0;
  let rejected = 0;
  let skipped = 0;

  for (const row of data ?? []) {
    const metadata = asObject(row.metadata);
    const rawEvent = readRawEvent(metadata);
    if (!row.project_id || !rawEvent) {
      skipped += 1;
      continue;
    }

    retried += 1;

    try {
      const result = await ingestOnchainEvents({
        projectId: row.project_id as string,
        events: [rawEvent],
      });
      const firstResult = Array.isArray(result.results) ? result.results[0] : null;
      const ok = Boolean(firstResult && typeof firstResult === "object" && "ok" in firstResult && firstResult.ok === true);

      if (ok) {
        completed += 1;
        await writeAdminAuditLog({
          projectId: row.project_id as string,
          sourceTable: "onchain_ingress",
          sourceId: row.source_id,
          action: "onchain_ingress_retry_completed",
          summary: "On-chain ingress retry completed successfully.",
          metadata: {
            retriedFromAuditLogId: row.id,
            rawEvent,
            result: firstResult,
          },
        });
      } else {
        rejected += 1;
        await writeAdminAuditLog({
          projectId: row.project_id as string,
          sourceTable: "onchain_ingress",
          sourceId: row.source_id,
          action: "onchain_ingress_retry_rejected",
          summary:
            typeof firstResult === "object" && firstResult && "reason" in firstResult && typeof firstResult.reason === "string"
              ? firstResult.reason
              : "On-chain ingress retry remained rejected.",
          metadata: {
            retriedFromAuditLogId: row.id,
            rawEvent,
            result: firstResult,
          },
        });
      }
    } catch (retryError) {
      rejected += 1;
      await writeAdminAuditLog({
        projectId: row.project_id as string,
        sourceTable: "onchain_ingress",
        sourceId: row.source_id,
        action: "onchain_ingress_retry_failed",
        summary: retryError instanceof Error ? retryError.message : "On-chain ingress retry failed.",
        metadata: {
          retriedFromAuditLogId: row.id,
          rawEvent,
        },
      });
    }
  }

  await writeAdminAuditLog({
    sourceTable: "onchain_ingress",
    sourceId: "retry-job",
    action: "onchain_retry_job_completed",
    summary: `On-chain retry job retried ${retried} rows with ${completed} recoveries.`,
    metadata: {
      limit,
      scanned: data?.length ?? 0,
      retried,
      completed,
      rejected,
      skipped,
    },
  });

  return {
    ok: true,
    scanned: data?.length ?? 0,
    retried,
    completed,
    rejected,
    skipped,
  };
}
