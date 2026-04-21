import { supabaseAdmin } from "../../lib/supabase.js";
import { writeAdminAuditLog } from "../ops/admin-audit.js";
import {
  buildPayoutCaseDedupeKey,
  resolvePayoutCaseByDedupeKey,
  upsertPayoutCase,
} from "../payout/payout-cases.js";
import { getStakeWeight } from "./staking.js";

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function roundAmount(value: number, digits = 6) {
  return Number(value.toFixed(digits));
}

export async function finalizeCampaignRewards(input: { campaignId: string }) {
  let projectId: string | null = null;
  let rewardAsset = "campaign_pool";
  let campaignTitle = "campaign";
  const finalizationDedupeKey = buildPayoutCaseDedupeKey([
    "campaign",
    input.campaignId,
    "finalization_failure",
  ]);

  try {
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("campaigns")
      .select("id, project_id, title, reward_type, reward_pool_amount, campaign_mode, status")
      .eq("id", input.campaignId)
      .maybeSingle();

    if (campaignError) {
      throw campaignError;
    }

    if (!campaign) {
      throw new Error("Campaign not found.");
    }

    projectId = (campaign.project_id as string | null) ?? null;
    campaignTitle = asTrimmedString(campaign.title) || "campaign";

    const rewardPoolAmount = asNumber(campaign.reward_pool_amount, 0);
    if (rewardPoolAmount <= 0) {
      throw new Error("This campaign has no reward pool configured yet.");
    }

    rewardAsset = asTrimmedString(campaign.reward_type) || "campaign_pool";
    const { data: stakes, error: stakesError } = await supabaseAdmin
      .from("xp_stakes")
      .select("id, auth_user_id, staked_xp, active_multiplier, state, lock_end_at, last_activity_at")
      .eq("campaign_id", input.campaignId)
      .neq("state", "slashed");

    if (stakesError) {
      throw stakesError;
    }

    const weightedStakes = (stakes ?? [])
      .map((stake) => ({
        id: stake.id as string,
        authUserId: stake.auth_user_id as string,
        stakedXp: asNumber(stake.staked_xp, 0),
        activeMultiplier: asNumber(stake.active_multiplier, 1),
        state: asTrimmedString(stake.state) || "active",
        weight: getStakeWeight({
          stakedXp: asNumber(stake.staked_xp, 0),
          activeMultiplier: asNumber(stake.active_multiplier, 1),
          state: asTrimmedString(stake.state) || "active",
        }),
        lockEndAt: stake.lock_end_at,
        lastActivityAt: stake.last_activity_at,
      }))
      .filter((stake) => stake.weight > 0);

    if (weightedStakes.length === 0) {
      throw new Error("No eligible stakes were found for this campaign.");
    }

    const totalWeight = weightedStakes.reduce((sum, stake) => sum + stake.weight, 0);
    if (totalWeight <= 0) {
      throw new Error("The stake pool does not currently produce a positive reward weight.");
    }

    const timestamp = new Date().toISOString();
    const distributions = weightedStakes.map((stake) => {
      const share = stake.weight / totalWeight;
      const rewardAmount = roundAmount(rewardPoolAmount * share);

      return {
        campaign_id: input.campaignId,
        auth_user_id: stake.authUserId,
        reward_asset: rewardAsset,
        reward_amount: rewardAmount,
        calculation_snapshot: {
          campaignTitle: asTrimmedString(campaign.title) || "Campaign",
          rewardAsset,
          rewardPoolAmount,
          totalWeight,
          share,
          weight: stake.weight,
          stakedXp: stake.stakedXp,
          activeMultiplier: stake.activeMultiplier,
          state: stake.state,
          finalizedAt: timestamp,
          campaignMode: asTrimmedString(campaign.campaign_mode) || "offchain",
        },
        status: "claimable",
        updated_at: timestamp,
      };
    });

    const { error: upsertError } = await supabaseAdmin.from("reward_distributions").upsert(distributions, {
      onConflict: "campaign_id,auth_user_id,reward_asset",
    });

    if (upsertError) {
      throw upsertError;
    }

    const eligibleAuthUserIds = new Set(weightedStakes.map((stake) => stake.authUserId));
    const { data: existingDistributions, error: existingDistributionsError } = await supabaseAdmin
      .from("reward_distributions")
      .select("id, auth_user_id")
      .eq("campaign_id", input.campaignId)
      .eq("reward_asset", rewardAsset);

    if (existingDistributionsError) {
      throw existingDistributionsError;
    }

    const staleDistributionIds = (existingDistributions ?? [])
      .filter((distribution) => !eligibleAuthUserIds.has(distribution.auth_user_id as string))
      .map((distribution) => distribution.id as string);

    if (staleDistributionIds.length > 0) {
      const { error: pendingError } = await supabaseAdmin
        .from("reward_distributions")
        .update({
          status: "pending",
          reward_amount: 0,
          calculation_snapshot: {
            reason: "No longer part of the finalized eligible stake set.",
            finalizedAt: timestamp,
          },
          updated_at: timestamp,
        })
        .in("id", staleDistributionIds);

      if (pendingError) {
        throw pendingError;
      }
    }

    const result = {
      ok: true,
      campaignId: input.campaignId,
      rewardAsset,
      rewardPoolAmount,
      recipients: distributions.length,
      totalDistributed: roundAmount(
        distributions.reduce((sum, distribution) => sum + asNumber(distribution.reward_amount, 0), 0)
      ),
    };

    await writeAdminAuditLog({
      projectId,
      sourceTable: "reward_distributions",
      sourceId: input.campaignId,
      action: "reward_finalization_completed",
      summary: `Reward distributions finalized for ${campaignTitle}.`,
      metadata: {
        rewardAsset,
        rewardPoolAmount,
        recipients: result.recipients,
        totalDistributed: result.totalDistributed,
      },
    });

    if (projectId) {
      await resolvePayoutCaseByDedupeKey({
        projectId,
        dedupeKey: finalizationDedupeKey,
        summary: `Campaign reward finalization recovered for ${campaignTitle}.`,
        notes: `Finalized ${result.recipients} recipient payout${result.recipients === 1 ? "" : "s"} after the latest run.`,
      });
    }

    return result;
  } catch (error) {
    await writeAdminAuditLog({
      projectId,
      sourceTable: "reward_distributions",
      sourceId: input.campaignId,
      action: "reward_finalization_failed",
      summary: error instanceof Error ? error.message : "Reward finalization failed.",
      metadata: {
        campaignId: input.campaignId,
        rewardAsset,
      },
    });

    if (projectId) {
      await upsertPayoutCase({
        projectId,
        campaignId: input.campaignId,
        caseType: "campaign_finalization_failure",
        severity: "high",
        status: "blocked",
        sourceType: "campaign_finalization",
        sourceId: input.campaignId,
        dedupeKey: finalizationDedupeKey,
        summary: error instanceof Error ? error.message : "Reward finalization failed.",
        evidenceSummary: `Campaign payout finalization for ${campaignTitle} failed and still needs operator follow-through.`,
        rawPayload: {
          campaignId: input.campaignId,
          campaignTitle,
          rewardAsset,
          error: error instanceof Error ? error.message : "Reward finalization failed.",
        },
        metadata: {
          campaignTitle,
          rewardAsset,
        },
      });
    }
    throw error;
  }
}
