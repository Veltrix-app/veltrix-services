import { NextResponse } from "next/server";
import {
  loadProjectContractScanEnrichment,
  loadProjectSwapTokenRegistry,
} from "@/lib/defi/project-token-registry";
import { fetchProjectTokenPriceSnapshot } from "@/lib/defi/vyntro-prices";
import { getSwapTokenByAddress, isEvmAddress, normalizeAddress } from "@/lib/defi/vyntro-swap";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProjectMarketRow = {
  id: string;
  name: string | null;
  status: string | null;
  is_public: boolean | null;
  token_contract_address: string | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const projectId = id?.trim();

  if (!projectId) {
    return NextResponse.json({ ok: false, error: "Missing project id." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, status, is_public, token_contract_address")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      return NextResponse.json({ ok: false, error: projectError.message }, { status: 500 });
    }

    const projectRow = project as ProjectMarketRow | null;
    if (!projectRow || projectRow.status !== "active" || projectRow.is_public === false) {
      return NextResponse.json({ ok: false, error: "Project market data not found." }, { status: 404 });
    }

    const projectSwapTokens = await loadProjectSwapTokenRegistry({ projectId });
    const tokenContractAddress = projectRow.token_contract_address?.trim() ?? "";
    const contractScanEnrichment = await loadProjectContractScanEnrichment({
      projectId,
      tokenContractAddress,
    });
    const knownSwapToken = getSwapTokenByAddress(tokenContractAddress, {
      projectTokens: projectSwapTokens,
    });
    const fallbackToken =
      !knownSwapToken && isEvmAddress(tokenContractAddress)
        ? {
            symbol: projectSwapTokens[0]?.symbol ?? "TOKEN",
            address: normalizeAddress(tokenContractAddress),
            chainId: 8453 as const,
          }
        : null;
    const tokenPrice =
      knownSwapToken || fallbackToken
        ? await fetchProjectTokenPriceSnapshot({
            token: knownSwapToken ?? fallbackToken!,
          })
        : null;

    return NextResponse.json(
      {
        ok: true,
        projectId,
        projectSwapTokens,
        tokenPrice,
        contractScanEnrichment,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Project showcase market data could not be loaded.",
      },
      { status: 500 }
    );
  }
}
