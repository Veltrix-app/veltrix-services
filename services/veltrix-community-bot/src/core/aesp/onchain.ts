import { supabaseAdmin } from "../../lib/supabase.js";
import type { OnchainIngressEvent, SupportedOnchainEventType, TrustSnapshotRow } from "../../types/aesp.js";
import { calculateEffectiveXp, getDefaultActionMultiplier, getDefaultBaseValue, getTrustMultiplierFromScore } from "./scoring.js";
import { emitXpEvent } from "./ledger.js";

function normalizeAddress(value: string) {
  return value.trim().toLowerCase();
}

function buildTrustReasons(eventType: SupportedOnchainEventType, walletVerified: boolean) {
  return {
    walletVerified,
    eventType,
    derivedAt: new Date().toISOString(),
  };
}

function deriveRiskFlags(event: OnchainIngressEvent) {
  const usdValue = Number(event.usdValue ?? 0);
  return {
    lowValueEvent: usdValue > 0 && usdValue < 5,
    transferLike: event.eventType === "transfer_in" || event.eventType === "transfer_out",
    exitLike: event.eventType === "unstake" || event.eventType === "lp_remove" || event.eventType === "transfer_out",
  };
}

export async function ingestOnchainEvents(input: {
  projectId: string;
  events: OnchainIngressEvent[];
}) {
  const results: Array<Record<string, unknown>> = [];

  for (const rawEvent of input.events) {
    const walletAddress = normalizeAddress(rawEvent.walletAddress);
    const contractAddress = normalizeAddress(rawEvent.contractAddress);
    const tokenAddress = rawEvent.tokenAddress ? normalizeAddress(rawEvent.tokenAddress) : null;

    const { data: walletLink, error: walletLinkError } = await supabaseAdmin
      .from("wallet_links")
      .select("id, auth_user_id, verified")
      .eq("wallet_address", walletAddress)
      .eq("verified", true)
      .maybeSingle();

    if (walletLinkError) {
      throw walletLinkError;
    }

    if (!walletLink?.auth_user_id) {
      results.push({
        ok: false,
        txHash: rawEvent.txHash,
        reason: "Wallet is not linked to a verified Veltrix account.",
      });
      continue;
    }

    const { data: trustSnapshot } = await supabaseAdmin
      .from("trust_snapshots")
      .select("score, reasons")
      .eq("auth_user_id", walletLink.auth_user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const trust = (trustSnapshot as TrustSnapshotRow | null) ?? { score: 50, reasons: {} };
    const derivedTrustMultiplier = getTrustMultiplierFromScore(trust.score);
    const baseValue = getDefaultBaseValue(rawEvent.eventType, rawEvent.usdValue);
    const scoring = calculateEffectiveXp({
      baseValue: typeof rawEvent.baseValue === "number" ? rawEvent.baseValue : baseValue,
      qualityMultiplier: rawEvent.qualityMultiplier ?? 1,
      trustMultiplier: rawEvent.trustMultiplier ?? derivedTrustMultiplier,
      actionMultiplier: rawEvent.actionMultiplier ?? getDefaultActionMultiplier(rawEvent.eventType),
    });

    const riskFlags = deriveRiskFlags(rawEvent);
    const timestamp = new Date().toISOString();

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
      throw onchainError;
    }

    await supabaseAdmin.from("trust_snapshots").insert({
      auth_user_id: walletLink.auth_user_id,
      score: trust.score ?? 50,
      reasons: {
        ...(trust.reasons ?? {}),
        ...buildTrustReasons(rawEvent.eventType, Boolean(walletLink.verified)),
        riskFlags,
      },
    });

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
