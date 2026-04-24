"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ArtworkImage } from "@/components/ui/artwork-image";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";
import { useAuth } from "@/components/providers/auth-provider";
import { useCommunityJourney } from "@/hooks/use-community-journey";

export function RewardDetailScreen() {
  const params = useParams<{ id: string }>();
  const rewardId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { session } = useAuth();
  const { snapshot: communitySnapshot } = useCommunityJourney();
  const { loading, error, rewards, campaigns, projects, claimReward, reload } = useLiveUserData({
    datasets: ["rewards", "campaigns", "projects"],
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "default" | "error" | "success"; text: string } | null>(
    null
  );

  const reward = rewards.find((item) => item.id === rewardId);
  const campaign = campaigns.find((item) => item.id === reward?.campaignId);
  const project = projects.find((item) => item.id === campaign?.projectId);

  if (loading) return <Notice tone="default" text="Loading reward..." />;
  if (error) return <Notice tone="error" text={error} />;
  if (!reward) return <Notice tone="default" text="Reward not found." />;

  const currentReward = reward;
  const rewardAlreadyClaimed = currentReward.claimed ?? false;
  const canClaimReward = currentReward.claimable && !rewardAlreadyClaimed;
  const nextRewardMove = rewardAlreadyClaimed
    ? "This reward is already in your claimed inventory, so the next move is to trace it back through the linked campaign or project."
    : canClaimReward
      ? "Route the claim now or open the linked campaign first if you want to read the surrounding lane before cashing in."
      : "Keep pushing the linked campaign and quest lane until this reward flips from locked to claimable.";
  const watchRewardCue = campaign
    ? `${campaign.title} is the strongest unlock lane behind this reward, while ${communitySnapshot.readinessLabel.toLowerCase()} is still shaping where claims should route next.`
    : `${communitySnapshot.readinessLabel} is still the main member-lane cue around this reward.`;

  async function handleClaimReward() {
    if (!session) {
      setMessage({
        tone: "error",
        text: "Sign in with an active member session before routing a reward claim.",
      });
      return;
    }

    if (!canClaimReward) {
      setMessage({
        tone: "default",
        text: rewardAlreadyClaimed
          ? "This reward is already in your claimed inventory."
          : "This reward is still locked behind progression.",
      });
      return;
    }

    setBusy(true);
    setMessage({
      tone: "default",
      text: "Routing your reward claim into the live fulfillment queue.",
    });

    const result = await claimReward(currentReward.id);

    if (!result.ok) {
      setMessage({
        tone: "error",
        text: result.error ?? "Veltrix could not submit this reward claim yet.",
      });
      setBusy(false);
      return;
    }

    await reload();
    setMessage({
      tone: "success",
      text: result.alreadyClaimed
        ? "This reward was already claimed and has been synced back into your rewards state."
        : "Reward claim submitted. The reward is now in the fulfillment queue.",
    });
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,196,0,0.14),rgba(0,0,0,0)_30%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        {currentReward.imageUrl ? (
          <div className="relative h-64 bg-[linear-gradient(135deg,rgba(255,196,0,0.16),rgba(0,0,0,0.18))]">
            <ArtworkImage
              src={currentReward.imageUrl}
              alt={currentReward.title}
              tone="amber"
              fallbackLabel="Reward art offline"
              imgClassName="h-full w-full object-cover opacity-82"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </div>
        ) : null}

        <div className="p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-amber-300">Reward</p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-[14ch]">
              <h2 className="font-display text-balance text-[clamp(2.2rem,4vw,4.5rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                {currentReward.title}
              </h2>
              <p className="mt-3 text-sm text-amber-200">
                {project?.name ?? "Project"}
                {campaign ? ` - ${campaign.title}` : ""}
              </p>
            </div>
            <StatusChip
              label={rewardAlreadyClaimed ? "Claimed" : currentReward.claimable ? "Claimable" : "Locked"}
              tone={rewardAlreadyClaimed || currentReward.claimable ? "positive" : "default"}
            />
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{currentReward.description}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <MetricTile label="Cost" value={`${currentReward.cost} XP`} />
            <MetricTile label="Rarity" value={currentReward.rarity} />
            <MetricTile label="Type" value={currentReward.rewardType} />
            <MetricTile
              label="State"
              value={rewardAlreadyClaimed ? "Claimed" : currentReward.claimable ? "Ready" : "Locked"}
            />
          </div>
        </div>
      </section>

      {message ? <Notice tone={message.tone} text={message.text} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface
          eyebrow="Command read"
          title="Read the payoff before you route the claim"
          description="Start with the live state, the next move, and the one unlock cue that matters before you press claim."
          className="bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]"
        >
          <div className="grid gap-3">
            <ReadTile
              label="Now"
              value={`${currentReward.title} is currently ${rewardAlreadyClaimed ? "already claimed" : currentReward.claimable ? "claimable and ready to route" : "still locked behind progression"}.`}
            />
            <ReadTile label="Next" value={nextRewardMove} />
            <ReadTile label="Watch" value={watchRewardCue} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <MetricTile
              label="State"
              value={rewardAlreadyClaimed ? "Claimed" : currentReward.claimable ? "Claimable" : "Locked"}
            />
            <MetricTile label="Campaign" value={campaign ? "Linked" : "Direct"} />
            <MetricTile label="Project" value={project ? "Linked" : "Unknown"} />
            <MetricTile label="Rarity" value={currentReward.rarity} />
          </div>
        </Surface>

        <Surface
          eyebrow="Next Move"
          title="What to do next"
          description="Rewards should tell you where to go next, not just repeat metadata."
        >
          <div className="space-y-4">
            <div className="metric-card rounded-[24px] p-4 text-sm leading-7 text-slate-300">
              {rewardAlreadyClaimed
                ? "This reward is already in your claimed inventory. Use the linked campaign or project if you want to trace where it came from."
                : currentReward.claimable
                  ? "This reward is now in reach. Claim it now or inspect the linked campaign and project context first."
                  : "This reward is still locked. Keep clearing the linked campaign and quests to push it into claimable territory."}
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm leading-7 text-slate-300">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Member journey context
              </p>
              <p className="mt-3 font-semibold text-white">{communitySnapshot.readinessLabel}</p>
              <p className="mt-2">
                Reward claims should reinforce the same member journey, so your best next path still points toward {communitySnapshot.projectName || "your active community"}.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm leading-7 text-slate-300">
              Reward availability, claim handling and delivery timing can vary by project.{" "}
              <Link
                href="/rewards/disclaimer"
                className="font-semibold text-amber-200 underline underline-offset-4"
              >
                Read the reward disclaimer
              </Link>
              .
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void handleClaimReward()}
                disabled={busy || !canClaimReward}
                className="rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:bg-amber-300/35"
              >
                {busy
                  ? "Routing claim..."
                  : rewardAlreadyClaimed
                    ? "Already claimed"
                    : canClaimReward
                      ? "Claim reward"
                      : "Locked"}
              </button>
              {campaign ? (
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Open linked campaign
                </Link>
              ) : null}
              {project ? (
                <Link
                  href={`/projects/${project.id}`}
                  className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Open project
                </Link>
              ) : null}
              <Link
                href={communitySnapshot.preferredRoute}
                className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Back to your journey
              </Link>
            </div>
          </div>
        </Surface>
      </div>

      {campaign ? (
        <Surface
          eyebrow="Campaign Link"
          title="Linked campaign"
          description="This reward is tied to an active campaign."
        >
          <Link
            href={`/campaigns/${campaign.id}`}
            className="panel-card block rounded-[30px] p-5 transition hover:border-amber-300/30 hover:bg-black/25"
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
        </Surface>
      ) : null}
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
    <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/85">{label}</p>
      <p className="mt-3 text-sm leading-7 text-slate-200">{value}</p>
    </div>
  );
}

function Notice({
  text,
  tone,
}: {
  text: string;
  tone: "default" | "error" | "success";
}) {
  return (
    <div
      className={`rounded-[24px] px-4 py-6 text-sm ${
        tone === "error"
          ? "border border-rose-400/20 bg-rose-500/10 text-rose-200"
          : tone === "success"
            ? "border border-lime-300/20 bg-lime-400/10 text-lime-100"
            : "border border-white/8 bg-black/20 text-slate-300"
      }`}
    >
      {text}
    </div>
  );
}
