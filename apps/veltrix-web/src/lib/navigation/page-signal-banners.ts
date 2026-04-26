export type MainPageSignalBannerRoute =
  | "/home"
  | "/community"
  | "/projects"
  | "/campaigns"
  | "/quests"
  | "/defi"
  | "/raids"
  | "/rewards";

export type MainPageSignalBanner = {
  route: MainPageSignalBannerRoute;
  eyebrow: string;
  title: string;
  copy: string;
  href: string;
  cta: string;
  signal: string;
};

export const mainPageSignalBannerRoutes: MainPageSignalBannerRoute[] = [
  "/home",
  "/community",
  "/projects",
  "/campaigns",
  "/quests",
  "/defi",
  "/raids",
  "/rewards",
];

const mainPageSignalBanners: Record<MainPageSignalBannerRoute, MainPageSignalBanner> = {
  "/home": {
    route: "/home",
    eyebrow: "Launch focus",
    title: "Start with what is live.",
    copy: "A compact read of the next route before users dive into spaces, quests or rewards.",
    href: "/quests",
    cta: "View quests",
    signal: "Live routes first",
  },
  "/community": {
    route: "/community",
    eyebrow: "Community pulse",
    title: "Find the strongest spaces.",
    copy: "Use community reads to spot where activity, onboarding and rewards are already moving.",
    href: "/projects",
    cta: "Browse projects",
    signal: "Signal over noise",
  },
  "/projects": {
    route: "/projects",
    eyebrow: "Project discovery",
    title: "Pick a launch surface.",
    copy: "Projects are the context layer behind quests, raids, campaigns and reward proof.",
    href: "/campaigns",
    cta: "Open campaigns",
    signal: "Context ready",
  },
  "/campaigns": {
    route: "/campaigns",
    eyebrow: "Campaign rail",
    title: "Follow active momentum.",
    copy: "Campaigns group the most relevant community actions into a cleaner mission path.",
    href: "/quests",
    cta: "Find quests",
    signal: "Momentum map",
  },
  "/quests": {
    route: "/quests",
    eyebrow: "Quest board",
    title: "Choose one clear action.",
    copy: "Small steps keep the experience readable and make progress feel obvious.",
    href: "/raids",
    cta: "Open raids",
    signal: "Action first",
  },
  "/defi": {
    route: "/defi",
    eyebrow: "DeFi proof",
    title: "Move funds only after context.",
    copy: "Vaults, lending and proof history stay separated so risk does not blur into rewards.",
    href: "/defi/activity",
    cta: "View proof",
    signal: "Non-custodial",
  },
  "/raids": {
    route: "/raids",
    eyebrow: "Raid ops",
    title: "Coordinate the next push.",
    copy: "Raids should feel like focused momentum, not another wall of cards.",
    href: "/leaderboard",
    cta: "View ranks",
    signal: "Group action",
  },
  "/rewards": {
    route: "/rewards",
    eyebrow: "Reward lane",
    title: "Claim only with clear proof.",
    copy: "Rewards land best when users understand the action, status and eligibility path.",
    href: "/rewards/disclaimer",
    cta: "Read rules",
    signal: "Proof-backed",
  },
};

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function getMainPageSignalBanner(pathname: string): MainPageSignalBanner | null {
  const normalizedPathname = normalizePathname(pathname);

  if (mainPageSignalBannerRoutes.includes(normalizedPathname as MainPageSignalBannerRoute)) {
    return mainPageSignalBanners[normalizedPathname as MainPageSignalBannerRoute];
  }

  return null;
}
