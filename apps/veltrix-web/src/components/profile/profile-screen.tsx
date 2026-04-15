"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Signal, Trophy, UserRound, Zap } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuth } from "@/components/providers/auth-provider";
import { useLiveUserData } from "@/hooks/use-live-user-data";
import type { ConnectedAccount } from "@/types/auth";

export function ProfileScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    profile,
    authConfigured,
    loading: authLoading,
    linkProvider,
    saveTelegramIdentity,
    syncConnectedAccounts,
  } = useAuth();
  const {
    connectedAccounts,
    notifications,
    unreadNotificationCount,
    loading,
    error,
    projectReputation,
    quests,
    reload,
  } = useLiveUserData();
  const [telegramUserId, setTelegramUserId] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [activeProvider, setActiveProvider] = useState<ConnectedAccount["provider"] | null>(null);
  const [providerMessage, setProviderMessage] = useState<{
    tone: "default" | "error" | "success";
    text: string;
  } | null>(null);
  const [linkedSyncHandled, setLinkedSyncHandled] = useState<string | null>(null);
  const [syncingLoadout, setSyncingLoadout] = useState(false);
  const [linkedAccountOverrides, setLinkedAccountOverrides] = useState<ConnectedAccount[]>([]);

  const effectiveConnectedAccounts = useMemo(() => {
    const providerMap = new Map(
      connectedAccounts.map((account) => [account.provider, account] as const)
    );

    for (const account of linkedAccountOverrides) {
      providerMap.set(account.provider, account);
    }

    return Array.from(providerMap.values());
  }, [connectedAccounts, linkedAccountOverrides]);

  const connectedCount = effectiveConnectedAccounts.filter(
    (account) => account.status === "connected"
  ).length;
  const providerMissionPressure = useMemo(() => {
    const pressure = {
      discord: 0,
      telegram: 0,
      x: 0,
    };

    for (const quest of quests) {
      if (quest.completionMode !== "integration_auto") {
        continue;
      }

      if (quest.verificationProvider === "discord") {
        pressure.discord += 1;
      }

      if (quest.verificationProvider === "telegram") {
        pressure.telegram += 1;
      }

      if (quest.verificationProvider === "x") {
        pressure.x += 1;
      }
    }

    return pressure;
  }, [quests]);

  const providerCards = useMemo(() => {
    const providerMap = new Map(
      effectiveConnectedAccounts.map((account) => [account.provider, account])
    );

    return [
      {
        provider: "discord" as const,
        label: "Discord",
        eyebrow: "Squad comms",
        hint: "Required for server joins, raid pressure and community-gated missions.",
        accent: "text-cyan-200",
        cta:
          providerMap.get("discord")?.status === "connected"
            ? "Refresh Discord link"
            : "Link Discord",
        missionCount: providerMissionPressure.discord,
        account: providerMap.get("discord") ?? null,
      },
      {
        provider: "telegram" as const,
        label: "Telegram",
        eyebrow: "Bot-assisted rail",
        hint: "Telegram verification needs your numeric Telegram id because group membership checks resolve against the bot.",
        accent: "text-lime-200",
        cta:
          providerMap.get("telegram")?.status === "connected"
            ? "Update Telegram id"
            : "Arm Telegram id",
        missionCount: providerMissionPressure.telegram,
        account: providerMap.get("telegram") ?? null,
      },
      {
        provider: "x" as const,
        label: "X",
        eyebrow: "Signal graph",
        hint: "Required for follow quests, social mission gating and signal-based campaign pressure.",
        accent: "text-amber-200",
        cta:
          providerMap.get("x")?.status === "connected"
            ? "Refresh X link"
            : "Link X",
        missionCount: providerMissionPressure.x,
        account: providerMap.get("x") ?? null,
      },
    ];
  }, [effectiveConnectedAccounts, providerMissionPressure]);

  async function handleProviderLink(provider: "discord" | "x") {
    setProviderMessage(null);
    setActiveProvider(provider);

    const result = await linkProvider(provider);

    if (!result.ok) {
      setProviderMessage({
        tone: "error",
        text: result.error ?? `Could not link ${provider.toUpperCase()} right now.`,
      });
      setActiveProvider(null);
      return;
    }

    setProviderMessage({
      tone: "default",
      text: `Routing ${provider.toUpperCase()} through the live identity link now.`,
    });
  }

  async function handleTelegramSave() {
    setProviderMessage(null);
    setActiveProvider("telegram");

    const result = await saveTelegramIdentity({
      telegramUserId,
      username: telegramUsername,
    });

    if (!result.ok) {
      setProviderMessage({
        tone: "error",
        text: result.error ?? "Could not arm your Telegram identity yet.",
      });
      setActiveProvider(null);
      return;
    }

    void reload();
    setProviderMessage({
      tone: "success",
      text: "Telegram id armed. Telegram join missions can now verify against this identity.",
    });
    setTelegramUserId("");
    setTelegramUsername("");
    setActiveProvider(null);
  }

  async function handleRefreshLinks() {
    setProviderMessage(null);
    setActiveProvider(null);
    setSyncingLoadout(true);
    const result = await syncConnectedAccounts();

    if (!result.ok) {
      setProviderMessage({
        tone: "error",
        text: result.error ?? "Could not refresh linked systems.",
      });
      setSyncingLoadout(false);
      return;
    }

    if (result.accounts) {
      setLinkedAccountOverrides(result.accounts);
    }
    void reload();
    setProviderMessage({
      tone: "success",
      text:
        (result.identities ?? 0) > 0
          ? "Linked systems refreshed against the live identity graph."
          : "No new OAuth identities were found for this pilot session.",
    });
    setSyncingLoadout(false);
  }

  useEffect(() => {
    const linkedProvider = searchParams.get("linked");
    const errorCode = searchParams.get("error_code");
    if (!linkedProvider || linkedSyncHandled === linkedProvider) {
      return;
    }
    const resolvedProvider = linkedProvider;
    setLinkedSyncHandled(resolvedProvider);

    let cancelled = false;

    async function finalizeLinkedProvider() {
      setSyncingLoadout(true);
      setProviderMessage({
        tone: "default",
        text:
          errorCode === "identity_already_exists"
            ? `${resolvedProvider.toUpperCase()} was already present in auth. Syncing it into your live loadout now...`
            : `Finalizing ${resolvedProvider.toUpperCase()} inside your live loadout...`,
      });

      const result = await syncConnectedAccounts();
      if (!result.ok) {
        if (!cancelled) {
          setProviderMessage({
            tone: "error",
            text: result.error ?? `Could not finalize ${resolvedProvider.toUpperCase()} linking.`,
          });
          setSyncingLoadout(false);
        }
        return;
      }

      if ((result.identities ?? 0) === 0) {
        if (!cancelled) {
          setProviderMessage({
            tone: "error",
            text:
              errorCode === "identity_already_exists"
                ? `${resolvedProvider.toUpperCase()} is already linked to a different Veltrix auth account, not this pilot.`
                : `No ${resolvedProvider.toUpperCase()} identity was found on this pilot after the return flow.`,
          });
          setSyncingLoadout(false);
          router.replace(pathname, { scroll: false });
        }
        return;
      }

      if (result.accounts) {
        setLinkedAccountOverrides(result.accounts);
      }
      void reload();

      if (!cancelled) {
        setProviderMessage({
          tone: "success",
          text:
            errorCode === "identity_already_exists"
              ? `${resolvedProvider.toUpperCase()} was already linked and is now synced into your identity loadout.`
              : `${resolvedProvider.toUpperCase()} is now armed inside your identity loadout.`,
        });
        setSyncingLoadout(false);
        router.replace(pathname, { scroll: false });
      }
    }

    void finalizeLinkedProvider();

    return () => {
      cancelled = true;
    };
  }, [linkedSyncHandled, pathname, reload, router, searchParams, syncConnectedAccounts]);

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
                  <button
                    type="button"
                    onClick={() => void handleRefreshLinks()}
                    disabled={authLoading || syncingLoadout}
                    className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {syncingLoadout ? "Syncing loadout..." : "Refresh linked systems"}
                  </button>
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
            title="Identity command"
            description="Linking is now part of the mission system, not a buried settings afterthought."
          >
            <div className="grid gap-3">
              <InfoPanel
                title="Auth foundation"
                text={
                  authConfigured
                    ? "Pilot auth is armed, so Discord and X can route through live identity linking instead of fake toggles."
                    : "Publishable Supabase envs are still missing, so live account reads are not armed yet."
                }
              />
              <InfoPanel
                title="Mission pressure"
                text={`${providerMissionPressure.discord + providerMissionPressure.telegram + providerMissionPressure.x} missions currently depend on linked provider state.`}
              />
              <InfoPanel
                title="Provider source"
                text="Verification readiness resolves from live linked identities and user_connected_accounts, not demo switches."
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
        description="Link the systems that power mission verification before you jump into the next lane."
      >
        {providerMessage ? (
          <Notice tone={providerMessage.tone === "error" ? "error" : "default"} text={providerMessage.text} />
        ) : null}

        {loading ? (
          <Notice tone="default" text="Loading connected systems..." />
        ) : error ? (
          <Notice tone="error" text={error} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {providerCards.map((providerCard) => {
              const account = providerCard.account;
              const isConnected = account?.status === "connected";
              const providerKey = providerCard.provider.toUpperCase();

              return (
              <div id={providerCard.provider} key={providerCard.provider} className="panel-card rounded-[32px] p-5 scroll-mt-32">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-500">
                      {providerCard.eyebrow}
                    </p>
                    <p className="mt-3 text-lg font-black text-white">{providerCard.label}</p>
                  </div>
                  <StatusChip
                    label={
                      isConnected
                        ? "Ready"
                        : providerCard.provider === "telegram"
                          ? "Needs id"
                          : "Not linked"
                    }
                    tone={
                      isConnected
                        ? "positive"
                        : providerCard.provider === "telegram"
                          ? "warning"
                          : "default"
                    }
                  />
                </div>
                <p className={`mt-3 text-sm ${providerCard.accent}`}>
                  {account?.username ?? account?.providerUserId ?? `${providerCard.missionCount} provider-gated missions live`}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {providerCard.hint}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MiniStat label="Mission pressure" value={String(providerCard.missionCount)} />
                  <MiniStat
                    label="Last sync"
                    value={
                      account?.updatedAt
                        ? new Date(account.updatedAt).toLocaleDateString("nl-NL")
                        : "Not linked"
                    }
                  />
                </div>

                {providerCard.provider === "telegram" ? (
                  <div className="mt-6 space-y-3">
                    <input
                      className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-lime-300/50"
                      placeholder="Telegram numeric id"
                      value={telegramUserId}
                      onChange={(event) => setTelegramUserId(event.target.value)}
                    />
                    <input
                      className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-lime-300/50"
                      placeholder="@username (optional)"
                      value={telegramUsername}
                      onChange={(event) => setTelegramUsername(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => void handleTelegramSave()}
                      disabled={authLoading || activeProvider === "telegram"}
                      className="glass-button w-full rounded-full px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {activeProvider === "telegram" ? "Arming Telegram..." : providerCard.cta}
                    </button>
                    <p className="text-xs leading-6 text-slate-400">
                      Telegram membership checks use the numeric id that the community bot sees inside Telegram, not only the @username.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleProviderLink(providerCard.provider)}
                    disabled={authLoading || activeProvider === providerCard.provider}
                    className="glass-button mt-6 w-full rounded-full px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {activeProvider === providerCard.provider
                      ? `Routing ${providerKey}...`
                      : providerCard.cta}
                  </button>
                )}

                <Link
                  href={`/campaigns`}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 underline underline-offset-4"
                >
                  Explore mission lanes
                </Link>
              </div>
              );
            })}
          </div>
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
