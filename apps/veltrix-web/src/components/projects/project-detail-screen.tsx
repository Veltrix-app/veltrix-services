"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ProjectBenchmarkCard } from "@/components/analytics/project-benchmark-card";
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

  if (loading) return <Notice tone="default" text="Loading project..." />;
  if (error) return <Notice tone="error" text={error} />;
  if (!project) return <Notice tone="default" text="Project not found." />;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,rgba(0,204,255,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
        {project.bannerUrl ? (
          <div className="relative h-64 bg-[linear-gradient(135deg,rgba(0,204,255,0.14),rgba(0,0,0,0.18))]">
            <ArtworkImage
              src={project.bannerUrl}
              alt={project.name}
              tone="cyan"
              fallbackLabel="Project art offline"
              imgClassName="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </div>
        ) : null}

        <div className="p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">Project Detail</p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-[14ch]">
              <h2 className="font-display text-balance text-[clamp(2.2rem,4vw,4.5rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                {project.name}
              </h2>
              <p className="mt-3 text-sm text-cyan-200">
                {project.chain ?? "Chain not set"} - {project.category ?? "General"}
              </p>
            </div>
            <StatusChip
              label={projectCampaigns.length > 0 ? "Live ecosystem" : "Public project"}
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
        <Surface
          eyebrow="Command read"
          title="What this project means right now"
          description="Project detail should open with ecosystem pressure first: what is active, what deserves attention and where your next move should go."
          className="bg-[radial-gradient(circle_at_top_left,rgba(74,217,255,0.08),transparent_28%),linear-gradient(180deg,rgba(16,22,34,0.96),rgba(9,13,22,0.96))]"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <ReadTile
              label="Now"
              value={
                projectCampaigns.length > 0
                  ? `${projectCampaigns[0].title} is the lead live campaign inside ${project.name}.`
                  : `${project.name} is visible, but no live campaigns are currently shaping it.`
              }
            />
            <ReadTile
              label="Next"
              value={
                projectCampaigns.length > 0
                  ? "Open the campaign lane first if you want the fastest route into active quests and reward pressure."
                  : "The project story is visible first because the campaign lane has not gone live yet."
              }
            />
            <ReadTile
              label="Watch"
              value={
                reputation
                  ? `Your contribution tier is ${reputation.contributionTier}, with ${reputation.xp.toLocaleString()} project XP already attached to this ecosystem.`
                  : "Your project-specific reputation has not started building here yet."
              }
            />
          </div>
        </Surface>

        <Surface
          eyebrow="Fast routes"
          title="Move through the ecosystem"
          description="The best project pages stay compact and route you into the community, website or live campaign lane without making you scan a dense side rail."
        >
          <div className="grid gap-3">
            <RouteTile
              href={`/communities/${project.id}`}
              label="Open community"
              body="Go to the community surface for missions, member pressure and the current journey lane."
            />
            {projectCampaigns[0] ? (
              <RouteTile
                href={`/campaigns/${projectCampaigns[0].id}`}
                label="Open lead campaign"
                body="Jump straight into the strongest active launch surface inside this project."
              />
            ) : null}
            {project.website ? (
              <a
                href={project.website}
                target="_blank"
                rel="noreferrer"
                className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 transition hover:border-cyan-300/20"
              >
                <p className="text-sm font-semibold text-white">Visit website</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Open the public project site without leaving the product context.
                </p>
              </a>
            ) : null}
          </div>
        </Surface>
      </section>

      <ProjectBenchmarkCard projectId={project.id} />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface
          eyebrow="Project Story"
          title="Ecosystem posture"
          description="This project should feel alive, connected and worth entering."
        >
          <div className="space-y-4">
            <div className="metric-card rounded-[24px] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Website</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {project.website
                  ? project.website
                  : "No website linked yet. This project is still visible through its live campaign surface."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/communities/${project.id}`}
                className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99]"
              >
                Open community
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
          title="Project reputation"
          description="Your momentum compounds separately inside each project."
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
        title="Campaigns in this project"
        description="Campaigns currently active inside this project."
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
        title="Rewards in this project"
        description="Rewards currently linked through this project's active campaigns."
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
          <Notice tone="default" text="No rewards are linked to this project yet." />
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

function ReadTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-7 text-slate-200">{value}</p>
    </div>
  );
}

function RouteTile({
  href,
  label,
  body,
}: {
  href: string;
  label: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 transition hover:border-cyan-300/20"
    >
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-2 text-sm leading-7 text-slate-300">{body}</p>
    </Link>
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
