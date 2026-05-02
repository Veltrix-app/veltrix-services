import { supabaseAdmin } from "../../lib/supabase.js";
import { rebuildUserReputationProjection } from "./projections.js";
import type { XpSourceType } from "../../types/aesp.js";
import {
  buildLedgerXpAwardPlan,
  buildLedgerXpSourceRef,
  getLedgerXpSourceAliases,
  resolveLedgerXpSourceConfig,
  type LedgerXpReputationSnapshot,
} from "./ledger-enforcement.js";

export async function emitXpEvent(input: {
  authUserId: string;
  projectId?: string | null;
  campaignId?: string | null;
  sourceType: XpSourceType;
  sourceRef: string;
  baseValue: number;
  xpAmount: number;
  qualityMultiplier?: number;
  trustMultiplier?: number;
  actionMultiplier?: number;
  effectiveXp: number;
  metadata?: Record<string, unknown>;
}) {
  const timestamp = new Date().toISOString();
  const context = await loadLedgerXpAwardContext({
    authUserId: input.authUserId,
    sourceType: input.sourceType,
  });
  const awardPlan = buildLedgerXpAwardPlan({
    authUserId: input.authUserId,
    sourceType: input.sourceType,
    sourceRef: input.sourceRef,
    baseValue: input.baseValue,
    xpAmount: input.xpAmount,
    effectiveXp: input.effectiveXp,
    recentSourceXp: context.recentSourceXp,
    claimedSourceRefs: context.claimedSourceRefs,
    reputation: context.reputation,
    metadata: input.metadata,
  });

  if (!awardPlan.ok && awardPlan.reason === "duplicate") {
    const projection = await rebuildUserReputationProjection(input.authUserId);
    return {
      xpEventId: null,
      projection,
      alreadyRecorded: true,
      reason: awardPlan.reason,
    };
  }

  if (!awardPlan.ok) {
    const error = new Error(awardPlan.message);
    (error as Error & { reason?: string; sourceRef?: string }).reason = awardPlan.reason;
    (error as Error & { reason?: string; sourceRef?: string }).sourceRef = awardPlan.sourceRef;
    throw error;
  }

  const { data, error } = await supabaseAdmin
    .from("xp_events")
    .upsert(
      {
        auth_user_id: input.authUserId,
        project_id: input.projectId ?? null,
        campaign_id: input.campaignId ?? null,
        source_type: awardPlan.event.sourceType,
        source_ref: awardPlan.event.sourceRef,
        base_value: awardPlan.event.baseValue,
        xp_amount: awardPlan.event.xpAmount,
        quality_multiplier: awardPlan.event.qualityMultiplier,
        trust_multiplier: awardPlan.event.trustMultiplier,
        action_multiplier: awardPlan.event.actionMultiplier,
        effective_xp: awardPlan.event.effectiveXp,
        metadata: awardPlan.event.metadata,
        updated_at: timestamp,
      },
      {
        onConflict: "auth_user_id,source_type,source_ref",
      }
    )
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const projection = await rebuildUserReputationProjection(input.authUserId);

  return {
    xpEventId: data.id,
    projection,
  };
}

function getUtcDayStartIso(now = new Date()) {
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  return dayStart.toISOString();
}

async function loadLedgerXpAwardContext(input: {
  authUserId: string;
  sourceType: unknown;
}): Promise<{
  claimedSourceRefs: string[];
  recentSourceXp: number;
  reputation: LedgerXpReputationSnapshot | null;
}> {
  const sourceConfig = resolveLedgerXpSourceConfig(input.sourceType);
  if (!sourceConfig) {
    return {
      claimedSourceRefs: [],
      recentSourceXp: 0,
      reputation: await loadLedgerReputation(input.authUserId),
    };
  }

  const aliases = getLedgerXpSourceAliases(input.sourceType);
  const [{ data: xpRows, error: xpError }, reputation] = await Promise.all([
    supabaseAdmin
      .from("xp_events")
      .select("source_type, source_ref, effective_xp, created_at")
      .eq("auth_user_id", input.authUserId)
      .in("source_type", aliases)
      .order("created_at", { ascending: false })
      .limit(1000),
    loadLedgerReputation(input.authUserId),
  ]);

  if (xpError) {
    throw xpError;
  }

  const dayStartIso = getUtcDayStartIso();
  const claims = (xpRows ?? []).map((row) => {
    const rawSourceType = typeof row.source_type === "string" ? row.source_type : sourceConfig.sourceType;
    const rowSourceConfig = resolveLedgerXpSourceConfig(rawSourceType) ?? sourceConfig;
    const rawSourceRef = typeof row.source_ref === "string" ? row.source_ref : "";
    return {
      sourceRef: rawSourceRef
        ? buildLedgerXpSourceRef(rowSourceConfig.sourceType, rawSourceRef)
        : "",
      xp: safeNumber(row.effective_xp),
      createdAt: typeof row.created_at === "string" ? row.created_at : "",
    };
  });

  return {
    claimedSourceRefs: claims.map((claim) => claim.sourceRef).filter(Boolean),
    recentSourceXp: claims
      .filter((claim) => claim.createdAt >= dayStartIso)
      .reduce((total, claim) => total + claim.xp, 0),
    reputation,
  };
}

async function loadLedgerReputation(authUserId: string): Promise<LedgerXpReputationSnapshot | null> {
  const { data, error } = await supabaseAdmin
    .from("user_global_reputation")
    .select("trust_score, sybil_score, status")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? {
        trustScore: data.trust_score,
        sybilScore: data.sybil_score,
        status: data.status,
      }
    : null;
}

function safeNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}
