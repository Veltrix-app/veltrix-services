import { NextResponse } from "next/server";
import { listDocsStateExplorerDatasets, loadDocsStateExplorerDataset } from "@/lib/docs-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({
      items: listDocsStateExplorerDatasets(),
    });
  }

  const dataset = loadDocsStateExplorerDataset(slug);

  if (!dataset) {
    return NextResponse.json({ error: "State dataset not found" }, { status: 404 });
  }

  return NextResponse.json(dataset);
}
