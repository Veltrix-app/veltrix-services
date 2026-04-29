export type ActivationBoardCampaign = {
  id: string;
  title: string;
  featured: boolean | null;
  status: string | null;
  created_at?: string | null;
};

export type ActivationBoardLinkedItem = {
  campaign_id: string | null;
};

export type ActivationBoardSegmentSummary = {
  newcomers: number;
  reactivation: number;
  core: number;
  commandReady: number;
};

export type ActivationBoardCandidate = {
  campaignId: string;
  title: string;
  featured: boolean;
  campaignStatus: string;
  activationReadiness: "live" | "content_ready" | "draft_setup";
  questCount: number;
  raidCount: number;
  rewardCount: number;
  newcomerCandidates: number;
  reactivationCandidates: number;
  coreCandidates: number;
  readyContributors: number;
  recommendedLane: "newcomer" | "reactivation" | "core";
  recommendedCopy: string;
};

function countLinkedItems(items: ActivationBoardLinkedItem[], campaignId: string) {
  return items.filter((item) => item.campaign_id === campaignId).length;
}

function scoreCampaignForActivationBoard(input: {
  campaign: ActivationBoardCampaign;
  questCount: number;
  raidCount: number;
  rewardCount: number;
}) {
  const linkedSurfaceScore = input.questCount * 4 + input.raidCount * 5 + input.rewardCount * 3;
  const activeScore = input.campaign.status === "active" ? 10_000 : 0;
  const featuredScore = input.campaign.featured === true ? 100 : 0;
  const createdAtScore = Math.max(0, Date.parse(input.campaign.created_at ?? "") || 0) / 1_000_000_000_000;

  return activeScore + linkedSurfaceScore * 10 + featuredScore + createdAtScore;
}

function resolveRecommendedLane(segmentSummary: ActivationBoardSegmentSummary) {
  if (
    segmentSummary.reactivation > segmentSummary.newcomers &&
    segmentSummary.reactivation >= segmentSummary.core
  ) {
    return "reactivation" as const;
  }

  if (segmentSummary.core > segmentSummary.newcomers) {
    return "core" as const;
  }

  return "newcomer" as const;
}

function resolveActivationReadiness(input: {
  campaignStatus: string;
  questCount: number;
  raidCount: number;
  rewardCount: number;
}) {
  if (input.campaignStatus === "active") {
    return "live" as const;
  }

  if (input.questCount + input.raidCount + input.rewardCount > 0) {
    return "content_ready" as const;
  }

  return "draft_setup" as const;
}

function resolveRecommendedCopy(input: {
  readiness: ActivationBoardCandidate["activationReadiness"];
  lane: ActivationBoardCandidate["recommendedLane"];
}) {
  if (input.readiness === "content_ready") {
    return "This campaign already has live surfaces attached. Use the board to coordinate the next public push and keep the route coherent.";
  }

  if (input.readiness === "draft_setup") {
    return "Prepare this campaign as the next activation lane: finish quests, rewards and raids, then publish when the route is ready.";
  }

  if (input.lane === "reactivation") {
    return "Re-ignite dormant contributors with a comeback wave around this campaign.";
  }

  if (input.lane === "core") {
    return "Lean into your core journey and raise pressure with raids and leaderboard visibility.";
  }

  return "Use a newcomer starter push to move fresh contributors into this campaign.";
}

export function buildActivationBoardCandidate(input: {
  campaigns: ActivationBoardCampaign[];
  quests: ActivationBoardLinkedItem[];
  raids: ActivationBoardLinkedItem[];
  rewards: ActivationBoardLinkedItem[];
  segmentSummary: ActivationBoardSegmentSummary;
}): ActivationBoardCandidate | null {
  if (input.campaigns.length === 0) {
    return null;
  }

  const rankedCampaigns = input.campaigns
    .map((campaign) => {
      const questCount = countLinkedItems(input.quests, campaign.id);
      const raidCount = countLinkedItems(input.raids, campaign.id);
      const rewardCount = countLinkedItems(input.rewards, campaign.id);

      return {
        campaign,
        questCount,
        raidCount,
        rewardCount,
        score: scoreCampaignForActivationBoard({
          campaign,
          questCount,
          raidCount,
          rewardCount,
        }),
      };
    })
    .sort((left, right) => right.score - left.score);

  const selected = rankedCampaigns[0];
  if (!selected) {
    return null;
  }

  const campaignStatus = selected.campaign.status ?? "draft";
  const activationReadiness = resolveActivationReadiness({
    campaignStatus,
    questCount: selected.questCount,
    raidCount: selected.raidCount,
    rewardCount: selected.rewardCount,
  });
  const recommendedLane = resolveRecommendedLane(input.segmentSummary);

  return {
    campaignId: selected.campaign.id,
    title: selected.campaign.title,
    featured: selected.campaign.featured === true,
    campaignStatus,
    activationReadiness,
    questCount: selected.questCount,
    raidCount: selected.raidCount,
    rewardCount: selected.rewardCount,
    newcomerCandidates: input.segmentSummary.newcomers,
    reactivationCandidates: input.segmentSummary.reactivation,
    coreCandidates: input.segmentSummary.core,
    readyContributors: input.segmentSummary.commandReady,
    recommendedLane,
    recommendedCopy: resolveRecommendedCopy({
      readiness: activationReadiness,
      lane: recommendedLane,
    }),
  };
}
