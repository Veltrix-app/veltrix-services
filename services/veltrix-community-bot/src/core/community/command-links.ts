import { buildCommunityJourneyDeepLinks, type CommunityJourneyType } from "./automation-links.js";

const appUrl = (process.env.PUBLIC_APP_URL || "https://veltrix-web.vercel.app").replace(
  /\/+$/,
  ""
);

export type CommunityCommandLinks = {
  communityUrl: string | null;
  onboardingUrl: string | null;
  comebackUrl: string | null;
  primaryUrl: string | null;
  captainWorkspaceUrl: string | null;
  profileUrl: string | null;
  missionsUrl: string | null;
  rewardsUrl: string | null;
};

export function buildCommunityCommandLinks(params: {
  projectId: string;
  lane: CommunityJourneyType;
  deepLinksEnabled?: boolean;
}): CommunityCommandLinks {
  if (params.deepLinksEnabled === false) {
    return {
      communityUrl: null,
      onboardingUrl: null,
      comebackUrl: null,
      primaryUrl: null,
      captainWorkspaceUrl: null,
      profileUrl: null,
      missionsUrl: null,
      rewardsUrl: null,
    };
  }

  const journeyLinks = buildCommunityJourneyDeepLinks(params.projectId, params.lane);
  const projectQuery = `?projectId=${encodeURIComponent(params.projectId)}`;

  return {
    communityUrl: journeyLinks.communityUrl,
    onboardingUrl: journeyLinks.onboardingUrl,
    comebackUrl: journeyLinks.comebackUrl,
    primaryUrl: journeyLinks.primaryUrl,
    captainWorkspaceUrl: journeyLinks.captainWorkspaceUrl,
    profileUrl: `${appUrl}/profile`,
    missionsUrl: `${appUrl}/community${projectQuery}`,
    rewardsUrl: `${appUrl}/rewards${projectQuery}`,
  };
}

