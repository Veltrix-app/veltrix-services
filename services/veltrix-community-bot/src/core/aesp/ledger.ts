import { supabaseAdmin } from "../../lib/supabase.js";
import { rebuildUserReputationProjection } from "./projections.js";
import type { XpSourceType } from "../../types/aesp.js";

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

  const { data, error } = await supabaseAdmin
    .from("xp_events")
    .upsert(
      {
        auth_user_id: input.authUserId,
        project_id: input.projectId ?? null,
        campaign_id: input.campaignId ?? null,
        source_type: input.sourceType,
        source_ref: input.sourceRef,
        base_value: input.baseValue,
        xp_amount: input.xpAmount,
        quality_multiplier: input.qualityMultiplier ?? 1,
        trust_multiplier: input.trustMultiplier ?? 1,
        action_multiplier: input.actionMultiplier ?? 1,
        effective_xp: input.effectiveXp,
        metadata: input.metadata ?? {},
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
