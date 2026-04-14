"use client";

import Link from "next/link";
import { ArrowRight, Radar, Swords, Trophy } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuth } from "@/components/providers/auth-provider";
import { useLiveUserData } from "@/hooks/use-live-user-data";

function getQuestTone(status: string) {
  if (status === "approved") return "positive";
  if (status === "pending") return "warning";
  if (status === "rejected") return "danger";
  return "info";
}

export function HomeScreen() {
  const { profile } = useAuth();
  const {
    loading,
    error,
    projects,
    campaigns,
    raids,
    rewards,
    quests,
    notifications,
    approvedQuestCount,
    pendingQuestCount,
    claimableRewardCount,
  } = useLiveUserData();

  const featuredCampaign = campaigns[0] ?? null;
  const featuredProject = projects.find((project) => project.id === featuredCampaign?.projectId) ?? null;
  const quickQueue = campaigns.slice(1, 5);
  const activeMissions = quests.slice(0, 4);
  const liveRaids = raids.slice(0, 3);
  const rewardMoments = rewards.slice(0, 3);
  const activityFeed = notifications.slice(0, 4);
  const projectsPreview = projects.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[36px] border border-cyan-300/10 bg-[radial-gradient(circle_at_85%_18%,rgba(0,204,255,0.2),transparent_18%),radial-gradient(circle_at_15%_0%,rgba(192,255,0,0.16),transparent_26%),linear-gradient(135deg,rgba(10,24,30,0.96),rgba(5,12,16,0.95))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.3)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
                Featured Mission
              </p>
              <h3 className="font-display mt-4 max-w-2xl text-3xl font-black tracking-[0.04em] text-white sm:text-5xl">
                {featuredCampaign?.title ?? "Your raid console is armed and waiting."}
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                {featuredCampaign?.description ??
                  "As soon as campaigns go live, this launcher becomes your main mission focus with live rewards, raids and verification pressure."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {featuredProject ? <StatusChip label={featuredProject.name} tone="info" /> : null}
              {featuredCampaign ? (
                <StatusChip
                  label={featuredCampaign.featured ? "Featured" : `${featuredCampaign.completionRate}% live`}
                  tone={featuredCampaign.featured ? "positive" : "info"}
                />
              ) : (
                <StatusChip label="Stand by" tone="default" />
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={featuredCampaign ? `/campaigns/${featuredCampaign.id}` : "/projects"}
              className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99]"
            >
              {featuredCampaign ? "Launch mission" : "Explore worlds"}
            </Link>
            <Link
              href="/profile"
              className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Open loadout
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <FeatureStat label="XP budget" value={featuredCampaign ? String(featuredCampaign.xpBudget) : "0"} />
            <FeatureStat label="Mission queue" value={String(quests.length)} />
            <FeatureStat label="Signals" value={String(notifications.length)} />
            <FeatureStat label="Reward heat" value={String(claimableRewardCount)} />
          </div>
        </div>

        <Surface
          eyebrow="Pilot Profile"
          title={profile?.username ?? "Guest Pilot"}
          description="Identity, streak and current mission posture at a glance."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricTile label="Tier" value={profile?.contributionTier ?? "Explorer"} />
            <MetricTile label="Level" value={String(profile?.level ?? 1)} />
            <MetricTile label="Streak" value={String(profile?.streak ?? 0)} />
            <MetricTile label="Pending" value={String(pendingQuestCount)} />
          </div>

          <div className="mt-5 rounded-[24px] border border-cyan-300/10 bg-cyan-300/5 px-4 py-4 text-sm leading-7 text-slate-300">
            Live auth, connected accounts and progress all run from the same backend as mobile, so this
            screen can become a real launcher instead of a mocked dashboard.
          </div>
        </Surface>
      </section>

      <Surface
        eyebrow="Mission Queue"
        title="Quick queue"
        description="Launcher-style mission lanes you can jump into next."
      >
        {quickQueue.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-4">
            {quickQueue.map((campaign) => {
              const linkedProject = projects.find((project) => project.id === campaign.projectId);

              return (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="panel-card rounded-[26px] p-5 transition hover:border-cyan-300/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-white">{campaign.title}</p>
                      <p className="mt-2 text-sm text-slate-300">{linkedProject?.name ?? "Project"}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-cyan-300" />
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="font-display text-[11px] uppercase tracking-[0.22em] text-lime-300">
                      {campaign.xpBudget} XP
                    </span>
                    <StatusChip
                      label={campaign.featured ? "Featured" : `${campaign.completionRate}% live`}
                      tone={campaign.featured ? "positive" : "info"}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Notice text="No queued campaigns yet." tone="default" />
        )}
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Surface
          eyebrow="Mission Board"
          title="Active missions"
          description="The next quest should be obvious and feel actionable."
        >
          {loading ? (
            <Notice text="Loading live missions..." tone="default" />
          ) : error ? (
            <Notice text={error} tone="error" />
          ) : activeMissions.length > 0 ? (
            <div className="space-y-4">
              {activeMissions.map((mission) => (
                <Link
                  key={mission.id}
                  href={`/quests/${mission.id}`}
                  className="panel-card rounded-[26px] p-5 transition hover:border-lime-300/30 hover:bg-black/25"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-white">{mission.title}</p>
                      <p className="mt-2 text-sm text-slate-300">
                        {mission.verificationProvider
                          ? `${mission.verificationProvider} verification flow`
                          : "Custom quest flow"}
                      </p>
                    </div>
                    <StatusChip label={mission.status} tone={getQuestTone(mission.status)} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-lime-200">XP payout: +{mission.xp}</p>
                    <span className="font-display text-[11px] uppercase tracking-[0.22em] text-cyan-300">
                      Open mission
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Notice
              text="No live quests yet. Once a project assigns campaigns to your account, they will show here."
              tone="default"
            />
          )}
        </Surface>

        <div className="space-y-6">
          <Surface
            eyebrow="Live Raids"
            title="Squad pressure"
            description="Urgent coordinated pushes happening right now."
          >
            {liveRaids.length > 0 ? (
              <div className="space-y-4">
                {liveRaids.map((raid) => (
                  <Link
                    key={raid.id}
                    href={`/raids/${raid.id}`}
                    className="panel-card rounded-[24px] p-4 transition hover:border-rose-300/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-rose-200">{raid.community}</p>
                        <p className="mt-1 text-lg font-black text-white">{raid.title}</p>
                      </div>
                      <Swords className="h-4 w-4 text-rose-300" />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-300">
                      <span>{raid.timer}</span>
                      <span>+{raid.reward} XP</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Notice text="No live raids yet." tone="default" />
            )}
          </Surface>

          <Surface
            eyebrow="Reward Pressure"
            title="Unlocks in reach"
            description="Rewards should feel desirable, not like rows in a database."
          >
            <div className="space-y-4">
              {rewardMoments.length > 0 ? (
                rewardMoments.map((reward) => (
                  <div key={reward.id} className="metric-card rounded-[24px] px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-white">{reward.title}</p>
                        <p className="mt-1 text-sm text-slate-300">{reward.rarity}</p>
                      </div>
                      <StatusChip
                        label={reward.claimable ? "Claimable" : "Locked"}
                        tone={reward.claimable ? "positive" : "default"}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <Notice text="No live rewards yet." tone="default" />
              )}
            </div>
          </Surface>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Surface
          eyebrow="Signal Feed"
          title="Recent activity"
          description="Recent approvals, waits and unlocks from the live feed."
        >
          <div className="space-y-3">
            {activityFeed.length > 0 ? (
              activityFeed.map((item) => (
                <div key={item.id} className="metric-card rounded-[22px] px-4 py-3 text-sm text-slate-200">
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-slate-300">{item.body}</p>
                </div>
              ))
            ) : (
              <Notice text="No live notifications yet." tone="default" />
            )}
          </div>
        </Surface>

        <Surface
          eyebrow="World Browser"
          title="Project worlds"
          description="Project cards should feel like selectable worlds inside the grid."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {projectsPreview.length > 0 ? (
              projectsPreview.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="panel-card rounded-[28px] p-5 transition hover:border-cyan-300/30">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-black text-white">{project.name}</p>
                    <StatusChip label={project.chain ?? "Live"} tone="info" />
                  </div>
                  <p className="mt-2 text-sm text-lime-200">{project.category ?? "Project"}</p>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{project.description}</p>
                </Link>
              ))
            ) : (
              <Notice text="No live projects are visible yet." tone="default" />
            )}
          </div>
        </Surface>
      </div>

      <Surface
        eyebrow="Diagnostics"
        title="Live parity foundation"
        description="These numbers confirm the web shell is reading the same live product surfaces as the mobile app."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureStat label="Approved quests" value={String(approvedQuestCount)} />
          <FeatureStat label="Projects" value={String(projects.length)} />
          <FeatureStat label="Campaigns" value={String(campaigns.length)} />
        </div>
      </Surface>
    </div>
  );
}

function FeatureStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[22px] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
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
