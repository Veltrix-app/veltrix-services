"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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

  if (loading) {
    return <Notice tone="default" text="Loading campaign..." />;
  }

  if (error) {
    return <Notice tone="error" text={error} />;
  }

  if (!campaign) {
    return <Notice tone="default" text="Campaign not found." />;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(192,255,0,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
          Campaign Detail
        </p>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              {campaign.title}
            </h2>
            <p className="mt-3 text-sm text-lime-200">{project?.name ?? "Project"}</p>
          </div>
          <StatusChip
            label={campaign.featured ? "Featured" : `${campaign.completionRate}% live`}
            tone={campaign.featured ? "positive" : "info"}
          />
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          {campaign.description}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <MetricTile label="XP budget" value={String(campaign.xpBudget)} />
          <MetricTile label="Quests" value={String(campaignQuests.length)} />
          <MetricTile label="Rewards" value={String(campaignRewards.length)} />
          <MetricTile
            label="Ends"
            value={campaign.endsAt ? new Date(campaign.endsAt).toLocaleDateString("nl-NL") : "Open"}
          />
        </div>
      </section>

      <Surface
        eyebrow="Quest Flow"
        title="Live quests"
        description="Verification-aware quest rows tied to this campaign."
      >
        {campaignQuests.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {campaignQuests.map((quest) => (
              <article
                key={quest.id}
                className="rounded-[26px] border border-white/8 bg-black/20 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white">{quest.title}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {quest.verificationProvider
                        ? `${quest.verificationProvider} verification`
                        : "Custom verification"}
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
              </article>
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No quests are linked to this campaign yet." />
        )}
      </Surface>

      <Surface
        eyebrow="Reward Outcome"
        title="Campaign rewards"
        description="Rewards unlocked or progressed by this mission lane."
      >
        {campaignRewards.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {campaignRewards.map((reward) => (
              <Link
                key={reward.id}
                href={`/rewards/${reward.id}`}
                className="rounded-[26px] border border-white/8 bg-black/20 p-5 transition hover:border-lime-300/30 hover:bg-black/25"
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
          <Notice tone="default" text="No rewards are linked to this campaign yet." />
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
