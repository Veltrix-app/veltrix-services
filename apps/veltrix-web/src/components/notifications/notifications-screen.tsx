"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BellRing, Radar, ShieldAlert, Sparkles } from "lucide-react";
import { CommunityStatusPanel } from "@/components/community/community-status-panel";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useCommunityJourney } from "@/hooks/use-community-journey";
import { useLiveUserData } from "@/hooks/use-live-user-data";

function getSignalHref(type: string, preferredRoute: string) {
  if (type === "community") {
    return preferredRoute;
  }

  if (type === "reward") {
    return "/rewards";
  }

  if (type === "raid") {
    return "/raids";
  }

  if (type === "quest") {
    return "/quests";
  }

  return null;
}

export function NotificationsScreen() {
  const { notifications, loading, error, markNotificationsRead } = useLiveUserData({
    datasets: ["notifications"],
  });
  const {
    snapshot: communitySnapshot,
    loading: communityLoading,
    refreshing: communityRefreshing,
    error: communityError,
    advance: advanceCommunityJourney,
  } = useCommunityJourney();
  const unreadItems = notifications.filter((item) => !item.read).length;
  const questUpdates = notifications.filter((item) => item.type === "quest").length;
  const rewardUpdates = notifications.filter((item) => item.type === "reward").length;
  const raidUpdates = notifications.filter((item) => item.type === "raid").length;
  const communityUpdates = notifications.filter((item) => item.type === "community").length;
  const [featuredSignal, ...signalQueue] = notifications;
  const nextSignal = signalQueue[0] ?? null;
  const featuredSignalHref = featuredSignal
    ? getSignalHref(featuredSignal.type, communitySnapshot.preferredRoute)
    : null;

  useEffect(() => {
    void markNotificationsRead();
  }, [markNotificationsRead]);

  return (
    <div className="space-y-5">
      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.25fr)_340px]">
        <div className="overflow-hidden rounded-[30px] border border-cyan-300/12 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.18),transparent_26%),radial-gradient(circle_at_86%_10%,rgba(192,255,0,0.08),transparent_18%),linear-gradient(145deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:p-6">
          <div className="flex flex-wrap items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300">
            <span>Signal Center</span>
            <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-2.5 py-1 tracking-[0.16em] text-cyan-100">
              Command Feed
            </span>
          </div>

          {featuredSignal ? (
            <div className="mt-5 space-y-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_280px]">
                <div className="space-y-4">
                  <SignalBanner />

                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-[18rem]">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100">
                          {featuredSignal.type}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                          {new Date(featuredSignal.createdAt).toLocaleDateString("nl-NL")}
                        </span>
                      </div>
                      <h3 className="mt-3 text-balance text-[1.18rem] font-semibold leading-[1.02] tracking-[-0.03em] text-white sm:text-[1.42rem]">
                        {featuredSignal.title}
                      </h3>
                      <p className="mt-2 max-w-xl text-[12px] leading-5 text-slate-300">
                        {featuredSignal.body}
                      </p>
                    </div>

                    <StatusChip label={featuredSignal.read ? "Read" : "Priority"} tone={featuredSignal.read ? "default" : "info"} />
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <FeatureStat label="Unread" value={String(unreadItems)} />
                    <FeatureStat label="Quest" value={String(questUpdates)} />
                    <FeatureStat label="Reward" value={String(rewardUpdates)} />
                    <FeatureStat label="Raid" value={String(raidUpdates)} />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={featuredSignalHref ?? communitySnapshot.preferredRoute}
                      className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2.5 text-[12px] font-bold text-slate-950 transition hover:bg-cyan-200"
                    >
                      {featuredSignal?.type === "community"
                        ? "Open best path"
                        : featuredSignal?.type === "reward"
                          ? "Open rewards"
                          : featuredSignal?.type === "quest"
                            ? "Open missions"
                            : featuredSignal?.type === "raid"
                              ? "Open raid board"
                              : "Open next surface"}
                    </Link>
                    <Link
                      href={communitySnapshot.preferredRoute}
                      className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold text-white transition hover:border-cyan-300/30"
                    >
                      Back to your journey
                    </Link>
                  </div>
                </div>

                <div className="rounded-[18px] border border-white/10 bg-black/24 p-3.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                    Signal queue
                  </p>
                  <div className="mt-3 space-y-2.5">
                    {signalQueue.slice(0, 4).map((item, index) => (
                      <article key={item.id} className="panel-card rounded-[18px] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                          Signal {index + 1}
                        </p>
                        <p className="mt-1.5 text-[13px] font-semibold text-white">{item.title}</p>
                        <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-slate-300">{item.body}</p>
                        <p className="mt-2.5 text-[10px] uppercase tracking-[0.16em] text-cyan-200">{item.type}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <QuickRead label="Unread now" value={String(unreadItems)} />
                <QuickRead label="Quest updates" value={String(questUpdates)} />
                <QuickRead label="Community nudges" value={String(communityUpdates)} />
              </div>
            </div>
          ) : (
            <EmptyNotice text="No signals are live yet." />
          )}
        </div>

        <div className="space-y-5">
          <Surface
            eyebrow="Command read"
            title="Read the signal feed before you open it"
            description="Start with the live cue, the next route back into the product, and the one feed pressure worth watching."
            className="bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]"
          >
            <div className="grid gap-3">
              <ReadTile
                label="Now"
                value={
                  featuredSignal
                    ? `${featuredSignal.title} is the lead signal in the feed right now.`
                    : "The signal feed is currently quiet."
                }
              />
              <ReadTile
                label="Next"
                value={
                  featuredSignalHref
                    ? `The fastest follow-through is ${featuredSignal?.type === "community" ? "your community lane" : featuredSignal?.type === "reward" ? "the rewards surface" : featuredSignal?.type === "quest" ? "the mission lane" : featuredSignal?.type === "raid" ? "the raid board" : "the next live surface"}.`
                    : nextSignal
                      ? `${nextSignal.title} is the next signal waiting in the queue.`
                      : "The next move is to jump back into your active community path."
                }
              />
              <ReadTile
                label="Watch"
                value={`${unreadItems} unread items are still live, with ${communityUpdates} community nudges and ${rewardUpdates} reward cues competing for attention.`}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3 2xl:grid-cols-1">
              <MetricTile label="Unread on open" value={String(unreadItems)} />
              <MetricTile label="Quest updates" value={String(questUpdates)} />
              <MetricTile label="Reward updates" value={String(rewardUpdates)} />
            </div>

            <div className="mt-4 space-y-2.5">
              <SignalTile icon={BellRing} label="Live signals" value={String(notifications.length)} accent="text-cyan-200" />
              <SignalTile icon={ShieldAlert} label="Unread now" value={String(unreadItems)} accent="text-amber-200" />
              <SignalTile icon={Radar} label="Raid updates" value={String(raidUpdates)} accent="text-rose-200" />
              <SignalTile icon={Sparkles} label="Reward updates" value={String(rewardUpdates)} accent="text-lime-200" />
            </div>
          </Surface>

          <Surface
            eyebrow="Community Follow-through"
            title="Journey after the signal"
            description="Community signals should route straight into the member journey instead of dying inside the feed."
          >
            <div className="mb-3.5 rounded-[18px] border border-white/8 bg-black/20 px-3.5 py-3.5 text-[12px] text-slate-300">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Preferred follow-through
              </p>
              <p className="mt-2 font-semibold text-white">{communitySnapshot.readinessLabel}</p>
              <p className="mt-1.5 leading-5 text-slate-300">
                The feed now routes back into {communitySnapshot.projectName || "your active community"} through the best current path instead of a generic landing.
              </p>
            </div>
            <CommunityStatusPanel
              snapshot={communitySnapshot}
              loading={communityLoading}
              refreshing={communityRefreshing}
              error={communityError}
              onAdvance={advanceCommunityJourney}
              mode="compact"
              actionLimit={2}
            />
          </Surface>

          <Surface
            eyebrow="Next Surfaces"
            title="Fast jumps"
            description="Quick routes back into the rest of the live experience."
          >
            <div className="flex flex-wrap gap-2.5">
              <QuickLink href="/community" label="Community home" />
              <QuickLink href="/raids" label="Raid board" />
              <QuickLink href="/leaderboard" label="Leaderboard" />
              <QuickLink href="/profile" label="Profile" />
              <QuickLink href="/projects" label="Project browser" />
            </div>
          </Surface>
        </div>
      </section>

      <Surface
        eyebrow="Feed Catalog"
        title="Recent signals"
        description="Quest approvals, reward drops and system pressure should read like a command feed, not a plain notification list."
      >
        {loading ? (
          <Notice tone="default" text="Loading notifications..." />
        ) : error ? (
          <Notice tone="error" text={error} />
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((item) => (
              <article key={item.id} className="panel-card rounded-[22px] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-100">
                        {item.type}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        {new Date(item.createdAt).toLocaleString("nl-NL")}
                      </span>
                    </div>
                    <p className="mt-3 text-[15px] font-black text-white">{item.title}</p>
                    <p className="mt-2 text-[12px] leading-5 text-slate-300">{item.body}</p>
                    {getSignalHref(item.type, communitySnapshot.preferredRoute) ? (
                      <Link
                        href={getSignalHref(item.type, communitySnapshot.preferredRoute)!}
                        className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold text-cyan-100 underline underline-offset-4"
                      >
                        Open community follow-through
                      </Link>
                    ) : null}
                  </div>
                  <StatusChip label={item.read ? "Read" : "New"} tone={item.read ? "default" : "info"} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No signals yet. New quest approvals, raids and rewards will appear here." />
        )}
      </Surface>
    </div>
  );
}

function SignalBanner() {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.22),transparent_34%),linear-gradient(145deg,rgba(8,20,28,0.96),rgba(4,9,13,0.94))] p-3.5">
      <div className="absolute right-3.5 top-3.5 flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/16 bg-cyan-300/10 text-cyan-200">
        <BellRing className="h-5 w-5" />
      </div>
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-200">
        Command Feed
      </p>
      <p className="mt-2 max-w-[16rem] text-[11px] leading-5 text-slate-300">
        Approvals, alerts and unlocks flow through this live signal layer before you move back into the product.
      </p>
    </div>
  );
}

function FeatureStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[16px] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-[13px] font-semibold text-white">{value}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[16px] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-[13px] font-semibold text-white">{value}</p>
    </div>
  );
}

function SignalTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof BellRing;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="metric-card rounded-[16px] px-3 py-2.5">
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
      <p className={`mt-1.5 text-[13px] font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function ReadTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-200/85">{label}</p>
      <p className="mt-1.5 text-[11px] leading-5 text-slate-200">{value}</p>
    </div>
  );
}

function QuickRead({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-white/[0.04] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-[12px] font-semibold text-white">{value}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="glass-button rounded-full px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-white/[0.08]"
    >
      {label}
    </Link>
  );
}

function EmptyNotice({ text }: { text: string }) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-3.5 text-[11px] text-slate-300">
      {text}
    </div>
  );
}

function Notice({ text, tone }: { text: string; tone: "default" | "error" }) {
  return (
    <div
        className={`rounded-[16px] px-3 py-3.5 text-[11px] ${
        tone === "error"
          ? "border border-rose-400/20 bg-rose-500/10 text-rose-200"
          : "border border-white/8 bg-black/20 text-slate-300"
      }`}
    >
      {text}
    </div>
  );
}
