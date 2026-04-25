import { randomUUID } from "crypto";
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
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for wallet nonce issuance.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function buildVerificationMessage(params: {
  walletAddress: string;
  chain: string;
  nonce: string;
}) {
  return [
    "VYNTRO wallet verification",
    `Address: ${params.walletAddress}`,
    `Chain: ${params.chain}`,
    `Nonce: ${params.nonce}`,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | { walletAddress?: string; chain?: string }
      | null;

    const walletAddress = body?.walletAddress?.trim().toLowerCase() ?? "";
    const chain = body?.chain?.trim().toLowerCase() || "evm";

    if (!walletAddress) {
      return NextResponse.json(
        { ok: false, error: "Wallet address is required." },
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

    const nonce = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const message = buildVerificationMessage({ walletAddress, chain, nonce });

    const { error: insertError } = await serviceSupabase.from("wallet_link_nonces").insert({
      auth_user_id: user.id,
      wallet_address: walletAddress,
      chain,
      nonce,
      message,
      expires_at: expiresAt,
    });

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      nonce,
      message,
      expiresAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not issue wallet nonce.",
      },
      { status: 500 }
    );
  }
}
