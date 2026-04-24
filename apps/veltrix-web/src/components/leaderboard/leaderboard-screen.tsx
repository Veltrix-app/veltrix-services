"use client";

import Link from "next/link";
import { Crown, Shield, Trophy, Zap } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function LeaderboardScreen() {
  const { leaderboard, loading, error } = useLiveUserData({
    datasets: ["leaderboard"],
  });
  const [featuredMember, ...rankingQueue] = leaderboard;
  const currentUserEntry = leaderboard.find((user) => user.isCurrentUser) ?? null;
  const nextChallenger = rankingQueue[0] ?? null;

  return (
    <div className="space-y-5">
      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.25fr)_340px]">
        <div className="overflow-hidden rounded-[30px] border border-amber-300/12 bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.18),transparent_26%),radial-gradient(circle_at_86%_10%,rgba(0,204,255,0.08),transparent_18%),linear-gradient(145deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:p-6">
          <div className="flex flex-wrap items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.18em] text-amber-300">
            <span>Leaderboard</span>
            <span className="rounded-full border border-amber-300/16 bg-amber-300/10 px-2.5 py-1 tracking-[0.16em] text-amber-100">
              Live Board
            </span>
          </div>

          {featuredMember ? (
            <div className="mt-5 space-y-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_280px]">
                <div className="space-y-4">
                  <RankBanner />
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-[16rem]">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-amber-300/16 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-100">
                          Rank #1
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                          Level {featuredMember.level}
                        </span>
                      </div>
                      <h3 className="mt-3 text-balance text-[1.2rem] font-semibold leading-[1.02] tracking-[-0.03em] text-white sm:text-[1.45rem]">
                        {featuredMember.username}
                      </h3>
                      <p className="mt-2 max-w-xl text-[12px] leading-5 text-slate-300">
                        Top member on the live board right now. This is the pace every other contributor is chasing.
                      </p>
                    </div>

                    <StatusChip label={`${featuredMember.xp} XP`} tone="info" />
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <FeatureStat label="XP" value={String(featuredMember.xp)} />
                    <FeatureStat label="Level" value={String(featuredMember.level)} />
                    <FeatureStat label="Rank" value="#1" />
                    <FeatureStat label="Status" value={featuredMember.isCurrentUser ? "You" : "Live"} />
                  </div>
                </div>

                <div className="rounded-[18px] border border-white/10 bg-black/24 p-3.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-200">
                    Ranking queue
                  </p>
                  <div className="mt-3 space-y-2.5">
                    {rankingQueue.slice(0, 4).map((user, index) => (
                      <article key={user.id} className="panel-card rounded-[18px] p-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                              Rank {index + 2}
                            </p>
                            <p className="mt-1 truncate text-[13px] font-semibold text-white">{user.username}</p>
                          </div>
                          <span className="text-[12px] font-semibold text-amber-200">{user.xp} XP</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <QuickRead label="Members on board" value={String(leaderboard.length)} />
                <QuickRead label="Top level" value={String(featuredMember.level)} />
                <QuickRead label="Current leader" value={featuredMember.isCurrentUser ? "You" : featuredMember.username} />
              </div>
            </div>
          ) : (
            <Notice tone="default" text="No leaderboard users found." />
          )}
        </div>

        <div className="space-y-5">
          <Surface
            eyebrow="Command read"
            title="Read the board before you chase it"
            description="Start with the pace-setter, the next threshold, and the one pressure cue that matters before you grind for more XP."
            className="bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]"
          >
            <div className="grid gap-3">
              <ReadTile
                label="Now"
                value={
                  featuredMember
                    ? `${featuredMember.username} leads the board with ${featuredMember.xp} XP at level ${featuredMember.level}.`
                    : "The live board has not filled with contributors yet."
                }
              />
              <ReadTile
                label="Next"
                value={
                  currentUserEntry
                    ? `You are currently sitting at rank #${leaderboard.findIndex((user) => user.isCurrentUser) + 1}; ${nextChallenger ? `${nextChallenger.username} is the next visible pace line.` : "hold your momentum and keep climbing."}`
                    : nextChallenger
                      ? `${nextChallenger.username} is the next pace line after the current leader.`
                      : "Jump into a mission lane to get yourself onto the board."
                }
              />
              <ReadTile
                label="Watch"
                value={
                  featuredMember
                    ? `${leaderboard.length} members are on the board and the level ${featuredMember.level} ceiling is setting the pressure right now.`
                    : "Watch for new contributors landing on the board once the next missions resolve."
                }
              />
            </div>

            <div className="space-y-2.5">
              <SignalTile icon={Crown} label="Top rank" value={featuredMember ? "#1" : "-"} accent="text-amber-200" />
              <SignalTile icon={Shield} label="Members" value={String(leaderboard.length)} accent="text-cyan-200" />
              <SignalTile icon={Trophy} label="Current leader XP" value={featuredMember ? String(featuredMember.xp) : "0"} accent="text-lime-200" />
              <SignalTile icon={Zap} label="Board level" value={featuredMember ? String(featuredMember.level) : "0"} accent="text-white" />
            </div>
          </Surface>

          <Surface
            eyebrow="Fast routes"
            title="Jump back into the climb"
            description="Move straight from the board into the surfaces that can change your standing."
          >
            <div className="flex flex-wrap gap-3">
              <RouteTile href="/campaigns" label="Open missions" />
              <RouteTile href="/projects" label="Scout projects" />
              <RouteTile href="/profile" label="Profile standing" />
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
          <div className="space-y-3">
            {leaderboard.map((user, index) => (
              <article
                key={user.id}
                className={`rounded-[22px] border p-4 ${
                  user.isCurrentUser
                    ? "border-lime-300/30 bg-lime-300/10"
                    : "panel-card"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="metric-card flex h-12 w-12 items-center justify-center rounded-full text-[15px] font-black text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-white">{user.username}</p>
                      <p className="mt-1 text-[12px] text-slate-300">Level {user.level}</p>
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
    <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.22),transparent_34%),linear-gradient(145deg,rgba(22,16,7,0.96),rgba(4,9,13,0.94))] p-3.5">
      <div className="absolute right-3.5 top-3.5 flex h-11 w-11 items-center justify-center rounded-full border border-amber-300/16 bg-amber-300/10 text-amber-200">
        <Trophy className="h-5 w-5" />
      </div>
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-200">
        Live Board
      </p>
      <p className="mt-2 max-w-[16rem] text-[11px] leading-5 text-slate-300">
        The live leaderboard shows who is actually driving momentum across the community.
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
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-200/85">{label}</p>
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

function RouteTile({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="glass-button rounded-full px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-white/[0.08]"
    >
      {label}
    </Link>
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
