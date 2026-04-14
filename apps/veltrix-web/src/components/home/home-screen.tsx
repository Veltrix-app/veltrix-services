"use client";

import Link from "next/link";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuth } from "@/components/providers/auth-provider";
import { useLiveUserData } from "@/hooks/use-live-user-data";

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

  const activeMissions = quests.slice(0, 3);
  const rewardMoments = rewards.slice(0, 3);
  const activityFeed = notifications.slice(0, 4);
  const projectsPreview = projects.slice(0, 3);
  const featuredCampaign = campaigns[0];
  const sideQueue = campaigns.slice(1, 4);
  const liveRaids = raids.slice(0, 2);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[34px] border border-cyan-300/10 bg-[radial-gradient(circle_at_top_right,rgba(0,204,255,0.12),transparent_20%),linear-gradient(135deg,rgba(192,255,0,0.14),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
            Operative Layer
          </p>
          <h3 className="font-display mt-4 max-w-2xl text-3xl font-black tracking-[0.04em] text-white sm:text-5xl">
            {profile
              ? `${profile.username} is live in the Veltrix raid grid.`
              : "Your mission stack is live in the Veltrix raid grid."}
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Quests, raids, rewards, notifications and connected identities now render from the
            real backend. The web layer should feel like a game platform, not a dashboard clone.
          </p>
          <p className="font-display mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Live command surface
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={featuredCampaign ? `/campaigns/${featuredCampaign.id}` : "/projects"}
              className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99]"
            >
              {featuredCampaign ? "Resume mission" : "Explore projects"}
            </Link>
            <Link
              href="/profile"
              className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Review connected accounts
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="metric-card rounded-[22px] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Mission queue
              </p>
              <p className="mt-2 text-2xl font-black text-white">{quests.length}</p>
            </div>
            <div className="metric-card rounded-[22px] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Live signals
              </p>
              <p className="mt-2 text-2xl font-black text-white">{notifications.length}</p>
            </div>
            <div className="metric-card rounded-[22px] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Reward heat
              </p>
              <p className="mt-2 text-2xl font-black text-white">{claimableRewardCount}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Surface
            eyebrow="Featured Mission"
            title={featuredCampaign?.title ?? "No featured mission yet"}
            description={
              featuredCampaign?.description ??
              "Once campaigns go live, this column becomes your launcher-style mission focus."
            }
          >
            <div className="space-y-4">
              <div className="metric-card rounded-[26px] px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-[11px] uppercase tracking-[0.24em] text-cyan-300">
                      Hot lane
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {featuredCampaign ? `${featuredCampaign.xpBudget} XP` : "Stand by"}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {featuredCampaign ? "Primary route with the strongest current mission pressure." : "No campaign selected."}
                    </p>
                  </div>
                  {featuredCampaign ? (
                    <StatusChip
                      label={featuredCampaign.featured ? "Featured" : `${featuredCampaign.completionRate}% live`}
                      tone={featuredCampaign.featured ? "positive" : "info"}
                    />
                  ) : null}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="metric-card rounded-[24px] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Tier</p>
                  <p className="mt-3 text-3xl font-black text-white">{profile?.contributionTier ?? "Explorer"}</p>
                  <p className="mt-2 text-sm text-slate-300">Level {profile?.level ?? 1}</p>
                </div>
                <div className="metric-card rounded-[24px] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Streak</p>
                  <p className="mt-3 text-3xl font-black text-white">{profile?.streak ?? 0}</p>
                  <p className="mt-2 text-sm text-slate-300">Current contribution streak</p>
                </div>
              </div>
            </div>
          </Surface>

          <div className="grid gap-4 md:grid-cols-2">
            {liveRaids.map((raid) => (
              <Link
                key={raid.id}
                href={`/raids/${raid.id}`}
                className="panel-card rounded-[26px] p-5 transition hover:border-rose-300/30"
              >
                <p className="font-display text-[11px] uppercase tracking-[0.24em] text-rose-300">
                  Live raid
                </p>
                <p className="mt-2 text-xl font-black text-white">{raid.title}</p>
                <p className="mt-2 text-sm text-slate-300">{raid.community}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {sideQueue.length > 0 ? (
        <Surface
          eyebrow="Quick Queue"
          title="Next mission lanes"
          description="A launcher-style queue of live campaign entries you can jump into next."
        >
          <div className="grid gap-4 xl:grid-cols-3">
            {sideQueue.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="panel-card rounded-[26px] p-5 transition hover:border-cyan-300/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-white">{campaign.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{campaign.description}</p>
                  </div>
                  <StatusChip
                    label={campaign.featured ? "Featured" : `${campaign.completionRate}% live`}
                    tone={campaign.featured ? "positive" : "info"}
                  />
                </div>
              </Link>
            ))}
          </div>
        </Surface>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Surface
          eyebrow="Mission Board"
          title="Active missions"
          description="The first consumer web surface should make the next action obvious."
        >
          {loading ? (
            <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-6 text-sm text-slate-300">
              Loading live missions...
            </div>
          ) : error ? (
            <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">
              {error}
            </div>
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
                    <StatusChip
                      label={mission.status}
                      tone={
                        mission.status === "approved"
                          ? "positive"
                          : mission.status === "pending"
                          ? "warning"
                          : mission.status === "rejected"
                          ? "danger"
                          : "info"
                      }
                    />
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
            <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-6 text-sm text-slate-300">
              No live quests yet. Once a project assigns campaigns to your account, they will show here.
            </div>
          )}
        </Surface>

        <div className="space-y-6">
          <Surface
            eyebrow="Payoff"
            title="Reward pressure"
            description="Rewards should feel like outcomes, not back-office rows."
          >
            <div className="space-y-4">
              {rewardMoments.length > 0 ? (
                rewardMoments.map((reward) => (
                  <div
                    key={reward.id}
                    className="metric-card flex items-center justify-between gap-4 rounded-[24px] px-4 py-4"
                  >
                    <div>
                      <p className="font-bold text-white">{reward.title}</p>
                      <p className="mt-1 text-sm text-slate-300">{reward.rarity}</p>
                    </div>
                    <StatusChip
                      label={reward.claimable ? "Claimable" : "Locked"}
                      tone={reward.claimable ? "positive" : "default"}
                    />
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-6 text-sm text-slate-300">
                  No live rewards yet.
                </div>
              )}
            </div>
          </Surface>

          <Surface
            eyebrow="Radar"
            title="Recent activity"
            description="A simple activity feed keeps the surface alive as soon as notifications exist."
          >
            <div className="space-y-3">
              {activityFeed.length > 0 ? (
                activityFeed.map((item) => (
                  <div
                    key={item.id}
                    className="metric-card rounded-[22px] px-4 py-3 text-sm text-slate-200"
                  >
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-slate-300">{item.body}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-6 text-sm text-slate-300">
                  No live notifications yet.
                </div>
              )}
            </div>
          </Surface>
        </div>
      </div>

      <Surface
        eyebrow="Ecosystem"
        title="Project worlds"
        description="Projects on web should feel like branded mission worlds, not bland list rows."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {projectsPreview.length > 0 ? (
            projectsPreview.map((project) => (
              <div
                key={project.id}
                className="panel-card rounded-[28px] p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-black text-white">{project.name}</p>
                  <StatusChip label={project.chain ?? "Live"} tone="info" />
                </div>
                <p className="mt-2 text-sm text-lime-200">{project.category ?? "Project"}</p>
                <p className="mt-4 text-sm leading-6 text-slate-300">{project.description}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[28px] border border-white/8 bg-black/20 p-5 text-sm text-slate-300 md:col-span-3">
              No live projects are visible yet.
            </div>
          )}
        </div>
      </Surface>

      <Surface
        eyebrow="Diagnostics"
        title="Live parity foundation"
        description="These numbers confirm the web shell is reading the same live product surfaces as the mobile app."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="metric-card rounded-[24px] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Approved quests</p>
            <p className="mt-3 text-3xl font-black text-white">{approvedQuestCount}</p>
          </div>
          <div className="metric-card rounded-[24px] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Projects</p>
            <p className="mt-3 text-3xl font-black text-white">{projects.length}</p>
          </div>
          <div className="metric-card rounded-[24px] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Campaigns</p>
            <p className="mt-3 text-3xl font-black text-white">{campaigns.length}</p>
          </div>
        </div>
      </Surface>
    </div>
  );
}
