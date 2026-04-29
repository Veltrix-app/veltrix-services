import { supabaseAdmin } from "../../lib/supabase.js";
import { deriveCostStatus } from "./cost-ledger.js";
import type {
  TradingCompetitionCreateInput,
  TradingCompetitionPairRead,
  TradingCompetitionRead,
  TradingCompetitionRewardRead,
  TradingCompetitionStatus,
  TradingCostStatus,
  TradingLeaderboardRow,
  TradingScoringMode,
  TradingSnapshotCadence,
  TradingTrackingMode,
} from "./types.js";

type JsonRecord = Record<string, unknown>;

export type TradingParticipantRead = {
  id: string;
  competitionId: string;
  competition_id: string;
  authUserId: string;
  auth_user_id: string;
  walletAddress: string;
  wallet_address: string;
  walletLinkId: string | null;
  wallet_link_id: string | null;
  status: string;
  joinedAt: string;
  joined_at: string;
  metadata: JsonRecord;
};

export type TrackingUsageInput = {
  projectId: string;
  competitionId?: string | null;
  provider: string;
  chain?: string;
  operationType:
    | "snapshot"
    | "rpc_call"
    | "log_scan"
    | "event_decode"
    | "leaderboard_rebuild"
    | "retry"
    | "storage_write";
  unitCount: number;
  estimatedCostCents: number;
  metadata?: JsonRecord;
};

export type ProviderRunInput = {
  projectId: string;
  competitionId?: string | null;
  provider: string;
  jobType: string;
  status: "queued" | "running" | "succeeded" | "failed" | "skipped";
  startedAt?: string | null;
  finishedAt?: string | null;
  latestBlockNumber?: number | null;
  latestSnapshotAt?: string | null;
  eventsProcessed?: number;
  usageCents?: number;
  errorMessage?: string | null;
  metadata?: JsonRecord;
};

function assertNoError(error: { message: string } | null, fallback: string): asserts error is null {
  if (error) {
    throw new Error(error.message || fallback);
  }
}

function toRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function toString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toNullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeWalletAddress(value: string) {
  return value.trim().toLowerCase();
}

export function resolveInitialCompetitionStatus(input: TradingCompetitionCreateInput): TradingCompetitionStatus {
  if (input.status) return input.status;
  return new Date(input.startsAt).getTime() > Date.now() ? "scheduled" : "live";
}

export function mapTradingPairRow(row: Record<string, unknown>): TradingCompetitionPairRead {
  return {
    id: toString(row.id),
    chain: toString(row.chain, "base"),
    baseSymbol: toString(row.base_symbol),
    quoteSymbol: toString(row.quote_symbol, "USDC"),
    baseTokenAddress: toString(row.base_token_address),
    quoteTokenAddress: toNullableString(row.quote_token_address),
    poolAddress: toNullableString(row.pool_address),
    routerAddress: toNullableString(row.router_address),
    minTradeUsd: toNumber(row.min_trade_usd, 5),
    isActive: toBoolean(row.is_active, true),
    metadata: toRecord(row.metadata),
  };
}

export function mapTradingRewardRow(row: Record<string, unknown>): TradingCompetitionRewardRead {
  return {
    id: toString(row.id),
    rewardAsset: toString(row.reward_asset),
    rewardAmount: toNumber(row.reward_amount),
    rankFrom: row.rank_from === null || row.rank_from === undefined ? null : toNumber(row.rank_from),
    rankTo: row.rank_to === null || row.rank_to === undefined ? null : toNumber(row.rank_to),
    rewardType:
      row.reward_type === "raffle" || row.reward_type === "participation" || row.reward_type === "xp"
        ? row.reward_type
        : "rank",
    metadata: toRecord(row.metadata),
  };
}

export function mapTradingCompetitionRow(
  row: Record<string, unknown>,
  pairs: TradingCompetitionPairRead[] = [],
  rewards: TradingCompetitionRewardRead[] = []
): TradingCompetitionRead {
  return {
    id: toString(row.id),
    projectId: toString(row.project_id),
    campaignId: toNullableString(row.campaign_id),
    title: toString(row.title),
    description: toString(row.description),
    bannerUrl: toNullableString(row.banner_url),
    status: toString(row.status, "draft") as TradingCompetitionStatus,
    trackingMode: toString(row.tracking_mode, "snapshot") as TradingTrackingMode,
    scoringMode: toString(row.scoring_mode, "hybrid") as TradingScoringMode,
    chain: toString(row.chain, "base"),
    quoteSymbol: toString(row.quote_symbol, "USDC"),
    startsAt: toString(row.starts_at),
    endsAt: toString(row.ends_at),
    freezeAt: toNullableString(row.freeze_at),
    snapshotCadence: toString(row.snapshot_cadence, "hourly") as TradingSnapshotCadence,
    budgetCapCents: toNumber(row.budget_cap_cents),
    currentCostCents: toNumber(row.current_cost_cents),
    costStatus: toString(row.cost_status, "ok") as TradingCostStatus,
    rules: toRecord(row.rules),
    metadata: toRecord(row.metadata),
    createdAt: toString(row.created_at),
    updatedAt: toString(row.updated_at),
    pairs,
    rewards,
  };
}

export function mapTradingParticipantRow(row: Record<string, unknown>): TradingParticipantRead {
  const competitionId = toString(row.competition_id);
  const authUserId = toString(row.auth_user_id);
  const walletAddress = toString(row.wallet_address);
  const walletLinkId = toNullableString(row.wallet_link_id);
  const joinedAt = toString(row.joined_at);

  return {
    id: toString(row.id),
    competitionId,
    competition_id: competitionId,
    authUserId,
    auth_user_id: authUserId,
    walletAddress,
    wallet_address: walletAddress,
    walletLinkId,
    wallet_link_id: walletLinkId,
    status: toString(row.status, "joined"),
    joinedAt,
    joined_at: joinedAt,
    metadata: toRecord(row.metadata),
  };
}

export function mapTradingLeaderboardRow(row: Record<string, unknown>): TradingLeaderboardRow & {
  status: string;
  calculatedAt: string;
} {
  return {
    participantId: toString(row.participant_id),
    authUserId: toString(row.auth_user_id),
    rank: toNumber(row.rank),
    score: toNumber(row.score),
    volumeUsd: toNumber(row.volume_usd),
    roiPercent: toNumber(row.roi_percent),
    tradeCount: toNumber(row.trade_count),
    flagsCount: toNumber(row.flags_count),
    scoreBreakdown: toRecord(row.score_breakdown),
    status: toString(row.status, "active"),
    calculatedAt: toString(row.calculated_at),
  };
}

export async function createTradingCompetition(input: TradingCompetitionCreateInput) {
  if (!input.pairs?.length) {
    throw new Error("At least one tracked pair is required.");
  }

  if (new Date(input.endsAt).getTime() <= new Date(input.startsAt).getTime()) {
    throw new Error("Trading competition end date must be after the start date.");
  }

  const { data: competition, error } = await supabaseAdmin
    .from("trading_competitions")
    .insert({
      project_id: input.projectId,
      campaign_id: input.campaignId ?? null,
      created_by_auth_user_id: input.createdByAuthUserId ?? null,
      title: input.title,
      description: input.description ?? "",
      banner_url: input.bannerUrl ?? null,
      status: resolveInitialCompetitionStatus(input),
      tracking_mode: input.trackingMode ?? "snapshot",
      scoring_mode: input.scoringMode ?? "hybrid",
      chain: input.chain ?? "base",
      quote_symbol: input.quoteSymbol ?? "USDC",
      registration_starts_at: input.registrationStartsAt ?? null,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      freeze_at: input.freezeAt ?? null,
      snapshot_cadence: input.snapshotCadence ?? "hourly",
      budget_cap_cents: input.budgetCapCents ?? 0,
      rules: input.rules ?? {},
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  assertNoError(error, "Trading competition could not be created.");

  const competitionId = toString(competition.id);
  const pairs = input.pairs.map((pair) => ({
    competition_id: competitionId,
    chain: pair.chain ?? input.chain ?? "base",
    base_symbol: pair.baseSymbol,
    quote_symbol: pair.quoteSymbol ?? input.quoteSymbol ?? "USDC",
    base_token_address: normalizeWalletAddress(pair.baseTokenAddress),
    quote_token_address: pair.quoteTokenAddress ? normalizeWalletAddress(pair.quoteTokenAddress) : null,
    pool_address: pair.poolAddress ? normalizeWalletAddress(pair.poolAddress) : null,
    router_address: pair.routerAddress ? normalizeWalletAddress(pair.routerAddress) : null,
    min_trade_usd: pair.minTradeUsd ?? 5,
    metadata: pair.metadata ?? {},
  }));

  const { error: pairsError } = await supabaseAdmin.from("trading_competition_pairs").insert(pairs);
  assertNoError(pairsError, "Trading competition pairs could not be created.");

  if (input.rewards?.length) {
    const rewards = input.rewards.map((reward) => ({
      competition_id: competitionId,
      reward_asset: reward.rewardAsset,
      reward_amount: reward.rewardAmount,
      rank_from: reward.rankFrom ?? null,
      rank_to: reward.rankTo ?? null,
      reward_type: reward.rewardType ?? "rank",
      metadata: reward.metadata ?? {},
    }));
    const { error: rewardsError } = await supabaseAdmin.from("trading_competition_rewards").insert(rewards);
    assertNoError(rewardsError, "Trading competition rewards could not be created.");
  }

  return getTradingCompetition({ competitionId });
}

export async function listTradingCompetitions(input: {
  projectId?: string;
  status?: TradingCompetitionStatus | TradingCompetitionStatus[];
  statuses?: TradingCompetitionStatus[];
  trackingMode?: TradingTrackingMode;
  limit?: number;
}) {
  let query = supabaseAdmin
    .from("trading_competitions")
    .select("*")
    .order("starts_at", { ascending: false })
    .limit(input.limit ?? 24);

  if (input.projectId) query = query.eq("project_id", input.projectId);
  if (Array.isArray(input.status) && input.status.length) query = query.in("status", input.status);
  if (input.status && !Array.isArray(input.status)) query = query.eq("status", input.status);
  if (input.statuses?.length) query = query.in("status", input.statuses);
  if (input.trackingMode) query = query.eq("tracking_mode", input.trackingMode);

  const { data, error } = await query;
  assertNoError(error, "Trading competitions could not be loaded.");

  const items = (data ?? []).map((row) => mapTradingCompetitionRow(row as Record<string, unknown>));

  return {
    ok: true,
    items,
    competitions: items,
  };
}

export async function getTradingCompetition(input: { competitionId: string }) {
  const { data: competition, error } = await supabaseAdmin
    .from("trading_competitions")
    .select("*")
    .eq("id", input.competitionId)
    .single();
  assertNoError(error, "Trading competition could not be loaded.");

  const [{ data: pairs, error: pairsError }, { data: rewards, error: rewardsError }] = await Promise.all([
    supabaseAdmin
      .from("trading_competition_pairs")
      .select("*")
      .eq("competition_id", input.competitionId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("trading_competition_rewards")
      .select("*")
      .eq("competition_id", input.competitionId)
      .order("rank_from", { ascending: true, nullsFirst: false }),
  ]);
  assertNoError(pairsError, "Trading competition pairs could not be loaded.");
  assertNoError(rewardsError, "Trading competition rewards could not be loaded.");

  return {
    ok: true,
    competition: mapTradingCompetitionRow(
      competition as Record<string, unknown>,
      (pairs ?? []).map((row) => mapTradingPairRow(row as Record<string, unknown>)),
      (rewards ?? []).map((row) => mapTradingRewardRow(row as Record<string, unknown>))
    ),
  };
}

export async function updateTradingCompetitionStatus(input: {
  competitionId: string;
  status: TradingCompetitionStatus;
  metadata?: JsonRecord;
}) {
  const updatePayload: Record<string, unknown> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  };
  if (input.metadata) updatePayload.metadata = input.metadata;

  const { data, error } = await supabaseAdmin
    .from("trading_competitions")
    .update(updatePayload)
    .eq("id", input.competitionId)
    .select("*")
    .single();
  assertNoError(error, "Trading competition status could not be updated.");

  return mapTradingCompetitionRow(data as Record<string, unknown>);
}

export async function setTradingCompetitionStatus(input: {
  competitionId: string;
  status: TradingCompetitionStatus;
  metadata?: JsonRecord;
}) {
  const competition = await updateTradingCompetitionStatus(input);
  return { ok: true, competition };
}

export async function joinTradingCompetition(input: { competitionId: string; authUserId: string }) {
  const { competition } = await getTradingCompetition(input);
  if (!["scheduled", "live"].includes(competition.status)) {
    throw new Error("Trading competition is not open for joins.");
  }

  const { data: wallet, error: walletError } = await supabaseAdmin
    .from("wallet_links")
    .select("id,wallet_address")
    .eq("auth_user_id", input.authUserId)
    .eq("verified", true)
    .order("verified_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  assertNoError(walletError, "Wallet link could not be loaded.");

  if (!wallet?.wallet_address) {
    throw new Error("Connect and verify a wallet before joining this Trading Arena.");
  }

  const { data, error } = await supabaseAdmin
    .from("trading_competition_participants")
    .upsert(
      {
        competition_id: input.competitionId,
        auth_user_id: input.authUserId,
        wallet_address: normalizeWalletAddress(toString(wallet.wallet_address)),
        wallet_link_id: toString(wallet.id),
        status: "joined",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "competition_id,auth_user_id" }
    )
    .select("*")
    .single();
  assertNoError(error, "Trading competition join could not be recorded.");

  return {
    ok: true,
    participant: mapTradingParticipantRow(data as Record<string, unknown>),
  };
}

export async function getTradingCompetitionParticipants(input: string | { competitionId: string }) {
  const competitionId = typeof input === "string" ? input : input.competitionId;
  const { data, error } = await supabaseAdmin
    .from("trading_competition_participants")
    .select("*")
    .eq("competition_id", competitionId)
    .order("joined_at", { ascending: true });
  assertNoError(error, "Trading competition participants could not be loaded.");

  return (data ?? []).map((row) => mapTradingParticipantRow(row as Record<string, unknown>));
}

export async function getTradingCompetitionPairs(competitionId: string) {
  const { data, error } = await supabaseAdmin
    .from("trading_competition_pairs")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  assertNoError(error, "Trading competition pairs could not be loaded.");

  return (data ?? []).map((row) => mapTradingPairRow(row as Record<string, unknown>));
}

export async function getTradingCompetitionLeaderboard(input: { competitionId: string; limit?: number }) {
  const { data, error } = await supabaseAdmin
    .from("trading_competition_leaderboard")
    .select("*")
    .eq("competition_id", input.competitionId)
    .order("rank", { ascending: true })
    .limit(input.limit ?? 100);
  assertNoError(error, "Trading competition leaderboard could not be loaded.");

  return {
    ok: true,
    items: (data ?? []).map((row) => mapTradingLeaderboardRow(row as Record<string, unknown>)),
  };
}

export async function upsertTradingLeaderboardRows(input: {
  competitionId: string;
  rows: TradingLeaderboardRow[];
  status?: "active" | "flagged" | "excluded" | "final";
}) {
  if (!input.rows.length) {
    return { ok: true, rows: 0 };
  }

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("trading_competition_leaderboard").upsert(
    input.rows.map((row) => ({
      competition_id: input.competitionId,
      participant_id: row.participantId,
      auth_user_id: row.authUserId,
      rank: row.rank,
      score: row.score,
      volume_usd: row.volumeUsd,
      roi_percent: row.roiPercent,
      trade_count: row.tradeCount,
      flags_count: row.flagsCount,
      score_breakdown: row.scoreBreakdown,
      status: input.status ?? "active",
      calculated_at: now,
      updated_at: now,
    })),
    { onConflict: "competition_id,participant_id" }
  );
  assertNoError(error, "Trading competition leaderboard could not be updated.");

  return { ok: true, rows: input.rows.length };
}

export async function writeTrackingUsage(input: TrackingUsageInput) {
  const { data, error } = await supabaseAdmin
    .from("tracking_usage_ledger")
    .insert({
      project_id: input.projectId,
      competition_id: input.competitionId ?? null,
      provider: input.provider,
      chain: input.chain ?? "base",
      operation_type: input.operationType,
      unit_count: input.unitCount,
      estimated_cost_cents: input.estimatedCostCents,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  assertNoError(error, "Tracking usage could not be recorded.");

  if (input.competitionId && input.estimatedCostCents > 0) {
    const { competition } = await getTradingCompetition({ competitionId: input.competitionId });
    const nextCost = competition.currentCostCents + input.estimatedCostCents;
    const costStatus = deriveCostStatus({
      currentCostCents: nextCost,
      budgetCapCents: competition.budgetCapCents,
    });

    const { error: updateError } = await supabaseAdmin
      .from("trading_competitions")
      .update({
        current_cost_cents: nextCost,
        cost_status: costStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.competitionId);
    assertNoError(updateError, "Trading competition cost state could not be updated.");
  }

  return { ok: true, usage: data };
}

export async function recordTrackingUsage(input: TrackingUsageInput) {
  return writeTrackingUsage(input);
}

export async function createTrackingProviderRun(input: {
  projectId: string;
  competitionId?: string | null;
  provider: string;
  jobType: string;
  metadata?: JsonRecord;
}) {
  const result = await recordTrackingProviderRun({
    ...input,
    status: "running",
    startedAt: new Date().toISOString(),
  });
  const run = result.run as Record<string, unknown>;
  const runId = toString(run.id);
  if (!runId) {
    throw new Error("Tracking provider run did not return an id.");
  }
  return runId;
}

export async function finishTrackingProviderRun(input: {
  runId: string;
  status: "succeeded" | "failed" | "skipped";
  latestBlockNumber?: number | null;
  latestSnapshotAt?: string | null;
  eventsProcessed?: number;
  usageCents?: number;
  errorMessage?: string | null;
  metadata?: JsonRecord;
}) {
  const { data, error } = await supabaseAdmin
    .from("tracking_provider_runs")
    .update({
      status: input.status,
      finished_at: new Date().toISOString(),
      latest_block_number: input.latestBlockNumber ?? null,
      latest_snapshot_at: input.latestSnapshotAt ?? null,
      events_processed: input.eventsProcessed ?? 0,
      usage_cents: input.usageCents ?? 0,
      error_message: input.errorMessage ?? null,
      metadata: input.metadata ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.runId)
    .select("*")
    .single();
  assertNoError(error, "Tracking provider run could not be finished.");

  return { ok: true, run: data };
}

export async function recordTrackingProviderRun(input: ProviderRunInput) {
  const { data, error } = await supabaseAdmin
    .from("tracking_provider_runs")
    .insert({
      project_id: input.projectId,
      competition_id: input.competitionId ?? null,
      provider: input.provider,
      job_type: input.jobType,
      status: input.status,
      started_at: input.startedAt ?? null,
      finished_at: input.finishedAt ?? null,
      latest_block_number: input.latestBlockNumber ?? null,
      latest_snapshot_at: input.latestSnapshotAt ?? null,
      events_processed: input.eventsProcessed ?? 0,
      usage_cents: input.usageCents ?? 0,
      error_message: input.errorMessage ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  assertNoError(error, "Tracking provider run could not be recorded.");

  return { ok: true, run: data };
}

export async function getOpenTradingFlagsByParticipant(competitionId: string) {
  const { data, error } = await supabaseAdmin
    .from("trading_competition_flags")
    .select("participant_id,status")
    .eq("competition_id", competitionId)
    .in("status", ["open", "upheld"]);
  assertNoError(error, "Trading flags could not be loaded.");

  return (data ?? []).reduce<Record<string, number>>((accumulator, row) => {
    const participantId = toNullableString((row as Record<string, unknown>).participant_id);
    if (!participantId) return accumulator;
    accumulator[participantId] = (accumulator[participantId] ?? 0) + 1;
    return accumulator;
  }, {});
}
