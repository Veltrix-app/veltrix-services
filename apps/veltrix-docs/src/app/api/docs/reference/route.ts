import { NextResponse } from "next/server";
import { listDocsReferenceDatasets, loadDocsReferenceDataset } from "@/lib/docs-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({
      items: listDocsReferenceDatasets(),
    });
  }

  const dataset = loadDocsReferenceDataset(slug);

  if (!dataset) {
    return NextResponse.json({ error: "Reference dataset not found" }, { status: 404 });
  }

  return NextResponse.json(dataset);
}
