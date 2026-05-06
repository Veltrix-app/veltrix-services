import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";
import { grantRaidShardsWithFeaturedPool } from "@/lib/lootboxes/featured-shard-pool-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
      .select("id, title, campaign_id, project_id, community, timer, generated_by")
      .eq("id", raidId)
      .maybeSingle();

    if (raidError) {
      throw new Error(raidError.message);
    }

    if (!raid?.id) {
      return NextResponse.json({ ok: false, error: "Raid not found." }, { status: 404 });
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
