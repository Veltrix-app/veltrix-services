"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function RewardDetailScreen() {
  const params = useParams<{ id: string }>();
  const rewardId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { loading, error, rewards, campaigns, projects } = useLiveUserData();

  const reward = rewards.find((item) => item.id === rewardId);
  const campaign = campaigns.find((item) => item.id === reward?.campaignId);
  const project = projects.find((item) => item.id === campaign?.projectId);

  if (loading) {
    return <Notice tone="default" text="Loading reward..." />;
  }

  if (error) {
    return <Notice tone="error" text={error} />;
  }

  if (!reward) {
    return <Notice tone="default" text="Reward not found." />;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,196,0,0.14),rgba(0,0,0,0)_30%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-amber-300">
          Reward Detail
        </p>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              {reward.title}
            </h2>
            <p className="mt-3 text-sm text-amber-200">
              {project?.name ?? "Project"}{campaign ? ` · ${campaign.title}` : ""}
            </p>
          </div>
          <StatusChip
            label={reward.claimable ? "Claimable" : "Locked"}
            tone={reward.claimable ? "positive" : "default"}
          />
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          {reward.description}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <MetricTile label="Cost" value={`${reward.cost} XP`} />
          <MetricTile label="Rarity" value={reward.rarity} />
          <MetricTile label="Type" value={reward.rewardType} />
        </div>
      </section>

      <Surface
        eyebrow="Claim Readiness"
        title="Reward status"
        description="A cleaner web detail view for payoff, eligibility and linked mission context."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricTile label="State" value={reward.claimable ? "Claimable" : "Locked"} />
          <MetricTile label="Campaign" value={campaign ? "Linked" : "Direct"} />
          <MetricTile label="Project" value={project ? "Linked" : "Unknown"} />
        </div>
      </Surface>

      {campaign ? (
        <Surface
          eyebrow="Mission Link"
          title="Linked campaign"
          description="This reward is tied to an active mission lane."
        >
          <Link
            href={`/campaigns/${campaign.id}`}
            className="block rounded-[26px] border border-white/8 bg-black/20 p-5 transition hover:border-amber-300/30 hover:bg-black/25"
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
        </Surface>
      ) : null}
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
