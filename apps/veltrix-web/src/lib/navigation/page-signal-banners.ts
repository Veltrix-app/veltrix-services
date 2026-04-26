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
  slides: MainPageSignalBannerSlide[];
};

export type MainPageSignalBannerSlide = {
  key:
    | "anti-sybil"
    | "borrow-lending"
    | "community"
    | "quests"
    | "raids"
    | "rewards"
    | "vaults";
  src: string;
  alt: string;
  label: string;
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

const vyntroSlides: Record<MainPageSignalBannerSlide["key"], MainPageSignalBannerSlide> = {
  "anti-sybil": {
    key: "anti-sybil",
    src: "/brand/slides/vyntro-anti-sybil.png",
    alt: "VYNTRO anti-sybil banner with secure shield and verification modules.",
    label: "Anti-sybil",
  },
  "borrow-lending": {
    key: "borrow-lending",
    src: "/brand/slides/vyntro-borrow-lending.png",
    alt: "VYNTRO borrow and lending banner provided by Moonwell.",
    label: "Borrow / lending",
  },
  community: {
    key: "community",
    src: "/brand/slides/vyntro-community.png",
    alt: "VYNTRO community banner focused on real connections.",
    label: "Community",
  },
  quests: {
    key: "quests",
    src: "/brand/slides/vyntro-quests.png",
    alt: "VYNTRO quests banner with mission checklist and XP rewards.",
    label: "Quests",
  },
  raids: {
    key: "raids",
    src: "/brand/slides/vyntro-raids.png",
    alt: "VYNTRO raids banner with team raid shield and rewards.",
    label: "Raids",
  },
  rewards: {
    key: "rewards",
    src: "/brand/slides/vyntro-rewards.png",
    alt: "VYNTRO rewards banner with treasure chest and claim rewards call to action.",
    label: "Rewards",
  },
  vaults: {
    key: "vaults",
    src: "/brand/slides/vyntro-vaults.png",
    alt: "VYNTRO vaults banner provided by Moonwell with a blue vault safe.",
    label: "Vaults",
  },
};

function selectSlides(keys: MainPageSignalBannerSlide["key"][]) {
  return keys.map((key) => vyntroSlides[key]);
}

const mainPageSignalBanners: Record<MainPageSignalBannerRoute, MainPageSignalBanner> = {
  "/home": {
    route: "/home",
    eyebrow: "Launch focus",
    title: "Start with what is live.",
    copy: "A compact read of the next route before users dive into spaces, quests or rewards.",
    href: "/quests",
    cta: "View quests",
    signal: "Live routes first",
    slides: selectSlides([
      "quests",
      "raids",
      "rewards",
      "community",
      "vaults",
      "borrow-lending",
      "anti-sybil",
    ]),
  },
  "/community": {
    route: "/community",
    eyebrow: "Community pulse",
    title: "Find the strongest spaces.",
    copy: "Use community reads to spot where activity, onboarding and rewards are already moving.",
    href: "/projects",
    cta: "Browse projects",
    signal: "Signal over noise",
    slides: selectSlides(["community", "anti-sybil"]),
  },
  "/projects": {
    route: "/projects",
    eyebrow: "Project discovery",
    title: "Pick a launch surface.",
    copy: "Projects are the context layer behind quests, raids, campaigns and reward proof.",
    href: "/campaigns",
    cta: "Open campaigns",
    signal: "Context ready",
    slides: selectSlides(["community", "quests", "rewards"]),
  },
  "/campaigns": {
    route: "/campaigns",
    eyebrow: "Campaign rail",
    title: "Follow active momentum.",
    copy: "Campaigns group the most relevant community actions into a cleaner mission path.",
    href: "/quests",
    cta: "Find quests",
    signal: "Momentum map",
    slides: selectSlides(["quests", "raids", "rewards"]),
  },
  "/quests": {
    route: "/quests",
    eyebrow: "Quest board",
    title: "Choose one clear action.",
    copy: "Small steps keep the experience readable and make progress feel obvious.",
    href: "/raids",
    cta: "Open raids",
    signal: "Action first",
    slides: selectSlides(["quests", "rewards"]),
  },
  "/defi": {
    route: "/defi",
    eyebrow: "DeFi proof",
    title: "Move funds only after context.",
    copy: "Vaults, lending and proof history stay separated so risk does not blur into rewards.",
    href: "/defi/activity",
    cta: "View proof",
    signal: "Non-custodial",
    slides: selectSlides(["vaults", "borrow-lending"]),
  },
  "/raids": {
    route: "/raids",
    eyebrow: "Raid ops",
    title: "Coordinate the next push.",
    copy: "Raids should feel like focused momentum, not another wall of cards.",
    href: "/leaderboard",
    cta: "View ranks",
    signal: "Group action",
    slides: selectSlides(["raids", "rewards"]),
  },
  "/rewards": {
    route: "/rewards",
    eyebrow: "Reward lane",
    title: "Claim only with clear proof.",
    copy: "Rewards land best when users understand the action, status and eligibility path.",
    href: "/rewards/disclaimer",
    cta: "Read rules",
    signal: "Proof-backed",
    slides: selectSlides(["rewards", "quests"]),
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
