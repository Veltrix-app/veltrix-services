import type { CommunityAutomationType } from "./model.js";

export type CommunityJourneyType = "onboarding" | "active" | "comeback";

export type CommunityJourneyDeepLinks = {
  communityUrl: string;
  onboardingUrl: string;
  comebackUrl: string;
  primaryUrl: string;
  captainWorkspaceUrl: string | null;
};

const webAppUrl = (process.env.PUBLIC_APP_URL || "https://veltrix-web.vercel.app").replace(
  /\/+$/,
  ""
);
const adminPortalUrl = (
  process.env.PUBLIC_ADMIN_PORTAL_URL ||
  process.env.ADMIN_PORTAL_URL ||
  ""
).replace(/\/+$/, "");

export function buildCommunityJourneyDeepLinks(
  projectId: string,
  lane: CommunityJourneyType
): CommunityJourneyDeepLinks {
  const query = `?projectId=${encodeURIComponent(projectId)}`;
  const communityUrl = `${webAppUrl}/community${query}`;
  const onboardingUrl = `${webAppUrl}/community/onboarding${query}`;
  const comebackUrl = `${webAppUrl}/community/comeback${query}`;
  const captainWorkspaceUrl = adminPortalUrl
    ? `${adminPortalUrl}/projects/${projectId}/community?mode=captain`
    : null;

  return {
    communityUrl,
    onboardingUrl,
    comebackUrl,
    primaryUrl:
      lane === "onboarding"
        ? onboardingUrl
        : lane === "comeback"
          ? comebackUrl
          : communityUrl,
    captainWorkspaceUrl,
  };
}

export function resolveCommunityAutomationJourneyLane(
  automationType: CommunityAutomationType
): CommunityJourneyType {
  if (automationType === "newcomer_pulse") {
    return "onboarding";
  }

  if (automationType === "reactivation_pulse") {
    return "comeback";
  }

  return "active";
}

export function resolveCommunityAutomationDeepLink(params: {
  projectId: string;
  automationType: CommunityAutomationType;
}) {
  return buildCommunityJourneyDeepLinks(
    params.projectId,
    resolveCommunityAutomationJourneyLane(params.automationType)
  ).primaryUrl;
}
