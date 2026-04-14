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

function makeBanner(text: string, accent: string) {
  const encoded = encodeURIComponent(text);
  return `https://placehold.co/1600x900/07111a/${accent}/png?text=${encoded}`;
}

function makeThumb(text: string, accent: string) {
  const encoded = encodeURIComponent(text);
  return `https://placehold.co/900x900/07111a/${accent}/png?text=${encoded}`;
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
    const banner = makeBanner(project.name, project.accent);
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
        banner_url: project.banner_url,
        thumbnail_url: makeThumb(`${showcaseProjects[index].name} Launch`, showcaseProjects[index].accent),
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
        banner_url: project.banner_url,
        thumbnail_url: makeThumb(`${showcaseProjects[index].name} Raid`, showcaseProjects[index].accent),
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
    image_url: makeThumb(campaign.title, showcaseProjects[index % showcaseProjects.length].accent),
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
      banner: project.banner_url,
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
