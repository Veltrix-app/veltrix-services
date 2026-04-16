import { supabaseAdmin } from "../lib/supabase.js";

async function deleteByIds(params: {
  table: string;
  column: string;
  ids: string[];
}) {
  if (params.ids.length === 0) {
    return 0;
  }

  const { error } = await supabaseAdmin
    .from(params.table)
    .delete()
    .in(params.column, params.ids);

  if (error) {
    throw new Error(`Failed to delete ${params.table}: ${error.message}`);
  }

  return params.ids.length;
}

async function cleanup() {
  const { data: showcaseProjects, error: projectError } = await supabaseAdmin
    .from("projects")
    .select("id, slug, name")
    .like("slug", "showcase-%");

  if (projectError) {
    throw new Error(projectError.message);
  }

  const projectIds = (showcaseProjects ?? []).map((project) => project.id);

  if (projectIds.length === 0) {
    console.log("No showcase projects found. Database already looks clean.");
    return;
  }

  const [{ data: campaigns, error: campaignsError }, { data: quests, error: questsError }, { data: rewards, error: rewardsError }] =
    await Promise.all([
      supabaseAdmin.from("campaigns").select("id").in("project_id", projectIds),
      supabaseAdmin.from("quests").select("id").in("project_id", projectIds),
      supabaseAdmin.from("rewards").select("id, campaign_id").in("project_id", projectIds),
    ]);

  if (campaignsError) {
    throw new Error(campaignsError.message);
  }

  if (questsError) {
    throw new Error(questsError.message);
  }

  if (rewardsError) {
    throw new Error(rewardsError.message);
  }

  const campaignIds = (campaigns ?? []).map((campaign) => campaign.id);
  const questIds = (quests ?? []).map((quest) => quest.id);
  const rewardIds = (rewards ?? []).map((reward) => reward.id);

  await deleteByIds({
    table: "verification_results",
    column: "quest_id",
    ids: questIds,
  });
  await deleteByIds({
    table: "verification_events",
    column: "quest_id",
    ids: questIds,
  });
  await deleteByIds({
    table: "quest_submissions",
    column: "quest_id",
    ids: questIds,
  });
  await deleteByIds({
    table: "reward_claims",
    column: "reward_id",
    ids: rewardIds,
  });
  await deleteByIds({
    table: "raids",
    column: "campaign_id",
    ids: campaignIds,
  });
  await deleteByIds({
    table: "rewards",
    column: "id",
    ids: rewardIds,
  });
  await deleteByIds({
    table: "quests",
    column: "id",
    ids: questIds,
  });
  await deleteByIds({
    table: "campaigns",
    column: "id",
    ids: campaignIds,
  });
  await deleteByIds({
    table: "projects",
    column: "id",
    ids: projectIds,
  });

  console.log(
    `Removed showcase data: ${projectIds.length} projects, ${campaignIds.length} campaigns, ${questIds.length} quests, ${rewardIds.length} rewards.`
  );
}

cleanup().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
