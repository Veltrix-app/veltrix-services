import { NextResponse } from "next/server";
import { BASE_SWAP_TOKENS, VYNTRO_SWAP_CHAIN_ID } from "@/lib/defi/vyntro-swap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      chainId: VYNTRO_SWAP_CHAIN_ID,
      tokens: BASE_SWAP_TOKENS,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    }
  );
}
