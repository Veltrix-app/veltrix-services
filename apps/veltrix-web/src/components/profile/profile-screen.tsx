"use client";

import Link from "next/link";
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
  } =
    useLiveUserData();

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(0,204,255,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            Identity Hub
          </p>
          <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            {profile
              ? `${profile.username} now drives web identity from the same live account layer as mobile.`
              : "Connected accounts become the switchboard for verification-aware quests."}
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            The profile is now wired to real Supabase auth, profile and linked-account reads, so
            web parity can grow on top of actual user state.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/profile/edit"
              className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99]"
            >
              Edit profile
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">XP</p>
              <p className="mt-3 text-3xl font-black text-white">{profile?.xp ?? 0}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Streak</p>
              <p className="mt-3 text-3xl font-black text-white">{profile?.streak ?? 0}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Trust</p>
              <p className="mt-3 text-3xl font-black text-white">{profile?.trustScore ?? 50}</p>
            </div>
          </div>
        </div>

        <Surface
          eyebrow="Session"
          title="Auth foundation"
          description="Sprint two replaces the preview profile with the real auth and identity layer."
        >
          <div className="grid gap-4">
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-sm font-bold text-white">Supabase client</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {authConfigured
                  ? "Publishable Supabase envs are present and the profile route is already using live session state."
                  : "Publishable Supabase envs are still missing, so this route cannot read live account data yet."}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-sm font-bold text-white">Linked account source</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Connected accounts read from <code className="rounded bg-white/8 px-1 py-0.5 text-xs">user_connected_accounts</code> and will gate verification-aware quests.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-sm font-bold text-white">Notification pressure</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {unreadNotificationCount} unread updates across {notifications.length} recent events.
              </p>
            </div>
          </div>
        </Surface>
      </section>

      <Surface
        eyebrow="Connected Accounts"
        title="Provider readiness"
        description="This is now reading from the real connected-account table instead of preview provider states."
      >
        {loading ? (
          <div className="rounded-[28px] border border-white/8 bg-black/20 px-5 py-6 text-sm text-slate-300">
            Loading connected accounts...
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-rose-400/20 bg-rose-500/10 px-5 py-6 text-sm text-rose-200">
            {error}
          </div>
        ) : connectedAccounts.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {connectedAccounts.map((account) => (
              <div
                key={account.id}
                className="rounded-[28px] border border-white/8 bg-black/20 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-black text-white">{account.provider.toUpperCase()}</p>
                  <StatusChip
                    label={
                      account.status === "connected"
                        ? "Connected"
                        : account.status === "expired"
                        ? "Reconnect"
                        : "Not connected"
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
                <p className="mt-3 text-sm text-cyan-200">
                  {account.username ?? account.providerUserId}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Connected {new Date(account.connectedAt).toLocaleDateString("nl-NL")}.
                </p>
                <button className="mt-6 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
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
          <div className="rounded-[28px] border border-white/8 bg-black/20 px-5 py-6 text-sm text-slate-300">
            No connected accounts yet. Link X, Discord or Telegram before starting provider-verified quests.
          </div>
        )}
      </Surface>

      <Surface
        eyebrow="Reputation"
        title="Project standing"
        description="Your global Veltrix score is only half the story. This is the project-level reputation layer that governs ecosystem-specific momentum."
      >
        {projectReputation.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {projectReputation.map((item) => (
              <div
                key={item.projectId}
                className="rounded-[28px] border border-white/8 bg-black/20 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-cyan-200">{item.projectName}</p>
                    <p className="mt-2 text-xl font-black text-white">
                      {item.contributionTier.toUpperCase()}
                    </p>
                  </div>
                  <StatusChip
                    label={item.rank > 0 ? `#${item.rank}` : "Unranked"}
                    tone={item.rank > 0 ? "positive" : "default"}
                  />
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
          <div className="rounded-[28px] border border-white/8 bg-black/20 px-5 py-6 text-sm text-slate-300">
            No project-specific reputation yet. Start completing quests and raids to build standing inside each ecosystem.
          </div>
        )}
      </Surface>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
