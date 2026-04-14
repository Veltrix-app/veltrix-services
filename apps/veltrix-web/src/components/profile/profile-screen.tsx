"use client";

import Link from "next/link";
import { ShieldCheck, Signal, Trophy, Zap } from "lucide-react";
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
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[36px] border border-cyan-300/16 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.18),transparent_42%),linear-gradient(145deg,rgba(9,15,21,0.98),rgba(3,7,12,0.92))] p-6 shadow-[0_28px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            <span>Pilot Profile</span>
            <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 tracking-[0.24em] text-cyan-100">
              Status Hub
            </span>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100">
                      {profile?.title ?? "Operator"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                      {connectedCount} providers linked
                    </span>
                  </div>
                  <h3 className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                    {profile?.username ? `${profile.username}, report to the grid.` : "Build your pilot identity."}
                  </h3>
                  <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    Live auth, connected providers, notification pressure and project-specific standing now land in one command-grade identity surface.
                  </p>
                </div>

                <StatusChip
                  label={authConfigured ? "Live session" : "Missing auth env"}
                  tone={authConfigured ? "positive" : "warning"}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <HeroStat label="XP" value={String(profile?.xp ?? 0)} />
                <HeroStat label="Streak" value={String(profile?.streak ?? 0)} />
                <HeroStat label="Trust" value={String(profile?.trustScore ?? 50)} />
                <HeroStat label="Unread" value={String(unreadNotificationCount)} />
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

            <div className="space-y-3 rounded-[28px] border border-white/10 bg-black/24 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
                Command readout
              </p>
              <SignalTile icon={Signal} label="Unread signals" value={String(unreadNotificationCount)} accent="text-cyan-200" />
              <SignalTile icon={ShieldCheck} label="Connected providers" value={String(connectedCount)} accent="text-lime-200" />
              <SignalTile icon={Trophy} label="World standing" value={String(projectReputation.length)} accent="text-amber-200" />
              <SignalTile icon={Zap} label="Recent events" value={String(notifications.length)} accent="text-white" />
            </div>
          </div>
        </div>

        <Surface
          eyebrow="Session"
          title="Identity stack"
          description="The web profile is now anchored to the same auth, connected-account and signal layers as mobile."
        >
          <div className="grid gap-3">
            <InfoPanel
              title="Auth foundation"
              text={
                authConfigured
                  ? "Supabase auth is live, so this pilot surface reads real session state and real profile data."
                  : "Publishable Supabase envs are still missing, so this route cannot read live account data yet."
              }
            />
            <InfoPanel
              title="Connected account source"
              text="Verification readiness is powered by user_connected_accounts, not demo provider toggles."
            />
            <InfoPanel
              title="Signal pressure"
              text={`${unreadNotificationCount} unread updates across ${notifications.length} recent events.`}
            />
          </div>
        </Surface>
      </section>

      <Surface
        eyebrow="Providers"
        title="Linked systems"
        description="Provider readiness should feel like a loadout, not a settings table."
      >
        {loading ? (
          <Notice tone="default" text="Loading connected systems..." />
        ) : error ? (
          <Notice tone="error" text={error} />
        ) : connectedAccounts.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {connectedAccounts.map((account) => (
              <div key={account.id} className="panel-card rounded-[30px] p-5">
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
                  Linked {new Date(account.connectedAt).toLocaleDateString("nl-NL")} and used to unlock provider-verified missions.
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
        eyebrow="Standing"
        title="World reputation"
        description="Global profile score is only half the story. These are the worlds where your standing actually compounds."
      >
        {projectReputation.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {projectReputation.map((item) => (
              <div key={item.projectId} className="panel-card rounded-[30px] p-5">
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
                  <MiniStat label="Approved quests" value={String(item.questsCompleted)} />
                  <MiniStat label="Confirmed raids" value={String(item.raidsCompleted)} />
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

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/24 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
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

function InfoPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="metric-card rounded-[24px] p-4">
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
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
