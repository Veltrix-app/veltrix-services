"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function ProjectDetailScreen() {
  const params = useParams<{ id: string }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { loading, error, projects, campaigns, rewards, projectReputation } = useLiveUserData();

  const project = projects.find((item) => item.id === projectId);
  const projectCampaigns = campaigns.filter((item) => item.projectId === projectId);
  const projectRewards = rewards.filter((reward) =>
    projectCampaigns.some((campaign) => campaign.id === reward.campaignId)
  );
  const reputation = projectReputation.find((item) => item.projectId === projectId);

  if (loading) {
    return <Notice tone="default" text="Loading project..." />;
  }

  if (error) {
    return <Notice tone="error" text={error} />;
  }

  if (!project) {
    return <Notice tone="default" text="Project not found." />;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(0,204,255,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
          Project Detail
        </p>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              {project.name}
            </h2>
            <p className="mt-3 text-sm text-cyan-200">
              {project.chain ?? "Chain not set"} · {project.category ?? "General"}
            </p>
          </div>
          <StatusChip
            label={projectCampaigns.length > 0 ? "Live ecosystem" : "Public profile"}
            tone={projectCampaigns.length > 0 ? "positive" : "info"}
          />
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          {project.description}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <MetricTile label="Members" value={project.members.toLocaleString()} />
          <MetricTile label="Campaigns" value={String(projectCampaigns.length)} />
          <MetricTile label="Rewards" value={String(projectRewards.length)} />
        </div>
      </section>

      <Surface
        eyebrow="Project Story"
        title="Public profile"
        description="The web detail surface gives each project a clearer branded mission-world feel."
      >
        <p className="text-sm leading-7 text-slate-300">
          {project.website
            ? `Website linked: ${project.website}`
            : "No website linked yet. This project is still visible through its active campaign surface."}
        </p>
        <div className="mt-5">
          <Link
            href={`/communities/${project.id}`}
            className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Open community world
          </Link>
        </div>
      </Surface>

      <Surface
        eyebrow="Your Standing"
        title="Project reputation"
        description="Inside each project, your momentum is tracked separately from your global Veltrix profile."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Tier" value={reputation ? reputation.contributionTier.toUpperCase() : "NOT STARTED"} />
          <MetricTile label="Rank" value={reputation?.rank ? `#${reputation.rank}` : "-"} />
          <MetricTile label="Project XP" value={reputation ? reputation.xp.toLocaleString() : "0"} />
          <MetricTile label="Trust" value={String(reputation?.trustScore ?? 50)} />
        </div>
      </Surface>

      <Surface
        eyebrow="Campaigns"
        title="Live campaigns"
        description="All campaigns currently tied to this project."
      >
        {projectCampaigns.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {projectCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="rounded-[26px] border border-white/8 bg-black/20 p-5 transition hover:border-cyan-300/30 hover:bg-black/25"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white">{campaign.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{campaign.description}</p>
                  </div>
                  <StatusChip
                    label={campaign.featured ? "Featured" : `${campaign.completionRate}% live`}
                    tone={campaign.featured ? "positive" : "info"}
                  />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MiniStat label="XP budget" value={String(campaign.xpBudget)} />
                  <MiniStat
                    label="Ends"
                    value={campaign.endsAt ? new Date(campaign.endsAt).toLocaleDateString("nl-NL") : "Open"}
                  />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No live campaigns are tied to this project yet." />
        )}
      </Surface>

      <Surface
        eyebrow="Rewards"
        title="Reward surface"
        description="Rewards linked through this project's campaigns."
      >
        {projectRewards.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {projectRewards.map((reward) => (
              <Link
                key={reward.id}
                href={`/rewards/${reward.id}`}
                className="rounded-[26px] border border-white/8 bg-black/20 p-5 transition hover:border-cyan-300/30 hover:bg-black/25"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white">{reward.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{reward.description}</p>
                  </div>
                  <StatusChip
                    label={reward.claimable ? "Claimable" : "Locked"}
                    tone={reward.claimable ? "positive" : "default"}
                  />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MiniStat label="Cost" value={`${reward.cost} XP`} />
                  <MiniStat label="Rarity" value={reward.rarity} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No rewards are linked to this project yet." />
        )}
      </Surface>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Notice({ text, tone }: { text: string; tone: "default" | "error" }) {
  return (
    <div
      className={`rounded-[24px] px-4 py-6 text-sm ${
        tone === "error"
          ? "border border-rose-400/20 bg-rose-500/10 text-rose-200"
          : "border border-white/8 bg-black/20 text-slate-300"
      }`}
    >
      {text}
    </div>
  );
}
