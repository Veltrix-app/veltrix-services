"use client";

import { Crown, Shield, Trophy, Zap } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function LeaderboardScreen() {
  const { leaderboard, loading, error } = useLiveUserData();
  const [featuredPilot, ...rankingQueue] = leaderboard;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_380px]">
        <div className="overflow-hidden rounded-[38px] border border-amber-300/12 bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.18),transparent_26%),radial-gradient(circle_at_86%_10%,rgba(0,204,255,0.08),transparent_18%),linear-gradient(145deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-amber-300">
            <span>Leaderboard</span>
            <span className="rounded-full border border-amber-300/16 bg-amber-300/10 px-3 py-1 tracking-[0.24em] text-amber-100">
              Rank Grid
            </span>
          </div>

          {featuredPilot ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_320px]">
                <div className="space-y-5">
                  <RankBanner />
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-[14ch]">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-amber-300/16 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-100">
                          Rank #1
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                          Level {featuredPilot.level}
                        </span>
                      </div>
                      <h3 className="font-display mt-4 text-balance text-[clamp(2.2rem,4vw,4.5rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                        {featuredPilot.username}
                      </h3>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                        Top pilot on the live board right now. This is the pace every other operator is chasing.
                      </p>
                    </div>

                    <StatusChip label={`${featuredPilot.xp} XP`} tone="info" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <FeatureStat label="XP" value={String(featuredPilot.xp)} />
                    <FeatureStat label="Level" value={String(featuredPilot.level)} />
                    <FeatureStat label="Rank" value="#1" />
                    <FeatureStat label="Status" value={featuredPilot.isCurrentUser ? "You" : "Live"} />
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/24 p-4">
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-amber-200">
                    Ranking queue
                  </p>
                  <div className="mt-4 space-y-3">
                    {rankingQueue.slice(0, 4).map((user, index) => (
                      <article key={user.id} className="panel-card rounded-[24px] p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                              Rank {index + 2}
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold text-white">{user.username}</p>
                          </div>
                          <span className="text-sm font-semibold text-amber-200">{user.xp} XP</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <QuickRead label="Pilots on board" value={String(leaderboard.length)} />
                <QuickRead label="Top level" value={String(featuredPilot.level)} />
                <QuickRead label="Current leader" value={featuredPilot.isCurrentUser ? "You" : featuredPilot.username} />
              </div>
            </div>
          ) : (
            <Notice tone="default" text="No leaderboard users found." />
          )}
        </div>

        <div className="space-y-6">
          <Surface
            eyebrow="Board Read"
            title="Ranking pressure"
            description="A faster read on how competitive the live board is right now."
          >
            <div className="space-y-3">
              <SignalTile icon={Crown} label="Top rank" value={featuredPilot ? "#1" : "-"} accent="text-amber-200" />
              <SignalTile icon={Shield} label="Pilots" value={String(leaderboard.length)} accent="text-cyan-200" />
              <SignalTile icon={Trophy} label="Current leader XP" value={featuredPilot ? String(featuredPilot.xp) : "0"} accent="text-lime-200" />
              <SignalTile icon={Zap} label="Board level" value={featuredPilot ? String(featuredPilot.level) : "0"} accent="text-white" />
            </div>
          </Surface>
        </div>
      </section>

      <Surface
        eyebrow="Ranking Board"
        title="Top contributors"
        description="Live ordering by XP and level, with the current user highlighted directly in the stream."
      >
        {loading ? (
          <Notice tone="default" text="Loading leaderboard..." />
        ) : error ? (
          <Notice tone="error" text={error} />
        ) : leaderboard.length > 0 ? (
          <div className="space-y-4">
            {leaderboard.map((user, index) => (
              <article
                key={user.id}
                className={`rounded-[30px] border p-5 ${
                  user.isCurrentUser
                    ? "border-lime-300/30 bg-lime-300/10"
                    : "panel-card"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="metric-card flex h-14 w-14 items-center justify-center rounded-full text-lg font-black text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-lg font-black text-white">{user.username}</p>
                      <p className="mt-1 text-sm text-slate-300">Level {user.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.isCurrentUser ? <StatusChip label="You" tone="positive" /> : null}
                    <StatusChip label={`${user.xp} XP`} tone="info" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No leaderboard users found." />
        )}
      </Surface>
    </div>
  );
}

function RankBanner() {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.22),transparent_34%),linear-gradient(145deg,rgba(22,16,7,0.96),rgba(4,9,13,0.94))] p-6">
      <div className="absolute right-4 top-4 flex h-20 w-20 items-center justify-center rounded-full border border-amber-300/16 bg-amber-300/10 text-amber-200">
        <Trophy className="h-8 w-8" />
      </div>
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-amber-200">
        Rank Grid
      </p>
      <p className="mt-3 max-w-[18rem] text-sm leading-7 text-slate-300">
        The live ranking board shows who is actually driving momentum across the grid.
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

function SignalTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Crown;
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
