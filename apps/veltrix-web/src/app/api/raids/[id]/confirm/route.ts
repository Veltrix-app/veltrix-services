import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";
import { grantRaidShardsWithFeaturedPool } from "@/lib/lootboxes/featured-shard-pool-server";
import {
  getRaidAutoVerificationRequirement,
  getRaidAutoVerificationUrl,
  isApprovedRaidVerification,
  type RaidAutoVerificationPayload,
} from "@/lib/raids/raid-auto-verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityBotWebhookSecret = process.env.COMMUNITY_BOT_WEBHOOK_SECRET;

type ServiceSupabase = ReturnType<typeof createSupabaseServiceClient>;

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

async function isCampaignFeatured(params: {
  serviceSupabase: ServiceSupabase;
  campaignId: string | null;
}) {
  if (!params.campaignId) {
    return false;
  }

  const { data: campaign, error } = await params.serviceSupabase
    .from("campaigns")
    .select("featured")
    .eq("id", params.campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(campaign?.featured);
}

async function runXRaidCheck(params: { authUserId: string; raidId: string }) {
  if (!communityBotUrl) {
    throw new Error("COMMUNITY_BOT_URL is missing for raid verification.");
  }

  const response = await fetch(getRaidAutoVerificationUrl(communityBotUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(communityBotWebhookSecret
        ? { "x-community-bot-secret": communityBotWebhookSecret }
        : {}),
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as RaidAutoVerificationPayload | null;

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "X raid verification failed.";

    throw new Error(errorMessage);
  }

  return payload;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  const { id: raidId } = await context.params;
  if (!raidId) {
    return NextResponse.json({ ok: false, error: "Missing raid id." }, { status: 400 });
  }

  try {
    const userSupabase = createSupabaseUserServerClient(accessToken);
    const serviceSupabase = createSupabaseServiceClient();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const { data: raid, error: raidError } = await serviceSupabase
      .from("raids")
      .select("id, title, campaign_id, project_id, community, timer, generated_by, source_provider, source_url, source_external_id")
      .eq("id", raidId)
      .maybeSingle();

    if (raidError) {
      throw new Error(raidError.message);
    }

    if (!raid?.id) {
      return NextResponse.json({ ok: false, error: "Raid not found." }, { status: 404 });
    }

    const verificationRequirement = getRaidAutoVerificationRequirement({
      source_provider: typeof raid.source_provider === "string" ? raid.source_provider : null,
      source_url: typeof raid.source_url === "string" ? raid.source_url : null,
      source_external_id: typeof raid.source_external_id === "string" ? raid.source_external_id : null,
    });

    if (!verificationRequirement.required) {
      return NextResponse.json(
        {
          ok: false,
          status: "verification_unavailable",
          error: verificationRequirement.reason,
        },
        { status: 409 }
      );
    }

    const [{ data: connectedAccount }, { data: projectIntegration }] = await Promise.all([
      serviceSupabase
        .from("user_connected_accounts")
        .select("id, provider, status, username")
        .eq("auth_user_id", user.id)
        .eq("provider", "x")
        .eq("status", "connected")
        .maybeSingle(),
      typeof raid.project_id === "string"
        ? serviceSupabase
            .from("project_integrations")
            .select("id, provider, status")
            .eq("project_id", raid.project_id)
            .eq("provider", "x")
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (!connectedAccount) {
      return NextResponse.json(
        {
          ok: false,
          status: "needs_account_link",
          error: "Link your X account before VYNTRO can verify this raid automatically.",
        },
        { status: 400 }
      );
    }

    if (typeof raid.project_id === "string" && (!projectIntegration || projectIntegration.status !== "connected")) {
      return NextResponse.json(
        {
          ok: false,
          status: "needs_project_integration",
          error: "X raid verification is not connected for this project yet. No XP or shards were awarded.",
        },
        { status: 400 }
      );
    }

    const botVerification = await runXRaidCheck({
      authUserId: user.id,
      raidId,
    });

    if (!isApprovedRaidVerification(botVerification)) {
      return NextResponse.json(
        {
          ok: false,
          status: botVerification?.status ?? "pending",
          error:
            botVerification?.message ||
            "VYNTRO could not verify this raid from your connected X account yet. No XP or shards were awarded.",
        },
        { status: 409 }
      );
    }

    const { data: existing, error: existingError } = await serviceSupabase
      .from("user_progress")
      .select("joined_communities, confirmed_raids, claimed_rewards, opened_lootbox_ids, unlocked_reward_ids, quest_statuses")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    const confirmedRaids = Array.isArray(existing?.confirmed_raids)
      ? [...new Set([...(existing.confirmed_raids as string[]), raidId])]
      : [raidId];

    const { error: progressError } = await serviceSupabase.from("user_progress").upsert(
      {
        auth_user_id: user.id,
        joined_communities: existing?.joined_communities ?? [],
        confirmed_raids: confirmedRaids,
        claimed_rewards: existing?.claimed_rewards ?? [],
        opened_lootbox_ids: existing?.opened_lootbox_ids ?? [],
        unlocked_reward_ids: existing?.unlocked_reward_ids ?? [],
        quest_statuses: existing?.quest_statuses ?? {},
      },
      { onConflict: "auth_user_id" }
    );

    if (progressError) {
      throw new Error(progressError.message);
    }

    const { error: completionError } = await serviceSupabase.from("raid_completions").insert({
      auth_user_id: user.id,
      raid_id: raidId,
    });

    if (completionError && completionError.code !== "23505") {
      throw new Error(completionError.message);
    }

    const featuredCampaign = await isCampaignFeatured({
      serviceSupabase,
      campaignId: typeof raid.campaign_id === "string" ? raid.campaign_id : null,
    });
    const generatedBy = typeof raid.generated_by === "string" ? raid.generated_by : "";
    const featuredRaid =
      featuredCampaign || generatedBy === "featured" || generatedBy === "campaign_studio";
    const shardAward = await grantRaidShardsWithFeaturedPool({
      serviceSupabase,
      authUserId: user.id,
      raidId,
      raidTitle: typeof raid.title === "string" ? raid.title : "Raid",
      projectId: typeof raid.project_id === "string" ? raid.project_id : null,
      campaignId: typeof raid.campaign_id === "string" ? raid.campaign_id : null,
      featured: featuredRaid,
      community: typeof raid.community === "string" ? raid.community : null,
      timer: typeof raid.timer === "string" ? raid.timer : null,
    });

    return NextResponse.json({ ok: true, confirmed: true, shardAward });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Raid confirm failed." },
      { status: 500 }
    );
  }
}
