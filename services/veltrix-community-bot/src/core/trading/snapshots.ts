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

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getPairMetric(pair: { metadata: Record<string, unknown> }, key: string) {
  return asNumber(pair.metadata[key], 0);
}

function getSnapshotCostCents(rows: number) {
  return Math.ceil(Math.max(rows, 1) * 0.15 + 5);
}

async function getExistingSnapshotTypes(competitionId: string) {
  const { data, error } = await supabaseAdmin
    .from("trading_competition_snapshots")
    .select("snapshot_type, snapshot_at")
    .eq("competition_id", competitionId)
    .order("snapshot_at", { ascending: false });

  if (error) throw error;

  return {
    hasStart: (data ?? []).some((row) => row.snapshot_type === "start"),
    hasEnd: (data ?? []).some((row) => row.snapshot_type === "end"),
    latestPeriodicAt:
      (data ?? []).find((row) => row.snapshot_type === "periodic")?.snapshot_at ?? null,
  };
}

function shouldRunPeriodicSnapshot(competition: TradingCompetitionRead, latestPeriodicAt: string | null) {
  if (competition.snapshotCadence === "start_end") return false;
  if (!latestPeriodicAt) return true;

  const elapsedMs = Date.now() - new Date(latestPeriodicAt).getTime();
  const requiredMs =
    competition.snapshotCadence === "daily" ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
  return elapsedMs >= requiredMs;
}

async function writeSnapshot(input: {
  competition: TradingCompetitionRead;
  snapshotType: "start" | "periodic" | "end";
}) {
  const participants = await getTradingCompetitionParticipants({
    competitionId: input.competition.id,
  });
  const snapshotAt = new Date().toISOString();
  const participantRows = participants.length > 0 ? participants : [null];
  const rows = input.competition.pairs.flatMap((pair) =>
    participantRows.map((participant) => ({
      competition_id: input.competition.id,
      pair_id: pair.id,
      participant_id: participant ? asString(participant.id) : null,
      snapshot_type: input.snapshotType,
      snapshot_at: snapshotAt,
      price_usd: getPairMetric(pair, "priceUsd"),
      liquidity_usd: getPairMetric(pair, "liquidityUsd"),
      wallet_balance: participant ? asNumber(participant.metadata?.walletBalance, 0) : null,
      wallet_value_usd: participant
        ? asNumber(participant.metadata?.walletValueUsd, 0)
        : null,
      source_provider: "vyntro_snapshot",
      raw_payload: {
        pair: {
          baseSymbol: pair.baseSymbol,
          quoteSymbol: pair.quoteSymbol,
          baseTokenAddress: pair.baseTokenAddress,
          poolAddress: pair.poolAddress,
        },
        participant: participant
          ? {
              authUserId: participant.auth_user_id,
              walletAddress: participant.wallet_address,
            }
          : null,
      },
    }))
  );

  if (rows.length === 0) {
    return { rows: 0, snapshotAt };
  }

  const { error } = await supabaseAdmin.from("trading_competition_snapshots").insert(rows);
  if (error) throw error;

  await recordTrackingUsage({
    projectId: input.competition.projectId,
    competitionId: input.competition.id,
    provider: "vyntro_snapshot",
    chain: input.competition.chain,
    operationType: "snapshot",
    unitCount: rows.length,
    estimatedCostCents: getSnapshotCostCents(rows.length),
    metadata: {
      snapshotType: input.snapshotType,
      snapshotAt,
    },
  });

  return { rows: rows.length, snapshotAt };
}

export async function rebuildSnapshotTradingLeaderboard(input: {
  competitionId: string;
  final?: boolean;
}) {
  const { competition } = await getTradingCompetition({ competitionId: input.competitionId });
  const { data: snapshots, error } = await supabaseAdmin
    .from("trading_competition_snapshots")
    .select("participant_id, snapshot_type, wallet_value_usd, snapshot_at")
    .eq("competition_id", input.competitionId)
    .not("participant_id", "is", null)
    .order("snapshot_at", { ascending: true });

  if (error) throw error;

  const participants = await getTradingCompetitionParticipants({ competitionId: input.competitionId });
  const byParticipant = new Map<string, typeof snapshots>();
  for (const snapshot of snapshots ?? []) {
    const participantId = asString(snapshot.participant_id);
    byParticipant.set(participantId, [...(byParticipant.get(participantId) ?? []), snapshot]);
  }

  const rows: TradingLeaderboardInput[] = participants.map((participant) => {
    const participantId = asString(participant.id);
    const participantSnapshots = byParticipant.get(participantId) ?? [];
    const startSnapshot =
      participantSnapshots.find((snapshot) => snapshot.snapshot_type === "start") ??
      participantSnapshots[0];
    const endSnapshot =
      [...participantSnapshots].reverse().find((snapshot) => snapshot.snapshot_type === "end") ??
      participantSnapshots[participantSnapshots.length - 1];
    const startValue = asNumber(startSnapshot?.wallet_value_usd, 0);
    const endValue = asNumber(endSnapshot?.wallet_value_usd, startValue);
    const roiPercent = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;
    const score = calculateTradingScore({
      scoringMode: competition.scoringMode,
      volumeUsd: Math.max(endValue, 0),
      roiPercent,
      tradeCount: participantSnapshots.length,
      activeDays: new Set(participantSnapshots.map((snapshot) => asString(snapshot.snapshot_at).slice(0, 10))).size,
      trustScore: asNumber(participant.metadata?.trustScore, 60),
      flagsCount: 0,
      maxVolumeUsdForScore: asNumber(competition.rules.maxVolumeUsdForScore, 10_000),
    });

    return {
      participantId,
      authUserId: asString(participant.auth_user_id),
      score: score.score,
      volumeUsd: Math.max(endValue, 0),
      roiPercent: Number(roiPercent.toFixed(4)),
      tradeCount: participantSnapshots.length,
      flagsCount: 0,
      scoreBreakdown: score.breakdown,
    };
  });

  const ranked = rankTradingParticipants(rows);
  await upsertTradingLeaderboardRows({
    competitionId: input.competitionId,
    rows: ranked,
    status: input.final ? "final" : "active",
  });

  await recordTrackingUsage({
    projectId: competition.projectId,
    competitionId: competition.id,
    provider: "vyntro_snapshot",
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

export async function runTradingSnapshotJobs(input: { limit?: number } = {}) {
  const competitions = await listTradingCompetitions({
    trackingMode: "snapshot",
    status: ["scheduled", "live"],
    limit: input.limit ?? 25,
  });
  let processed = 0;
  let snapshotsWritten = 0;

  for (const listedCompetition of competitions.competitions) {
    const { competition } = await getTradingCompetition({ competitionId: listedCompetition.id });
    const runId = await createTrackingProviderRun({
      projectId: competition.projectId,
      competitionId: competition.id,
      provider: "vyntro_snapshot",
      jobType: "snapshot",
    });

    try {
      const now = Date.now();
      const startsAt = new Date(competition.startsAt).getTime();
      const endsAt = new Date(competition.endsAt).getTime();
      const existing = await getExistingSnapshotTypes(competition.id);
      let snapshotType: "start" | "periodic" | "end" | null = null;

      if (now >= startsAt && !existing.hasStart) {
        snapshotType = "start";
      } else if (now >= endsAt && !existing.hasEnd) {
        snapshotType = "end";
      } else if (competition.status === "live" && shouldRunPeriodicSnapshot(competition, existing.latestPeriodicAt)) {
        snapshotType = "periodic";
      }

      if (competition.status === "scheduled" && now >= startsAt) {
        await setTradingCompetitionStatus({ competitionId: competition.id, status: "live" });
      }

      if (!snapshotType) {
        await finishTrackingProviderRun({
          runId,
          status: "skipped",
          metadata: { reason: "No snapshot due." },
        });
        continue;
      }

      const result = await writeSnapshot({ competition, snapshotType });
      await rebuildSnapshotTradingLeaderboard({
        competitionId: competition.id,
        final: snapshotType === "end",
      });

      if (snapshotType === "end") {
        await setTradingCompetitionStatus({ competitionId: competition.id, status: "settling" });
      }

      processed += 1;
      snapshotsWritten += result.rows;
      await finishTrackingProviderRun({
        runId,
        status: "succeeded",
        eventsProcessed: result.rows,
        latestSnapshotAt: result.snapshotAt,
        usageCents: getSnapshotCostCents(result.rows),
        metadata: { snapshotType },
      });
    } catch (error) {
      await finishTrackingProviderRun({
        runId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Snapshot job failed.",
      });
    }
  }

  return {
    ok: true,
    competitionsScanned: competitions.competitions.length,
    processed,
    snapshotsWritten,
  };
}
