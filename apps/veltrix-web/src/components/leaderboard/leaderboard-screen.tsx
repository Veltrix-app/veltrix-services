"use client";

/* eslint-disable @next/next/no-img-element -- Profile avatars can be user-uploaded or Supabase-hosted URLs outside the static image config. */
import Link from "next/link";
import {
  BadgeCheck,
  Crown,
  Flame,
  Medal,
  Shield,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuth } from "@/components/providers/auth-provider";
import { useLiveUserData } from "@/hooks/use-live-user-data";
import type { LiveLeaderboardUser } from "@/types/live";

type BadgeTone = "gold" | "lime" | "cyan" | "violet" | "slate";

type MemberBadge = {
  label: string;
  tone: BadgeTone;
};

const previewLeaderboardUsers: LiveLeaderboardUser[] = [
  {
    id: "preview-1",
    username: "ChainPilot",
    xp: 18240,
    level: 12,
    avatarUrl: "",
    bannerUrl: "/brand/slides/vyntro-raids.png",
    title: "Raid Captain",
    faction: "Vanguard",
    isCurrentUser: false,
  },
  {
    id: "preview-2",
    username: "QuestNova",
    xp: 14880,
    level: 10,
    avatarUrl: "",
    bannerUrl: "/brand/slides/vyntro-quests.png",
    title: "Mission Builder",
    faction: "Pulse",
    isCurrentUser: false,
  },
  {
    id: "preview-3",
    username: "VaultRunner",
    xp: 12150,
    level: 8,
    avatarUrl: "",
    bannerUrl: "/brand/slides/vyntro-vaults.png",
    title: "DeFi Scout",
    faction: "Base",
    isCurrentUser: false,
  },
  {
    id: "preview-4",
    username: "SybilShield",
    xp: 9760,
    level: 7,
    avatarUrl: "",
    bannerUrl: "/brand/slides/vyntro-anti-sybil.png",
    title: "Trust Sentinel",
    faction: "Signal",
    isCurrentUser: false,
  },
  {
    id: "preview-5",
    username: "RewardForge",
    xp: 8240,
    level: 6,
    avatarUrl: "",
    bannerUrl: "/brand/slides/vyntro-rewards.png",
    title: "Claim Specialist",
    faction: "Rewards",
    isCurrentUser: false,
  },
];

export function LeaderboardScreen() {
  const { authConfigured, session } = useAuth();
  const { leaderboard: liveLeaderboard, loading, error } = useLiveUserData({
    datasets: ["leaderboard"],
  });
  const isPreview = !authConfigured || !session;
  const showingPreview = isPreview && liveLeaderboard.length === 0;
  const leaderboard =
    liveLeaderboard.length > 0 || !showingPreview ? liveLeaderboard : previewLeaderboardUsers;
  const [featuredMember, ...rankingQueue] = leaderboard;
  const podiumMembers = leaderboard.slice(0, 3);
  const currentUserRank = leaderboard.findIndex((user) => user.isCurrentUser) + 1;
  const currentUserEntry =
    currentUserRank > 0 ? leaderboard[currentUserRank - 1] ?? null : null;
  const nextChallenger = rankingQueue[0] ?? null;

  return (
    <div className="min-w-0 space-y-5">
      <section className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="min-w-0 overflow-hidden rounded-[30px] border border-amber-300/10 bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.16),transparent_28%),radial-gradient(circle_at_86%_10%,rgba(139,92,246,0.12),transparent_20%),linear-gradient(145deg,rgba(9,12,18,0.98),rgba(3,6,10,0.96))] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
            <div className="flex flex-wrap items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.18em] text-amber-300">
              <span>Leaderboard</span>
              <span className="rounded-full border border-amber-300/16 bg-amber-300/10 px-2.5 py-1 tracking-[0.16em] text-amber-100">
                Profile race
              </span>
            </div>
            <StatusChip
              label={showingPreview ? "Preview board" : `${leaderboard.length} members`}
              tone={leaderboard.length > 0 ? "info" : "default"}
            />
          </div>

          {featuredMember ? (
            <div className="mt-3 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
              <FeaturedMemberCard user={featuredMember} rank={1} />

              <div className="grid gap-3">
                <div className="rounded-[24px] border border-white/8 bg-black/22 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-200">
                        Podium stack
                      </p>
                      <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
                        Top profiles, banners and badges in one quick scan.
                      </p>
                    </div>
                    <Crown className="h-4 w-4 text-amber-200" />
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {podiumMembers.map((user, index) => (
                      <PodiumMemberCard key={user.id} user={user} rank={index + 1} />
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-lime-300/12 bg-lime-300/[0.055] p-3.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-lime-300">
                    Your standing
                  </p>
                  <p className="mt-2 text-[15px] font-black text-white">
                    {currentUserEntry
                      ? `Rank #${currentUserRank} with ${formatXp(currentUserEntry.xp)} XP`
                      : "Join a mission to enter the board"}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-5 text-slate-300">
                    {currentUserEntry
                      ? "Your profile is visible in the race with avatar, banner and earned signal."
                      : "Complete quests, raids or DeFi proof to start building a public standing."}
                  </p>
                </div>
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
            description="Start with the pace-setter, your current rank and the one pressure cue that matters before you grind for more XP."
            className="bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.15),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]"
          >
            <div className="grid gap-3">
              <ReadTile
                label="Now"
                value={
                  featuredMember
                    ? `${featuredMember.username} leads with ${formatXp(featuredMember.xp)} XP at level ${featuredMember.level}.`
                    : "The live board has not filled with contributors yet."
                }
              />
              <ReadTile
                label="Next"
                value={
                  currentUserEntry
                    ? `You are rank #${currentUserRank}; ${
                        nextChallenger
                          ? `${nextChallenger.username} is the next visible pace line.`
                          : "hold your momentum and keep climbing."
                      }`
                    : nextChallenger
                      ? `${nextChallenger.username} is the next pace line after the current leader.`
                      : "Jump into a mission lane to get yourself onto the board."
                }
              />
              <ReadTile
                label="Watch"
                value={
                  featuredMember
                    ? `${leaderboard.length} profiles are ranked and the level ${featuredMember.level} ceiling is setting pressure right now.`
                    : "Watch for new contributors landing on the board once the next missions resolve."
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <SignalTile icon="crown" label="Top rank" value={featuredMember ? "#1" : "-"} accent="text-amber-200" />
              <SignalTile icon="shield" label="Members" value={String(leaderboard.length)} accent="text-cyan-200" />
              <SignalTile icon="trophy" label="Leader XP" value={featuredMember ? formatXp(featuredMember.xp) : "0"} accent="text-lime-200" />
              <SignalTile icon="zap" label="Top level" value={featuredMember ? String(featuredMember.level) : "0"} accent="text-white" />
            </div>
          </Surface>

          <Surface
            eyebrow="Fast routes"
            title="Jump back into the climb"
            description="Move straight from the board into the surfaces that can change your standing."
          >
            <div className="flex flex-wrap gap-3">
              <RouteTile href="/quests" label="Open quests" />
              <RouteTile href="/raids" label="Join raids" />
              <RouteTile href="/profile" label="Profile standing" />
            </div>
          </Surface>
        </div>
      </section>

      <Surface
        eyebrow="Ranking Board"
        title="Top contributors"
        description="Live ordering by XP and level, now with profile banners, avatars and earned status badges."
      >
        {loading && !showingPreview ? (
          <Notice tone="default" text="Loading leaderboard..." />
        ) : error ? (
          <Notice tone="error" text={error} />
        ) : leaderboard.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {leaderboard.map((user, index) => (
              <LeaderboardMemberRow
                key={user.id}
                user={user}
                rank={index + 1}
              />
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No leaderboard users found." />
        )}
      </Surface>
    </div>
  );
}

function FeaturedMemberCard({ user, rank }: { user: LiveLeaderboardUser; rank: number }) {
  const badges = buildMemberBadges(user, rank);

  return (
    <article className="relative min-w-0 overflow-hidden rounded-[26px] border border-amber-300/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-2.5">
      <ProfileBanner user={user} rank={rank} className="h-44 sm:h-56" />

      <div className="relative z-10 -mt-12 px-3 pb-3 sm:px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 items-end gap-3">
            <ProfileAvatar user={user} size="hero" />
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-amber-300/18 bg-amber-300/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100">
                  Rank #{rank}
                </span>
                {user.isCurrentUser ? <StatusChip label="You" tone="positive" /> : null}
              </div>
              <h3 className="mt-2 truncate text-[1.45rem] font-black leading-none tracking-[-0.04em] text-white sm:text-[2rem]">
                {user.username}
              </h3>
              <p className="mt-1 text-[12px] font-semibold text-slate-300">
                {user.title} {user.faction && user.faction !== "Unassigned" ? `// ${user.faction}` : ""}
              </p>
            </div>
          </div>

          <div className="w-full rounded-[18px] border border-white/8 bg-black/34 px-4 py-3 text-left backdrop-blur-xl sm:w-auto sm:text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Total XP</p>
            <p className="mt-1 text-[1.15rem] font-black text-amber-100">{formatXp(user.xp)}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <ProfileBadge key={badge.label} badge={badge} />
          ))}
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-4">
          <FeatureStat label="XP" value={formatXp(user.xp)} />
          <FeatureStat label="Level" value={String(user.level)} />
          <FeatureStat label="Profile" value={profileCompletionLabel(user)} />
          <FeatureStat label="Status" value={user.isCurrentUser ? "You" : "Live"} />
        </div>
      </div>
    </article>
  );
}

function PodiumMemberCard({ user, rank }: { user: LiveLeaderboardUser; rank: number }) {
  return (
    <article className="group relative overflow-hidden rounded-[18px] border border-white/8 bg-white/[0.035] p-2.5 transition hover:border-white/12">
      <ProfileBanner user={user} rank={rank} className="h-16" />
      <div className="relative z-10 -mt-8 flex items-end justify-between gap-3 px-1 pb-1">
        <div className="flex min-w-0 items-end gap-2.5">
          <ProfileAvatar user={user} size="sm" />
          <div className="min-w-0 pb-1">
            <p className="truncate text-[13px] font-black text-white">{user.username}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Level {user.level}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-amber-300/16 bg-amber-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
          #{rank}
        </span>
      </div>
    </article>
  );
}

function LeaderboardMemberRow({ user, rank }: { user: LiveLeaderboardUser; rank: number }) {
  const badges = buildMemberBadges(user, rank).slice(0, 3);

  return (
    <article
      className={`group relative overflow-hidden rounded-[24px] border p-2.5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(0,0,0,0.32)] ${
        user.isCurrentUser
          ? "border-lime-300/28 bg-lime-300/[0.075]"
          : rank <= 3
            ? "border-amber-300/14 bg-amber-300/[0.045]"
            : "border-white/7 bg-white/[0.028]"
      }`}
    >
      <ProfileBanner user={user} rank={rank} className="h-24" />

      <div className="relative z-10 -mt-10 grid gap-3 px-2 pb-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="flex min-w-0 items-end gap-3">
          <ProfileAvatar user={user} size="md" />
          <div className="min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${rankChipClass(rank)}`}>
                #{rank}
              </span>
              {user.isCurrentUser ? <StatusChip label="You" tone="positive" /> : null}
            </div>
            <h3 className="mt-2 truncate text-[17px] font-black tracking-[-0.03em] text-white">
              {user.username}
            </h3>
            <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">
              {user.title} {user.faction && user.faction !== "Unassigned" ? `// ${user.faction}` : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-[12rem]">
          <FeatureStat label="XP" value={formatXp(user.xp)} />
          <FeatureStat label="Level" value={String(user.level)} />
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap gap-2 px-2 pb-2">
        {badges.map((badge) => (
          <ProfileBadge key={badge.label} badge={badge} compact />
        ))}
      </div>
    </article>
  );
}

function ProfileBanner({
  user,
  rank,
  className,
}: {
  user: LiveLeaderboardUser;
  rank: number;
  className: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border border-white/8 ${fallbackBannerClass(rank)} ${className}`}
      style={
        user.bannerUrl
          ? {
              backgroundImage: `linear-gradient(180deg,rgba(4,7,10,0.18),rgba(4,7,10,0.82)), url(${user.bannerUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.18),transparent_22%),linear-gradient(90deg,rgba(0,0,0,0.1),rgba(0,0,0,0.56))]" />
      <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl">
        {user.bannerUrl ? "Custom banner" : "Signal banner"}
      </div>
    </div>
  );
}

function ProfileAvatar({
  user,
  size,
}: {
  user: LiveLeaderboardUser;
  size: "sm" | "md" | "hero";
}) {
  const sizeClass =
    size === "hero"
      ? "h-20 w-20 sm:h-24 sm:w-24"
      : size === "md"
        ? "h-16 w-16"
        : "h-12 w-12";

  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden rounded-[22px] border border-white/14 bg-[linear-gradient(135deg,rgba(190,255,74,0.18),rgba(139,92,246,0.16))] shadow-[0_18px_48px_rgba(0,0,0,0.38)]`}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={`${user.username} avatar`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[15px] font-black uppercase tracking-[0.16em] text-white">
          {getInitials(user.username)}
        </div>
      )}
    </div>
  );
}

function ProfileBadge({
  badge,
  compact = false,
}: {
  badge: MemberBadge;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-black uppercase tracking-[0.14em] ${compact ? "text-[9px]" : "text-[10px]"} ${badgeToneClass(badge.tone)}`}
    >
      <BadgeIcon tone={badge.tone} />
      {badge.label}
    </span>
  );
}

function BadgeIcon({ tone }: { tone: BadgeTone }) {
  if (tone === "gold") {
    return <Medal className="h-3 w-3" />;
  }

  if (tone === "lime") {
    return <Flame className="h-3 w-3" />;
  }

  if (tone === "cyan") {
    return <BadgeCheck className="h-3 w-3" />;
  }

  if (tone === "violet") {
    return <Zap className="h-3 w-3" />;
  }

  return <UserRound className="h-3 w-3" />;
}

function buildMemberBadges(user: LiveLeaderboardUser, rank: number): MemberBadge[] {
  const badges: MemberBadge[] = [];

  if (rank === 1) {
    badges.push({ label: "Board leader", tone: "gold" });
  } else if (rank <= 3) {
    badges.push({ label: "Podium", tone: "gold" });
  } else if (rank <= 10) {
    badges.push({ label: "Top 10", tone: "cyan" });
  }

  if (user.isCurrentUser) {
    badges.push({ label: "You", tone: "lime" });
  }

  if (user.level >= 10) {
    badges.push({ label: "Veteran", tone: "violet" });
  } else if (user.level >= 5) {
    badges.push({ label: "Rising", tone: "violet" });
  } else {
    badges.push({ label: `Level ${user.level}`, tone: "slate" });
  }

  if (user.xp >= 10000) {
    badges.push({ label: "10K XP", tone: "lime" });
  } else if (user.xp >= 1000) {
    badges.push({ label: "1K XP", tone: "lime" });
  }

  if (user.avatarUrl && user.bannerUrl) {
    badges.push({ label: "Profile ready", tone: "cyan" });
  }

  return badges.slice(0, 5);
}

function SignalTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: "crown" | "shield" | "trophy" | "zap";
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="metric-card rounded-[16px] px-3 py-2.5">
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <SignalIcon icon={icon} />
        <span>{label}</span>
      </div>
      <p className={`mt-1.5 text-[13px] font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function SignalIcon({ icon }: { icon: "crown" | "shield" | "trophy" | "zap" }) {
  if (icon === "crown") {
    return <Crown className="h-3 w-3" />;
  }

  if (icon === "shield") {
    return <Shield className="h-3 w-3" />;
  }

  if (icon === "trophy") {
    return <Trophy className="h-3 w-3" />;
  }

  return <Zap className="h-3 w-3" />;
}

function FeatureStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[16px] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1.5 truncate text-[13px] font-semibold text-white">{value}</p>
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

function getInitials(username: string) {
  const letters = username
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return letters || "V";
}

function formatXp(value: number) {
  return value.toLocaleString("en-US");
}

function profileCompletionLabel(user: LiveLeaderboardUser) {
  if (user.avatarUrl && user.bannerUrl) {
    return "Complete";
  }

  if (user.avatarUrl || user.bannerUrl) {
    return "Partial";
  }

  return "Starter";
}

function rankChipClass(rank: number) {
  if (rank === 1) {
    return "border-amber-300/22 bg-amber-300/14 text-amber-100";
  }

  if (rank <= 3) {
    return "border-cyan-300/18 bg-cyan-300/12 text-cyan-100";
  }

  return "border-white/10 bg-white/6 text-slate-200";
}

function badgeToneClass(tone: BadgeTone) {
  if (tone === "gold") {
    return "border-amber-300/18 bg-amber-300/12 text-amber-100";
  }

  if (tone === "lime") {
    return "border-lime-300/18 bg-lime-300/12 text-lime-100";
  }

  if (tone === "cyan") {
    return "border-cyan-300/18 bg-cyan-300/12 text-cyan-100";
  }

  if (tone === "violet") {
    return "border-violet-300/18 bg-violet-300/12 text-violet-100";
  }

  return "border-white/10 bg-white/7 text-slate-200";
}

function fallbackBannerClass(rank: number) {
  if (rank === 1) {
    return "bg-[radial-gradient(circle_at_18%_18%,rgba(255,196,0,0.28),transparent_30%),linear-gradient(135deg,rgba(47,32,9,0.98),rgba(8,10,16,0.96))]";
  }

  if (rank <= 3) {
    return "bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.24),transparent_30%),linear-gradient(135deg,rgba(8,22,32,0.98),rgba(8,10,16,0.96))]";
  }

  return "bg-[radial-gradient(circle_at_18%_18%,rgba(139,92,246,0.22),transparent_30%),linear-gradient(135deg,rgba(15,12,28,0.98),rgba(8,10,16,0.96))]";
}
