"use client";

import Link from "next/link";
import { Activity, ArrowRight, BellRing, Gift, Radar, ShieldCheck, Swords } from "lucide-react";
import type { LiveActivityFeed, LiveActivityFeedItem, LiveActivityTone } from "@/lib/activity/live-activity-feed";

export function LiveActivityFeedPanel({
  feed,
  compact = false,
}: {
  feed: LiveActivityFeed;
  compact?: boolean;
}) {
  const visibleItems = compact ? feed.items.slice(0, 4) : feed.items.slice(0, 8);

  return (
    <section
      className={`motion-surface motion-light-sweep relative overflow-hidden rounded-[26px] border border-white/8 bg-[radial-gradient(circle_at_14%_0%,rgba(34,211,238,0.13),transparent_30%),radial-gradient(circle_at_90%_18%,rgba(192,255,0,0.08),transparent_26%),linear-gradient(180deg,rgba(12,16,22,0.96),rgba(6,8,12,0.99))] shadow-[0_20px_62px_rgba(0,0,0,0.26)] ${
        compact ? "p-4" : "p-4 sm:p-5"
      }`}
    >
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">Live activity</p>
          <h2 className="mt-2 text-[1rem] font-semibold tracking-[-0.02em] text-white">
            {feed.featuredItem?.title ?? "Activity feed is warming up"}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-slate-400">
            {feed.featuredItem?.body ??
              "Quest clears, shard rewards, lootbox moments and community nudges will appear here as the platform moves."}
          </p>
        </div>
        <Link
          href={feed.nextAction.href}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-cyan-300/16 bg-cyan-300/[0.08] px-3.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-200/32 hover:bg-cyan-300/[0.13]"
        >
          {feed.nextAction.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="relative z-10 mt-4 grid gap-2 sm:grid-cols-4">
        <ActivityMetric label="Total" value={feed.summary.total} />
        <ActivityMetric label="Unread" value={feed.summary.unread} tone="amber" />
        <ActivityMetric label="Quests" value={feed.summary.quests} tone="cyan" />
        <ActivityMetric label="Rewards" value={feed.summary.rewards} tone="lime" />
      </div>

      <div className={`relative z-10 mt-4 grid gap-2.5 ${compact ? "" : "xl:grid-cols-2"}`}>
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => <LiveActivityRow key={item.id} item={item} />)
        ) : (
          <div className="flex min-h-[5.75rem] items-center gap-3 rounded-[18px] border border-dashed border-white/10 bg-white/[0.025] p-4">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.035] text-slate-400">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[12px] font-semibold text-white">No activity yet.</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Complete a quest, open a lootbox or claim a reward to light up this feed.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function LiveActivityRow({ item }: { item: LiveActivityFeedItem }) {
  return (
    <Link
      href={item.href}
      className="group flex min-h-[5.75rem] items-center gap-3 rounded-[18px] border border-white/8 bg-black/20 p-3 transition hover:border-cyan-300/18 hover:bg-cyan-300/[0.045]"
    >
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${getToneClass(item.tone)}`}
      >
        <ActivityIcon category={item.category} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/8 bg-white/[0.035] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
            {item.badgeLabel}
          </span>
          {item.unread ? (
            <span className="rounded-full border border-cyan-300/16 bg-cyan-300/[0.08] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.13em] text-cyan-100">
              New
            </span>
          ) : null}
        </span>
        <span className="mt-1.5 block truncate text-[13px] font-semibold text-white">{item.title}</span>
        <span className="mt-1 block line-clamp-1 text-[11px] leading-5 text-slate-400">{item.body}</span>
        <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
          {item.actorLabel} / {item.whenLabel}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-100" />
    </Link>
  );
}

function ActivityIcon({ category }: { category: LiveActivityFeedItem["category"] }) {
  if (category === "quest") return <ShieldCheck className="h-4 w-4" />;
  if (category === "reward") return <Gift className="h-4 w-4" />;
  if (category === "raid") return <Swords className="h-4 w-4" />;
  if (category === "community") return <Radar className="h-4 w-4" />;
  return <BellRing className="h-4 w-4" />;
}

function ActivityMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "amber" | "cyan" | "lime";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-300/18 bg-amber-300/[0.07] text-amber-100"
      : tone === "cyan"
        ? "border-cyan-300/18 bg-cyan-300/[0.07] text-cyan-100"
        : tone === "lime"
          ? "border-lime-300/18 bg-lime-300/[0.07] text-lime-100"
          : "border-white/8 bg-white/[0.035] text-white";

  return (
    <div className={`min-w-0 rounded-[16px] border px-3 py-2 ${toneClass}`}>
      <p className="truncate text-[8px] font-black uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-1 text-[1rem] font-black tracking-[-0.03em]">{value}</p>
    </div>
  );
}

function getToneClass(tone: LiveActivityTone) {
  if (tone === "cyan") return "border-cyan-300/18 bg-cyan-300/[0.08] text-cyan-100";
  if (tone === "amber") return "border-amber-300/18 bg-amber-300/[0.08] text-amber-100";
  if (tone === "rose") return "border-rose-300/18 bg-rose-300/[0.08] text-rose-100";
  if (tone === "lime") return "border-lime-300/18 bg-lime-300/[0.08] text-lime-100";
  return "border-white/8 bg-white/[0.035] text-slate-300";
}
