"use client";

import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function LeaderboardScreen() {
  const { leaderboard, loading, error } = useLiveUserData();

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,196,0,0.14),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-amber-300">
          Leaderboard
        </p>
        <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
          Top raiders from live backend data.
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          Web now reads the same live leaderboard surface as mobile, but with a more ceremonial,
          board-like desktop hierarchy for rankings, XP and current-user focus.
        </p>
      </section>

      <Surface
        eyebrow="Ranking"
        title="Top contributors"
        description="Live ordering by XP and level, with the current user highlighted in-stream."
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
                className={`rounded-[26px] border p-5 ${
                  user.isCurrentUser
                    ? "border-lime-300/30 bg-lime-300/10"
                    : "panel-card"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="metric-card flex h-12 w-12 items-center justify-center rounded-full text-lg font-black text-white">
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
