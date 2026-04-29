import { NextRequest, NextResponse } from "next/server";
import { callAespService, getBearerToken, requireAuthenticatedUser } from "@/lib/server/aesp-service";
import { createSupabaseUserServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const user = await requireAuthenticatedUser(accessToken);
    const competitionResult = (await callAespService(`/trading/competitions/${id}`)) as {
      competition?: { projectId?: string };
    };
    const projectId = competitionResult.competition?.projectId ?? "";
    const supabase = createSupabaseUserServerClient(accessToken);
    const { data: canManage, error: roleError } = await supabase.rpc("has_project_role", {
      check_auth_user_id: user.id,
      check_project_id: projectId,
      allowed_roles: ["owner", "admin"],
    });

    if (roleError || canManage !== true) {
      return NextResponse.json(
        { ok: false, error: "Only project owners or admins can settle Trading Arena competitions." },
        { status: 403 }
      );
    }

    const result = await callAespService(`/trading/competitions/${id}/settle`, {
      method: "POST",
      body: JSON.stringify({ triggeredByAuthUserId: user.id }),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Trading competition settlement failed.",
      },
      { status: 400 }
    );
  }
}
