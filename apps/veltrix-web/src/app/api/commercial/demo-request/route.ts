import { NextRequest, NextResponse } from "next/server";
import { readGrowthAnalyticsContextFromRequest } from "@/lib/analytics/attribution";
import { submitDemoRequest } from "@/lib/commercial/lead-intake";

type DemoRequestBody = {
  requesterName?: string;
  requesterEmail?: string;
  companyName?: string;
  teamSize?: string;
  useCase?: string;
  urgency?: string;
  context?: {
    plan?: string | null;
    intent?: string | null;
    from?: string | null;
    accountId?: string | null;
    returnTo?: string | null;
    sourcePath?: string | null;
  } | null;
};

function sanitize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as DemoRequestBody | null;
    const requesterName = sanitize(body?.requesterName);
    const requesterEmail = sanitize(body?.requesterEmail).toLowerCase();
    const companyName = sanitize(body?.companyName);
    const teamSize = sanitize(body?.teamSize);
    const useCase = sanitize(body?.useCase);
    const urgency = sanitize(body?.urgency);

    if (requesterName.length < 2) {
      return NextResponse.json({ ok: false, error: "Add your name so the request can be routed." }, { status: 400 });
    }

    if (!requesterEmail.includes("@")) {
      return NextResponse.json({ ok: false, error: "Add a valid work email." }, { status: 400 });
    }

    if (companyName.length < 2) {
      return NextResponse.json({ ok: false, error: "Add the company or project name." }, { status: 400 });
    }

    if (useCase.length < 20) {
      return NextResponse.json(
        { ok: false, error: "Add a bit more context so the demo request lands with enough signal." },
        { status: 400 }
      );
    }

    const result = await submitDemoRequest({
      requesterName,
      requesterEmail,
      companyName,
      teamSize,
      useCase,
      urgency,
      context: {
        ...(body?.context ?? {}),
        sourcePath: body?.context?.sourcePath ?? request.nextUrl.pathname,
      },
      analyticsContext: readGrowthAnalyticsContextFromRequest(request),
    });

    return NextResponse.json(
      {
        ok: true,
        leadId: result.leadId,
        requestId: result.requestId,
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
        error: error instanceof Error ? error.message : "Demo request submission failed.",
      },
      { status: 500 }
    );
  }
}
