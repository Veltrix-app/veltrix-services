"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BellRing, Radar, ShieldAlert, Sparkles } from "lucide-react";
import { CommunityStatusPanel } from "@/components/community/community-status-panel";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useCommunityJourney } from "@/hooks/use-community-journey";
import { useLiveUserData } from "@/hooks/use-live-user-data";

function getSignalHref(type: string) {
  if (type === "community") {
    return "/community";
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
  const featuredSignalHref = featuredSignal ? getSignalHref(featuredSignal.type) : null;

  useEffect(() => {
    void markNotificationsRead();
  }, [markNotificationsRead]);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_380px]">
        <div className="overflow-hidden rounded-[38px] border border-cyan-300/12 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.18),transparent_26%),radial-gradient(circle_at_86%_10%,rgba(192,255,0,0.08),transparent_18%),linear-gradient(145deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            <span>Signal Center</span>
            <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 tracking-[0.24em] text-cyan-100">
              Command Feed
            </span>
          </div>

          {featuredSignal ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_320px]">
                <div className="space-y-5">
                  <SignalBanner />

                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-[14ch]">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100">
                          {featuredSignal.type}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                          {new Date(featuredSignal.createdAt).toLocaleDateString("nl-NL")}
                        </span>
                      </div>
                      <h3 className="font-display mt-4 text-balance text-[clamp(2.2rem,4vw,4.5rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                        {featuredSignal.title}
                      </h3>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                        {featuredSignal.body}
                      </p>
                    </div>

                    <StatusChip label={featuredSignal.read ? "Read" : "Priority"} tone={featuredSignal.read ? "default" : "info"} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <FeatureStat label="Unread" value={String(unreadItems)} />
                    <FeatureStat label="Quest" value={String(questUpdates)} />
                    <FeatureStat label="Reward" value={String(rewardUpdates)} />
                    <FeatureStat label="Raid" value={String(raidUpdates)} />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={featuredSignalHref ?? "/raids"}
                      className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                    >
                      {featuredSignal?.type === "community" ? "Open Community Home" : "Open raid board"}
                    </Link>
                    <Link
                      href="/profile"
                      className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30"
                    >
                      Back to pilot
                    </Link>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/24 p-4">
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
                    Signal queue
                  </p>
                  <div className="mt-4 space-y-3">
                    {signalQueue.slice(0, 4).map((item, index) => (
                      <article key={item.id} className="panel-card rounded-[24px] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                          Signal {index + 1}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-300">{item.body}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.22em] text-cyan-200">{item.type}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <QuickRead label="Unread now" value={String(unreadItems)} />
                <QuickRead label="Quest updates" value={String(questUpdates)} />
                <QuickRead label="Community nudges" value={String(communityUpdates)} />
              </div>
            </div>
          ) : (
            <EmptyNotice text="No signals are live yet." />
          )}
        </div>

        <div className="space-y-6">
          <Surface
            eyebrow="Feed Pressure"
            title="Signal read"
            description="A fast tactical read on what kind of updates are currently hitting your account."
          >
            <div className="grid gap-4 sm:grid-cols-3 2xl:grid-cols-1">
              <MetricTile label="Unread on open" value={String(unreadItems)} />
              <MetricTile label="Quest updates" value={String(questUpdates)} />
              <MetricTile label="Reward updates" value={String(rewardUpdates)} />
            </div>

            <div className="mt-5 space-y-3">
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
            description="Quick routes back into the rest of the live grid."
          >
            <div className="flex flex-wrap gap-3">
              <QuickLink href="/community" label="Community home" />
              <QuickLink href="/raids" label="Raid board" />
              <QuickLink href="/leaderboard" label="Leaderboard" />
              <QuickLink href="/profile" label="Pilot profile" />
              <QuickLink href="/projects" label="World browser" />
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
          <div className="space-y-4">
            {notifications.map((item) => (
              <article key={item.id} className="panel-card rounded-[30px] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-100">
                        {item.type}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                        {new Date(item.createdAt).toLocaleString("nl-NL")}
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-black text-white">{item.title}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
                    {getSignalHref(item.type) ? (
                      <Link
                        href={getSignalHref(item.type)!}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 underline underline-offset-4"
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
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.22),transparent_34%),linear-gradient(145deg,rgba(8,20,28,0.96),rgba(4,9,13,0.94))] p-6">
      <div className="absolute right-4 top-4 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/16 bg-cyan-300/10 text-cyan-200">
        <BellRing className="h-8 w-8" />
      </div>
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-200">
        Command Feed
      </p>
      <p className="mt-3 max-w-[18rem] text-sm leading-7 text-slate-300">
        Approvals, alerts and unlocks flow through this live signal layer before you move back into the grid.
      </p>
    </div>
  );
}

function FeatureStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[24px] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
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
    <div className="metric-card rounded-[22px] px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className={`mt-3 text-2xl font-black ${accent}`}>{value}</p>
    </div>
  );
}

function QuickRead({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] border border-white/8 bg-white/[0.04] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
    >
      {label}
    </Link>
  );
}

function EmptyNotice({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-6 text-sm text-slate-300">
      {text}
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
