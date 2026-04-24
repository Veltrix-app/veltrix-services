"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function RaidsScreen() {
  const { raids, loading, error } = useLiveUserData({
    datasets: ["raids"],
  });

  const sortedRaids = [...raids].sort(
    (left, right) => right.reward - left.reward || right.progress - left.progress
  );
  const spotlightRaids = sortedRaids.slice(0, 3);
  const urgentCount = sortedRaids.filter((raid) => raid.progress >= 50).length;
  const liveParticipants = sortedRaids.reduce((sum, raid) => sum + raid.participants, 0);
  const averageProgress =
    sortedRaids.length > 0
      ? Math.round(sortedRaids.reduce((sum, raid) => sum + raid.progress, 0) / sortedRaids.length)
      : 0;

  return (
    <div className="space-y-7">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_300px]">
        <div className="rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.12),transparent_26%),linear-gradient(180deg,rgba(13,15,18,0.99),rgba(6,8,11,0.99))] p-4 shadow-[0_20px_54px_rgba(0,0,0,0.24)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-300">Raid pushes</p>
            <h2 className="mt-2.5 text-[1rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.12rem]">
              Hot pushes first, dense raid board after that
            </h2>
            <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-slate-400">
              Keep the hottest squad pressure visible without turning the whole page into a monitor wall.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <BoardStat label="Open raids" value={String(sortedRaids.length)} />
            <BoardStat label="Urgent" value={String(urgentCount)} />
            <BoardStat label="Squads" value={String(liveParticipants)} />
          </div>
        </div>
        </div>

        <div className="rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_bottom_right,rgba(251,113,133,0.12),transparent_28%),linear-gradient(180deg,rgba(13,14,18,0.98),rgba(8,9,12,0.98))] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Push signal</p>
          <p className="mt-2.5 text-[1rem] font-semibold tracking-[-0.02em] text-white">
            Raid pressure
          </p>

          <div className="mt-4 space-y-2.5">
            <SignalCard label="Urgent now" value={String(urgentCount)} meta="hot raids" />
            <SignalCard label="Squads live" value={String(liveParticipants)} meta="active members" />
            <SignalCard label="Average clear" value={`${averageProgress}%`} meta="raid progress" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Spotlights"
          title="Hot raids"
          description="The top lane keeps the biggest coordinated pushes visible before you drop into the wider board."
        />

        {loading ? (
          <EmptyNotice text="Loading raid spotlights..." />
        ) : error ? (
          <EmptyNotice text={error} tone="error" />
        ) : spotlightRaids.length > 0 ? (
          <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]">
            {spotlightRaids.map((raid, index) => (
              <Link
                key={raid.id}
                href={`/raids/${raid.id}`}
                prefetch={false}
                className={`group relative overflow-hidden rounded-[25px] border border-white/6 bg-[linear-gradient(180deg,rgba(18,20,24,0.98),rgba(9,11,15,0.98))] shadow-[0_18px_52px_rgba(0,0,0,0.26)] transition hover:border-rose-300/18 hover:bg-[linear-gradient(180deg,rgba(24,18,20,0.98),rgba(10,11,14,0.98))] ${
                  index === 0 ? "min-h-[238px] p-4.5 sm:p-5" : "min-h-[200px] p-3.5 sm:p-4"
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.14),transparent_35%),linear-gradient(180deg,rgba(10,12,15,0.08),rgba(10,12,15,0.88))]" />
                <div className="relative flex h-full flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <CardPill>{raid.community}</CardPill>
                      <CardPill>{raid.timer}</CardPill>
                    </div>
                    <StatusChip label={`${raid.progress}% live`} tone={raid.progress >= 50 ? "warning" : "info"} />
                  </div>

                  <h3
                    className={`font-semibold leading-6 text-white ${
                      index === 0 ? "mt-6 text-[1.06rem]" : "mt-5 text-[0.94rem]"
                    }`}
                  >
                    {raid.title}
                  </h3>
                  <p className="mt-2.5 line-clamp-2 text-[12px] leading-5 text-slate-300">{raid.target}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <MetricPill label="Reward" value={`${raid.reward} XP`} />
                    <MetricPill label="Squad" value={String(raid.participants)} />
                    <MetricPill label="Timer" value={raid.timer} />
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-white/6 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Join lane
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-rose-200 transition group-hover:translate-x-0.5">
                      View
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyNotice text="No live raid spotlights are visible yet." />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Grid"
          title="All raid pushes"
          description="Keep the board dense and legible: smaller titles, compact timing, and one clear route into each raid."
        />

        {loading ? (
          <EmptyNotice text="Loading raid board..." />
        ) : error ? (
          <EmptyNotice text={error} tone="error" />
        ) : sortedRaids.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
            {sortedRaids.map((raid) => (
              <Link
                key={raid.id}
                href={`/raids/${raid.id}`}
                prefetch={false}
                className="group rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,17,20,0.98),rgba(7,9,12,0.98))] p-3.5 transition hover:border-rose-300/16 hover:bg-[linear-gradient(180deg,rgba(21,17,19,0.98),rgba(8,10,13,0.98))]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[0.94rem] font-semibold text-white">{raid.title}</p>
                    <p className="mt-2 truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      {raid.community}
                    </p>
                  </div>
                  <StatusChip label={raid.progress >= 50 ? "Hot" : "Live"} tone={raid.progress >= 50 ? "warning" : "default"} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                  <span className="truncate">{raid.target}</span>
                  <span>{raid.participants} in</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <MetricPill label="Reward" value={`${raid.reward} XP`} />
                  <MetricPill label="Timer" value={raid.timer} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Open raid
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-rose-200">
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyNotice text="No raids are live right now." />
        )}
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-2 text-[0.98rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.08rem]">
          {title}
        </h2>
        <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-400">{description}</p>
      </div>
      <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400">
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

function BoardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-1.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-white">{value}</p>
    </div>
  );
}

function SignalCard({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-3.5 py-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-[13px] font-semibold text-white">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">{meta}</p>
    </div>
  );
}

function CardPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-slate-300">
      {children}
    </span>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/20 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
      <span>{label}</span>
      <span className="text-white">{value}</span>
    </span>
  );
}

function EmptyNotice({
  text,
  tone = "default",
}: {
  text: string;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`rounded-[24px] border px-4 py-5 text-sm ${
        tone === "error"
          ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
          : "border-white/8 bg-black/20 text-slate-300"
      }`}
    >
      {text}
    </div>
  );
}
