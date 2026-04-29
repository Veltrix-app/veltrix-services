import { supabaseAdmin } from "../../lib/supabase.js";
import { calculateTradingScore, rankTradingParticipants } from "./scoring.js";
import {
  createTrackingProviderRun,
  finishTrackingProviderRun,
  getTradingCompetition,
  getTradingCompetitionParticipants,
  listTradingCompetitions,
  recordTrackingUsage,
  setTradingCompetitionStatus,
  upsertTradingLeaderboardRows,
} from "./repository.js";
import type { TradingCompetitionRead, TradingLeaderboardInput } from "./types.js";

type UnknownRecord = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeAddress(value: unknown) {
  return asString(value).toLowerCase();
}

function inferSide(eventType: string): "buy" | "sell" | "swap" {
  if (["buy", "stake", "lp_add", "transfer_in"].includes(eventType)) return "buy";
  if (["sell", "unstake", "lp_remove", "transfer_out"].includes(eventType)) return "sell";
  return "swap";
}

function pairMatchesEvent(pair: TradingCompetitionRead["pairs"][number], event: UnknownRecord) {
  const contractAddress = normalizeAddress(event.contract_address);
  const tokenAddress = normalizeAddress(event.token_address);
  const addresses = [
    pair.baseTokenAddress,
    pair.quoteTokenAddress,
    pair.poolAddress,
    pair.routerAddress,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  return addresses.includes(contractAddress) || addresses.includes(tokenAddress);
}

async function importExistingOnchainEvents(competition: TradingCompetitionRead) {
  const participants = await getTradingCompetitionParticipants({ competitionId: competition.id });
  const participantsByAuthUser = new Map(
    participants.map((participant) => [asString(participant.auth_user_id), participant])
  );
  let query = supabaseAdmin
    .from("onchain_events")
    .select("id, auth_user_id, chain, tx_hash, block_time, event_type, contract_address, token_address, usd_value, metadata")
    .eq("project_id", competition.projectId)
    .gte("block_time", competition.startsAt)
    .lte("block_time", competition.endsAt);

  if (competition.campaignId) {
    query = query.eq("campaign_id", competition.campaignId);
  }

  const { data, error } = await query.limit(500);
  if (error) throw error;

  const rows = (data ?? [])
    .map((event) => {
      const participant = participantsByAuthUser.get(asString(event.auth_user_id));
      if (!participant) return null;
      const pair =
        competition.pairs.find((candidate) => pairMatchesEvent(candidate, event as UnknownRecord)) ??
        competition.pairs[0];
      if (!pair) return null;

      return {
        competition_id: competition.id,
        pair_id: pair.id,
        participant_id: asString(participant.id),
        auth_user_id: asString(event.auth_user_id),
        wallet_address: normalizeAddress(participant.wallet_address),
        chain: asString(event.chain, competition.chain),
        tx_hash: asString(event.tx_hash).toLowerCase(),
        log_index: 0,
        block_number: null,
        block_time: asString(event.block_time),
        side: inferSide(asString(event.event_type)),
        base_amount: 0,
        quote_amount: asNumber(event.usd_value, 0),
        usd_value: asNumber(event.usd_value, 0),
        source_provider: "vyntro_onchain_events",
        raw_payload: {
          onchainEventId: event.id,
          eventType: event.event_type,
          metadata: event.metadata ?? {},
        },
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (rows.length === 0) return 0;

  const { error: upsertError } = await supabaseAdmin
    .from("trading_competition_events")
    .upsert(rows, { onConflict: "competition_id,chain,tx_hash,log_index" });

  if (upsertError) throw upsertError;
  return rows.length;
}

export async function rebuildLiveTradingLeaderboard(input: {
  competitionId: string;
  final?: boolean;
}) {
  const { competition } = await getTradingCompetition({ competitionId: input.competitionId });
  const participants = await getTradingCompetitionParticipants({ competitionId: competition.id });
  const { data: events, error: eventsError } = await supabaseAdmin
    .from("trading_competition_events")
    .select("participant_id, auth_user_id, side, usd_value, block_time")
    .eq("competition_id", competition.id);

  if (eventsError) throw eventsError;

  const eventsByParticipant = new Map<string, UnknownRecord[]>();
  for (const event of events ?? []) {
    const participantId = asString(event.participant_id);
    eventsByParticipant.set(participantId, [
      ...(eventsByParticipant.get(participantId) ?? []),
      event as UnknownRecord,
    ]);
  }

  const rows: TradingLeaderboardInput[] = participants.map((participant) => {
    const participantEvents = eventsByParticipant.get(asString(participant.id)) ?? [];
    const volumeUsd = participantEvents.reduce((sum, event) => sum + asNumber(event.usd_value, 0), 0);
    const buyVolume = participantEvents
      .filter((event) => asString(event.side) === "buy")
      .reduce((sum, event) => sum + asNumber(event.usd_value, 0), 0);
    const sellVolume = participantEvents
      .filter((event) => asString(event.side) === "sell")
      .reduce((sum, event) => sum + asNumber(event.usd_value, 0), 0);
    const roiPercent = buyVolume > 0 ? ((sellVolume - buyVolume) / buyVolume) * 100 : 0;
    const activeDays = new Set(participantEvents.map((event) => asString(event.block_time).slice(0, 10))).size;
    const flagsCount = asNumber(participant.metadata?.flagsCount, 0);
    const score = calculateTradingScore({
      scoringMode: competition.scoringMode,
      volumeUsd,
      roiPercent,
      tradeCount: participantEvents.length,
      activeDays,
      trustScore: asNumber(participant.metadata?.trustScore, 60),
      flagsCount,
      maxVolumeUsdForScore: asNumber(competition.rules.maxVolumeUsdForScore, 10_000),
    });

    return {
      participantId: asString(participant.id),
      authUserId: asString(participant.auth_user_id),
      score: score.score,
      volumeUsd: Number(volumeUsd.toFixed(4)),
      roiPercent: Number(roiPercent.toFixed(4)),
      tradeCount: participantEvents.length,
      flagsCount,
      scoreBreakdown: score.breakdown,
    };
  });

  const ranked = rankTradingParticipants(rows);
  await upsertTradingLeaderboardRows({
    competitionId: competition.id,
    rows: ranked,
    status: input.final ? "final" : "active",
  });

  await recordTrackingUsage({
    projectId: competition.projectId,
    competitionId: competition.id,
    provider: "vyntro_live",
    chain: competition.chain,
    operationType: "leaderboard_rebuild",
    unitCount: ranked.length,
    estimatedCostCents: ranked.length > 0 ? 4 : 1,
    metadata: { final: input.final === true },
  });

  return {
    ok: true,
    rows: ranked.length,
  };
}

export async function runTradingLiveTrackingJobs(input: { limit?: number } = {}) {
  const competitions = await listTradingCompetitions({
    trackingMode: "live",
    status: ["scheduled", "live"],
    limit: input.limit ?? 20,
  });
  let importedEvents = 0;
  let rebuiltLeaderboards = 0;

  for (const listedCompetition of competitions.competitions) {
    const { competition } = await getTradingCompetition({ competitionId: listedCompetition.id });
    const runId = await createTrackingProviderRun({
      projectId: competition.projectId,
      competitionId: competition.id,
      provider: "vyntro_live",
      jobType: "live_tracking",
    });

    try {
      if (competition.costStatus === "capped") {
        await setTradingCompetitionStatus({ competitionId: competition.id, status: "paused" });
        await finishTrackingProviderRun({
          runId,
          status: "skipped",
          metadata: { reason: "Budget cap reached." },
        });
        continue;
      }

      if (competition.status === "scheduled" && new Date(competition.startsAt).getTime() <= Date.now()) {
        await setTradingCompetitionStatus({ competitionId: competition.id, status: "live" });
      }

      const imported = await importExistingOnchainEvents(competition);
      const leaderboard = await rebuildLiveTradingLeaderboard({ competitionId: competition.id });
      await recordTrackingUsage({
        projectId: competition.projectId,
        competitionId: competition.id,
        provider: "vyntro_live",
        chain: competition.chain,
        operationType: "event_decode",
        unitCount: imported,
        estimatedCostCents: Math.ceil(imported * 0.271),
        metadata: { source: "onchain_events" },
      });

      if (new Date(competition.endsAt).getTime() <= Date.now()) {
        await setTradingCompetitionStatus({ competitionId: competition.id, status: "settling" });
      }

      importedEvents += imported;
      rebuiltLeaderboards += leaderboard.rows;
      await finishTrackingProviderRun({
        runId,
        status: "succeeded",
        eventsProcessed: imported,
        usageCents: Math.ceil(imported * 0.271),
        metadata: { leaderboardRows: leaderboard.rows },
      });
    } catch (error) {
      await finishTrackingProviderRun({
        runId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Live tracking job failed.",
      });
    }
  }

  return {
    ok: true,
    competitionsScanned: competitions.competitions.length,
    importedEvents,
    rebuiltLeaderboards,
  };
}
