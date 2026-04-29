import { supabaseAdmin } from "../../lib/supabase.js";
import { getTradingCompetition, getTradingCompetitionLeaderboard, setTradingCompetitionStatus } from "./repository.js";
import { rebuildLiveTradingLeaderboard } from "./live-tracking.js";
import { rebuildSnapshotTradingLeaderboard } from "./snapshots.js";

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export async function settleTradingCompetition(input: {
  competitionId: string;
  triggeredByAuthUserId?: string | null;
}) {
  const { competition } = await getTradingCompetition({ competitionId: input.competitionId });

  if (competition.trackingMode === "live") {
    await rebuildLiveTradingLeaderboard({ competitionId: competition.id, final: true });
  } else {
    await rebuildSnapshotTradingLeaderboard({ competitionId: competition.id, final: true });
  }

  const leaderboard = await getTradingCompetitionLeaderboard({
    competitionId: competition.id,
    limit: 100,
  });
  const eligibleRewards = competition.rewards.filter(
    (reward) => reward.rewardType === "rank" && reward.rewardAmount > 0
  );

  if (!competition.campaignId || eligibleRewards.length === 0) {
    const settled = await setTradingCompetitionStatus({
      competitionId: competition.id,
      status: "settled",
    });

    return {
      ok: true,
      competition: settled.competition,
      recipients: 0,
      totalDistributed: 0,
      warning: !competition.campaignId
        ? "Competition settled without reward distributions because no campaign is linked."
        : "Competition settled without rank rewards.",
    };
  }

  const timestamp = new Date().toISOString();
  const distributions = leaderboard.items.flatMap((entry) =>
    eligibleRewards
      .filter((reward) => {
        const rankFrom = reward.rankFrom ?? entry.rank;
        const rankTo = reward.rankTo ?? rankFrom;
        return entry.rank >= rankFrom && entry.rank <= rankTo;
      })
      .map((reward) => ({
        campaign_id: competition.campaignId,
        auth_user_id: entry.authUserId,
        reward_asset: `trading:${competition.id}:${reward.rewardAsset}:${entry.rank}`,
        reward_amount: reward.rewardAmount,
        calculation_snapshot: {
          source: "trading_arena",
          competitionId: competition.id,
          competitionTitle: competition.title,
          rank: entry.rank,
          score: entry.score,
          volumeUsd: entry.volumeUsd,
          roiPercent: entry.roiPercent,
          rewardAsset: reward.rewardAsset,
          rewardType: reward.rewardType,
          triggeredByAuthUserId: input.triggeredByAuthUserId ?? null,
          settledAt: timestamp,
        },
        status: "claimable",
        updated_at: timestamp,
      }))
  );

  if (distributions.length > 0) {
    const { error } = await supabaseAdmin
      .from("reward_distributions")
      .upsert(distributions, { onConflict: "campaign_id,auth_user_id,reward_asset" });

    if (error) throw error;
  }

  await supabaseAdmin
    .from("trading_competition_participants")
    .update({
      status: "settled",
      updated_at: timestamp,
    })
    .eq("competition_id", competition.id)
    .in(
      "auth_user_id",
      leaderboard.items.map((entry) => entry.authUserId)
    );

  const settled = await setTradingCompetitionStatus({
    competitionId: competition.id,
    status: "settled",
  });

  return {
    ok: true,
    competition: settled.competition,
    recipients: distributions.length,
    totalDistributed: distributions.reduce(
      (sum, distribution) => sum + asNumber(distribution.reward_amount, 0),
      0
    ),
  };
}
