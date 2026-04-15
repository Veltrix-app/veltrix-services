"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArtworkImage } from "@/components/ui/artwork-image";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function CampaignDetailScreen() {
  const params = useParams<{ id: string }>();
  const campaignId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { loading, error, campaigns, projects, quests, rewards } = useLiveUserData();

  const campaign = campaigns.find((item) => item.id === campaignId);
  const project = projects.find((item) => item.id === campaign?.projectId);
  const campaignQuests = quests.filter((item) => item.campaignId === campaignId);
  const campaignRewards = rewards.filter((item) => item.campaignId === campaignId);

  if (loading) return <Notice tone="default" text="Loading campaign..." />;
  if (error) return <Notice tone="error" text={error} />;
  if (!campaign) return <Notice tone="default" text="Campaign not found." />;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(135deg,rgba(192,255,0,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        {campaign.bannerUrl || campaign.thumbnailUrl ? (
          <div className="relative h-64 bg-[linear-gradient(135deg,rgba(192,255,0,0.14),rgba(0,0,0,0.18))]">
            <ArtworkImage
              src={campaign.bannerUrl ?? campaign.thumbnailUrl}
              alt={campaign.title}
              tone="lime"
              fallbackLabel="Lane art offline"
              imgClassName="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </div>
        ) : null}

        <div className="p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">Mission Lane</p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-[14ch]">
              <h2 className="font-display text-balance text-[clamp(2.2rem,4vw,4.5rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                {campaign.title}
              </h2>
              <p className="mt-3 text-sm text-lime-200">{project?.name ?? "Project"}</p>
            </div>
            <StatusChip label={campaign.featured ? "Prime lane" : `${campaign.completionRate}% live`} tone={campaign.featured ? "positive" : "info"} />
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{campaign.description}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <MetricTile label="XP budget" value={String(campaign.xpBudget)} />
            <MetricTile label="Quests" value={String(campaignQuests.length)} />
            <MetricTile label="Rewards" value={String(campaignRewards.length)} />
            <MetricTile label="Ends" value={campaign.endsAt ? new Date(campaign.endsAt).toLocaleDateString("nl-NL") : "Open"} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface
          eyebrow="Mission Read"
          title="Campaign posture"
          description="This lane should feel like an active operation with live pressure and real outcome."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricTile label="Project" value={project?.name ?? "Unlinked"} />
            <MetricTile label="Completion" value={`${campaign.completionRate}%`} />
            <MetricTile label="Featured" value={campaign.featured ? "Yes" : "No"} />
            <MetricTile label="Window" value={campaign.endsAt ? "Timed" : "Open"} />
          </div>
        </Surface>

        <Surface
          eyebrow="Action"
          title="Mission routing"
          description="Jump directly into the world or community context around this lane."
        >
          <div className="flex flex-wrap gap-3">
            {project ? (
              <Link href={`/projects/${project.id}`} prefetch={false} className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99]">
                Open world
              </Link>
            ) : null}
            {project ? (
              <Link href={`/communities/${project.id}`} prefetch={false} className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                Open community world
              </Link>
            ) : null}
          </div>
        </Surface>
      </div>

      <Surface
        eyebrow="Quest Flow"
        title="Mission steps"
        description="Verification-aware mission steps tied to this lane."
      >
        {campaignQuests.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {campaignQuests.map((quest) => (
              <Link key={quest.id} href={`/quests/${quest.id}`} prefetch={false} className="panel-card rounded-[30px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white">{quest.title}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {quest.verificationProvider ? `${quest.verificationProvider} verification` : "Custom verification"}
                    </p>
                  </div>
                  <StatusChip
                    label={quest.status}
                    tone={
                      quest.status === "approved"
                        ? "positive"
                        : quest.status === "pending"
                          ? "warning"
                          : quest.status === "rejected"
                            ? "danger"
                            : "info"
                    }
                  />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MiniStat label="XP" value={`+${quest.xp}`} />
                  <MiniStat label="Mode" value={quest.completionMode ?? "manual"} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No quests are linked to this lane yet." />
        )}
      </Surface>

      <Surface
        eyebrow="Reward Outcome"
        title="Campaign rewards"
        description="Vault outcomes unlocked or progressed by this lane."
      >
        {campaignRewards.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {campaignRewards.map((reward) => (
              <Link key={reward.id} href={`/rewards/${reward.id}`} prefetch={false} className="panel-card rounded-[30px] p-5 transition hover:border-lime-300/30 hover:bg-black/25">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white">{reward.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{reward.description}</p>
                  </div>
                  <StatusChip label={reward.claimable ? "Claimable" : "Locked"} tone={reward.claimable ? "positive" : "default"} />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MiniStat label="Cost" value={`${reward.cost} XP`} />
                  <MiniStat label="Rarity" value={reward.rarity} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No rewards are linked to this lane yet." />
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
