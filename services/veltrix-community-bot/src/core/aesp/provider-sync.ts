import { Contract, Interface, JsonRpcProvider, formatUnits, getAddress } from "ethers";
import { env } from "../../config/env.js";
import { supabaseAdmin } from "../../lib/supabase.js";
import type { OnchainIngressEvent } from "../../types/aesp.js";
import {
  buildOnchainCaseDedupeKey,
  resolveOnchainCaseByDedupeKey,
  upsertOnchainCase,
} from "../onchain/onchain-cases.js";
import { writeAdminAuditLog } from "../ops/admin-audit.js";
import { ingestOnchainEvents } from "./onchain.js";

type AssetSyncState = {
  lastSyncedBlock?: number;
  lastSyncedAt?: string;
  lastSyncStatus?: "completed" | "failed" | "skipped";
  lastSyncProcessed?: number;
  lastSyncGenerated?: number;
  lastSyncError?: string | null;
};

type AssetIndexerMetadata = {
  startBlock?: number;
  marketMakerAddresses?: string[];
  stakingContractAddresses?: string[];
  lpContractAddresses?: string[];
  allowedFunctions?: string[];
  trackContractCalls?: boolean;
  enableHoldTracking?: boolean;
  holdThresholdHours?: number;
  syncState?: AssetSyncState;
};

type ProjectAssetRow = {
  id: string;
  project_id: string;
  chain: string;
  contract_address: string;
  asset_type: string;
  symbol: string;
  decimals: number;
  metadata: Record<string, unknown> | null;
};

type ProjectWalletRow = {
  project_id: string;
  wallet_address: string;
  wallet_type: string;
};

type WalletLinkRow = {
  id: string;
  auth_user_id: string;
  wallet_address: string;
  verified_at: string | null;
  created_at: string | null;
  risk_label: string | null;
};

type PriorOnchainRow = {
  wallet_link_id: string | null;
  event_type: string;
  block_time: string;
};

type SyncInput = {
  projectId?: string | null;
  limit?: number;
  maxBlocks?: number;
};

type SyncAssetResult = {
  assetId: string;
  projectId: string;
  symbol: string;
  fromBlock: number | null;
  toBlock: number | null;
  generatedEvents: number;
  processed: number;
  synced: boolean;
  status: "completed" | "failed" | "skipped";
  reason?: string;
};

const transferInterface = new Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address) view returns (uint256)",
]);

function normalizeAddress(value: string) {
  try {
    return getAddress(value).toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true") {
      return true;
    }
    if (lowered === "false") {
      return false;
    }
  }

  return null;
}

function asStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((item) => (typeof item === "string" ? normalizeAddress(item) : ""))
    .filter(Boolean);
}

function asSelectorList(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter(Boolean);
}

function parseAssetIndexerMetadata(metadata: Record<string, unknown> | null | undefined): AssetIndexerMetadata {
  const source = asObject(metadata);
  const syncState = asObject(source.syncState);

  return {
    startBlock: asNumber(source.startBlock) ?? undefined,
    marketMakerAddresses: asStringList(source.marketMakerAddresses),
    stakingContractAddresses: asStringList(source.stakingContractAddresses),
    lpContractAddresses: asStringList(source.lpContractAddresses),
    allowedFunctions: asSelectorList(source.allowedFunctions),
    trackContractCalls: asBoolean(source.trackContractCalls) ?? undefined,
    enableHoldTracking: asBoolean(source.enableHoldTracking) ?? undefined,
    holdThresholdHours: asNumber(source.holdThresholdHours) ?? undefined,
    syncState: {
      lastSyncedBlock: asNumber(syncState.lastSyncedBlock) ?? undefined,
      lastSyncedAt:
        typeof syncState.lastSyncedAt === "string" ? syncState.lastSyncedAt : undefined,
      lastSyncStatus:
        syncState.lastSyncStatus === "failed" ||
        syncState.lastSyncStatus === "skipped" ||
        syncState.lastSyncStatus === "completed"
          ? syncState.lastSyncStatus
          : undefined,
      lastSyncProcessed: asNumber(syncState.lastSyncProcessed) ?? undefined,
      lastSyncGenerated: asNumber(syncState.lastSyncGenerated) ?? undefined,
      lastSyncError:
        typeof syncState.lastSyncError === "string" ? syncState.lastSyncError : undefined,
    },
  };
}

function buildNextAssetMetadata(
  metadata: Record<string, unknown> | null | undefined,
  syncState: AssetSyncState
) {
  const next = asObject(metadata);
  return {
    ...next,
    syncState: {
      ...asObject(next.syncState),
      ...syncState,
    },
  };
}

async function loadPagedRows<T>(loader: (from: number, to: number) => Promise<T[]>) {
  const pageSize = 1000;
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const page = await loader(from, from + pageSize - 1);
    rows.push(...page);

    if (page.length < pageSize) {
      return rows;
    }

    from += pageSize;
  }
}

async function loadTrackedAssets(projectId?: string | null) {
  const rows = await loadPagedRows<ProjectAssetRow>(async (from, to) => {
    let query = supabaseAdmin
      .from("project_assets")
      .select("id, project_id, chain, contract_address, asset_type, symbol, decimals, metadata")
      .eq("is_active", true)
      .eq("chain", "evm")
      .order("created_at", { ascending: true })
      .range(from, to);

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data ?? []) as ProjectAssetRow[];
  });

  return rows.map((row) => ({
    ...row,
    contract_address: normalizeAddress(row.contract_address),
  }));
}

async function loadProjectWallets(projectIds: string[]) {
  if (projectIds.length === 0) {
    return [] as ProjectWalletRow[];
  }

  const { data, error } = await supabaseAdmin
    .from("project_wallets")
    .select("project_id, wallet_address, wallet_type")
    .in("project_id", projectIds)
    .eq("is_active", true)
    .eq("chain", "evm");

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProjectWalletRow[]).map((row) => ({
    ...row,
    wallet_address: normalizeAddress(row.wallet_address),
    wallet_type: row.wallet_type.trim().toLowerCase(),
  }));
}

async function loadVerifiedWalletLinks() {
  const rows = await loadPagedRows<WalletLinkRow>(async (from, to) => {
    const { data, error } = await supabaseAdmin
      .from("wallet_links")
      .select("id, auth_user_id, wallet_address, verified_at, created_at, risk_label")
      .eq("verified", true)
      .eq("chain", "evm")
      .order("verified_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    return (data ?? []) as WalletLinkRow[];
  });

  return rows.map((row) => ({
    ...row,
    wallet_address: normalizeAddress(row.wallet_address),
  }));
}

async function loadPriorOnchainRows(projectId: string, contractAddress: string) {
  const { data, error } = await supabaseAdmin
    .from("onchain_events")
    .select("wallet_link_id, event_type, block_time")
    .eq("project_id", projectId)
    .eq("contract_address", contractAddress)
    .order("block_time", { ascending: false })
    .limit(500);

  if (error) {
    throw error;
  }

  return (data ?? []) as PriorOnchainRow[];
}

async function updateAssetSyncState(
  asset: ProjectAssetRow,
  nextState: AssetSyncState
) {
  const metadata = buildNextAssetMetadata(asset.metadata, nextState);
  const { error } = await supabaseAdmin
    .from("project_assets")
    .update({
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", asset.id);

  if (error) {
    throw error;
  }
}

function classifyTransferEvent(input: {
  walletAddress: string;
  fromAddress: string;
  toAddress: string;
  marketMakerAddresses: Set<string>;
  stakingContractAddresses: Set<string>;
  lpContractAddresses: Set<string>;
}) {
  if (input.walletAddress === input.fromAddress && input.stakingContractAddresses.has(input.toAddress)) {
    return "stake";
  }

  if (input.walletAddress === input.toAddress && input.stakingContractAddresses.has(input.fromAddress)) {
    return "unstake";
  }

  if (input.walletAddress === input.fromAddress && input.lpContractAddresses.has(input.toAddress)) {
    return "lp_add";
  }

  if (input.walletAddress === input.toAddress && input.lpContractAddresses.has(input.fromAddress)) {
    return "lp_remove";
  }

  if (input.walletAddress === input.toAddress && input.marketMakerAddresses.has(input.fromAddress)) {
    return "buy";
  }

  return input.walletAddress === input.toAddress ? "transfer_in" : "transfer_out";
}

function buildSyntheticHoldHash(input: {
  contractAddress: string;
  walletAddress: string;
  bucketStart: number;
}) {
  return `hold:${input.contractAddress}:${input.walletAddress}:${input.bucketStart}`;
}

async function getBlockIsoTimestamp(
  provider: JsonRpcProvider,
  cache: Map<number, string>,
  blockNumber: number
) {
  const cached = cache.get(blockNumber);
  if (cached) {
    return cached;
  }

  const block = await provider.getBlock(blockNumber);
  if (!block) {
    throw new Error(`Missing block ${blockNumber}.`);
  }

  const iso = new Date(block.timestamp * 1000).toISOString();
  cache.set(blockNumber, iso);
  return iso;
}

function coerceHexNumber(value: string | number) {
  if (typeof value === "number") {
    return value;
  }

  if (value.startsWith("0x")) {
    return Number.parseInt(value.slice(2), 16);
  }

  return Number.parseInt(value, 10);
}

async function buildTransferEventsForAsset(input: {
  provider: JsonRpcProvider;
  asset: ProjectAssetRow;
  fromBlock: number;
  toBlock: number;
  verifiedWalletByAddress: Map<string, WalletLinkRow>;
  projectWallets: ProjectWalletRow[];
  blockTimestampCache: Map<number, string>;
}) {
  const transferEvent = transferInterface.getEvent("Transfer");
  if (!transferEvent) {
    return {
      generatedEvents: [] as OnchainIngressEvent[],
      touchedWalletLinkIds: new Set<string>(),
    };
  }

  const logs = await input.provider.getLogs({
    address: input.asset.contract_address,
    fromBlock: input.fromBlock,
    toBlock: input.toBlock,
    topics: [transferEvent.topicHash],
  });

  const assetMetadata = parseAssetIndexerMetadata(input.asset.metadata);
  const marketMakerAddresses = new Set(assetMetadata.marketMakerAddresses ?? []);
  const stakingContractAddresses = new Set(assetMetadata.stakingContractAddresses ?? []);
  const lpContractAddresses = new Set([
    ...(assetMetadata.lpContractAddresses ?? []),
    ...input.projectWallets
      .filter((wallet) => wallet.wallet_type === "lp")
      .map((wallet) => wallet.wallet_address),
  ]);
  const generatedEvents: OnchainIngressEvent[] = [];
  const touchedWalletLinkIds = new Set<string>();

  for (const log of logs) {
    let parsed: ReturnType<Interface["parseLog"]>;
    try {
      parsed = transferInterface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
    } catch {
      continue;
    }

    if (!parsed) {
      continue;
    }

    const fromAddress = normalizeAddress(String(parsed.args.from ?? ""));
    const toAddress = normalizeAddress(String(parsed.args.to ?? ""));
    const value = parsed.args.value as bigint;
    const participants = [...new Set([fromAddress, toAddress])].filter((address) =>
      input.verifiedWalletByAddress.has(address)
    );

    if (participants.length === 0) {
      continue;
    }

    const occurredAt = await getBlockIsoTimestamp(
      input.provider,
      input.blockTimestampCache,
      coerceHexNumber(log.blockNumber)
    );

    for (const walletAddress of participants) {
      const walletLink = input.verifiedWalletByAddress.get(walletAddress);
      if (!walletLink) {
        continue;
      }

      touchedWalletLinkIds.add(walletLink.id);
      const eventType = classifyTransferEvent({
        walletAddress,
        fromAddress,
        toAddress,
        marketMakerAddresses,
        stakingContractAddresses,
        lpContractAddresses,
      });

      generatedEvents.push({
        chain: "evm",
        walletAddress,
        txHash: `${log.transactionHash}:log:${String(log.index)}`,
        occurredAt,
        eventType,
        contractAddress: input.asset.contract_address,
        tokenAddress: input.asset.contract_address,
        usdValue: null,
        metadata: {
          transactionHash: log.transactionHash,
          logIndex: String(log.index),
          fromAddress,
          toAddress,
          amountRaw: value.toString(),
          amountDecimal: Number.parseFloat(formatUnits(value, input.asset.decimals)),
          assetSymbol: input.asset.symbol,
          trackedAssetId: input.asset.id,
          trackedAssetType: input.asset.asset_type,
          marketMakerMatched:
            marketMakerAddresses.has(fromAddress) || marketMakerAddresses.has(toAddress),
          stakingContractMatched:
            stakingContractAddresses.has(fromAddress) || stakingContractAddresses.has(toAddress),
          lpContractMatched:
            lpContractAddresses.has(fromAddress) || lpContractAddresses.has(toAddress),
        },
      });
    }
  }

  return {
    generatedEvents,
    touchedWalletLinkIds,
  };
}

async function buildContractCallEventsForAsset(input: {
  provider: JsonRpcProvider;
  asset: ProjectAssetRow;
  fromBlock: number;
  toBlock: number;
  verifiedWalletByAddress: Map<string, WalletLinkRow>;
  blockTimestampCache: Map<number, string>;
}) {
  const assetMetadata = parseAssetIndexerMetadata(input.asset.metadata);
  const allowedFunctions = new Set(assetMetadata.allowedFunctions ?? []);
  const shouldTrackContractCalls =
    input.asset.asset_type === "staking_pool" ||
    allowedFunctions.size > 0 ||
    assetMetadata.trackContractCalls === true;

  if (!shouldTrackContractCalls) {
    return {
      generatedEvents: [] as OnchainIngressEvent[],
      touchedWalletLinkIds: new Set<string>(),
    };
  }

  const logs = await input.provider.getLogs({
    address: input.asset.contract_address,
    fromBlock: input.fromBlock,
    toBlock: input.toBlock,
  });

  const seenTransactions = new Set<string>();
  const generatedEvents: OnchainIngressEvent[] = [];
  const touchedWalletLinkIds = new Set<string>();

  for (const log of logs) {
    if (seenTransactions.has(log.transactionHash)) {
      continue;
    }

    seenTransactions.add(log.transactionHash);
    const transaction = await input.provider.getTransaction(log.transactionHash);
    if (!transaction?.from || !transaction.to) {
      continue;
    }

    const fromAddress = normalizeAddress(transaction.from);
    const toAddress = normalizeAddress(transaction.to);
    const walletLink = input.verifiedWalletByAddress.get(fromAddress);
    if (!walletLink || toAddress !== input.asset.contract_address) {
      continue;
    }

    const functionName = transaction.data.slice(0, 10).toLowerCase();
    if (allowedFunctions.size > 0 && !allowedFunctions.has(functionName)) {
      continue;
    }

    touchedWalletLinkIds.add(walletLink.id);

    generatedEvents.push({
      chain: "evm",
      walletAddress: fromAddress,
      txHash: `${transaction.hash}:call:${input.asset.id}`,
      occurredAt: await getBlockIsoTimestamp(
        input.provider,
        input.blockTimestampCache,
        Number(transaction.blockNumber ?? 0)
      ),
      eventType: "contract_call",
      contractAddress: input.asset.contract_address,
      tokenAddress: null,
      usdValue: null,
      metadata: {
        transactionHash: transaction.hash,
        functionName,
        trackedAssetId: input.asset.id,
        trackedAssetType: input.asset.asset_type,
      },
    });
  }

  return {
    generatedEvents,
    touchedWalletLinkIds,
  };
}

async function buildHoldEventsForAsset(input: {
  provider: JsonRpcProvider;
  asset: ProjectAssetRow;
  candidateWalletIds: Set<string>;
  verifiedWalletById: Map<string, WalletLinkRow>;
  priorRows: PriorOnchainRow[];
  syncTimestamp: number;
}) {
  const assetMetadata = parseAssetIndexerMetadata(input.asset.metadata);
  const enableHoldTracking =
    assetMetadata.enableHoldTracking ?? input.asset.asset_type !== "staking_pool";
  if (!enableHoldTracking || input.candidateWalletIds.size === 0) {
    return [] as OnchainIngressEvent[];
  }

  const holdThresholdHours =
    assetMetadata.holdThresholdHours ?? env.ONCHAIN_SYNC_DEFAULT_HOLD_THRESHOLD_HOURS;
  const holdThresholdMs = holdThresholdHours * 60 * 60 * 1000;
  const contract = new Contract(
    input.asset.contract_address,
    ["function balanceOf(address) view returns (uint256)"],
    input.provider
  );

  const lastHoldAt = new Map<string, number>();
  const lastMovementAt = new Map<string, number>();
  for (const row of input.priorRows) {
    if (!row.wallet_link_id) {
      continue;
    }

    const timestamp = new Date(row.block_time).getTime();
    if (!Number.isFinite(timestamp)) {
      continue;
    }

    if (row.event_type === "hold" && !lastHoldAt.has(row.wallet_link_id)) {
      lastHoldAt.set(row.wallet_link_id, timestamp);
      continue;
    }

    if (row.event_type !== "hold" && !lastMovementAt.has(row.wallet_link_id)) {
      lastMovementAt.set(row.wallet_link_id, timestamp);
    }
  }

  const generatedEvents: OnchainIngressEvent[] = [];
  let balanceLookupSupported = true;

  for (const walletLinkId of input.candidateWalletIds) {
    if (!balanceLookupSupported) {
      break;
    }

    const walletLink = input.verifiedWalletById.get(walletLinkId);
    if (!walletLink) {
      continue;
    }

    const latestMovementAt = lastMovementAt.get(walletLink.id);
    if (!latestMovementAt) {
      continue;
    }

    const holdDurationMs = input.syncTimestamp - latestMovementAt;
    if (holdDurationMs < holdThresholdMs) {
      continue;
    }

    const bucketStart = Math.floor(input.syncTimestamp / holdThresholdMs) * holdThresholdMs;
    const previousHoldAt = lastHoldAt.get(walletLink.id);
    if (previousHoldAt && previousHoldAt >= bucketStart) {
      continue;
    }

    let balanceRaw: bigint;
    try {
      balanceRaw = (await contract.balanceOf(walletLink.wallet_address)) as bigint;
    } catch {
      balanceLookupSupported = false;
      break;
    }

    if (balanceRaw <= 0n) {
      continue;
    }

    generatedEvents.push({
      chain: "evm",
      walletAddress: walletLink.wallet_address,
      txHash: buildSyntheticHoldHash({
        contractAddress: input.asset.contract_address,
        walletAddress: walletLink.wallet_address,
        bucketStart,
      }),
      occurredAt: new Date(input.syncTimestamp).toISOString(),
      eventType: "hold",
      contractAddress: input.asset.contract_address,
      tokenAddress: input.asset.contract_address,
      usdValue: null,
      metadata: {
        trackedAssetId: input.asset.id,
        trackedAssetType: input.asset.asset_type,
        balanceRaw: balanceRaw.toString(),
        balanceDecimal: Number.parseFloat(formatUnits(balanceRaw, input.asset.decimals)),
        holdDurationHours: Number((holdDurationMs / (60 * 60 * 1000)).toFixed(2)),
      },
    });
  }

  return generatedEvents;
}

export async function syncOnchainProvider(input: SyncInput = {}) {
  if (!env.ONCHAIN_EVM_RPC_URL) {
    throw new Error("ONCHAIN_EVM_RPC_URL is missing for provider sync.");
  }

  const provider = new JsonRpcProvider(env.ONCHAIN_EVM_RPC_URL);
  const latestBlock = await provider.getBlockNumber();
  const latestSafeBlock = latestBlock - env.ONCHAIN_SYNC_CONFIRMATIONS;

  if (latestSafeBlock <= 0) {
    return {
      ok: true,
      provider: "evm_rpc",
      latestBlock,
      latestSafeBlock,
      syncedAssets: 0,
      generatedEvents: 0,
      processedEvents: 0,
      results: [] as SyncAssetResult[],
    };
  }

  const assets = (await loadTrackedAssets(input.projectId))
    .filter((asset) => asset.chain === "evm")
    .slice(0, input.limit ?? 50);
  const verifiedWallets = await loadVerifiedWalletLinks();
  const verifiedWalletByAddress = new Map(
    verifiedWallets.map((wallet) => [wallet.wallet_address, wallet] as const)
  );
  const verifiedWalletById = new Map(
    verifiedWallets.map((wallet) => [wallet.id, wallet] as const)
  );
  const projectWallets = await loadProjectWallets(
    [...new Set(assets.map((asset) => asset.project_id))]
  );
  const projectWalletsByProject = new Map<string, ProjectWalletRow[]>();
  for (const wallet of projectWallets) {
    const current = projectWalletsByProject.get(wallet.project_id) ?? [];
    current.push(wallet);
    projectWalletsByProject.set(wallet.project_id, current);
  }

  const blockTimestampCache = new Map<number, string>();
  const results: SyncAssetResult[] = [];
  let generatedEvents = 0;
  let processedEvents = 0;

  for (const asset of assets) {
    const metadata = parseAssetIndexerMetadata(asset.metadata);
    const cursorBlock =
      metadata.syncState?.lastSyncedBlock ??
      metadata.startBlock ??
      Math.max(latestSafeBlock - env.ONCHAIN_SYNC_BACKFILL_BLOCKS, 0);
    const fromBlock = metadata.syncState?.lastSyncedBlock ? cursorBlock + 1 : cursorBlock;
    const requestedSpan = input.maxBlocks ?? env.ONCHAIN_SYNC_BATCH_BLOCKS;
    const toBlock = Math.min(fromBlock + requestedSpan - 1, latestSafeBlock);

    if (toBlock < fromBlock) {
      const nextState: AssetSyncState = {
        lastSyncedBlock: cursorBlock,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: "skipped",
        lastSyncProcessed: 0,
        lastSyncGenerated: 0,
        lastSyncError: null,
      };
      await updateAssetSyncState(asset, nextState);
      results.push({
        assetId: asset.id,
        projectId: asset.project_id,
        symbol: asset.symbol,
        fromBlock: null,
        toBlock: null,
        generatedEvents: 0,
        processed: 0,
        synced: false,
        status: "skipped",
        reason: "Asset is already synced up to the latest safe block.",
      });
      continue;
    }

    try {
      const projectScopedWallets = projectWalletsByProject.get(asset.project_id) ?? [];
      const transferResult = await buildTransferEventsForAsset({
        provider,
        asset,
        fromBlock,
        toBlock,
        verifiedWalletByAddress,
        projectWallets: projectScopedWallets,
        blockTimestampCache,
      });
      const contractCallResult = await buildContractCallEventsForAsset({
        provider,
        asset,
        fromBlock,
        toBlock,
        verifiedWalletByAddress,
        blockTimestampCache,
      });
      const priorRows = await loadPriorOnchainRows(asset.project_id, asset.contract_address);
      const holdEvents = await buildHoldEventsForAsset({
        provider,
        asset,
        candidateWalletIds: new Set([
          ...transferResult.touchedWalletLinkIds,
          ...contractCallResult.touchedWalletLinkIds,
          ...priorRows
            .map((row) => row.wallet_link_id)
            .filter((value): value is string => Boolean(value)),
        ]),
        verifiedWalletById,
        priorRows,
        syncTimestamp: Date.now(),
      });
      const events = [
        ...transferResult.generatedEvents,
        ...contractCallResult.generatedEvents,
        ...holdEvents,
      ];

      const ingestionResult =
        events.length > 0
          ? await ingestOnchainEvents({
              projectId: asset.project_id,
              events,
            })
          : { ok: true, processed: 0, results: [] as Array<Record<string, unknown>> };

      generatedEvents += events.length;
      processedEvents += Number(ingestionResult.processed ?? 0);

      const nextState: AssetSyncState = {
        lastSyncedBlock: toBlock,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: "completed",
        lastSyncProcessed: Number(ingestionResult.processed ?? 0),
        lastSyncGenerated: events.length,
        lastSyncError: null,
      };

      await updateAssetSyncState(asset, nextState);
      await writeAdminAuditLog({
        projectId: asset.project_id,
        sourceTable: "project_assets",
        sourceId: asset.id,
        action: "onchain_provider_sync_completed",
        summary: `Provider sync processed ${events.length} normalized events for ${asset.symbol}.`,
        metadata: {
          provider: "evm_rpc",
          symbol: asset.symbol,
          contractAddress: asset.contract_address,
          fromBlock,
          toBlock,
          generatedEvents: events.length,
          processedEvents: Number(ingestionResult.processed ?? 0),
          latestSafeBlock,
        },
      });
      await resolveOnchainCaseByDedupeKey({
        projectId: asset.project_id,
        dedupeKey: buildOnchainCaseDedupeKey(["provider_sync_failure", asset.id]),
        summary: `Provider sync recovered for ${asset.symbol}.`,
      }).catch(() => null);

      results.push({
        assetId: asset.id,
        projectId: asset.project_id,
        symbol: asset.symbol,
        fromBlock,
        toBlock,
        generatedEvents: events.length,
        processed: Number(ingestionResult.processed ?? 0),
        synced: true,
        status: "completed",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown provider sync failure.";
      const nextState: AssetSyncState = {
        lastSyncedBlock: metadata.syncState?.lastSyncedBlock,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: "failed",
        lastSyncProcessed: 0,
        lastSyncGenerated: 0,
        lastSyncError: message,
      };
      await updateAssetSyncState(asset, nextState);
      await writeAdminAuditLog({
        projectId: asset.project_id,
        sourceTable: "project_assets",
        sourceId: asset.id,
        action: "onchain_provider_sync_failed",
        summary: message,
        metadata: {
          provider: "evm_rpc",
          symbol: asset.symbol,
          contractAddress: asset.contract_address,
          latestSafeBlock,
        },
      });
      await upsertOnchainCase({
        projectId: asset.project_id,
        assetId: asset.id,
        caseType: "provider_sync_failure",
        severity: "high",
        status: "blocked",
        sourceType: "provider_sync",
        sourceId: asset.id,
        dedupeKey: buildOnchainCaseDedupeKey(["provider_sync_failure", asset.id]),
        summary: message,
        evidenceSummary: `Provider sync could not finish for tracked asset ${asset.symbol}.`,
        rawPayload: {
          provider: "evm_rpc",
          symbol: asset.symbol,
          contractAddress: asset.contract_address,
          fromBlock,
          toBlock,
          latestSafeBlock,
        },
        metadata: {
          symbol: asset.symbol,
          contractAddress: asset.contract_address,
        },
      }).catch(() => null);

      results.push({
        assetId: asset.id,
        projectId: asset.project_id,
        symbol: asset.symbol,
        fromBlock,
        toBlock,
        generatedEvents: 0,
        processed: 0,
        synced: false,
        status: "failed",
        reason: message,
      });
    }
  }

  await writeAdminAuditLog({
    sourceTable: "onchain_provider_sync",
    sourceId: input.projectId ?? "all-projects",
    action: "onchain_provider_sync_job_completed",
    summary: `Provider sync scanned ${results.length} tracked assets and generated ${generatedEvents} normalized events.`,
    metadata: {
      provider: "evm_rpc",
      latestBlock,
      latestSafeBlock,
      syncedAssets: results.filter((row) => row.status === "completed").length,
      failedAssets: results.filter((row) => row.status === "failed").length,
      skippedAssets: results.filter((row) => row.status === "skipped").length,
      generatedEvents,
      processedEvents,
    },
  });

  return {
    ok: true,
    provider: "evm_rpc",
    latestBlock,
    latestSafeBlock,
    syncedAssets: results.filter((row) => row.status === "completed").length,
    generatedEvents,
    processedEvents,
    results,
  };
}
