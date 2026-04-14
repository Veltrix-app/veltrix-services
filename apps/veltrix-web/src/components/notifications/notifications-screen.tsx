"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BellRing, Radar, ShieldAlert, Sparkles } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function NotificationsScreen() {
  const { notifications, loading, error, markNotificationsRead } = useLiveUserData();
  const unreadItems = notifications.filter((item) => !item.read).length;
  const questUpdates = notifications.filter((item) => item.type === "quest").length;
  const rewardUpdates = notifications.filter((item) => item.type === "reward").length;
  const raidUpdates = notifications.filter((item) => item.type === "raid").length;
  const [featuredSignal, ...signalQueue] = notifications;

  useEffect(() => {
    void markNotificationsRead();
  }, [markNotificationsRead]);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[36px] border border-cyan-300/16 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.18),transparent_42%),linear-gradient(145deg,rgba(9,15,21,0.98),rgba(3,7,12,0.92))] p-6 shadow-[0_28px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            <span>Signal Center</span>
            <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 tracking-[0.24em] text-cyan-100">
              Command Feed
            </span>
          </div>

          {featuredSignal ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100">
                        {featuredSignal.type}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                        {new Date(featuredSignal.createdAt).toLocaleDateString("nl-NL")}
                      </span>
                    </div>
                    <h3 className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                      {featuredSignal.title}
                    </h3>
                    <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                      {featuredSignal.body}
                    </p>
                  </div>

                  <StatusChip label={featuredSignal.read ? "Read" : "Priority"} tone={featuredSignal.read ? "default" : "info"} />
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <HeroStat label="Unread" value={String(unreadItems)} />
                  <HeroStat label="Quest" value={String(questUpdates)} />
                  <HeroStat label="Reward" value={String(rewardUpdates)} />
                  <HeroStat label="Raid" value={String(raidUpdates)} />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/raids"
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                  >
                    Open live board
                  </Link>
                  <Link
                    href="/profile"
                    className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30"
                  >
                    Back to pilot
                  </Link>
                </div>
              </div>

              <div className="space-y-3 rounded-[28px] border border-white/10 bg-black/24 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  Signal queue
                </p>
                {signalQueue.slice(0, 4).map((item, index) => (
                  <article
                    key={item.id}
                    className="panel-card rounded-[24px] p-4"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                      Signal {index + 1}
                    </p>
                    <p className="mt-2 text-lg font-black text-white">{item.title}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-300">{item.body}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-cyan-200">
                      {item.type}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 px-5 py-8 text-sm text-slate-300">
              No signals are live yet.
            </div>
          )}
        </div>

        <Surface
          eyebrow="Signals"
          title="Feed pressure"
          description="A fast tactical read on what kind of updates are currently hitting your account."
        >
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <StatCard label="Unread on open" value={String(unreadItems)} />
            <StatCard label="Quest updates" value={String(questUpdates)} />
            <StatCard label="Reward updates" value={String(rewardUpdates)} />
          </div>

          <div className="mt-5 space-y-3">
            <SignalTile icon={BellRing} label="Live signals" value={String(notifications.length)} accent="text-cyan-200" />
            <SignalTile icon={ShieldAlert} label="Unread now" value={String(unreadItems)} accent="text-amber-200" />
            <SignalTile icon={Radar} label="Raid updates" value={String(raidUpdates)} accent="text-rose-200" />
            <SignalTile icon={Sparkles} label="Reward updates" value={String(rewardUpdates)} accent="text-lime-200" />
          </div>
        </Surface>
      </section>

      <Surface
        eyebrow="Feed Grid"
        title="Recent signals"
        description="Quest approvals, reward drops and system pressure now read like a command feed instead of a plain notification list."
      >
        {loading ? (
          <Notice tone="default" text="Loading notifications..." />
        ) : error ? (
          <Notice tone="error" text={error} />
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((item) => (
              <article key={item.id} className="panel-card rounded-[28px] p-5">
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
                  </div>
                  <StatusChip label={item.read ? "Read" : "New"} tone={item.read ? "default" : "info"} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No signals yet. New quest approvals, raids, badges and rewards will appear here." />
        )}
      </Surface>

      <Surface
        eyebrow="Links"
        title="Next surfaces"
        description="Fast jumps into the rest of the live consumer grid."
      >
        <div className="flex flex-wrap gap-3">
          <QuickLink href="/raids" label="Raid board" />
          <QuickLink href="/leaderboard" label="Leaderboard" />
          <QuickLink href="/profile" label="Pilot profile" />
          <QuickLink href="/projects" label="World browser" />
        </div>
      </Surface>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/24 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
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

function QuickLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
    >
      {label}
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
