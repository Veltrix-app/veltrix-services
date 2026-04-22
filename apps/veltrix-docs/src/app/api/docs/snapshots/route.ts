import { NextResponse } from "next/server";
import { listDocsSurfaceSnapshots, loadDocsSurfaceSnapshot } from "@/lib/docs-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({
      items: listDocsSurfaceSnapshots(),
    });
  }

  const snapshot = loadDocsSurfaceSnapshot(slug);

  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
