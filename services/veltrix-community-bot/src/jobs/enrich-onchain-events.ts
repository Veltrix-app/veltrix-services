import { supabaseAdmin } from "../lib/supabase.js";
import { writeAdminAuditLog } from "../core/ops/admin-audit.js";

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getUsdBand(value: number | null) {
  if (!value || value <= 0) return "none";
  if (value < 5) return "tiny";
  if (value < 25) return "small";
  if (value < 100) return "medium";
  return "high";
}

function getTrustBand(score: number) {
  if (score <= 35) return "low";
  if (score <= 45) return "watch";
  if (score >= 70) return "strong";
  return "healthy";
}

function getSignalClass(eventType: string) {
  if (["buy", "stake", "lp_add", "hold"].includes(eventType)) return "accumulation";
  if (["unstake", "lp_remove", "transfer_out"].includes(eventType)) return "distribution";
  if (["transfer_in"].includes(eventType)) return "inbound";
  return "neutral";
}

export async function runOnchainEnrichmentJob(input?: { limit?: number }) {
  const limit = Math.min(Math.max(input?.limit ?? 200, 1), 500);
  const { data, error } = await supabaseAdmin
    .from("onchain_events")
    .select("id, auth_user_id, project_id, event_type, usd_value, metadata, created_at, updated_at")
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  let enriched = 0;
  let skipped = 0;
  const touchedAuthUsers = new Set<string>();

  for (const row of data ?? []) {
    const metadata = asObject(row.metadata);
    if (metadata.enrichmentStatus === "completed" && metadata.enrichmentVersion === 2) {
      skipped += 1;
      continue;
    }

    const trustReasons = asObject(metadata.trustReasons);
    const suspiciousFlags = Array.isArray(trustReasons.suspiciousFlags)
      ? trustReasons.suspiciousFlags
      : [];
    const trustScore = Number(trustReasons.score ?? 50);

    const nextMetadata = {
      ...metadata,
      enrichmentStatus: "completed",
      enrichmentVersion: 2,
      enrichedAt: new Date().toISOString(),
      usdBand: getUsdBand(Number(row.usd_value ?? 0)),
      trustBand: getTrustBand(Number.isFinite(trustScore) ? trustScore : 50),
      signalClass: getSignalClass(String(row.event_type ?? "")),
      suspiciousFlagCount: suspiciousFlags.length,
      velocityBand:
        Number(trustReasons.recentEventCount24h ?? 0) >= 20
          ? "high"
          : Number(trustReasons.recentEventCount24h ?? 0) >= 8
            ? "medium"
            : "low",
    };

    const { error: updateError } = await supabaseAdmin
      .from("onchain_events")
      .update({
        metadata: nextMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (updateError) {
      throw updateError;
    }

    enriched += 1;
    touchedAuthUsers.add(row.auth_user_id as string);
  }

  await writeAdminAuditLog({
    sourceTable: "onchain_events",
    sourceId: "enrichment-job",
    action: "onchain_enrichment_job_completed",
    summary: `On-chain enrichment job processed ${data?.length ?? 0} rows and enriched ${enriched}.`,
    metadata: {
      limit,
      processed: data?.length ?? 0,
      enriched,
      skipped,
      touchedUsers: touchedAuthUsers.size,
    },
  });

  return {
    ok: true,
    processed: data?.length ?? 0,
    enriched,
    skipped,
    touchedUsers: touchedAuthUsers.size,
  };
}
