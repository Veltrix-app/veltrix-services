import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  buildProjectSwapTokenRegistryFromAssets,
  type ProjectSwapTokenAssetRegistryRow,
  type ProjectSwapTokenRegistryEntry,
} from "./vyntro-swap";

type ProjectAssetRow = {
  id: string | null;
  project_id: string | null;
  chain: string | null;
  contract_address: string | null;
  asset_type: string | null;
  symbol: string | null;
  decimals: number | null;
  is_active: boolean | null;
  metadata: Record<string, unknown> | null;
  updated_at?: string | null;
};

type ProjectRegistryRow = {
  id: string | null;
  name: string | null;
  status: string | null;
  is_public: boolean | null;
  token_contract_address: string | null;
};

export type ProjectContractScanEnrichment = {
  sourceVerified: boolean | null;
  abiAvailable: boolean | null;
  proxyDetected: boolean | null;
  ownerRenounced: boolean | null;
  auditUrl: string | null;
  explorerSourceUrl: string | null;
  updatedAt: string | null;
};

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readFlag(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function isTokenAssetType(value: string | null | undefined) {
  const type = value?.trim().toLowerCase() ?? "";
  return (
    type === "token" ||
    type === "erc20" ||
    type === "project_token" ||
    type === "utility_token" ||
    type === "governance_token"
  );
}

function buildExplorerSourceUrl(chain: string | null | undefined, address: string | null | undefined) {
  const tokenAddress = cleanString(address);
  if (!tokenAddress) return null;
  const normalizedChain = chain?.toLowerCase() ?? "";

  if (normalizedChain.includes("base")) return `https://basescan.org/address/${tokenAddress}#code`;
  if (normalizedChain.includes("bnb") || normalizedChain.includes("bsc")) {
    return `https://bscscan.com/address/${tokenAddress}#code`;
  }
  if (normalizedChain.includes("eth")) return `https://etherscan.io/address/${tokenAddress}#code`;

  return null;
}

function normalizeContractScanEnrichment(asset: ProjectAssetRow | null): ProjectContractScanEnrichment | null {
  if (!asset) return null;
  const metadata = asset.metadata ?? {};
  const scan = readObject(metadata.contractScan);

  return {
    sourceVerified: readFlag(scan.sourceVerified),
    abiAvailable: readFlag(scan.abiAvailable),
    proxyDetected: readFlag(scan.proxyDetected),
    ownerRenounced: readFlag(scan.ownerRenounced),
    auditUrl: cleanString(scan.auditUrl),
    explorerSourceUrl:
      cleanString(scan.explorerSourceUrl) ??
      buildExplorerSourceUrl(asset.chain, asset.contract_address),
    updatedAt: cleanString(scan.updatedAt) ?? cleanString(asset.updated_at),
  };
}

export async function loadProjectSwapTokenRegistry(input?: {
  projectId?: string | null;
}): Promise<ProjectSwapTokenRegistryEntry[]> {
  const supabase = createSupabaseServiceClient();
  const projectId = input?.projectId?.trim() ?? "";
  let assetQuery = supabase
    .from("project_assets")
    .select("id, project_id, chain, contract_address, asset_type, symbol, decimals, is_active, metadata")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (projectId) {
    assetQuery = assetQuery.eq("project_id", projectId);
  }

  const { data: assets, error: assetsError } = await assetQuery;
  if (assetsError) throw assetsError;

  const assetRows = (assets ?? []) as ProjectAssetRow[];
  const projectIds = Array.from(
    new Set(assetRows.map((asset) => asset.project_id).filter((id): id is string => Boolean(id)))
  );
  const projectsById = new Map<string, ProjectRegistryRow>();

  if (projectIds.length > 0) {
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name, status, is_public, token_contract_address")
      .in("id", projectIds)
      .eq("status", "active");

    if (projectsError) throw projectsError;

    for (const project of (projects ?? []) as ProjectRegistryRow[]) {
      if (project.id) projectsById.set(project.id, project);
    }
  }

  const registryRows: ProjectSwapTokenAssetRegistryRow[] = assetRows.map((asset) => ({
    ...asset,
    project: asset.project_id ? projectsById.get(asset.project_id) ?? null : null,
  }));

  return buildProjectSwapTokenRegistryFromAssets(registryRows);
}

export async function loadProjectContractScanEnrichment(input: {
  projectId: string;
  tokenContractAddress?: string | null;
}): Promise<ProjectContractScanEnrichment | null> {
  const supabase = createSupabaseServiceClient();
  const projectId = input.projectId.trim();
  const tokenContractAddress = input.tokenContractAddress?.trim().toLowerCase() ?? "";

  if (!projectId) return null;

  const { data, error } = await supabase
    .from("project_assets")
    .select("id, project_id, chain, contract_address, asset_type, symbol, decimals, is_active, metadata, updated_at")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const assets = (data ?? []) as ProjectAssetRow[];
  const matchingAsset =
    assets.find(
      (asset) =>
        isTokenAssetType(asset.asset_type) &&
        Boolean(tokenContractAddress) &&
        asset.contract_address?.trim().toLowerCase() === tokenContractAddress
    ) ??
    assets.find((asset) => isTokenAssetType(asset.asset_type)) ??
    null;

  return normalizeContractScanEnrichment(matchingAsset);
}
