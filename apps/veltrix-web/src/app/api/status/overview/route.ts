import { NextResponse } from "next/server";
import { loadPublicStatusOverview } from "@/lib/status/public-status";

export async function GET() {
  try {
    const overview = await loadPublicStatusOverview();

    return NextResponse.json(
      {
        ok: true,
        overview,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load public status overview.",
      },
      { status: 500 }
    );
  }
}
