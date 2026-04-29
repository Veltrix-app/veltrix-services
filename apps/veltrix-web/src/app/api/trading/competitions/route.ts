import { NextRequest, NextResponse } from "next/server";
import { callAespService, getBearerToken, requireAuthenticatedUser } from "@/lib/server/aesp-service";
import { createSupabaseUserServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams.toString();
    const result = await callAespService(`/trading/competitions${params ? `?${params}` : ""}`);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Trading competitions could not be loaded.",
      },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const user = await requireAuthenticatedUser(accessToken);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const projectId = typeof body?.projectId === "string" ? body.projectId : "";
    const supabase = createSupabaseUserServerClient(accessToken);
    const { data: canManage, error: roleError } = await supabase.rpc("has_project_role", {
      check_auth_user_id: user.id,
      check_project_id: projectId,
      allowed_roles: ["owner", "admin"],
    });

    if (roleError || canManage !== true) {
      return NextResponse.json(
        { ok: false, error: "Only project owners or admins can create Trading Arena competitions." },
        { status: 403 }
      );
    }

    const result = await callAespService("/trading/competitions", {
      method: "POST",
      body: JSON.stringify({
        ...(body ?? {}),
        createdByAuthUserId: user.id,
      }),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Trading competition could not be created.",
      },
      { status: 400 }
    );
  }
}
