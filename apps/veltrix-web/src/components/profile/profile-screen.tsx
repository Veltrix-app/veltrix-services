"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Copy, ShieldCheck, Signal, Trophy, UserRound, Wallet, Zap } from "lucide-react";
import { CommunityStatusPanel } from "@/components/community/community-status-panel";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuth } from "@/components/providers/auth-provider";
import { useCommunityJourney } from "@/hooks/use-community-journey";
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
    connectedAccounts,
    connectedAccountsState,
    linkProvider,
    saveTelegramIdentity,
    syncConnectedAccounts,
  } = useAuth();
  const {
    notifications,
    unreadNotificationCount,
    loading,
    error,
    campaigns,
    projectReputation,
    quests,
    xpStakes,
    rewardDistributions,
    claimableDistributionCount,
    reload,
  } = useLiveUserData({
    datasets: [
      "notifications",
      "campaigns",
      "projectReputation",
      "quests",
      "xpStakes",
      "rewardDistributions",
    ],
  });
  const [telegramUserId, setTelegramUserId] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [activeProvider, setActiveProvider] = useState<ConnectedAccount["provider"] | null>(null);
  const [providerMessage, setProviderMessage] = useState<{
    tone: "default" | "error" | "success";
    text: string;
  } | null>(null);
  const [linkedSyncHandled, setLinkedSyncHandled] = useState<string | null>(null);
  const [syncingLoadout, setSyncingLoadout] = useState(false);
  const effectiveConnectedAccounts = connectedAccounts;
  const loadoutSyncing = connectedAccountsState === "syncing" || syncingLoadout;
  const [walletCopied, setWalletCopied] = useState(false);
  const {
    snapshot: communitySnapshot,
    loading: communityLoading,
    refreshing: communityRefreshing,
    error: communityError,
    advance: advanceCommunityJourney,
  } = useCommunityJourney();

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

  const activeStakeCount = useMemo(
    () => xpStakes.filter((stake) => stake.state !== "completed" && stake.state !== "slashed").length,
    [xpStakes]
  );

  const totalStakedXp = useMemo(
    () =>
      xpStakes.reduce((sum, stake) => sum + Number(stake.stakedXp ?? 0), 0),
    [xpStakes]
  );

  const claimableDistributions = useMemo(
    () => rewardDistributions.filter((distribution) => distribution.status === "claimable"),
    [rewardDistributions]
  );

  const totalClaimableAmount = useMemo(
    () =>
      claimableDistributions.reduce(
        (sum, distribution) => sum + Number(distribution.rewardAmount ?? 0),
        0
      ),
    [claimableDistributions]
  );

  const claimableDistributionRows = useMemo(() => {
    return claimableDistributions.slice(0, 4).map((distribution) => {
      const linkedCampaign = campaigns.find((campaign) => campaign.id === distribution.campaignId);

      return {
        id: distribution.id,
        campaignTitle: linkedCampaign?.title ?? "Campaign",
        rewardAsset: distribution.rewardAsset,
        rewardAmount: Number(distribution.rewardAmount.toFixed(4)),
      };
    });
  }, [campaigns, claimableDistributions]);

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
        eyebrow: "Bot connection",
        hint: "Telegram verification needs your numeric Telegram id because group membership checks resolve against the bot.",
        accent: "text-lime-200",
        cta:
          providerMap.get("telegram")?.status === "connected"
            ? "Update Telegram id"
            : "Add Telegram id",
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
  const providerWithPressure = providerCards.find(
    (providerCard) =>
      providerCard.missionCount > 0 && providerCard.account?.status !== "connected"
  );
  const nextIdentityMove = !profile?.wallet
    ? "Connect and verify a wallet so rewards and identity trust can resolve against a live address."
    : providerWithPressure
      ? `Link ${providerWithPressure.label} next because ${providerWithPressure.missionCount} provider-gated missions are waiting on it.`
      : communitySnapshot.nextBestAction?.description ??
        "Refresh your linked systems and keep your profile ready for the next live wave.";
  const watchIdentityCue =
    claimableDistributionCount > 0
      ? `${claimableDistributionCount} claimable payout lanes are waiting inside your reward vault.`
      : activeStakeCount > 0
        ? `${activeStakeCount} active AESP stake lanes are still live and worth monitoring.`
        : `${unreadNotificationCount} unread signals are still competing for your attention.`;

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
        text: result.error ?? "Could not save your Telegram identity yet.",
      });
      setActiveProvider(null);
      return;
    }

    void reload();
    setProviderMessage({
      tone: "success",
      text: "Telegram id saved. Telegram join missions can now verify against this identity.",
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

    void reload();
    setProviderMessage({
      tone: "success",
      text:
        (result.identities ?? 0) > 0
          ? "Linked systems refreshed against the live identity graph."
          : "No new OAuth identities were found for this session.",
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
            ? `${resolvedProvider.toUpperCase()} was already present in auth. Syncing it into your live setup now...`
            : `Finalizing ${resolvedProvider.toUpperCase()} inside your live setup...`,
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
                ? `${resolvedProvider.toUpperCase()} is already linked to a different Veltrix account, not this one.`
                : `No ${resolvedProvider.toUpperCase()} identity was found on this account after the return flow.`,
          });
          setSyncingLoadout(false);
          router.replace(pathname, { scroll: false });
        }
        return;
      }

      void reload();

      if (!cancelled) {
        setProviderMessage({
          tone: "success",
          text:
            errorCode === "identity_already_exists"
              ? `${resolvedProvider.toUpperCase()} was already linked and is now synced into your identity setup.`
              : `${resolvedProvider.toUpperCase()} is now connected inside your identity setup.`,
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

  useEffect(() => {
    if (!linkedSyncHandled || syncingLoadout) {
      return;
    }

    const resolvedAccount = effectiveConnectedAccounts.find(
      (account) =>
        account.provider === linkedSyncHandled &&
        account.status === "connected"
    );

    if (!resolvedAccount) {
      return;
    }

    setProviderMessage({
      tone: "success",
      text: `${linkedSyncHandled.toUpperCase()} is connected and ready for provider-gated missions.`,
    });
  }, [effectiveConnectedAccounts, linkedSyncHandled, syncingLoadout]);

  async function handleCopyWallet() {
    if (!profile?.wallet || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(profile.wallet);
    setWalletCopied(true);
    window.setTimeout(() => setWalletCopied(false), 1800);
  }

  return (
    <div className="space-y-6">
      {communitySnapshot.lane === "onboarding" ? (
        <div className="rounded-[28px] border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm text-cyan-100">
          Your onboarding path is using this profile as the live setup surface.{" "}
          <Link
            href={communitySnapshot.nextBestAction?.route ?? communitySnapshot.preferredRoute}
            className="font-semibold underline underline-offset-4"
          >
            {communitySnapshot.nextBestAction?.ctaLabel ?? "Open next onboarding move"}
          </Link>
        </div>
      ) : null}

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_380px]">
        <div className="overflow-hidden rounded-[38px] border border-cyan-300/12 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.18),transparent_26%),radial-gradient(circle_at_86%_10%,rgba(192,255,0,0.12),transparent_18%),linear-gradient(145deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            <span>Member Profile</span>
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
                      {profile?.username ?? "Guest member"}
                    </h3>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                      Your profile ties live auth, provider readiness, signal pressure and project standing into one command-grade identity layer.
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

                <div className="rounded-[26px] border border-white/8 bg-white/[0.04] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Wallet link
                      </p>
                      <p className="mt-3 text-lg font-black text-white">
                        {profile?.wallet
                          ? `${profile.wallet.slice(0, 6)}...${profile.wallet.slice(-4)}`
                          : "No wallet armed"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/profile/edit"
                        className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30"
                      >
                        <Wallet className="h-4 w-4" />
                        {profile?.wallet ? "Manage wallet" : "Connect wallet"}
                      </Link>
                      {profile?.wallet ? (
                        <button
                          type="button"
                          onClick={() => void handleCopyWallet()}
                          className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30"
                        >
                          <Copy className="h-4 w-4" />
                          {walletCopied ? "Copied" : "Copy address"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                  >
                    Update profile
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
                    {syncingLoadout ? "Syncing setup..." : "Refresh linked systems"}
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/24 p-4">
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
                  Live readout
                </p>
                <div className="mt-4 space-y-3">
                  <SignalTile icon={Signal} label="Unread signals" value={String(unreadNotificationCount)} accent="text-cyan-200" />
                  <SignalTile icon={ShieldCheck} label="Connected systems" value={String(connectedCount)} accent="text-lime-200" />
                  <SignalTile icon={Trophy} label="Project standing" value={String(projectReputation.length)} accent="text-amber-200" />
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
            eyebrow="Command read"
            title="Read your identity pressure first"
            description="Start with your live profile state, the next setup move, and the one cue that is most likely to change your standing."
            className="bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]"
          >
            <div className="grid gap-3">
              <ReadTile
                label="Now"
                value={`${profile?.username ?? "Guest member"} is running at level ${profile?.level ?? 1} with ${connectedCount} linked systems and ${unreadNotificationCount} unread live signals.`}
              />
              <ReadTile label="Next" value={nextIdentityMove} />
              <ReadTile label="Watch" value={watchIdentityCue} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoPanel
                title="Current journey posture"
                text={communitySnapshot.readinessLabel}
              />
              <InfoPanel
                title="Mission pressure"
                text={`${providerMissionPressure.discord + providerMissionPressure.telegram + providerMissionPressure.x} missions currently depend on linked provider state.`}
              />
              <InfoPanel
                title="Auth foundation"
                text={
                  authConfigured
                    ? "Your account auth is armed, so linked providers resolve from live identity data instead of fake toggles."
                    : "Publishable Supabase auth envs are still missing, so live account reads are not fully armed yet."
                }
              />
              <InfoPanel
                title="Provider source"
                text="Verification readiness resolves from linked identities and user_connected_accounts, not demo switches."
              />
            </div>
          </Surface>

          <Surface
            eyebrow="Quick Links"
            title="Next surfaces"
            description="Fast jumps into the rest of the live member experience."
          >
            <div className="flex flex-wrap gap-3">
              <QuickLink href="/community" label="Community home" />
              <QuickLink href="/notifications" label="Signal center" />
              <QuickLink href="/raids" label="Raid board" />
              <QuickLink href="/leaderboard" label="Leaderboard" />
              <QuickLink href="/projects" label="Project browser" />
            </div>
          </Surface>
        </div>
      </section>

      <Surface
        eyebrow="Connected Accounts"
        title="Provider setup"
        description="Link the systems that power mission verification before you move deeper into the journey."
      >
        {providerMessage ? (
          <Notice tone={providerMessage.tone === "error" ? "error" : "default"} text={providerMessage.text} />
        ) : null}

        {error ? (
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
                        : loadoutSyncing
                          ? "Syncing"
                        : providerCard.provider === "telegram"
                          ? "Needs id"
                          : "Not linked"
                    }
                    tone={
                      isConnected
                        ? "positive"
                        : loadoutSyncing
                          ? "info"
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
                          : loadoutSyncing
                            ? "Syncing..."
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
                      {activeProvider === "telegram" ? "Saving Telegram..." : providerCard.cta}
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
                  Explore missions
                </Link>
              </div>
              );
            })}
          </div>
        )}
      </Surface>

      <Surface
        eyebrow="Community Journey"
        title="Member journey"
        description="Your personal onboarding, comeback state and recognition now live as a first-class webapp surface."
      >
        <CommunityStatusPanel
          snapshot={communitySnapshot}
          loading={communityLoading}
          refreshing={communityRefreshing}
          error={communityError}
          onAdvance={advanceCommunityJourney}
          mode="compact"
          actionLimit={2}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <QuickLink href="/community" label="Open Community Home" />
          <QuickLink href="/community/onboarding" label="Onboarding path" />
          <QuickLink href="/community/comeback" label="Comeback path" />
        </div>
      </Surface>

      <Surface
        eyebrow="Project Standing"
        title="Project reputation"
        description="This is where your standing actually compounds across the projects you join."
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
          <Notice tone="default" text="No project-specific reputation yet. Start clearing quests and raids to build standing inside each project." />
        )}
      </Surface>

      <Surface
        eyebrow="AESP Balance"
        title="Claimable pool and active stakes"
        description="This is the first live readout of what your AESP balance is building across campaign stake pressure and finalized distributions."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <FeatureStat label="Claimable lanes" value={String(claimableDistributionCount)} />
          <FeatureStat
            label="Claimable total"
            value={Number(totalClaimableAmount.toFixed(2)).toString()}
          />
          <FeatureStat label="Active stakes" value={String(activeStakeCount)} />
          <FeatureStat label="Staked XP" value={String(totalStakedXp)} />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3 rounded-[28px] border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Claimable distributions
            </p>
            {claimableDistributionRows.length > 0 ? (
              claimableDistributionRows.map((distribution) => (
                <div
                  key={distribution.id}
                  className="metric-card rounded-[20px] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-white">{distribution.campaignTitle}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {distribution.rewardAsset}
                      </p>
                    </div>
                    <p className="text-sm font-black text-lime-200">
                      {distribution.rewardAmount}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <Notice
                tone="default"
                text="No claimable campaign pool distributions have landed for this account yet."
              />
            )}
            <div className="pt-2">
              <Link
                href="/rewards"
                className="glass-button inline-flex rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Open payout queue
              </Link>
            </div>
          </div>

          <div className="space-y-3 rounded-[28px] border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Stake posture
            </p>
            {xpStakes.length > 0 ? (
              xpStakes.slice(0, 4).map((stake) => {
                const linkedCampaign = campaigns.find((campaign) => campaign.id === stake.campaignId);

                return (
                  <div key={stake.id} className="metric-card rounded-[20px] px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-white">
                          {linkedCampaign?.title ?? "Campaign"}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                          {stake.state} stake
                        </p>
                      </div>
                      <p className="text-sm font-black text-cyan-200">
                        {Number(stake.stakedXp.toFixed(2))}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <Notice
                tone="default"
                text="No live AESP stakes are active for this account yet."
              />
            )}
          </div>
        </div>
      </Surface>
    </div>
  );
}

function IdentityBanner() {
  const { profile } = useAuth();

  return (
    <div
      className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.22),transparent_34%),linear-gradient(145deg,rgba(8,20,28,0.96),rgba(4,9,13,0.94))] p-6"
      style={
        profile?.bannerUrl
          ? {
              backgroundImage: `linear-gradient(180deg,rgba(3,8,12,0.28),rgba(3,8,12,0.78)), url(${profile.bannerUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="absolute right-4 top-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-cyan-300/16 bg-cyan-300/10 text-cyan-200">
        <ProfileIdentityAvatar />
      </div>
      <p className="font-display relative z-10 text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-200">
        Member Profile
      </p>
      <p className="relative z-10 mt-3 max-w-[18rem] text-sm leading-7 text-slate-300">
        Identity, connected systems and reputation converge here before you jump back into the product.
      </p>
    </div>
  );
}

function ProfileIdentityAvatar() {
  const { profile } = useAuth();

  if (profile?.avatarUrl) {
    return (
      <img
        src={profile.avatarUrl}
        alt="Member avatar"
        className="h-full w-full object-cover"
      />
    );
  }

  return <UserRound className="h-8 w-8" />;
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

function ReadTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200/85">{label}</p>
      <p className="mt-3 text-sm leading-7 text-slate-200">{value}</p>
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
