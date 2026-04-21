import { supabaseAdmin } from "../../lib/supabase.js";
import type { OnchainIngressEvent, SupportedOnchainEventType, TrustSnapshotRow } from "../../types/aesp.js";
import { calculateEffectiveXp, getDefaultActionMultiplier, getDefaultBaseValue, getTrustMultiplierFromScore } from "./scoring.js";
import { emitXpEvent } from "./ledger.js";
import {
  buildOnchainCaseDedupeKey,
  resolveOnchainCaseByDedupeKey,
  upsertOnchainCase,
  type OnchainCaseSeverity,
} from "../onchain/onchain-cases.js";
import { writeAdminAuditLog } from "../ops/admin-audit.js";
import { upsertTrustCasesFromSignals } from "../trust/trust-cases.js";
import { deriveOnchainTrustAssessment, type SuspiciousSignal } from "./trust.js";

function normalizeAddress(value: string) {
  return value.trim().toLowerCase();
}

function deriveRiskFlags(event: OnchainIngressEvent) {
  const usdValue = Number(event.usdValue ?? 0);
  return {
    lowValueEvent: usdValue > 0 && usdValue < 5,
    transferLike: event.eventType === "transfer_in" || event.eventType === "transfer_out",
    exitLike: event.eventType === "unstake" || event.eventType === "lp_remove" || event.eventType === "transfer_out",
    highValueEvent: usdValue >= 50,
    buyLike: event.eventType === "buy" || event.eventType === "stake" || event.eventType === "lp_add",
  };
}

function getHighestSignalSeverity(signals: SuspiciousSignal[]): OnchainCaseSeverity {
  if (signals.some((signal) => signal.severity === "high")) {
    return "high";
  }

  if (signals.some((signal) => signal.severity === "medium")) {
    return "medium";
  }

  return "low";
}

function buildSignalEvidenceSummary(signals: SuspiciousSignal[]) {
  return signals.map((signal) => signal.reason).join(" | ");
}

async function writeTrustSnapshot(input: {
  authUserId: string;
  score: number;
  reasons: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("trust_snapshots").insert({
    auth_user_id: input.authUserId,
    score: input.score,
    reasons: input.reasons,
  });

  if (error) {
    throw error;
  }
}

async function upsertReviewFlags(input: {
  authUserId: string;
  projectId: string;
  sourceTable: string;
  sourceId: string;
  signals: SuspiciousSignal[];
  baseMetadata?: Record<string, unknown>;
}) {
  for (const signal of input.signals) {
    const query = supabaseAdmin
      .from("review_flags")
      .select("id")
      .eq("auth_user_id", input.authUserId)
      .eq("project_id", input.projectId)
      .eq("source_table", input.sourceTable)
      .eq("source_id", input.sourceId)
      .eq("flag_type", signal.flagType)
      .order("created_at", { ascending: false })
      .limit(1);

    const { data: existingFlag, error: existingFlagError } = await query.maybeSingle();
    if (existingFlagError) {
      throw existingFlagError;
    }

    const metadata = {
      ...(input.baseMetadata ?? {}),
      ...(signal.metadata ?? {}),
    };

    if (existingFlag?.id) {
      const { error: updateError } = await supabaseAdmin
        .from("review_flags")
        .update({
          severity: signal.severity,
          status: "open",
          reason: signal.reason,
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingFlag.id);

      if (updateError) {
        throw updateError;
      }
      continue;
    }

    const { error: insertError } = await supabaseAdmin.from("review_flags").insert({
      auth_user_id: input.authUserId,
      project_id: input.projectId,
      source_table: input.sourceTable,
      source_id: input.sourceId,
      flag_type: signal.flagType,
      severity: signal.severity,
      status: "open",
      reason: signal.reason,
      metadata,
    });

    if (insertError) {
      throw insertError;
    }
  }
}

export async function ingestOnchainEvents(input: {
  projectId: string;
  events: OnchainIngressEvent[];
}) {
  const results: Array<Record<string, unknown>> = [];
  const { data: trackedAssets, error: trackedAssetsError } = await supabaseAdmin
    .from("project_assets")
    .select("id, chain, contract_address, symbol, asset_type, metadata")
    .eq("project_id", input.projectId)
    .eq("is_active", true);

  if (trackedAssetsError) {
    throw trackedAssetsError;
  }

  const activeTrackedAssets = trackedAssets ?? [];

  if (activeTrackedAssets.length === 0) {
    await Promise.all(
      input.events.map((event) =>
        writeAdminAuditLog({
          projectId: input.projectId,
          sourceTable: "onchain_ingress",
          sourceId: `${event.chain}:${event.txHash}:${event.eventType}`,
          action: "onchain_ingress_rejected",
          summary: "Project has no active tracked assets configured for on-chain scoring.",
          metadata: {
            chain: event.chain,
            txHash: event.txHash,
            eventType: event.eventType,
            contractAddress: event.contractAddress,
            tokenAddress: event.tokenAddress ?? null,
            walletAddress: event.walletAddress,
            rawEvent: event,
          },
        })
      )
    );

    return {
      ok: true,
      processed: input.events.length,
      results: input.events.map((event) => ({
        ok: false,
        txHash: event.txHash,
        reason: "Project has no active tracked assets configured for on-chain scoring.",
      })),
    };
  }

  for (const rawEvent of input.events) {
    const ingressSourceId = `${rawEvent.chain}:${rawEvent.txHash}:${rawEvent.eventType}`;
    const walletAddress = normalizeAddress(rawEvent.walletAddress);
    const contractAddress = normalizeAddress(rawEvent.contractAddress);
    const tokenAddress = rawEvent.tokenAddress ? normalizeAddress(rawEvent.tokenAddress) : null;
    const matchedAsset =
      activeTrackedAssets.find(
        (asset) =>
          asset.chain === rawEvent.chain &&
          (asset.contract_address === contractAddress ||
            (tokenAddress ? asset.contract_address === tokenAddress : false))
      ) ?? null;

    if (!matchedAsset) {
      await upsertOnchainCase({
        projectId: input.projectId,
        walletAddress,
        caseType: "unmatched_project_asset",
        severity: "medium",
        sourceType: "onchain_ingress",
        sourceId: ingressSourceId,
        dedupeKey: buildOnchainCaseDedupeKey([
          "unmatched_project_asset",
          walletAddress,
          tokenAddress ?? contractAddress,
          rawEvent.txHash,
          rawEvent.eventType,
        ]),
        summary: "No active tracked project asset matched this on-chain event.",
        evidenceSummary: `Event ${rawEvent.eventType} for ${tokenAddress ?? contractAddress} could not be matched to an active project asset.`,
        rawPayload: {
          chain: rawEvent.chain,
          txHash: rawEvent.txHash,
          eventType: rawEvent.eventType,
          contractAddress,
          tokenAddress,
          walletAddress,
          rawEvent,
        },
        metadata: {
          chain: rawEvent.chain,
          contractAddress,
          tokenAddress,
        },
      });

      await writeAdminAuditLog({
        projectId: input.projectId,
        sourceTable: "onchain_ingress",
        sourceId: ingressSourceId,
        action: "onchain_ingress_rejected",
        summary: "No active tracked project asset matched this on-chain event.",
        metadata: {
          chain: rawEvent.chain,
          txHash: rawEvent.txHash,
          eventType: rawEvent.eventType,
          contractAddress,
          tokenAddress,
          walletAddress,
          rawEvent: rawEvent,
        },
      });
      results.push({
        ok: false,
        txHash: rawEvent.txHash,
        reason: "No active tracked project asset matched this on-chain event.",
      });
      continue;
    }

    const { data: walletLink, error: walletLinkError } = await supabaseAdmin
      .from("wallet_links")
      .select("id, auth_user_id, verified, verified_at, created_at, risk_label, last_seen_at")
      .eq("wallet_address", walletAddress)
      .eq("verified", true)
      .maybeSingle();

    if (walletLinkError) {
      throw walletLinkError;
    }

    if (!walletLink?.auth_user_id) {
      await upsertOnchainCase({
        projectId: input.projectId,
        walletAddress,
        caseType: "unlinked_wallet_activity",
        severity: "medium",
        sourceType: "wallet_link",
        sourceId: ingressSourceId,
        dedupeKey: buildOnchainCaseDedupeKey([
          "unlinked_wallet_activity",
          walletAddress,
          rawEvent.txHash,
          rawEvent.eventType,
        ]),
        summary: "Wallet is not linked to a verified Veltrix account.",
        evidenceSummary: "Tracked on-chain activity arrived for a wallet that is not yet linked and verified.",
        rawPayload: {
          chain: rawEvent.chain,
          txHash: rawEvent.txHash,
          eventType: rawEvent.eventType,
          contractAddress,
          tokenAddress,
          walletAddress,
          rawEvent,
        },
        metadata: {
          chain: rawEvent.chain,
          contractAddress,
          tokenAddress,
        },
      });

      await writeAdminAuditLog({
        projectId: input.projectId,
        sourceTable: "onchain_ingress",
        sourceId: ingressSourceId,
        action: "onchain_ingress_rejected",
        summary: "Wallet is not linked to a verified Veltrix account.",
        metadata: {
          chain: rawEvent.chain,
          txHash: rawEvent.txHash,
          eventType: rawEvent.eventType,
          contractAddress,
          tokenAddress,
          walletAddress,
          rawEvent: rawEvent,
        },
      });
      results.push({
        ok: false,
        txHash: rawEvent.txHash,
        reason: "Wallet is not linked to a verified Veltrix account.",
      });
      continue;
    }

    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [
      { data: trustSnapshot, error: trustSnapshotError },
      { count: recentEventCount24h, error: recentEventCount24hError },
      { count: recentEventTypeCount24h, error: recentEventTypeCount24hError },
      { count: recentLowValueTransferCount24h, error: recentLowValueTransferCount24hError },
      { count: connectedSocialCount, error: connectedSocialCountError },
    ] = await Promise.all([
      supabaseAdmin
        .from("trust_snapshots")
        .select("score, reasons")
        .eq("auth_user_id", walletLink.auth_user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("onchain_events")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", walletLink.auth_user_id)
        .eq("project_id", input.projectId)
        .gte("created_at", windowStart),
      supabaseAdmin
        .from("onchain_events")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", walletLink.auth_user_id)
        .eq("project_id", input.projectId)
        .eq("event_type", rawEvent.eventType)
        .gte("created_at", windowStart),
      supabaseAdmin
        .from("onchain_events")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", walletLink.auth_user_id)
        .eq("project_id", input.projectId)
        .in("event_type", ["transfer_in", "transfer_out"])
        .lt("usd_value", 5)
        .gte("created_at", windowStart),
      supabaseAdmin
        .from("user_connected_accounts")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", walletLink.auth_user_id)
        .eq("status", "connected")
        .in("provider", ["discord", "telegram", "x"]),
    ]);

    if (trustSnapshotError) {
      throw trustSnapshotError;
    }

    if (recentEventCount24hError) {
      throw recentEventCount24hError;
    }

    if (recentEventTypeCount24hError) {
      throw recentEventTypeCount24hError;
    }

    if (recentLowValueTransferCount24hError) {
      throw recentLowValueTransferCount24hError;
    }

    if (connectedSocialCountError) {
      throw connectedSocialCountError;
    }

    const trust = (trustSnapshot as TrustSnapshotRow | null) ?? { score: 50, reasons: {} };
    const riskFlags = deriveRiskFlags(rawEvent);
    const trustAssessment = deriveOnchainTrustAssessment({
      event: rawEvent,
      latestTrustScore: Number(trust.score ?? 50),
      walletVerifiedAt: walletLink.verified_at,
      walletCreatedAt: walletLink.created_at,
      riskLabel: walletLink.risk_label,
      connectedSocialCount: connectedSocialCount ?? 0,
      recentEventCount24h: recentEventCount24h ?? 0,
      recentEventTypeCount24h: recentEventTypeCount24h ?? 0,
      recentLowValueTransferCount24h: recentLowValueTransferCount24h ?? 0,
      trackedAssetMetadata:
        matchedAsset.metadata && typeof matchedAsset.metadata === "object"
          ? (matchedAsset.metadata as Record<string, unknown>)
          : {},
      riskFlags,
    });
    const derivedTrustMultiplier = getTrustMultiplierFromScore(trustAssessment.score);
    const baseValue = getDefaultBaseValue(rawEvent.eventType, rawEvent.usdValue);
    const scoring = calculateEffectiveXp({
      baseValue: typeof rawEvent.baseValue === "number" ? rawEvent.baseValue : baseValue,
      qualityMultiplier: rawEvent.qualityMultiplier ?? 1,
      trustMultiplier: rawEvent.trustMultiplier ?? derivedTrustMultiplier,
      actionMultiplier: rawEvent.actionMultiplier ?? getDefaultActionMultiplier(rawEvent.eventType),
    });
    const timestamp = new Date().toISOString();
    const baseReviewMetadata = {
      chain: rawEvent.chain,
      txHash: rawEvent.txHash,
      eventType: rawEvent.eventType,
      contractAddress,
      tokenAddress,
      walletAddress,
      trackedAssetId: matchedAsset.id,
      trackedAssetSymbol: matchedAsset.symbol,
      trackedAssetType: matchedAsset.asset_type,
      trustScore: trustAssessment.score,
    };

    if (trustAssessment.rejectReason) {
      if (trustAssessment.suspiciousSignals.length > 0) {
        await upsertOnchainCase({
          projectId: input.projectId,
          authUserId: walletLink.auth_user_id,
          walletAddress,
          assetId: matchedAsset.id,
          caseType: "suspicious_onchain_pattern",
          severity: getHighestSignalSeverity(trustAssessment.suspiciousSignals),
          sourceType: "onchain_ingress",
          sourceId: ingressSourceId,
          dedupeKey: buildOnchainCaseDedupeKey([
            "suspicious_onchain_pattern",
            walletAddress,
            rawEvent.txHash,
            rawEvent.eventType,
          ]),
          summary: trustAssessment.rejectReason,
          evidenceSummary: buildSignalEvidenceSummary(trustAssessment.suspiciousSignals),
          rawPayload: {
            ...baseReviewMetadata,
            suspiciousSignals: trustAssessment.suspiciousSignals,
            reasons: trustAssessment.reasons,
            rawEvent,
          },
          metadata: {
            signalFlagTypes: trustAssessment.suspiciousSignals.map((signal) => signal.flagType),
          },
        });
      } else {
        await upsertOnchainCase({
          projectId: input.projectId,
          authUserId: walletLink.auth_user_id,
          walletAddress,
          assetId: matchedAsset.id,
          caseType: "ingress_rejected",
          severity: "medium",
          sourceType: "onchain_ingress",
          sourceId: ingressSourceId,
          dedupeKey: buildOnchainCaseDedupeKey([
            "ingress_rejected",
            walletAddress,
            rawEvent.txHash,
            rawEvent.eventType,
          ]),
          summary: trustAssessment.rejectReason,
          evidenceSummary: trustAssessment.rejectReason,
          rawPayload: {
            ...baseReviewMetadata,
            reasons: trustAssessment.reasons,
            rawEvent,
          },
          metadata: {
            rejectReason: trustAssessment.rejectReason,
          },
        });
      }

      await writeAdminAuditLog({
        authUserId: walletLink.auth_user_id,
        projectId: input.projectId,
        sourceTable: "onchain_ingress",
        sourceId: ingressSourceId,
        action: "onchain_ingress_rejected",
        summary: trustAssessment.rejectReason,
        metadata: {
          ...baseReviewMetadata,
          suspiciousSignals: trustAssessment.suspiciousSignals,
          reasons: trustAssessment.reasons,
          rawEvent: rawEvent,
        },
      });

      await writeTrustSnapshot({
        authUserId: walletLink.auth_user_id,
        score: trustAssessment.score,
        reasons: trustAssessment.reasons,
      });

      if (trustAssessment.suspiciousSignals.length > 0) {
        await upsertReviewFlags({
          authUserId: walletLink.auth_user_id,
          projectId: input.projectId,
          sourceTable: "onchain_ingress",
          sourceId: ingressSourceId,
          signals: trustAssessment.suspiciousSignals,
          baseMetadata: baseReviewMetadata,
        });

        await upsertTrustCasesFromSignals({
          projectId: input.projectId,
          authUserId: walletLink.auth_user_id,
          walletAddress,
          sourceType: "onchain_signal",
          sourceId: ingressSourceId,
          signals: trustAssessment.suspiciousSignals,
          signalPayload: {
            ...baseReviewMetadata,
            reasons: trustAssessment.reasons,
            rawEvent,
          },
        });
      }

      results.push({
        ok: false,
        txHash: rawEvent.txHash,
        reason: trustAssessment.rejectReason,
      });
      continue;
    }

    const { data: onchainEvent, error: onchainError } = await supabaseAdmin
      .from("onchain_events")
      .upsert(
        {
          auth_user_id: walletLink.auth_user_id,
          project_id: input.projectId,
          wallet_link_id: walletLink.id,
          chain: rawEvent.chain,
          tx_hash: rawEvent.txHash,
          block_time: rawEvent.occurredAt,
          event_type: rawEvent.eventType,
          contract_address: contractAddress,
          token_address: tokenAddress,
          usd_value: rawEvent.usdValue ?? null,
          metadata: {
            ...(rawEvent.metadata ?? {}),
            walletAddress,
            riskFlags,
            trustReasons: trustAssessment.reasons,
            trackedAssetId: matchedAsset.id,
            trackedAssetSymbol: matchedAsset.symbol,
            trackedAssetType: matchedAsset.asset_type,
          },
          updated_at: timestamp,
        },
        {
          onConflict: "chain,tx_hash,event_type,contract_address",
        }
      )
      .select("id")
      .single();

    if (onchainError) {
      await writeAdminAuditLog({
        authUserId: walletLink.auth_user_id,
        projectId: input.projectId,
        sourceTable: "onchain_ingress",
        sourceId: ingressSourceId,
        action: "onchain_ingress_failed",
        summary: onchainError.message,
        metadata: {
          chain: rawEvent.chain,
          txHash: rawEvent.txHash,
          eventType: rawEvent.eventType,
          contractAddress,
          tokenAddress,
          walletAddress,
          rawEvent: rawEvent,
        },
      });
      throw onchainError;
    }

    await writeTrustSnapshot({
      authUserId: walletLink.auth_user_id,
      score: trustAssessment.score,
      reasons: trustAssessment.reasons,
    });

    await resolveOnchainCaseByDedupeKey({
      projectId: input.projectId,
      dedupeKey: buildOnchainCaseDedupeKey([
        "unmatched_project_asset",
        walletAddress,
        tokenAddress ?? contractAddress,
        rawEvent.txHash,
        rawEvent.eventType,
      ]),
      summary: "Tracked asset mapping recovered after successful on-chain ingestion.",
    });
    await resolveOnchainCaseByDedupeKey({
      projectId: input.projectId,
      dedupeKey: buildOnchainCaseDedupeKey([
        "unlinked_wallet_activity",
        walletAddress,
        rawEvent.txHash,
        rawEvent.eventType,
      ]),
      summary: "Wallet link posture recovered after successful on-chain ingestion.",
    });

    if (trustAssessment.suspiciousSignals.length > 0) {
      await upsertOnchainCase({
        projectId: input.projectId,
        authUserId: walletLink.auth_user_id,
        walletAddress,
        assetId: matchedAsset.id,
        caseType: "suspicious_onchain_pattern",
        severity: getHighestSignalSeverity(trustAssessment.suspiciousSignals),
        sourceType: "onchain_event",
        sourceId: onchainEvent.id,
        dedupeKey: buildOnchainCaseDedupeKey([
          "suspicious_onchain_pattern",
          walletAddress,
          rawEvent.txHash,
          rawEvent.eventType,
        ]),
        summary: "Accepted on-chain event still carries suspicious signal pressure.",
        evidenceSummary: buildSignalEvidenceSummary(trustAssessment.suspiciousSignals),
        rawPayload: {
          ...baseReviewMetadata,
          reasons: trustAssessment.reasons,
          onchainEventId: onchainEvent.id,
          suspiciousSignals: trustAssessment.suspiciousSignals,
          rawEvent,
        },
        metadata: {
          signalFlagTypes: trustAssessment.suspiciousSignals.map((signal) => signal.flagType),
        },
      });

      await upsertReviewFlags({
        authUserId: walletLink.auth_user_id,
        projectId: input.projectId,
        sourceTable: "onchain_events",
        sourceId: onchainEvent.id,
        signals: trustAssessment.suspiciousSignals,
        baseMetadata: {
          ...baseReviewMetadata,
          reasons: trustAssessment.reasons,
        },
      });

      await upsertTrustCasesFromSignals({
        projectId: input.projectId,
        authUserId: walletLink.auth_user_id,
        walletAddress,
        sourceType: "onchain_signal",
        sourceId: onchainEvent.id,
        signals: trustAssessment.suspiciousSignals,
        signalPayload: {
          ...baseReviewMetadata,
          reasons: trustAssessment.reasons,
          onchainEventId: onchainEvent.id,
          rawEvent,
        },
      });
    } else {
      await resolveOnchainCaseByDedupeKey({
        projectId: input.projectId,
        dedupeKey: buildOnchainCaseDedupeKey([
          "suspicious_onchain_pattern",
          walletAddress,
          rawEvent.txHash,
          rawEvent.eventType,
        ]),
        summary: "Suspicious on-chain signal pressure cleared for this event.",
      });
      await resolveOnchainCaseByDedupeKey({
        projectId: input.projectId,
        dedupeKey: buildOnchainCaseDedupeKey([
          "ingress_rejected",
          walletAddress,
          rawEvent.txHash,
          rawEvent.eventType,
        ]),
        summary: "On-chain ingress rejection cleared after successful ingestion.",
      });
    }

    const ledger = await emitXpEvent({
      authUserId: walletLink.auth_user_id,
      projectId: input.projectId,
      campaignId: rawEvent.campaignId ?? null,
      sourceType: "onchain_event",
      sourceRef: onchainEvent.id,
      baseValue: typeof rawEvent.baseValue === "number" ? rawEvent.baseValue : baseValue,
      xpAmount: scoring.effectiveXp,
      qualityMultiplier: scoring.qualityMultiplier,
      trustMultiplier: scoring.trustMultiplier,
      actionMultiplier: scoring.actionMultiplier,
      effectiveXp: scoring.effectiveXp,
      metadata: {
        chain: rawEvent.chain,
        eventType: rawEvent.eventType,
        txHash: rawEvent.txHash,
        contractAddress,
        tokenAddress,
        usdValue: rawEvent.usdValue ?? null,
        riskFlags,
        trustReasons: trustAssessment.reasons,
        trackedAssetId: matchedAsset.id,
        trackedAssetSymbol: matchedAsset.symbol,
        trackedAssetType: matchedAsset.asset_type,
      },
    });

    results.push({
      ok: true,
      txHash: rawEvent.txHash,
      onchainEventId: onchainEvent.id,
      xpEventId: ledger.xpEventId,
      effectiveXp: scoring.effectiveXp,
    });
  }

  return {
    ok: true,
    processed: results.length,
    results,
  };
}
