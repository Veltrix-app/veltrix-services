import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../lib/supabase.js";

type ProjectBlueprint = {
  name: string;
  chain: string;
  category: string;
  mood: string;
  accent: string;
  description: string;
  longDescription: string;
};

const showcaseProjects: ProjectBlueprint[] = [
  {
    name: "Atlas Frontier",
    chain: "Ethereum",
    category: "Infrastructure",
    mood: "signal-rich launch grid",
    accent: "9eff00",
    description: "A launch ecosystem focused on network visibility, squad coordination and partner activations.",
    longDescription: "Atlas Frontier uses Veltrix as its public mission grid for launch awareness, partner activations and community growth loops across multiple campaigns.",
  },
  {
    name: "Chainwars",
    chain: "BNB Chain",
    category: "Gaming",
    mood: "raid-heavy gaming world",
    accent: "00d1ff",
    description: "A gaming-native world tuned for raid pressure, mission pacing and reward heat.",
    longDescription: "Chainwars runs a layered campaign model with squad raids, onboarding missions and loot-driven engagement to keep its world feeling alive.",
  },
  {
    name: "Pepe Raiders",
    chain: "Ethereum",
    category: "Community",
    mood: "meme-first growth engine",
    accent: "7dff4d",
    description: "A viral community world built around social pressure, meme reach and rapid mission throughput.",
    longDescription: "Pepe Raiders uses community-first loops with social tasks, fast raid bursts and collectible reward drops to sustain daily energy.",
  },
  {
    name: "Nebula Net",
    chain: "Base",
    category: "AI",
    mood: "high-tech operator lane",
    accent: "6ae2ff",
    description: "An AI-native ecosystem that pushes operator reputation, verification and research missions.",
    longDescription: "Nebula Net turns advanced product launches into operator missions, blending community raids with knowledge-driven campaign loops.",
  },
  {
    name: "Ghost Market",
    chain: "Solana",
    category: "Marketplace",
    mood: "dark liquidity bazaar",
    accent: "ffb347",
    description: "A marketplace world where community momentum, listings and creator campaigns all compete for attention.",
    longDescription: "Ghost Market uses its Veltrix surfaces to spotlight drops, growth sprints and marketplace events with clear reward ladders.",
  },
  {
    name: "Quantum Guild",
    chain: "Arbitrum",
    category: "Education",
    mood: "operator academy",
    accent: "91ffdb",
    description: "An education-driven world where contributors level up through missions, proof quests and guild raids.",
    longDescription: "Quantum Guild is structured around faction learning loops, social quests and proof-backed contribution campaigns.",
  },
  {
    name: "Solar Syndicate",
    chain: "Polygon",
    category: "Creator",
    mood: "creator launchpad",
    accent: "ffe36e",
    description: "A creator-heavy project world with campaign lanes for drops, shoutouts and gated reward unlocks.",
    longDescription: "Solar Syndicate relies on fast content campaigns, creator collaborations and collector-facing reward vaults.",
  },
  {
    name: "Luna Pulse",
    chain: "Optimism",
    category: "SocialFi",
    mood: "social mission hub",
    accent: "92f6ff",
    description: "A SocialFi world optimized for follow quests, amplification raids and campaign-linked reputation.",
    longDescription: "Luna Pulse structures community growth around social verification, lightweight onboarding and regular raid pulses.",
  },
  {
    name: "Ironclad DAO",
    chain: "Ethereum",
    category: "DAO",
    mood: "governance war room",
    accent: "ff8b8b",
    description: "A DAO world where contributors earn access and standing through campaigns, raids and proof-based quests.",
    longDescription: "Ironclad DAO turns contributor operations into ranked missions, encouraging sustained momentum and earned reputation.",
  },
  {
    name: "Wildbyte",
    chain: "Avalanche",
    category: "Consumer",
    mood: "fast arcade consumer grid",
    accent: "9cfb5b",
    description: "A consumer project world with highly visual launches, mobile-first quests and playful reward heat.",
    longDescription: "Wildbyte blends creator drops, community raids and unlockable digital rewards into a faster consumer experience.",
  },
  {
    name: "Aether Loop",
    chain: "zkSync",
    category: "Infrastructure",
    mood: "next-gen signal mesh",
    accent: "73f0ff",
    description: "An infra-focused world tuned for ecosystem education, verification and advanced launch support.",
    longDescription: "Aether Loop uses layered campaigns to guide contributors from discovery into advanced participation and ambassador work.",
  },
  {
    name: "Drift Harbor",
    chain: "Sui",
    category: "Trading",
    mood: "high-volume command dock",
    accent: "ffb36b",
    description: "A trading-centric world where campaigns revolve around visibility bursts, partner raids and unlockable perks.",
    longDescription: "Drift Harbor uses raid coordination and promotional campaigns to move users into trading, referrals and event participation.",
  },
  {
    name: "Mythic Room",
    chain: "Ethereum",
    category: "Collectibles",
    mood: "premium collector arena",
    accent: "d5a6ff",
    description: "A collectible-first world designed around scarcity, prestige and high-heat reward moments.",
    longDescription: "Mythic Room pairs premium collectibles with raid pushes, reveal campaigns and collector ranking pressure.",
  },
  {
    name: "Turbo Garden",
    chain: "Base",
    category: "Community",
    mood: "bright social greenhouse",
    accent: "7dff88",
    description: "A community world built for fast missions, referral loops and playful social campaigns.",
    longDescription: "Turbo Garden uses fast progression hooks and repeatable campaign lanes to sustain daily social growth.",
  },
  {
    name: "Echo Forge",
    chain: "Arbitrum",
    category: "Gaming",
    mood: "mechanical raid factory",
    accent: "7fe8ff",
    description: "A gaming world where every campaign feels like a mission cartridge and every reward slot matters.",
    longDescription: "Echo Forge structures its growth playbook around launch raids, operator quests and high-value reward drops.",
  },
  {
    name: "Prism Core",
    chain: "Polygon",
    category: "AI",
    mood: "precision signal engine",
    accent: "fff17c",
    description: "A data-heavy AI world focused on reputation, mission hygiene and sharp verification flows.",
    longDescription: "Prism Core mixes educational launches with AI-themed campaign beats and clear user progression.",
  },
  {
    name: "Nightshift",
    chain: "Optimism",
    category: "Infrastructure",
    mood: "late-night operator grid",
    accent: "8cc5ff",
    description: "A dark-mode operations world where launch windows, status checks and reward readiness are tightly tracked.",
    longDescription: "Nightshift uses tactical mission lanes and raid pushes to turn launches into nightly operator campaigns.",
  },
  {
    name: "Velora Labs",
    chain: "Ethereum",
    category: "Research",
    mood: "experimental command lab",
    accent: "8effc2",
    description: "A research-forward world that rewards deep contributors with tiered campaigns and unlockable proof quests.",
    longDescription: "Velora Labs turns research, community feedback and content amplification into measurable campaign work.",
  },
  {
    name: "Manta Rise",
    chain: "Solana",
    category: "Consumer",
    mood: "clean launch ocean",
    accent: "7be4ff",
    description: "A consumer-facing world with polished launches, visual campaigns and highly visible reward ladders.",
    longDescription: "Manta Rise uses lightweight onboarding missions and campaign-based progression to scale product attention.",
  },
  {
    name: "Riot Garden",
    chain: "Base",
    category: "Creator",
    mood: "chaotic creator arcade",
    accent: "ff9d6e",
    description: "A creator world built around momentum, hype loops and playful rewards that keep the grid buzzing.",
    longDescription: "Riot Garden turns every creator drop into a structured mission lane with raids, social quests and collectible payoffs.",
  },
  {
    name: "Circuit House",
    chain: "BNB Chain",
    category: "Marketplace",
    mood: "high-density trading hall",
    accent: "ffd66e",
    description: "A marketplace world designed around campaign bursts, community raids and clear buyer incentives.",
    longDescription: "Circuit House uses launch-focused campaigns and marketplace raid pushes to drive high-energy participation.",
  },
  {
    name: "Coreline",
    chain: "Arbitrum",
    category: "Infrastructure",
    mood: "serious builder lane",
    accent: "71f5ff",
    description: "A builder-centric world where technical launches and partner missions sit alongside community raids.",
    longDescription: "Coreline uses mission-driven launches to translate technical milestones into community participation and ecosystem awareness.",
  },
  {
    name: "Bloom Protocol",
    chain: "Polygon",
    category: "DeFi",
    mood: "bright yield arena",
    accent: "92ff74",
    description: "A DeFi world that balances onboarding, product education and reward-driven community loops.",
    longDescription: "Bloom Protocol structures its public growth around campaign-based education and high-heat vault rewards.",
  },
  {
    name: "Nova Yard",
    chain: "Sui",
    category: "Gaming",
    mood: "squad-first battle yard",
    accent: "92d8ff",
    description: "A game-like ecosystem built for squads, raids and visible mission streaks.",
    longDescription: "Nova Yard translates game energy into campaign pacing with raid bursts, quick quests and rare payoff moments.",
  },
  {
    name: "Mirror Syndicate",
    chain: "Ethereum",
    category: "Community",
    mood: "prestige faction hall",
    accent: "f6b0ff",
    description: "A prestige-heavy world where rank, faction standing and premium unlocks all matter.",
    longDescription: "Mirror Syndicate uses campaign-driven ranking and selective reward ladders to reinforce community status.",
  },
];

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : normalized;

  const parsed = Number.parseInt(value, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeBanner({
  title,
  subtitle,
  eyebrow,
  accent,
}: {
  title: string;
  subtitle: string;
  eyebrow: string;
  accent: string;
}) {
  const { r, g, b } = hexToRgb(accent);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1600" y2="900">
          <stop stop-color="#07111A"/>
          <stop offset="0.5" stop-color="#0B1621"/>
          <stop offset="1" stop-color="#05090F"/>
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1160 260) rotate(132) scale(600 420)">
          <stop stop-color="rgb(${r} ${g} ${b})" stop-opacity="0.55"/>
          <stop offset="1" stop-color="rgb(${r} ${g} ${b})" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="glow2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(320 680) rotate(12) scale(520 360)">
          <stop stop-color="rgb(${r} ${g} ${b})" stop-opacity="0.22"/>
          <stop offset="1" stop-color="rgb(${r} ${g} ${b})" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" rx="48" fill="url(#bg)"/>
      <rect width="1600" height="900" rx="48" fill="url(#glow)"/>
      <rect width="1600" height="900" rx="48" fill="url(#glow2)"/>
      <g opacity="0.16" stroke="rgb(${r} ${g} ${b})">
        <path d="M0 170H1600"/>
        <path d="M0 620H1600"/>
        <path d="M230 0V900"/>
        <path d="M1090 0V900"/>
      </g>
      <g opacity="0.9">
        <rect x="84" y="84" width="238" height="42" rx="21" fill="rgba(${r}, ${g}, ${b}, 0.18)" stroke="rgba(${r}, ${g}, ${b}, 0.5)"/>
        <text x="112" y="112" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="5">${eyebrow}</text>
      </g>
      <text x="92" y="290" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="800">${title}</text>
      <text x="92" y="352" fill="rgba(255,255,255,0.84)" font-family="Arial, Helvetica, sans-serif" font-size="30">${subtitle}</text>
      <g opacity="0.95">
        <rect x="92" y="706" width="300" height="88" rx="28" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)"/>
        <text x="124" y="744" fill="rgb(${r} ${g} ${b})" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">LIVE WORLD</text>
        <text x="124" y="782" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700">Veltrix showcase build</text>
      </g>
      <g>
        <circle cx="1230" cy="332" r="178" fill="rgba(${r}, ${g}, ${b}, 0.11)" stroke="rgba(${r}, ${g}, ${b}, 0.42)" stroke-width="2"/>
        <circle cx="1230" cy="332" r="128" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)"/>
        <circle cx="1230" cy="332" r="88" fill="rgba(${r}, ${g}, ${b}, 0.22)"/>
        <path d="M1152 332H1308" stroke="rgba(255,255,255,0.65)" stroke-width="2"/>
        <path d="M1230 254V410" stroke="rgba(255,255,255,0.65)" stroke-width="2"/>
      </g>
    </svg>
  `;
  return svgDataUri(svg);
}

function makeThumb({
  title,
  subtitle,
  accent,
}: {
  title: string;
  subtitle: string;
  accent: string;
}) {
  const { r, g, b } = hexToRgb(accent);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="900" y2="900">
          <stop stop-color="#07111A"/>
          <stop offset="0.55" stop-color="#0C1520"/>
          <stop offset="1" stop-color="#05090F"/>
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(620 230) rotate(128) scale(300 250)">
          <stop stop-color="rgb(${r} ${g} ${b})" stop-opacity="0.58"/>
          <stop offset="1" stop-color="rgb(${r} ${g} ${b})" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="900" height="900" rx="40" fill="url(#bg)"/>
      <rect width="900" height="900" rx="40" fill="url(#glow)"/>
      <g opacity="0.16" stroke="rgb(${r} ${g} ${b})">
        <path d="M0 188H900"/>
        <path d="M0 676H900"/>
        <path d="M188 0V900"/>
        <path d="M706 0V900"/>
      </g>
      <rect x="60" y="60" width="220" height="40" rx="20" fill="rgba(${r}, ${g}, ${b}, 0.18)" stroke="rgba(${r}, ${g}, ${b}, 0.45)"/>
      <text x="88" y="86" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" letter-spacing="4">VELTRIX</text>
      <text x="68" y="612" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="800">${title}</text>
      <text x="68" y="666" fill="rgba(255,255,255,0.82)" font-family="Arial, Helvetica, sans-serif" font-size="24">${subtitle}</text>
      <g>
        <circle cx="650" cy="294" r="146" fill="rgba(${r}, ${g}, ${b}, 0.14)" stroke="rgba(${r}, ${g}, ${b}, 0.38)" stroke-width="2"/>
        <circle cx="650" cy="294" r="104" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)"/>
        <circle cx="650" cy="294" r="68" fill="rgba(${r}, ${g}, ${b}, 0.26)"/>
      </g>
    </svg>
  `;
  return svgDataUri(svg);
}

async function seed() {
  const existingProjects = await supabaseAdmin
    .from("projects")
    .select("id, slug")
    .like("slug", "showcase-%");

  if (existingProjects.error) {
    throw existingProjects.error;
  }

  const oldProjectIds = (existingProjects.data ?? []).map((item) => item.id);
  if (oldProjectIds.length > 0) {
    const existingCampaigns = await supabaseAdmin
      .from("campaigns")
      .select("id")
      .in("project_id", oldProjectIds);

    if (existingCampaigns.error) {
      throw existingCampaigns.error;
    }

    const oldCampaignIds = (existingCampaigns.data ?? []).map((item) => item.id);

    if (oldCampaignIds.length > 0) {
      const deleteRaids = await supabaseAdmin.from("raids").delete().in("campaign_id", oldCampaignIds);
      if (deleteRaids.error) throw deleteRaids.error;

      const deleteRewards = await supabaseAdmin.from("rewards").delete().in("campaign_id", oldCampaignIds);
      if (deleteRewards.error) throw deleteRewards.error;
    }

    const deleteQuests = await supabaseAdmin.from("quests").delete().in("project_id", oldProjectIds);
    if (deleteQuests.error) throw deleteQuests.error;

    const deleteCampaigns = await supabaseAdmin.from("campaigns").delete().in("project_id", oldProjectIds);
    if (deleteCampaigns.error) throw deleteCampaigns.error;

    const deleteProjects = await supabaseAdmin.from("projects").delete().in("id", oldProjectIds);
    if (deleteProjects.error) throw deleteProjects.error;
  }

  const projectRows = showcaseProjects.map((project, index) => {
    const slug = `showcase-${slugify(project.name)}`;
    const banner = makeBanner({
      title: project.name,
      subtitle: project.mood,
      eyebrow: `${project.chain} / ${project.category}`.toUpperCase(),
      accent: project.accent,
    });
    return {
      id: randomUUID(),
      name: project.name,
      slug,
      chain: project.chain,
      category: project.category,
      status: "active",
      description: project.description,
      long_description: project.longDescription,
      members: 1800 + index * 137,
      logo: project.name.slice(0, 2).toUpperCase(),
      banner_url: banner,
      website: `https://showcase.veltrix.world/${slug}`,
      x_url: `https://x.com/${slug.replace(/-/g, "")}`,
      telegram_url: `https://t.me/${slug.replace(/-/g, "_")}`,
      discord_url: `https://discord.gg/${slug.slice(0, 10)}`,
      contact_email: `${slug}@veltrix-showcase.local`,
      brand_accent: `#${project.accent}`,
      brand_mood: project.mood,
      is_public: true,
      is_featured: index < 8,
    };
  });

  const insertProjects = await supabaseAdmin.from("projects").insert(projectRows).select("id, name");
  if (insertProjects.error) {
    throw insertProjects.error;
  }

  const campaignRows = projectRows.flatMap((project, index) => {
    const launchCampaignId = randomUUID();
    const raidCampaignId = randomUUID();
    return [
      {
        id: launchCampaignId,
        project_id: project.id,
        title: `${showcaseProjects[index].name} Boot Sequence`,
        slug: `${project.slug}-boot-sequence`,
        short_description: `Push the first launch wave for ${showcaseProjects[index].name} and unlock early grid momentum.`,
        long_description: `A launch-focused campaign lane for ${showcaseProjects[index].name}, tuned for discovery, operator onboarding and reward pressure.`,
        banner_url: makeBanner({
          title: `${showcaseProjects[index].name} Boot Sequence`,
          subtitle: "Launch lane / discovery pressure / early momentum",
          eyebrow: "CAMPAIGN / LAUNCH",
          accent: showcaseProjects[index].accent,
        }),
        thumbnail_url: makeThumb({
          title: "Boot",
          subtitle: showcaseProjects[index].name,
          accent: showcaseProjects[index].accent,
        }),
        campaign_type: "social_growth",
        xp_budget: 1200 + index * 40,
        participants: 240 + index * 9,
        completion_rate: 42 + (index % 33),
        visibility: "public",
        featured: index % 3 === 0,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + (5 + index) * 86400000).toISOString(),
        status: "active",
      },
      {
        id: raidCampaignId,
        project_id: project.id,
        title: `${showcaseProjects[index].name} Squad Surge`,
        slug: `${project.slug}-squad-surge`,
        short_description: `Join a higher-pressure mission lane with raid pushes, social tasks and premium reward heat.`,
        long_description: `This campaign turns ${showcaseProjects[index].name} into a squad-first mission lane with raids, coordinated pushes and stronger payoff pacing.`,
        banner_url: makeBanner({
          title: `${showcaseProjects[index].name} Squad Surge`,
          subtitle: "Raid lane / squad pressure / premium reward heat",
          eyebrow: "CAMPAIGN / RAID",
          accent: showcaseProjects[index].accent,
        }),
        thumbnail_url: makeThumb({
          title: "Surge",
          subtitle: showcaseProjects[index].name,
          accent: showcaseProjects[index].accent,
        }),
        campaign_type: "community_growth",
        xp_budget: 1800 + index * 55,
        participants: 320 + index * 11,
        completion_rate: 28 + (index % 41),
        visibility: "public",
        featured: index % 4 === 0,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + (9 + index) * 86400000).toISOString(),
        status: "active",
      },
    ];
  });

  const insertCampaigns = await supabaseAdmin.from("campaigns").insert(campaignRows);
  if (insertCampaigns.error) {
    throw insertCampaigns.error;
  }

  const questTemplates = [
    {
      title: "Lock in your social follow",
      quest_type: "social_follow",
      verification_type: "api_check",
      verification_provider: "x",
      completion_mode: "integration_auto",
      action_label: "Follow on X",
      proof_required: false,
      proof_type: "none",
    },
    {
      title: "Join the signal room",
      quest_type: "discord_join",
      verification_type: "bot_check",
      verification_provider: "discord",
      completion_mode: "integration_auto",
      action_label: "Join Discord",
      proof_required: false,
      proof_type: "none",
    },
    {
      title: "Hit the launch page",
      quest_type: "url_visit",
      verification_type: "event_check",
      verification_provider: "website",
      completion_mode: "integration_auto",
      action_label: "Open launch site",
      proof_required: false,
      proof_type: "none",
    },
  ] as const;

  const questRows = campaignRows.flatMap((campaign, index) =>
    questTemplates.map((template, templateIndex) => ({
      id: randomUUID(),
      project_id: campaign.project_id,
      campaign_id: campaign.id,
      title: `${template.title} ${templateIndex === 0 ? "Alpha" : templateIndex === 1 ? "Beta" : "Gamma"}`,
      short_description: `Complete ${template.title.toLowerCase()} for ${campaign.title}.`,
      type: template.quest_type,
      quest_type: template.quest_type,
      xp: 80 + templateIndex * 40 + (index % 5) * 5,
      action_label: template.action_label,
      action_url: `https://showcase.veltrix.world/${slugify(campaign.title)}/${template.quest_type}`,
      proof_required: template.proof_required,
      proof_type: template.proof_type,
      auto_approve: false,
      verification_type: template.verification_type,
      verification_provider: template.verification_provider,
      completion_mode: template.completion_mode,
      verification_config: {
        provider: template.verification_provider,
        showcase: true,
        sourceCampaign: campaign.title,
      },
      is_repeatable: false,
      cooldown_seconds: 0,
      max_completions_per_user: 1,
      sort_order: templateIndex + 1,
      status: "active",
    }))
  );

  const insertQuests = await supabaseAdmin.from("quests").insert(questRows);
  if (insertQuests.error) {
    throw insertQuests.error;
  }

  const rewardRows = campaignRows.map((campaign, index) => ({
    id: randomUUID(),
    project_id: campaign.project_id,
    campaign_id: campaign.id,
    title: `${campaign.title} ${index % 2 === 0 ? "Access Pass" : "Vault Drop"}`,
    type: index % 2 === 0 ? "badge" : "access",
    reward_type: index % 2 === 0 ? "badge" : "access",
    rarity: index % 7 === 0 ? "legendary" : index % 5 === 0 ? "epic" : index % 3 === 0 ? "rare" : "common",
    cost: 120 + index * 18,
    claimable: index % 4 === 0,
    image_url: makeThumb({
      title: index % 2 === 0 ? "Access" : "Vault",
      subtitle: campaign.title,
      accent: showcaseProjects[index % showcaseProjects.length].accent,
    }),
  }));

  const insertRewards = await supabaseAdmin.from("rewards").insert(rewardRows);
  if (insertRewards.error) {
    throw insertRewards.error;
  }

  const raidRows = projectRows.map((project, index) => {
    const linkedCampaign = campaignRows[index * 2 + 1] ?? campaignRows[index * 2];
    return {
      id: randomUUID(),
      project_id: project.id,
      campaign_id: linkedCampaign.id,
      title: `${showcaseProjects[index].name} Raid Window`,
      short_description: `Coordinated showcase raid for ${showcaseProjects[index].name}.`,
      community: showcaseProjects[index].name,
      timer: `${6 + (index % 8)}h left`,
      reward_xp: 180 + index * 12,
      participants: 40 + index * 6,
      progress: 18 + (index * 7) % 81,
      target: `Coordinate a fast squad push for ${showcaseProjects[index].name} across its live mission lane.`,
      banner: makeBanner({
        title: `${showcaseProjects[index].name} Raid Window`,
        subtitle: "Coordinated push / signal burst / XP payout",
        eyebrow: "RAID / LIVE",
        accent: showcaseProjects[index].accent,
      }),
      platform: "x",
      verification_type: "manual_confirm",
      instructions: [
        "Open the linked mission lane.",
        "Complete the social pulse tasks.",
        "Return to confirm the coordinated push.",
      ],
      status: "active",
    };
  });

  const insertRaids = await supabaseAdmin.from("raids").insert(raidRows);
  if (insertRaids.error) {
    throw insertRaids.error;
  }

  console.log(
    JSON.stringify(
      {
        projects: projectRows.length,
        campaigns: campaignRows.length,
        quests: questRows.length,
        rewards: rewardRows.length,
        raids: raidRows.length,
      },
      null,
      2
    )
  );
}

seed().catch((error) => {
  console.error("Showcase seed failed:", error);
  process.exit(1);
});
