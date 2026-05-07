import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";
import {
  buildLootboxProfileCosmeticEquipAuditPayload,
  buildLootboxProfileCosmeticEquipPatch,
  buildLootboxTitleEquipAuditPayload,
  buildLootboxTitleEquipPatch,
  buildLootboxTitleProfilePatch,
  canEquipLootboxProfileCosmetic,
  canEquipLootboxTitle,
  resolveLootboxProfileCosmeticLabel,
  resolveLootboxTitleLabel,
} from "@/lib/lootboxes/lootbox-inventory-read";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type InventoryUtilityRow = {
  id: string;
  auth_user_id: string;
  item_type: string;
  label: string;
  payload: Record<string, unknown> | null;
  status: string | null;
};

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function normalizePayload(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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
      .select("id, auth_user_id, item_type, label, payload, status")
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

    const existing = existingResponse.data as InventoryUtilityRow;
    const canEquipTitle = canEquipLootboxTitle(existing);
    const canEquipCosmetic = canEquipLootboxProfileCosmetic(existing);

    if (!canEquipTitle && !canEquipCosmetic) {
      return NextResponse.json(
        { ok: false, error: "This lootbox reward is not equip-ready." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    if (canEquipCosmetic) {
      const cosmetic = resolveLootboxProfileCosmeticLabel({
        label: existing.label,
        payload: existing.payload,
      });
      const cosmeticRowsResponse = await serviceSupabase
        .from("user_inventory")
        .select("id, payload")
        .eq("auth_user_id", user.id)
        .eq("item_type", "profile_cosmetic");

      if (cosmeticRowsResponse.error) {
        return NextResponse.json(
          { ok: false, error: cosmeticRowsResponse.error.message },
          { status: 500 }
        );
      }

      const clearPreviousCosmetics = await Promise.all(
        (cosmeticRowsResponse.data ?? [])
          .filter((row) => row.id !== existing.id && normalizePayload(row.payload).equipped === true)
          .map((row) =>
            serviceSupabase
              .from("user_inventory")
              .update(
                buildLootboxProfileCosmeticEquipPatch({
                  payload: normalizePayload(row.payload),
                  equipped: false,
                  now,
                })
              )
              .eq("id", row.id)
              .eq("auth_user_id", user.id)
          )
      );
      const clearCosmeticError = clearPreviousCosmetics.find((result) => result.error)?.error;
      if (clearCosmeticError) {
        return NextResponse.json({ ok: false, error: clearCosmeticError.message }, { status: 500 });
      }

      const updateResponse = await serviceSupabase
        .from("user_inventory")
        .update(
          buildLootboxProfileCosmeticEquipPatch({
            payload: existing.payload,
            equipped: true,
            now,
          })
        )
        .eq("id", existing.id)
        .eq("auth_user_id", user.id)
        .select("id, item_type, rarity, label, payload, status, created_at, updated_at")
        .single();

      if (updateResponse.error) {
        return NextResponse.json({ ok: false, error: updateResponse.error.message }, { status: 500 });
      }

      const auditResponse = await serviceSupabase
        .from("admin_audit_logs")
        .insert(
          buildLootboxProfileCosmeticEquipAuditPayload({
            authUserId: user.id,
            inventoryItem: existing,
            cosmetic,
          })
        )
        .select("id, action, summary, metadata, created_at")
        .single();

      if (auditResponse.error) {
        console.error("Lootbox cosmetic equip audit skipped:", auditResponse.error.message);
      }

      return NextResponse.json({
        ok: true,
        equippedKind: "profile_cosmetic",
        profileCosmetic: cosmetic,
        inventoryItem: {
          ...updateResponse.data,
          auditTrail: auditResponse.data ? [auditResponse.data] : [],
        },
      });
    }

    const title = resolveLootboxTitleLabel({
      label: existing.label,
      payload: existing.payload,
    });
    const titleRowsResponse = await serviceSupabase
      .from("user_inventory")
      .select("id, payload")
      .eq("auth_user_id", user.id)
      .eq("item_type", "title");

    if (titleRowsResponse.error) {
      return NextResponse.json(
        { ok: false, error: titleRowsResponse.error.message },
        { status: 500 }
      );
    }

    const clearPreviousResults = await Promise.all(
      (titleRowsResponse.data ?? [])
        .filter((row) => row.id !== existing.id && normalizePayload(row.payload).equipped === true)
        .map((row) =>
          serviceSupabase
            .from("user_inventory")
            .update(
              buildLootboxTitleEquipPatch({
                payload: normalizePayload(row.payload),
                equipped: false,
                now,
              })
            )
            .eq("id", row.id)
            .eq("auth_user_id", user.id)
        )
    );
    const clearPreviousError = clearPreviousResults.find((result) => result.error)?.error;
    if (clearPreviousError) {
      return NextResponse.json({ ok: false, error: clearPreviousError.message }, { status: 500 });
    }

    const updateResponse = await serviceSupabase
      .from("user_inventory")
      .update(
        buildLootboxTitleEquipPatch({
          payload: existing.payload,
          equipped: true,
          now,
        })
      )
      .eq("id", existing.id)
      .eq("auth_user_id", user.id)
      .select("id, item_type, rarity, label, payload, status, created_at, updated_at")
      .single();

    if (updateResponse.error) {
      return NextResponse.json({ ok: false, error: updateResponse.error.message }, { status: 500 });
    }

    const profileResponse = await serviceSupabase
      .from("user_profiles")
      .update(buildLootboxTitleProfilePatch(title))
      .eq("auth_user_id", user.id);

    if (profileResponse.error) {
      return NextResponse.json({ ok: false, error: profileResponse.error.message }, { status: 500 });
    }

    const auditResponse = await serviceSupabase
      .from("admin_audit_logs")
      .insert(
        buildLootboxTitleEquipAuditPayload({
          authUserId: user.id,
          inventoryItem: existing,
          title,
        })
      )
      .select("id, action, summary, metadata, created_at")
      .single();

    if (auditResponse.error) {
      console.error("Lootbox title equip audit skipped:", auditResponse.error.message);
    }

    return NextResponse.json({
      ok: true,
      equippedKind: "title",
      profileTitle: title,
      inventoryItem: {
        ...updateResponse.data,
        auditTrail: auditResponse.data ? [auditResponse.data] : [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Lootbox equip failed.",
      },
      { status: 500 }
    );
  }
}
