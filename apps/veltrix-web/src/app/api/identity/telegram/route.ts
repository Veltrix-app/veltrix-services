import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function getSupabaseClient(accessToken: string) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getServiceSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for Telegram identity writes.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeConnectedAccountRow(row: {
  id: string;
  provider: "discord" | "x" | "telegram";
  provider_user_id: string;
  username: string | null;
  status: "connected" | "expired" | "revoked";
  connected_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    provider: row.provider,
    providerUserId: row.provider_user_id,
    username: row.username,
    status: row.status,
    connectedAt: row.connected_at,
    updatedAt: row.updated_at,
  };
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | { telegramUserId?: string; username?: string }
      | null;
    const sanitizedUserId = body?.telegramUserId?.replace(/[^\d]/g, "") ?? "";
    const sanitizedUsername = body?.username?.trim().replace(/^@+/, "") ?? "";

    if (!sanitizedUserId) {
      return NextResponse.json(
        { ok: false, error: "Enter your Telegram numeric user id first." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient(accessToken);
    const serviceSupabase = getServiceSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const timestamp = new Date().toISOString();
    const { error: upsertError } = await serviceSupabase
      .from("user_connected_accounts")
      .upsert(
        {
          auth_user_id: user.id,
          provider: "telegram",
          provider_user_id: sanitizedUserId,
          username: sanitizedUsername || null,
          status: "connected",
          connected_at: timestamp,
          updated_at: timestamp,
        },
        {
          onConflict: "auth_user_id,provider",
        }
      );

    if (upsertError) {
      return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });
    }

    const { data: finalAccounts, error: finalAccountsError } = await serviceSupabase
      .from("user_connected_accounts")
      .select("id, provider, provider_user_id, username, status, connected_at, updated_at")
      .eq("auth_user_id", user.id)
      .in("provider", ["discord", "x", "telegram"])
      .order("connected_at", { ascending: false });

    if (finalAccountsError) {
      return NextResponse.json({ ok: false, error: finalAccountsError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      accounts: (finalAccounts ?? []).map(normalizeConnectedAccountRow),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Telegram identity save failed.",
      },
      { status: 500 }
    );
  }
}
