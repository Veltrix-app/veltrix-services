import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyMessage } from "ethers";

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
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for wallet verification.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | { walletAddress?: string; chain?: string; signature?: string }
      | null;

    const walletAddress = body?.walletAddress?.trim().toLowerCase() ?? "";
    const chain = body?.chain?.trim().toLowerCase() || "evm";
    const signature = body?.signature?.trim() ?? "";

    if (!walletAddress || !signature) {
      return NextResponse.json(
        { ok: false, error: "Wallet address and signature are required." },
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

    const { data: nonceRow, error: nonceError } = await serviceSupabase
      .from("wallet_link_nonces")
      .select("id, message, expires_at, consumed_at")
      .eq("auth_user_id", user.id)
      .eq("wallet_address", walletAddress)
      .eq("chain", chain)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (nonceError) {
      return NextResponse.json({ ok: false, error: nonceError.message }, { status: 500 });
    }

    if (!nonceRow) {
      return NextResponse.json(
        { ok: false, error: "No active wallet verification challenge found." },
        { status: 400 }
      );
    }

    if (new Date(nonceRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, error: "This wallet verification challenge expired. Request a new one." },
        { status: 400 }
      );
    }

    const recoveredAddress = verifyMessage(nonceRow.message, signature).toLowerCase();
    if (recoveredAddress !== walletAddress) {
      return NextResponse.json(
        { ok: false, error: "Wallet signature did not match the requested address." },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    const { data: existingWalletLink, error: existingWalletLinkError } = await serviceSupabase
      .from("wallet_links")
      .select("auth_user_id")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (existingWalletLinkError) {
      return NextResponse.json(
        { ok: false, error: existingWalletLinkError.message },
        { status: 500 }
      );
    }

    if (existingWalletLink?.auth_user_id && existingWalletLink.auth_user_id !== user.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "This wallet is already verified on another Veltrix account.",
        },
        { status: 409 }
      );
    }

    await serviceSupabase
      .from("wallet_links")
      .update({
        metadata: { primary: false },
        updated_at: timestamp,
      })
      .eq("auth_user_id", user.id);

    const { error: walletUpsertError } = await serviceSupabase.from("wallet_links").upsert(
      {
        auth_user_id: user.id,
        wallet_address: walletAddress,
        chain,
        source: "browser_signature",
        verified: true,
        verified_at: timestamp,
        last_seen_at: timestamp,
        risk_label: "verified",
        metadata: { primary: true },
        updated_at: timestamp,
      },
      {
        onConflict: "wallet_address",
      }
    );

    if (walletUpsertError) {
      return NextResponse.json({ ok: false, error: walletUpsertError.message }, { status: 500 });
    }

    const { error: profileUpdateError } = await serviceSupabase
      .from("user_profiles")
      .update({
        wallet: walletAddress,
      })
      .eq("auth_user_id", user.id);

    if (profileUpdateError) {
      return NextResponse.json({ ok: false, error: profileUpdateError.message }, { status: 500 });
    }

    const { error: consumeError } = await serviceSupabase
      .from("wallet_link_nonces")
      .update({
        consumed_at: timestamp,
        updated_at: timestamp,
      })
      .eq("id", nonceRow.id);

    if (consumeError) {
      return NextResponse.json({ ok: false, error: consumeError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      walletAddress,
      chain,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Wallet verification failed.",
      },
      { status: 500 }
    );
  }
}
