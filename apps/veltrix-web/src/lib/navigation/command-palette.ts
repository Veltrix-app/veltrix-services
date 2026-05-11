import { PLATFORM_QUEST_PROJECT_ID } from "../platform-quests/platform-quest-catalog";
import type { LiveProject, LiveQuest, LiveReward } from "../../types/live";

export type CommandPaletteActionGroup = "smart" | "navigate" | "earn" | "account";

export type CommandPaletteAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  group: CommandPaletteActionGroup;
  keywords: string[];
  badge?: string;
  priority: number;
};

export function buildCommandPaletteActions(input: {
  quests: LiveQuest[];
  rewards: LiveReward[];
  projects: LiveProject[];
  accountReady: boolean;
}): CommandPaletteAction[] {
  const claimableReward = input.rewards
    .filter((reward) => reward.claimable && !reward.claimed)
    .sort((left, right) => right.cost - left.cost)[0];
  const nextQuest = input.quests
    .filter((quest) => quest.status !== "approved")
    .sort((left, right) => Number(left.status === "open") - Number(right.status === "open") || right.xp - left.xp)[0];
  const vyntroProject =
    input.projects.find((project) => project.id === PLATFORM_QUEST_PROJECT_ID) ??
    input.projects.find((project) => project.name.toLowerCase().includes("vyntro"));
  const actions: CommandPaletteAction[] = [];

  if (claimableReward) {
    actions.push({
      id: `claim-reward-${claimableReward.id}`,
      label: "Claim Reward",
      description: claimableReward.title,
      href: `/rewards/${claimableReward.id}`,
      group: "smart",
      keywords: ["claim", "reward", "vault", claimableReward.title],
      badge: "Ready",
      priority: 100,
    });
  }

  if (nextQuest) {
    actions.push({
      id: `open-next-quest-${nextQuest.id}`,
      label: "Open next quest",
      description: `${nextQuest.title} · ${nextQuest.xp} XP`,
      href: `/quests/${nextQuest.id}`,
      group: "smart",
      keywords: ["next", "quest", "mission", nextQuest.title],
      badge: `${nextQuest.xp} XP`,
      priority: 92,
    });
  }

  if (vyntroProject) {
    actions.push({
      id: "go-to-vyntro-project",
      label: "Go to VYNTRO Project",
      description: vyntroProject.name,
      href: `/projects/${vyntroProject.id}`,
      group: "smart",
      keywords: ["vyntro", "project", "platform", vyntroProject.name],
      badge: "Project",
      priority: 86,
    });
  }

  actions.push(
    {
      id: "open-swap",
      label: "Open Swap",
      description: "Route into the VYNTRO swap surface.",
      href: "/defi/swap",
      group: "navigate",
      keywords: ["swap", "defi", "trade", "route"],
      badge: "DeFi",
      priority: 76,
    },
    {
      id: "open-lootboxes",
      label: "Open Lootboxes",
      description: "Spend shards, open boxes and inspect inventory.",
      href: "/lootboxes",
      group: "earn",
      keywords: ["lootbox", "lootboxes", "shards", "inventory"],
      badge: "Shards",
      priority: 70,
    },
    {
      id: "open-rewards",
      label: claimableReward ? "Open reward vault" : "Check Rewards",
      description: claimableReward ? "A claimable reward is waiting." : "Inspect rewards and claim lanes.",
      href: "/rewards",
      group: "earn",
      keywords: ["reward", "rewards", "claim", "vault"],
      badge: claimableReward ? "Claimable" : undefined,
      priority: 68,
    },
    {
      id: "open-quests",
      label: "Open Quests",
      description: "View mission board and journey map.",
      href: "/quests",
      group: "earn",
      keywords: ["quests", "missions", "journey", "map"],
      priority: 62,
    },
    {
      id: "open-profile",
      label: input.accountReady ? "View Profile" : "Sign in",
      description: input.accountReady ? "Open reputation card and inventory signals." : "Access your VYNTRO account.",
      href: input.accountReady ? "/profile" : "/sign-in",
      group: "account",
      keywords: ["profile", "reputation", "account", "identity", "sign in"],
      priority: 58,
    },
    {
      id: "open-home",
      label: "Open Command Center",
      description: "Return to your VYNTRO cockpit.",
      href: "/home",
      group: "navigate",
      keywords: ["home", "dashboard", "command", "cockpit"],
      priority: 54,
    }
  );

  return actions.sort((left, right) => right.priority - left.priority || left.label.localeCompare(right.label));
}

export function filterCommandPaletteActions(actions: CommandPaletteAction[], query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return actions;
  }

  return actions.filter((action) => {
    const haystack = [action.label, action.description, action.group, action.badge, ...action.keywords]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return normalized
      .split(/\s+/)
      .every((token) => haystack.includes(token));
  });
}
