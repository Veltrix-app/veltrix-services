import { NextRequest, NextResponse } from "next/server";
import { loadProjectSwapTokenRegistry } from "@/lib/defi/project-token-registry";
import {
  VYNTRO_SWAP_CHAIN_ID,
  getAllSwapTokens,
  type ProjectSwapTokenRegistryEntry,
} from "@/lib/defi/vyntro-swap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  let registryStatus: "live" | "fallback" = "live";
  let projectTokens: ProjectSwapTokenRegistryEntry[] = [];

  try {
    projectTokens = await loadProjectSwapTokenRegistry({
      projectId: request.nextUrl.searchParams.get("projectId"),
    });
  } catch {
    registryStatus = "fallback";
  }

  return NextResponse.json(
    {
      ok: true,
      chainId: VYNTRO_SWAP_CHAIN_ID,
      registryStatus,
      tokens: getAllSwapTokens({ projectTokens }),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    }
  );
}
