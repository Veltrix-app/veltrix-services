export type LootboxRevealRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export type LootboxRevealAction = {
  label: string;
  href: string;
  mode: "equip" | "claim" | "inventory";
};

export function normalizeLootboxRevealRarity(value: string): LootboxRevealRarity {
  const normalized = value.toLowerCase();
  if (
    normalized === "rare" ||
    normalized === "epic" ||
    normalized === "legendary" ||
    normalized === "mythic"
  ) {
    return normalized;
  }

  return "common";
}

export function getLootboxRevealTone(value: string) {
  const rarity = normalizeLootboxRevealRarity(value);
  const tones = {
    common: {
      label: "Clean pull",
      headline: "Vault opened",
      borderClass: "border-slate-200/18",
      glowClass: "from-slate-200/24 via-white/10 to-transparent",
      badgeClass: "border-slate-200/18 bg-slate-200/[0.08] text-slate-100",
      buttonClass: "bg-slate-100 text-black hover:brightness-110",
    },
    rare: {
      label: "Rare signal",
      headline: "Rare unlock",
      borderClass: "border-sky-300/24",
      glowClass: "from-sky-300/30 via-cyan-300/12 to-transparent",
      badgeClass: "border-sky-300/22 bg-sky-300/[0.09] text-sky-100",
      buttonClass: "bg-sky-300 text-black hover:brightness-110",
    },
    epic: {
      label: "Epic pull",
      headline: "Epic reward found",
      borderClass: "border-violet-300/28",
      glowClass: "from-violet-300/34 via-fuchsia-300/14 to-transparent",
      badgeClass: "border-violet-300/24 bg-violet-300/[0.1] text-violet-100",
      buttonClass: "bg-violet-300 text-black hover:brightness-110",
    },
    legendary: {
      label: "Legendary drop",
      headline: "Legendary reward",
      borderClass: "border-amber-300/32",
      glowClass: "from-amber-300/38 via-orange-300/16 to-transparent",
      badgeClass: "border-amber-300/28 bg-amber-300/[0.12] text-amber-100",
      buttonClass: "bg-amber-300 text-black hover:brightness-110",
    },
    mythic: {
      label: "Mythic event",
      headline: "Mythic vault break",
      borderClass: "border-rose-300/34",
      glowClass: "from-rose-300/40 via-violet-300/18 to-transparent",
      badgeClass: "border-rose-300/30 bg-rose-300/[0.12] text-rose-100",
      buttonClass: "bg-rose-300 text-black hover:brightness-110",
    },
  } satisfies Record<
    LootboxRevealRarity,
    {
      label: string;
      headline: string;
      borderClass: string;
      glowClass: string;
      badgeClass: string;
      buttonClass: string;
    }
  >;

  return { rarity, ...tones[rarity] };
}

export function getLootboxRevealAction(itemType: string): LootboxRevealAction {
  const normalized = itemType.toLowerCase();
  if (normalized === "profile_title" || normalized === "profile_cosmetic") {
    return {
      label: "Equip from vault",
      href: "#reward-vault",
      mode: "equip",
    };
  }

  if (normalized === "token_reward" || normalized === "perk_reward") {
    return {
      label: "Request claim",
      href: "#reward-vault",
      mode: "claim",
    };
  }

  return {
    label: "View in vault",
    href: "#reward-vault",
    mode: "inventory",
  };
}
