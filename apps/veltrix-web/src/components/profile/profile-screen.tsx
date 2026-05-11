"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Copy,
  Flame,
  Gem,
  LockKeyhole,
  Medal,
  PackageCheck,
  ShieldCheck,
  Signal,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Wallet,
  Zap,
} from "lucide-react";
import { CommunityStatusPanel } from "@/components/community/community-status-panel";
import { ContributionTierBadge } from "@/components/ui/contribution-tier-badge";
import { FeatureBadgeMark } from "@/components/ui/feature-badge-mark";
import { ShardBadge } from "@/components/ui/shard-badge";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { XpValue, isXpDisplay } from "@/components/ui/xp-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { useCommunityJourney } from "@/hooks/use-community-journey";
import { useLiveUserData } from "@/hooks/use-live-user-data";
import { buildLootboxInventoryRead } from "@/lib/lootboxes/lootbox-inventory-read";
import { buildAchievementBadgesRead } from "@/lib/profile/achievement-badges";
import { buildReputationCardRead } from "@/lib/profile/reputation-card";
import { buildXpProgressionRead } from "@/lib/xp/xp-economy";
import { getProviderReplaceButtonLabel } from "@/lib/auth/identity-provider-replacement";
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
    error,
    campaigns,
    projectReputation,
    quests,
    xpStakes,
    rewardDistributions,
    inventory,
    shardBalance,
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
      "inventory",
    ],
  });
  const [telegramUserId, setTelegramUserId] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [activeProvider, setActiveProvider] = useState<ConnectedAccount["provider"] | null>(null);
  const [providerMessage, setProviderMessage] = useState<{
    tone: "default" | "error" | "success";
    text: string;
  } | null>(null);
  const linkedSyncHandledRef = useRef<string | null>(null);
  const [syncingLoadout, setSyncingLoadout] = useState(false);
  const effectiveConnectedAccounts = connectedAccounts;
  const loadoutSyncing = connectedAccountsState === "syncing" || syncingLoadout;
  const [walletCopied, setWalletCopied] = useState(false);
  const [profileCardCopied, setProfileCardCopied] = useState(false);
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
        cta: getProviderReplaceButtonLabel({
          provider: "discord",
          connected: providerMap.get("discord")?.status === "connected",
        }),
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
        cta: getProviderReplaceButtonLabel({
          provider: "x",
          connected: providerMap.get("x")?.status === "connected",
        }),
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
  const xpProgression = buildXpProgressionRead(profile?.xp ?? 0);
  const inventoryRead = useMemo(() => buildLootboxInventoryRead(inventory), [inventory]);
  const equippedCosmetic =
    inventoryRead.items.find((item) => item.utility.isEquippedCosmetic)?.utility.cosmeticLabel ??
    null;
  const activeSeasonAccess =
    inventoryRead.items.find((item) => item.utility.isActiveSeasonAccess)?.utility
      .seasonAccessBadgeLabel ?? null;
  const completedPlatformQuestCount = useMemo(
    () => quests.filter((quest) => quest.status === "approved" && quest.isPlatformQuest).length,
    [quests]
  );
  const completedDeFiQuestCount = useMemo(
    () =>
      quests.filter((quest) => {
        if (quest.status !== "approved") {
          return false;
        }

        const haystack = [
          quest.title,
          quest.description,
          quest.type,
          quest.questType,
          quest.platformQuestSlug,
          quest.verificationProvider,
          quest.actionUrl,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return /swap|defi|vault|wallet|onchain|pool|liquidity|stake/.test(haystack);
      }).length,
    [quests]
  );
  const openShardQuestCount = useMemo(
    () =>
      quests.filter(
        (quest) => quest.status !== "approved" && Math.max(0, quest.shardRewardAmount ?? 0) > 0
      ).length,
    [quests]
  );
  const trustedProjectCount = useMemo(
    () => projectReputation.filter((item) => item.trustScore >= 80).length,
    [projectReputation]
  );
  const reputationCard = useMemo(
    () =>
      buildReputationCardRead({
        profile,
        shardBalance,
        equippedCosmetic,
        activeSeasonAccess,
        connectedSystemCount: connectedCount,
    }),
    [activeSeasonAccess, connectedCount, equippedCosmetic, profile, shardBalance]
  );
  const achievementBadges = useMemo(
    () =>
      buildAchievementBadgesRead({
        level: profile?.level ?? 1,
        streak: profile?.streak ?? 0,
        questsCompleted: Math.max(
          profile?.questsCompleted ?? 0,
          quests.filter((quest) => quest.status === "approved").length
        ),
        raidsCompleted: profile?.raidsCompleted ?? 0,
        rewardsClaimed: profile?.rewardsClaimed ?? 0,
        shardBalance,
        walletConnected: Boolean(profile?.wallet),
        connectedSystemCount: connectedCount,
        projectCount: projectReputation.length,
        trustedProjectCount,
        completedPlatformQuestCount,
        completedDeFiQuestCount,
        openShardQuestCount,
        inventoryItems: inventoryRead.items,
      }),
    [
      completedDeFiQuestCount,
      completedPlatformQuestCount,
      connectedCount,
      inventoryRead.items,
      openShardQuestCount,
      profile?.level,
      profile?.questsCompleted,
      profile?.raidsCompleted,
      profile?.rewardsClaimed,
      profile?.streak,
      profile?.wallet,
      projectReputation.length,
      quests,
      shardBalance,
      trustedProjectCount,
    ]
  );

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
      text: `Routing ${provider.toUpperCase()} through the live identity link now. Choose the account you want VYNTRO to use on the provider screen.`,
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
    if (!linkedProvider || linkedSyncHandledRef.current === linkedProvider) {
      return;
    }
    const resolvedProvider = linkedProvider;
    linkedSyncHandledRef.current = resolvedProvider;

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
                ? `${resolvedProvider.toUpperCase()} is already linked to a different VYNTRO account, not this one.`
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
  }, [pathname, reload, router, searchParams, syncConnectedAccounts]);

  async function handleCopyWallet() {
    if (!profile?.wallet || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(profile.wallet);
    setWalletCopied(true);
    window.setTimeout(() => setWalletCopied(false), 1800);
  }

  async function handleCopyProfileCard() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    const profileUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/profile`
        : "/profile";
    await navigator.clipboard.writeText(`${reputationCard.shareText}\n${profileUrl}`);
    setProfileCardCopied(true);
    window.setTimeout(() => setProfileCardCopied(false), 1800);
  }

  return (
    <div className="space-y-5">
      {communitySnapshot.lane === "onboarding" ? (
        <div className="rounded-[20px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-3.5 text-[12px] text-cyan-100">
          Your onboarding path is using this profile as the live setup surface.{" "}
          <Link
            href={communitySnapshot.nextBestAction?.route ?? communitySnapshot.preferredRoute}
            className="font-semibold underline underline-offset-4"
          >
            {communitySnapshot.nextBestAction?.ctaLabel ?? "Open next onboarding move"}
          </Link>
        </div>
      ) : null}

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.25fr)_340px]">
        <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/12 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.18),transparent_26%),radial-gradient(circle_at_86%_10%,rgba(192,255,0,0.12),transparent_18%),linear-gradient(145deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:p-6">
          <FeatureBadgeMark
            badge="profile"
            className="absolute right-5 top-12 h-36 w-36 opacity-[0.24] mix-blend-screen sm:h-44 sm:w-44"
            imageClassName="rotate-[8deg]"
            sizes="176px"
          />
          <div className="flex flex-wrap items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300">
            <span>Member Profile</span>
            <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 tracking-[0.24em] text-cyan-100">
              Identity Hub
            </span>
          </div>

          <div className="mt-5 space-y-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_280px]">
              <div className="space-y-4">
                <IdentityBanner />

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-[18rem]">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100">
                        {profile?.title ?? "Operator"}
                      </span>
                      {equippedCosmetic ? (
                        <span className="rounded-full border border-violet-300/18 bg-violet-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-100">
                          {equippedCosmetic}
                        </span>
                      ) : null}
                      {activeSeasonAccess ? (
                        <span className="rounded-full border border-cyan-300/18 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100">
                          {activeSeasonAccess}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                        {connectedCount} linked systems
                      </span>
                    </div>
                    <h3 className="font-display mt-3 text-balance text-[1.22rem] font-black leading-[1] tracking-[0.02em] text-white sm:text-[1.5rem]">
                      {profile?.username ?? "Guest member"}
                    </h3>
                    <p className="mt-2 max-w-xl text-[12px] leading-5 text-slate-300">
                      Your profile ties live auth, provider readiness, signal pressure and project standing into one command-grade identity layer.
                    </p>
                  </div>

                  <StatusChip
                    label={authConfigured ? "Live session" : "Auth not armed"}
                    tone={authConfigured ? "positive" : "warning"}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <FeatureStat label="XP" value={String(profile?.xp ?? 0)} />
                  <FeatureStat label="Level" value={String(profile?.level ?? 1)} />
                  <FeatureStat label="Streak" value={String(profile?.streak ?? 0)} />
                  <FeatureStat label="Trust" value={String(profile?.trustScore ?? 50)} />
                </div>

                <div className="rounded-[18px] border border-lime-300/12 bg-lime-300/[0.055] p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-lime-300">
                        XP economy v1
                      </p>
                      <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-[14px] font-black text-white">
                        <span>{xpProgression.levelLabel} to</span>
                        <XpValue size="xs">{xpProgression.nextLevelXp.toLocaleString()} XP</XpValue>
                      </p>
                      <p className="mt-1.5 text-[11px] leading-5 text-slate-300">
                        Quests, raids, DeFi, streaks and anti-abuse now share one central XP logic.
                      </p>
                    </div>
                    <ContributionTierBadge tier={xpProgression.contributionTier} size="sm" />
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
                    <div
                      className="h-full rounded-full bg-lime-300"
                      style={{ width: `${xpProgression.progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-slate-400">
                    <XpValue size="xs">{xpProgression.totalXp.toLocaleString()} XP</XpValue>
                    <span>{xpProgression.progressPercent}% to next level</span>
                  </div>
                </div>

                <div className="rounded-[18px] border border-white/8 bg-white/[0.04] p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Wallet link
                      </p>
                      <p className="mt-2 text-[14px] font-black text-white">
                        {profile?.wallet
                          ? `${profile.wallet.slice(0, 6)}...${profile.wallet.slice(-4)}`
                          : "No wallet armed"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/profile/edit"
                        className="glass-button inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-[12px] font-semibold text-white transition hover:border-cyan-300/30"
                      >
                        <Wallet className="h-4 w-4" />
                        {profile?.wallet ? "Manage wallet" : "Connect wallet"}
                      </Link>
                      {profile?.wallet ? (
                        <button
                          type="button"
                          onClick={() => void handleCopyWallet()}
                          className="glass-button inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-[12px] font-semibold text-white transition hover:border-cyan-300/30"
                        >
                          <Copy className="h-4 w-4" />
                          {walletCopied ? "Copied" : "Copy address"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2.5 text-[12px] font-bold text-slate-950 transition hover:bg-cyan-200"
                  >
                    Update profile
                  </Link>
                  <Link
                    href="/notifications"
                    className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold text-white transition hover:border-cyan-300/30"
                  >
                    Open signal feed
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleRefreshLinks()}
                    disabled={authLoading || syncingLoadout}
                    className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold text-white transition hover:border-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {syncingLoadout ? "Syncing setup..." : "Refresh linked systems"}
                  </button>
                </div>
              </div>

              <div className="rounded-[18px] border border-white/10 bg-black/24 p-3.5">
                <p className="font-display text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                  Live readout
                </p>
                <div className="mt-3 space-y-2.5">
                  <SignalTile icon={Signal} label="Unread signals" value={String(unreadNotificationCount)} accent="text-cyan-200" />
                  <SignalTile icon={ShieldCheck} label="Connected systems" value={String(connectedCount)} accent="text-lime-200" />
                  <SignalTile icon={Trophy} label="Project standing" value={String(projectReputation.length)} accent="text-amber-200" />
                  <SignalTile icon={Zap} label="Recent events" value={String(notifications.length)} accent="text-white" />
                </div>
              </div>
            </div>

            <ReputationCardPreview
              read={reputationCard}
              avatarUrl={profile?.avatarUrl ?? ""}
              bannerUrl={profile?.bannerUrl ?? ""}
              copied={profileCardCopied}
              onCopy={() => void handleCopyProfileCard()}
            />

            <AchievementBadgesPanel read={achievementBadges} />

            <div className="grid gap-3 sm:grid-cols-3">
              <QuickRead label="Profile title" value={profile?.title ?? "Operator"} />
              <QuickRead
                label="Contribution tier"
                value={profile?.contributionTier ?? "explorer"}
                valueNode={<ContributionTierBadge tier={profile?.contributionTier ?? "explorer"} size="sm" />}
              />
              <QuickRead label="Unread now" value={String(unreadNotificationCount)} />
            </div>
          </div>
        </div>

        <div className="space-y-5">
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

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
            <div className="flex flex-wrap gap-2.5">
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
          <div className="grid gap-3 lg:grid-cols-3">
            {providerCards.map((providerCard) => {
              const account = providerCard.account;
              const isConnected = account?.status === "connected";
              const providerKey = providerCard.provider.toUpperCase();

              return (
              <div id={providerCard.provider} key={providerCard.provider} className="panel-card rounded-[22px] p-4 scroll-mt-32">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {providerCard.eyebrow}
                    </p>
                    <p className="mt-2 text-[14px] font-black text-white">{providerCard.label}</p>
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
                <p className={`mt-2 text-[12px] ${providerCard.accent}`}>
                  {account?.username ?? account?.providerUserId ?? `${providerCard.missionCount} provider-gated missions live`}
                </p>
                <p className="mt-3 text-[12px] leading-5 text-slate-300">
                  {providerCard.hint}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                  <div className="mt-5 space-y-2.5">
                    <input
                      className="w-full rounded-[16px] border border-white/10 bg-black/20 px-3.5 py-2.5 text-[12px] text-white outline-none transition focus:border-lime-300/50"
                      placeholder="Telegram numeric id"
                      value={telegramUserId}
                      onChange={(event) => setTelegramUserId(event.target.value)}
                    />
                    <input
                      className="w-full rounded-[16px] border border-white/10 bg-black/20 px-3.5 py-2.5 text-[12px] text-white outline-none transition focus:border-lime-300/50"
                      placeholder="@username (optional)"
                      value={telegramUsername}
                      onChange={(event) => setTelegramUsername(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => void handleTelegramSave()}
                      disabled={authLoading || activeProvider === "telegram"}
                      className="glass-button w-full rounded-full px-3.5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {activeProvider === "telegram" ? "Saving Telegram..." : providerCard.cta}
                    </button>
                    <p className="text-[11px] leading-5 text-slate-400">
                      Telegram membership checks use the numeric id that the community bot sees inside Telegram, not only the @username.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleProviderLink(providerCard.provider)}
                    disabled={authLoading || activeProvider === providerCard.provider}
                    className="glass-button mt-5 w-full rounded-full px-3.5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {activeProvider === providerCard.provider
                      ? `Routing ${providerKey}...`
                      : providerCard.cta}
                  </button>
                )}

                <Link
                  href={`/campaigns`}
                  className="mt-2.5 inline-flex items-center gap-2 text-[12px] font-semibold text-cyan-100 underline underline-offset-4"
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
          <div className="grid gap-3 xl:grid-cols-2">
            {projectReputation.map((item) => (
              <div key={item.projectId} className="panel-card relative overflow-hidden rounded-[22px] p-4">
                <FeatureBadgeMark
                  badge="reputation"
                  className="absolute -right-2 top-8 h-20 w-20 opacity-[0.22] mix-blend-screen"
                  imageClassName="rotate-[10deg]"
                  sizes="96px"
                />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-semibold text-cyan-200">{item.projectName}</p>
                    <div className="mt-2">
                      <ContributionTierBadge tier={item.contributionTier} size="md" />
                    </div>
                  </div>
                  <StatusChip label={item.rank > 0 ? `#${item.rank}` : "Unranked"} tone={item.rank > 0 ? "positive" : "default"} />
                </div>
                <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-2">
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
        <div className="grid gap-3 md:grid-cols-4">
          <FeatureStat label="Claimable lanes" value={String(claimableDistributionCount)} />
          <FeatureStat
            label="Claimable total"
            value={Number(totalClaimableAmount.toFixed(2)).toString()}
          />
          <FeatureStat label="Active stakes" value={String(activeStakeCount)} />
          <FeatureStat label="Staked XP" value={String(totalStakedXp)} />
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="relative space-y-2.5 overflow-hidden rounded-[20px] border border-white/10 bg-black/20 p-3.5">
            <FeatureBadgeMark
              badge="staking"
              className="absolute right-2 top-8 h-20 w-20 opacity-[0.2] mix-blend-screen"
              imageClassName="rotate-[10deg]"
              sizes="96px"
            />
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Claimable distributions
            </p>
            {claimableDistributionRows.length > 0 ? (
              claimableDistributionRows.map((distribution) => (
                <div
                  key={distribution.id}
                  className="metric-card rounded-[16px] px-3.5 py-2.5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[12px] font-bold text-white">{distribution.campaignTitle}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                        {distribution.rewardAsset}
                      </p>
                    </div>
                      <p className="text-[12px] font-black text-lime-200">
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
                className="glass-button inline-flex rounded-full px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Open payout queue
              </Link>
            </div>
          </div>

          <div className="space-y-2.5 rounded-[20px] border border-white/10 bg-black/20 p-3.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Stake posture
            </p>
            {xpStakes.length > 0 ? (
              xpStakes.slice(0, 4).map((stake) => {
                const linkedCampaign = campaigns.find((campaign) => campaign.id === stake.campaignId);

                return (
                  <div key={stake.id} className="metric-card rounded-[16px] px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[12px] font-bold text-white">
                          {linkedCampaign?.title ?? "Campaign"}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                          {stake.state} stake
                        </p>
                      </div>
                        <p className="text-[12px] font-black text-cyan-200">
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
      className="relative overflow-hidden rounded-[18px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.22),transparent_34%),linear-gradient(145deg,rgba(8,20,28,0.96),rgba(4,9,13,0.94))] p-3.5"
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
      <div className="absolute right-3.5 top-3.5 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-cyan-300/16 bg-cyan-300/10 text-cyan-200">
        <ProfileIdentityAvatar />
      </div>
      <p className="relative z-10 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-200">
        Member Profile
      </p>
      <p className="relative z-10 mt-2 max-w-[16rem] text-[11px] leading-5 text-slate-300">
        Identity, connected systems and reputation converge here before you jump back into the product.
      </p>
    </div>
  );
}

function ProfileIdentityAvatar() {
  const { profile } = useAuth();

  if (profile?.avatarUrl) {
    return (
      <Image
        src={profile.avatarUrl}
        alt="Member avatar"
        fill
        unoptimized
        sizes="44px"
        className="object-cover"
      />
    );
  }

  return <UserRound className="h-8 w-8" />;
}

type ReputationCardRead = ReturnType<typeof buildReputationCardRead>;
type AchievementBadgesRead = ReturnType<typeof buildAchievementBadgesRead>;

function ReputationCardPreview({
  read,
  avatarUrl,
  bannerUrl,
  copied,
  onCopy,
}: {
  read: ReputationCardRead;
  avatarUrl: string;
  bannerUrl: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-violet-300/16 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_84%_14%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(145deg,rgba(10,13,22,0.98),rgba(5,7,13,0.99))] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.3)]">
      {bannerUrl ? (
        <>
          <Image
            src={bannerUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 760px, 92vw"
            className="absolute inset-0 h-full w-full object-cover opacity-22 saturate-125"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,13,0.4),rgba(5,7,13,0.96))]" />
        </>
      ) : null}
      <FeatureBadgeMark
        badge="reputation"
        className="absolute -right-4 top-7 h-36 w-36 opacity-[0.2] mix-blend-screen"
        imageClassName="rotate-[10deg]"
        sizes="160px"
      />

      <div className="relative z-10 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-6 w-6" />
              )}
            </span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-200">
                Public reputation card
              </p>
              <p className="mt-1 text-[1rem] font-black text-white">{read.username}</p>
            </div>
          </div>

          <h2 className="mt-4 max-w-2xl text-[1.65rem] font-black leading-none tracking-[-0.055em] text-white sm:text-[2.25rem]">
            {read.title}
          </h2>
          <p className="mt-3 max-w-2xl text-[12px] leading-5 text-slate-300">{read.headline}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusChip label={read.rankLabel} tone={read.rankLabel === "Unranked" ? "default" : "positive"} />
            <StatusChip label={read.levelLabel} tone="info" />
            <ShardBadge value={read.shardLabel.replace(" shards", "")} size="sm" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {read.badges.map((badge) => (
              <span
                key={`${badge.label}-${badge.detail}`}
                className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${getReputationBadgeTone(badge.tone)}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            {read.stats.slice(0, 6).map((stat) => (
              <MiniStat key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-violet-300 px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-black transition hover:bg-violet-200"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied card" : "Copy profile card"}
          </button>
        </div>
      </div>
    </section>
  );
}

function AchievementBadgesPanel({ read }: { read: AchievementBadgesRead }) {
  const featured = read.featuredBadge ?? read.nextBadge;

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_12%_0%,rgba(132,204,22,0.13),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(251,191,36,0.14),transparent_28%),linear-gradient(145deg,rgba(8,12,20,0.96),rgba(4,6,12,0.99))] p-4">
      <FeatureBadgeMark
        badge="reward"
        className="absolute -right-3 top-8 h-28 w-28 opacity-[0.16] mix-blend-screen"
        imageClassName="rotate-[9deg]"
        sizes="128px"
      />

      <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/18 bg-amber-300/[0.08] text-amber-100">
              <Award className="h-4 w-4" />
            </span>
            <div>
              <p className="font-display text-[9px] font-black uppercase tracking-[0.18em] text-amber-200">
                Achievement Badges
              </p>
              <h2 className="mt-1 text-[1.1rem] font-black text-white">
                {read.unlockedCount}/{read.totalCount} badges unlocked
              </h2>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-[12px] leading-5 text-slate-300">
            {featured
              ? `${featured.label}: ${featured.description}`
              : "Badges will light up as soon as your first live actions land."}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[360px]">
          <MiniStat label="Completion" value={`${read.completionPercent}%`} />
          <MiniStat label="Unlocked" value={String(read.unlockedCount)} />
          <MiniStat label="Next" value={read.nextBadge?.label ?? "Complete"} />
        </div>
      </div>

      <div className="relative z-10 mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {read.badges.map((badge) => (
          <div
            key={badge.id}
            className={`rounded-[18px] border p-3.5 ${getAchievementBadgeTone(badge.tone, badge.status)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/25">
                  <AchievementBadgeIcon id={badge.id} />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-black text-white">{badge.label}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-300">{badge.description}</p>
                </div>
              </div>
              {badge.status === "unlocked" ? (
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-lime-200" />
              ) : (
                <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
              )}
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">
                <span>{badge.status === "unlocked" ? "Unlocked" : "Progress"}</span>
                <span>
                  {Math.min(badge.current, badge.target)}/{badge.target}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className={`h-full rounded-full ${getAchievementProgressTone(badge.tone)}`}
                  style={{ width: `${badge.progress}%` }}
                />
              </div>
            </div>

            <Link
              href={badge.route}
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-full border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.13em] text-white transition hover:border-cyan-300/35 hover:bg-white/[0.07]"
            >
              {badge.status === "unlocked" ? "View badge" : badge.ctaLabel}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function AchievementBadgeIcon({ id }: { id: string }) {
  if (id === "streak-builder") return <Flame className="h-4 w-4 text-lime-100" />;
  if (id === "shard-hunter") return <Gem className="h-4 w-4 text-amber-100" />;
  if (id === "defi-explorer") return <Zap className="h-4 w-4 text-violet-100" />;
  if (id === "raid-confirmed") return <ShieldCheck className="h-4 w-4 text-rose-100" />;
  if (id === "vault-collector") return <PackageCheck className="h-4 w-4 text-amber-100" />;
  if (id === "profile-flex") return <Sparkles className="h-4 w-4 text-violet-100" />;
  if (id === "trusted-contributor") return <BadgeCheck className="h-4 w-4 text-lime-100" />;
  if (id === "early-member") return <Star className="h-4 w-4 text-cyan-100" />;
  if (id === "season-pass") return <Medal className="h-4 w-4 text-rose-100" />;
  if (id === "mythic-signal") return <Trophy className="h-4 w-4 text-violet-100" />;
  if (id === "reward-claimer") return <Award className="h-4 w-4 text-amber-100" />;
  return <CheckCircle2 className="h-4 w-4 text-cyan-100" />;
}

function getAchievementBadgeTone(tone: "cyan" | "lime" | "amber" | "violet" | "rose", status: "unlocked" | "locked") {
  const opacity = status === "unlocked" ? "" : " opacity-70";

  if (tone === "lime") return `border-lime-300/16 bg-lime-300/[0.055]${opacity}`;
  if (tone === "amber") return `border-amber-300/16 bg-amber-300/[0.055]${opacity}`;
  if (tone === "violet") return `border-violet-300/16 bg-violet-300/[0.055]${opacity}`;
  if (tone === "rose") return `border-rose-300/16 bg-rose-300/[0.055]${opacity}`;
  return `border-cyan-300/16 bg-cyan-300/[0.055]${opacity}`;
}

function getAchievementProgressTone(tone: "cyan" | "lime" | "amber" | "violet" | "rose") {
  if (tone === "lime") return "bg-lime-300";
  if (tone === "amber") return "bg-amber-300";
  if (tone === "violet") return "bg-violet-300";
  if (tone === "rose") return "bg-rose-300";
  return "bg-cyan-300";
}

function getReputationBadgeTone(tone: "cyan" | "lime" | "amber" | "violet") {
  if (tone === "lime") return "border-lime-300/18 bg-lime-300/[0.08] text-lime-100";
  if (tone === "amber") return "border-amber-300/18 bg-amber-300/[0.08] text-amber-100";
  if (tone === "violet") return "border-violet-300/18 bg-violet-300/[0.08] text-violet-100";
  return "border-cyan-300/18 bg-cyan-300/[0.08] text-cyan-100";
}

function FeatureStat({ label, value }: { label: string; value: string }) {
  const hasXpBadge = isXpDisplay(label, value);

  return (
    <div className="metric-card rounded-[16px] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-1.5">
        {hasXpBadge ? <XpValue size="sm">{value}</XpValue> : <p className="text-[13px] font-semibold text-white">{value}</p>}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  const hasXpBadge = isXpDisplay(label, value);

  return (
    <div className="metric-card rounded-[14px] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-1">
        {hasXpBadge ? <XpValue size="xs">{value}</XpValue> : <p className="text-[11px] font-semibold text-white">{value}</p>}
      </div>
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
    <div className="metric-card rounded-[16px] px-3 py-2.5">
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
      <p className={`mt-1.5 text-[13px] font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function QuickRead({
  label,
  value,
  valueNode,
}: {
  label: string;
  value: string;
  valueNode?: ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-white/[0.04] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-1.5">
        {valueNode ?? <p className="text-[12px] font-semibold text-white">{value}</p>}
      </div>
    </div>
  );
}

function ReadTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-200/85">{label}</p>
      <p className="mt-1.5 text-[11px] leading-5 text-slate-200">{value}</p>
    </div>
  );
}

function InfoPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="metric-card rounded-[16px] p-3">
      <p className="text-[12px] font-semibold text-white">{title}</p>
      <p className="mt-1.5 text-[11px] leading-5 text-slate-300">{text}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
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
