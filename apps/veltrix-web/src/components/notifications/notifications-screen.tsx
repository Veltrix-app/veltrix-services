"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function NotificationsScreen() {
  const { notifications, loading, error, markNotificationsRead } = useLiveUserData();
  const unreadItems = notifications.filter((item) => !item.read).length;
  const questUpdates = notifications.filter((item) => item.type === "quest").length;
  const rewardUpdates = notifications.filter((item) => item.type === "reward").length;

  useEffect(() => {
    void markNotificationsRead();
  }, [markNotificationsRead]);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(0,204,255,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            Activity Feed
          </p>
          <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Everything happening around your live account.
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Quest approvals, verification waits, raids, rewards and system messages now land in the
            same feed layer as the mobile app.
          </p>
        </div>

        <Surface
          eyebrow="Summary"
          title="Notification pressure"
          description="Quick signal counts pulled from the live activity feed."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Unread on open" value={String(unreadItems)} />
            <StatCard label="Quest updates" value={String(questUpdates)} />
            <StatCard label="Reward updates" value={String(rewardUpdates)} />
          </div>
        </Surface>
      </section>

      <Surface
        eyebrow="Feed"
        title="Recent notifications"
        description="The same user notification table now powers the web activity stream."
      >
        {loading ? (
          <Notice tone="default" text="Loading notifications..." />
        ) : error ? (
          <Notice tone="error" text={error} />
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((item) => (
              <article
                key={item.id}
                className="rounded-[26px] border border-white/8 bg-black/20 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.body}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusChip label={item.read ? "Read" : "New"} tone={item.read ? "default" : "info"} />
                    <StatusChip label={item.type} tone="default" />
                  </div>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {new Date(item.createdAt).toLocaleString("nl-NL")}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <Notice
            tone="default"
            text="No notifications yet. New quest approvals, raids, badges and rewards will appear here."
          />
        )}
      </Surface>

      <Surface
        eyebrow="Links"
        title="Next surfaces"
        description="Fast links into the rest of the live web parity layer."
      >
        <div className="flex flex-wrap gap-3">
          <QuickLink href="/quests" label="Quest flows" disabled />
          <QuickLink href="/raids" label="Raids" />
          <QuickLink href="/leaderboard" label="Leaderboard" />
          <QuickLink href="/profile" label="Profile" />
        </div>
      </Surface>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  label,
  disabled = false,
}: {
  href: string;
  label: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-400">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
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
