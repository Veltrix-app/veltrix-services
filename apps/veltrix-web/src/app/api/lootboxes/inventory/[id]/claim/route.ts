import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";
import {
  buildLootboxInventoryClaimAuditPayload,
  buildLootboxInventoryClaimPatch,
  canRequestLootboxInventoryClaim,
} from "@/lib/lootboxes/lootbox-inventory-read";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type InventoryRow = {
  id: string;
  auth_user_id: string;
  item_type: string;
  label: string;
  status: string | null;
};

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing inventory item id." }, { status: 400 });
    }

    const userSupabase = createSupabaseUserServerClient(accessToken);
    const serviceSupabase = createSupabaseServiceClient();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const existingResponse = await serviceSupabase
      .from("user_inventory")
      .select("id, auth_user_id, item_type, label, status")
      .eq("id", id)
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (existingResponse.error) {
      return NextResponse.json(
        { ok: false, error: existingResponse.error.message },
        { status: 500 }
      );
    }

    if (!existingResponse.data) {
      return NextResponse.json({ ok: false, error: "Inventory item not found." }, { status: 404 });
    }

    const existing = existingResponse.data as InventoryRow;
    if (!canRequestLootboxInventoryClaim(existing)) {
      return NextResponse.json(
        { ok: false, error: "This lootbox reward is not ready for a fulfillment request." },
        { status: 409 }
      );
    }

    const updateResponse = await serviceSupabase
      .from("user_inventory")
      .update(buildLootboxInventoryClaimPatch())
      .eq("id", existing.id)
      .eq("auth_user_id", user.id)
      .eq("status", "owned")
      .select("id, item_type, rarity, label, payload, status, created_at, updated_at")
      .single();

    if (updateResponse.error) {
      return NextResponse.json(
        { ok: false, error: updateResponse.error.message },
        { status: 500 }
      );
    }

    const auditResponse = await serviceSupabase
      .from("admin_audit_logs")
      .insert(
        buildLootboxInventoryClaimAuditPayload({
          authUserId: user.id,
          inventoryItem: existing,
        })
      );

    if (auditResponse.error) {
      console.error("Lootbox claim request audit skipped:", auditResponse.error.message);
    }

    return NextResponse.json({ ok: true, inventoryItem: updateResponse.data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Lootbox claim request failed.",
      },
      { status: 500 }
    );
  }
}
