import { NextResponse } from "next/server";
import { loadPublicSubprocessors } from "@/lib/trust/public-trust";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await loadPublicSubprocessors();
    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load subprocessors.",
      },
      { status: 500 }
    );
  }
}
