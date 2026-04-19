"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArtworkImage } from "@/components/ui/artwork-image";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function ProjectDetailScreen() {
  const params = useParams<{ id: string }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { loading, error, projects, campaigns, rewards, projectReputation } = useLiveUserData({
    datasets: ["projects", "campaigns", "rewards", "projectReputation"],
  });

  const project = projects.find((item) => item.id === projectId);
  const projectCampaigns = campaigns.filter((item) => item.projectId === projectId);
  const projectRewards = rewards.filter((reward) =>
    projectCampaigns.some((campaign) => campaign.id === reward.campaignId)
  );
  const reputation = projectReputation.find((item) => item.projectId === projectId);

  if (loading) return <Notice tone="default" text="Loading world..." />;
  if (error) return <Notice tone="error" text={error} />;
  if (!project) return <Notice tone="default" text="World not found." />;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(135deg,rgba(0,204,255,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        {project.bannerUrl ? (
          <div className="relative h-64 bg-[linear-gradient(135deg,rgba(0,204,255,0.14),rgba(0,0,0,0.18))]">
            <ArtworkImage
              src={project.bannerUrl}
              alt={project.name}
              tone="cyan"
              fallbackLabel="World art offline"
              imgClassName="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </div>
        ) : null}

        <div className="p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">World Detail</p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-[14ch]">
              <h2 className="font-display text-balance text-[clamp(2.2rem,4vw,4.5rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                {project.name}
              </h2>
              <p className="mt-3 text-sm text-cyan-200">
                {project.chain ?? "Chain not set"} {" • "} {project.category ?? "General"}
              </p>
            </div>
            <StatusChip
              label={projectCampaigns.length > 0 ? "Live ecosystem" : "Public world"}
              tone={projectCampaigns.length > 0 ? "positive" : "info"}
            />
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            {project.description}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <MetricTile label="Members" value={project.members.toLocaleString()} />
            <MetricTile label="Campaigns" value={String(projectCampaigns.length)} />
            <MetricTile label="Rewards" value={String(projectRewards.length)} />
            <MetricTile label="Website" value={project.website ? "Linked" : "Missing"} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface
          eyebrow="World Story"
          title="Ecosystem posture"
          description="This world should feel alive, connected and worth entering."
        >
          <div className="space-y-4">
            <div className="metric-card rounded-[24px] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Website</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {project.website
                  ? project.website
                  : "No website linked yet. This world is still visible through its live campaign surface."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/communities/${project.id}`}
                className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99]"
              >
                Open community world
              </Link>
              {project.website ? (
                <a
                  href={project.website}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Visit website
                </a>
              ) : null}
            </div>
          </div>
        </Surface>

        <Surface
          eyebrow="Your Standing"
          title="World reputation"
          description="Your momentum compounds separately inside each world."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricTile label="Tier" value={reputation ? reputation.contributionTier.toUpperCase() : "NOT STARTED"} />
            <MetricTile label="Rank" value={reputation?.rank ? `#${reputation.rank}` : "-"} />
            <MetricTile label="Project XP" value={reputation ? reputation.xp.toLocaleString() : "0"} />
            <MetricTile label="Trust" value={String(reputation?.trustScore ?? 50)} />
          </div>
        </Surface>
      </div>

      <Surface
        eyebrow="Live Campaigns"
        title="Mission lanes in this world"
        description="Campaign lanes currently active inside this world."
      >
        {projectCampaigns.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {projectCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="panel-card rounded-[30px] p-5 transition hover:border-cyan-300/30 hover:bg-black/25"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white">{campaign.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{campaign.description}</p>
                  </div>
                  <StatusChip
                    label={campaign.featured ? "Prime" : `${campaign.completionRate}% live`}
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
          <Notice tone="default" text="No live campaigns are tied to this world yet." />
        )}
      </Surface>

      <Surface
        eyebrow="Vault Surface"
        title="Rewards in this world"
        description="Vault items currently linked through this world's active lanes."
      >
        {projectRewards.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {projectRewards.map((reward) => (
              <Link
                key={reward.id}
                href={`/rewards/${reward.id}`}
                className="panel-card rounded-[30px] p-5 transition hover:border-cyan-300/30 hover:bg-black/25"
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
          <Notice tone="default" text="No rewards are linked to this world yet." />
        )}
      </Surface>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[24px] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[20px] px-4 py-3">
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
