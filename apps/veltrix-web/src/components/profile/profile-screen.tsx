"use client";

import Link from "next/link";
import { ShieldCheck, Signal, Trophy, UserRound, Zap } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuth } from "@/components/providers/auth-provider";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function ProfileScreen() {
  const { profile, authConfigured } = useAuth();
  const {
    connectedAccounts,
    notifications,
    unreadNotificationCount,
    loading,
    error,
    projectReputation,
  } = useLiveUserData();

  const connectedCount = connectedAccounts.filter((account) => account.status === "connected").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_380px]">
        <div className="overflow-hidden rounded-[38px] border border-cyan-300/12 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.18),transparent_26%),radial-gradient(circle_at_86%_10%,rgba(192,255,0,0.12),transparent_18%),linear-gradient(145deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            <span>Pilot Profile</span>
            <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 tracking-[0.24em] text-cyan-100">
              Identity Hub
            </span>
          </div>

          <div className="mt-6 space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_320px]">
              <div className="space-y-5">
                <IdentityBanner />

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-[14ch]">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100">
                        {profile?.title ?? "Operator"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                        {connectedCount} linked systems
                      </span>
                    </div>
                    <h3 className="font-display mt-4 text-balance text-[clamp(2.2rem,4vw,4.5rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                      {profile?.username ?? "Guest pilot"}
                    </h3>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                      Your pilot surface ties live auth, provider readiness, signal pressure and world standing into one command-grade identity layer.
                    </p>
                  </div>

                  <StatusChip
                    label={authConfigured ? "Live session" : "Auth not armed"}
                    tone={authConfigured ? "positive" : "warning"}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <FeatureStat label="XP" value={String(profile?.xp ?? 0)} />
                  <FeatureStat label="Level" value={String(profile?.level ?? 1)} />
                  <FeatureStat label="Streak" value={String(profile?.streak ?? 0)} />
                  <FeatureStat label="Trust" value={String(profile?.trustScore ?? 50)} />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                  >
                    Tune pilot
                  </Link>
                  <Link
                    href="/notifications"
                    className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30"
                  >
                    Open signal feed
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/24 p-4">
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
                  Command readout
                </p>
                <div className="mt-4 space-y-3">
                  <SignalTile icon={Signal} label="Unread signals" value={String(unreadNotificationCount)} accent="text-cyan-200" />
                  <SignalTile icon={ShieldCheck} label="Connected systems" value={String(connectedCount)} accent="text-lime-200" />
                  <SignalTile icon={Trophy} label="World standing" value={String(projectReputation.length)} accent="text-amber-200" />
                  <SignalTile icon={Zap} label="Recent events" value={String(notifications.length)} accent="text-white" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <QuickRead label="Profile title" value={profile?.title ?? "Operator"} />
              <QuickRead label="Contribution tier" value={profile?.contributionTier ?? "Explorer"} />
              <QuickRead label="Unread now" value={String(unreadNotificationCount)} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Surface
            eyebrow="Identity Stack"
            title="Session source"
            description="This pilot hub is tied to the same live account surfaces as mobile."
          >
            <div className="grid gap-3">
              <InfoPanel
                title="Auth foundation"
                text={
                  authConfigured
                    ? "Supabase auth is active, so this surface reads real profile and session state."
                    : "Publishable Supabase envs are still missing, so live account reads are not armed yet."
                }
              />
              <InfoPanel
                title="Provider source"
                text="Verification readiness comes from user_connected_accounts, not demo toggles."
              />
              <InfoPanel
                title="Signal pressure"
                text={`${unreadNotificationCount} unread updates across ${notifications.length} recent events.`}
              />
            </div>
          </Surface>

          <Surface
            eyebrow="Pilot Links"
            title="Next surfaces"
            description="Fast jumps into the rest of the live consumer grid."
          >
            <div className="flex flex-wrap gap-3">
              <QuickLink href="/notifications" label="Signal center" />
              <QuickLink href="/raids" label="Raid board" />
              <QuickLink href="/leaderboard" label="Leaderboard" />
              <QuickLink href="/projects" label="World browser" />
            </div>
          </Surface>
        </div>
      </section>

      <Surface
        eyebrow="Linked Systems"
        title="Provider loadout"
        description="Provider readiness should feel like a pilot loadout, not a settings table."
      >
        {loading ? (
          <Notice tone="default" text="Loading connected systems..." />
        ) : error ? (
          <Notice tone="error" text={error} />
        ) : connectedAccounts.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {connectedAccounts.map((account) => (
              <div key={account.id} className="panel-card rounded-[32px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-black text-white">{account.provider.toUpperCase()}</p>
                  <StatusChip
                    label={
                      account.status === "connected"
                        ? "Ready"
                        : account.status === "expired"
                          ? "Reconnect"
                          : "Offline"
                    }
                    tone={
                      account.status === "connected"
                        ? "positive"
                        : account.status === "expired"
                          ? "warning"
                          : "default"
                    }
                  />
                </div>
                <p className="mt-3 text-sm text-cyan-200">{account.username ?? account.providerUserId}</p>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Linked {new Date(account.connectedAt).toLocaleDateString("nl-NL")} and ready for provider-verified missions.
                </p>
                <button className="glass-button mt-6 rounded-full px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                  {account.status === "connected"
                    ? `Manage ${account.provider}`
                    : account.status === "expired"
                      ? `Reconnect ${account.provider}`
                      : `Connect ${account.provider}`}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No connected systems yet. Link X, Discord or Telegram before starting provider-verified missions." />
        )}
      </Surface>

      <Surface
        eyebrow="World Standing"
        title="Project reputation"
        description="This is where your standing actually compounds across the live worlds."
      >
        {projectReputation.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {projectReputation.map((item) => (
              <div key={item.projectId} className="panel-card rounded-[32px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-cyan-200">{item.projectName}</p>
                    <p className="mt-2 text-xl font-black text-white">{item.contributionTier.toUpperCase()}</p>
                  </div>
                  <StatusChip label={item.rank > 0 ? `#${item.rank}` : "Unranked"} tone={item.rank > 0 ? "positive" : "default"} />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MiniStat label="Project XP" value={item.xp.toLocaleString()} />
                  <MiniStat label="Trust" value={String(item.trustScore)} />
                  <MiniStat label="Quests" value={String(item.questsCompleted)} />
                  <MiniStat label="Raids" value={String(item.raidsCompleted)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No project-specific reputation yet. Start clearing quests and raids to build standing inside each world." />
        )}
      </Surface>
    </div>
  );
}

function IdentityBanner() {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.22),transparent_34%),linear-gradient(145deg,rgba(8,20,28,0.96),rgba(4,9,13,0.94))] p-6">
      <div className="absolute right-4 top-4 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/16 bg-cyan-300/10 text-cyan-200">
        <UserRound className="h-8 w-8" />
      </div>
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-200">
        Pilot Command
      </p>
      <p className="mt-3 max-w-[18rem] text-sm leading-7 text-slate-300">
        Identity, systems and reputation converge here before you jump back into the grid.
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[20px] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SignalTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Signal;
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

function InfoPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="metric-card rounded-[24px] p-4">
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
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
