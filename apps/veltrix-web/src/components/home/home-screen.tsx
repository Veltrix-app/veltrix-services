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

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(192,255,0,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
            Live Mission Layer
          </p>
          <h3 className="mt-4 max-w-xl text-3xl font-black tracking-tight text-white sm:text-5xl">
            {profile
              ? `${profile.username} is now running on live Veltrix data.`
              : "Your mission stack is ready to run on live data."}
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            This surface now reads from the real app backend: quests, campaigns, rewards,
            notifications and connected identities instead of demo content.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Web parity rollout in progress
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={campaigns[0] ? `/campaigns/${campaigns[0].id}` : "/projects"}
              className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99]"
            >
              {campaigns[0] ? "Resume mission" : "Explore projects"}
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
                Missions live
              </p>
              <p className="mt-2 text-2xl font-black text-white">{quests.length}</p>
            </div>
            <div className="metric-card rounded-[22px] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Signals
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

        <Surface
          eyebrow="Progression"
          title="Momentum stack"
          description="A lightweight but high-signal snapshot of where the user stands."
        >
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
            <div className="metric-card rounded-[24px] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Claimable</p>
              <p className="mt-3 text-3xl font-black text-white">{claimableRewardCount}</p>
              <p className="mt-2 text-sm text-slate-300">Rewards ready to claim</p>
            </div>
            <div className="metric-card rounded-[24px] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Pending</p>
              <p className="mt-3 text-3xl font-black text-white">{pendingQuestCount}</p>
              <p className="mt-2 text-sm text-slate-300">Quest verifications in motion</p>
            </div>
          </div>
        </Surface>
      </section>

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
                  <p className="mt-4 text-sm font-semibold text-lime-200">XP payout: +{mission.xp}</p>
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
