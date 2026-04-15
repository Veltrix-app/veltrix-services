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

  if (provider === "twitter") {
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

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseClient(accessToken);
    const serviceSupabase = getServiceSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const { data: adminUserResult, error: adminUserError } =
      await serviceSupabase.auth.admin.getUserById(user.id);

    if (adminUserError || !adminUserResult?.user) {
      return NextResponse.json(
        { ok: false, error: adminUserError?.message || "Could not load auth user identities." },
        { status: 500 }
      );
    }

    const linkedIdentities = (Array.isArray(adminUserResult.user.identities)
      ? adminUserResult.user.identities
      : [])
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

    const { error: deleteError } = await serviceSupabase
      .from("user_connected_accounts")
      .delete()
      .eq("auth_user_id", user.id)
      .in("provider", ["discord", "x"]);

    if (deleteError) {
      return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
    }

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

    return NextResponse.json({
      ok: true,
      identities: linkedIdentities.length,
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
