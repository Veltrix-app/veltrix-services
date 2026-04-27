import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { UserIdentity } from "@supabase/supabase-js";

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
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for identity sync.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function mapIdentityProvider(provider: string): "discord" | "x" | null {
  if (provider === "discord") {
    return "discord";
  }

  if (provider === "twitter" || provider === "x") {
    return "x";
  }

  return null;
}

function deriveIdentityUserId(identity: UserIdentity) {
  const identityData = identity.identity_data ?? {};
  const rawValue =
    identityData.sub ??
    identityData.user_id ??
    identityData.id ??
    identityData.provider_id ??
    identity.identity_id;

  return rawValue ? String(rawValue) : "";
}

function deriveIdentityUsername(identity: UserIdentity) {
  const identityData = identity.identity_data ?? {};
  const username =
    identityData.user_name ??
    identityData.preferred_username ??
    identityData.username ??
    identityData.nick ??
    identityData.name ??
    null;

  return typeof username === "string" && username.length > 0 ? username : null;
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

async function loadCurrentAccounts(params: {
  serviceSupabase: ReturnType<typeof getServiceSupabaseClient>;
  authUserId: string;
}) {
  const { data: finalAccounts, error: finalAccountsError } = await params.serviceSupabase
    .from("user_connected_accounts")
    .select("id, provider, provider_user_id, username, status, connected_at, updated_at")
    .eq("auth_user_id", params.authUserId)
    .in("provider", ["discord", "x", "telegram"])
    .order("connected_at", { ascending: false });

  if (finalAccountsError) {
    throw new Error(finalAccountsError.message);
  }

  return (finalAccounts ?? []).map(normalizeConnectedAccountRow);
}

async function resolveRequestUser(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    throw new Error("Missing bearer token.");
  }

  const supabase = getSupabaseClient(accessToken);
  const serviceSupabase = getServiceSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    throw new Error("Invalid session.");
  }

  return { user, serviceSupabase, supabase };
}

export async function GET(request: NextRequest) {
  try {
    const { user, serviceSupabase } = await resolveRequestUser(request);
    const normalizedAccounts = await loadCurrentAccounts({
      serviceSupabase,
      authUserId: user.id,
    });

    return NextResponse.json({
      ok: true,
      identities: normalizedAccounts.length,
      accounts: normalizedAccounts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Identity snapshot failed.";
    const status = message === "Missing bearer token." ? 401 : message === "Invalid session." ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, serviceSupabase } = await resolveRequestUser(request);

    const { data: adminUserResult, error: adminUserError } =
      await serviceSupabase.auth.admin.getUserById(user.id);

    if (adminUserError || !adminUserResult?.user) {
      return NextResponse.json(
        { ok: false, error: adminUserError?.message || "Could not load auth user identities." },
        { status: 500 }
      );
    }

    const sessionIdentities = Array.isArray(user.identities) ? user.identities : [];
    const adminIdentities = Array.isArray(adminUserResult.user.identities)
      ? adminUserResult.user.identities
      : [];
    const dedupedIdentityMap = new Map<string, UserIdentity>();

    for (const identity of [...sessionIdentities, ...adminIdentities]) {
      const provider = mapIdentityProvider(identity.provider);
      const providerUserId = deriveIdentityUserId(identity);

      if (!provider || !providerUserId) {
        continue;
      }

      dedupedIdentityMap.set(`${provider}:${providerUserId}`, identity);
    }

    const linkedIdentities = Array.from(dedupedIdentityMap.values())
      .map((identity) => {
        const provider = mapIdentityProvider(identity.provider);
        const providerUserId = deriveIdentityUserId(identity);

        if (!provider || !providerUserId) {
          return null;
        }

        return {
          auth_user_id: user.id,
          provider,
          provider_user_id: providerUserId,
          username: deriveIdentityUsername(identity),
          status: "connected",
          connected_at: identity.created_at ?? new Date().toISOString(),
          updated_at: identity.updated_at ?? new Date().toISOString(),
        };
      })
      .filter((identity): identity is NonNullable<typeof identity> => Boolean(identity));

    if (linkedIdentities.length > 0) {
      const { error: insertError } = await serviceSupabase
        .from("user_connected_accounts")
        .upsert(linkedIdentities, {
          onConflict: "auth_user_id,provider",
        });

      if (insertError) {
        return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
      }
    }

    const normalizedAccounts = await loadCurrentAccounts({
      serviceSupabase,
      authUserId: user.id,
    });

    return NextResponse.json({
      ok: true,
      identities: normalizedAccounts.length,
      accounts: normalizedAccounts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Identity sync failed.",
      },
      { status: 500 }
    );
  }
}
