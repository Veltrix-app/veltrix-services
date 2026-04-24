"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ArtworkImage } from "@/components/ui/artwork-image";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuth } from "@/components/providers/auth-provider";
import { useLiveUserData } from "@/hooks/use-live-user-data";

function getStatusTone(status: string) {
  if (status === "approved") return "positive";
  if (status === "pending") return "warning";
  if (status === "rejected") return "danger";
  return "info";
}

function getProofGuidance(params: {
  proofRequired: boolean;
  proofType: string;
  verificationType: string;
  verificationProvider: string | null;
  completionMode: string | null;
  questType: string;
}) {
  const {
    proofRequired,
    proofType,
    verificationType,
    verificationProvider,
    completionMode,
    questType,
  } = params;

  if (
    questType === "social_follow" &&
    verificationProvider === "x" &&
    completionMode === "integration_auto"
  ) {
    return "Link your X account, follow the project profile and let Veltrix wait for follow confirmation instead of asking for manual proof.";
  }

  if (
    questType === "telegram_join" &&
    verificationProvider === "telegram" &&
    completionMode === "integration_auto"
  ) {
    return "Link your Telegram account, join the group and let Veltrix wait for membership confirmation instead of asking for manual proof.";
  }

  if (
    questType === "discord_join" &&
    verificationProvider === "discord" &&
    completionMode === "integration_auto"
  ) {
    return "Link your Discord account, join the server and let Veltrix wait for membership confirmation instead of asking for manual proof.";
  }

  if (
    questType === "url_visit" &&
    verificationProvider === "website" &&
    completionMode === "integration_auto"
  ) {
    return "Open the tracked destination and Veltrix will complete this mission automatically after the website visit is confirmed.";
  }

  if (!proofRequired || proofType === "none") {
    return "No manual proof is required here. Complete the action and transmit once the move is finished.";
  }

  if (proofType === "url") {
    return "Paste the direct URL that proves you completed the action.";
  }

  if (proofType === "tx_hash") {
    return "Paste the onchain transaction hash so Veltrix can verify the action cleanly.";
  }

  if (proofType === "wallet") {
    return "Use your connected wallet context or paste the relevant wallet address if requested.";
  }

  if (proofType === "image") {
    return "Paste a clear screenshot note or image proof reference that a reviewer can understand quickly.";
  }

  if (questType === "referral" || verificationType === "hybrid") {
    return "This mission mixes automation and review, so be as explicit as possible in your proof.";
  }

  return "Add the clearest proof you can so review is fast and predictable.";
}

function getStringConfigValue(
  config: Record<string, unknown> | null | undefined,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = config?.[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

function isPlaceholderUrl(value: string) {
  return value.includes("...");
}

async function updateQuestStatus(
  authUserId: string,
  questId: string,
  nextStatus: "pending" | "approved"
) {
  const supabase = createSupabaseBrowserClient();
  const { data: existing } = await supabase
    .from("user_progress")
    .select(
      "joined_communities, confirmed_raids, claimed_rewards, opened_lootbox_ids, unlocked_reward_ids, quest_statuses"
    )
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  const questStatuses =
    existing?.quest_statuses && typeof existing.quest_statuses === "object"
      ? (existing.quest_statuses as Record<string, string>)
      : {};

  const { error } = await supabase.from("user_progress").upsert({
    auth_user_id: authUserId,
    joined_communities: existing?.joined_communities ?? [],
    confirmed_raids: existing?.confirmed_raids ?? [],
    claimed_rewards: existing?.claimed_rewards ?? [],
    opened_lootbox_ids: existing?.opened_lootbox_ids ?? [],
    unlocked_reward_ids: existing?.unlocked_reward_ids ?? [],
    quest_statuses: {
      ...questStatuses,
      [questId]: nextStatus,
    },
  });

  if (error) {
    throw error;
  }
}

async function createQuestSubmission(params: {
  authUserId: string;
  questId: string;
  proofText: string;
  status: "pending" | "approved";
}) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("quest_submissions").insert({
    auth_user_id: params.authUserId,
    quest_id: params.questId,
    proof_text: params.proofText,
    status: params.status,
  });

  if (error) {
    throw error;
  }
}

export function QuestDetailScreen() {
  const params = useParams<{ id: string }>();
  const questId = Array.isArray(params.id) ? params.id[0] : params.id;
  const {
    session,
    authUserId,
    profile,
    connectedAccounts,
    connectedAccountsState,
    reloadProfile,
  } = useQuestAuth();
  const { loading, error, quests, campaigns, rewards, projects, reload } = useLiveUserData({
    datasets: ["quests", "campaigns", "rewards", "projects"],
  });
  const [proof, setProof] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "default" | "error" | "success"; text: string } | null>(
    null
  );
  const returnRecheckCleanupRef = useRef<(() => void) | null>(null);

  const quest = quests.find((item) => item.id === questId);
  const linkedCampaign = campaigns.find((item) => item.id === quest?.campaignId);
  const linkedProject = projects.find((item) => item.id === (quest?.projectId ?? linkedCampaign?.projectId));
  const linkedRewards = rewards.filter((item) => item.campaignId === quest?.campaignId).slice(0, 3);
  const heroVisual = linkedCampaign?.bannerUrl ?? linkedCampaign?.thumbnailUrl ?? linkedProject?.bannerUrl ?? null;
  const verificationConfig =
    quest?.verificationConfig && typeof quest.verificationConfig === "object"
      ? quest.verificationConfig
      : null;
  const inferredVerificationProvider =
    !quest
      ? null
      : quest.questType === "telegram_join"
        ? "telegram"
        : quest.questType === "discord_join"
          ? "discord"
          : quest.questType === "social_follow"
            ? "x"
            : quest.questType === "url_visit"
              ? "website"
              : quest.verificationProvider
                ? quest.verificationProvider
                : quest.verificationType === "bot_check" &&
                    typeof verificationConfig?.groupUrl === "string" &&
                    verificationConfig.groupUrl.trim().length > 0
                  ? "telegram"
                  : quest.verificationType === "bot_check" &&
                      typeof verificationConfig?.inviteUrl === "string" &&
                      verificationConfig.inviteUrl.trim().length > 0
                    ? "discord"
                    : quest.verificationType === "api_check" &&
                        ((typeof verificationConfig?.profileUrl === "string" &&
                          verificationConfig.profileUrl.trim().length > 0) ||
                          (typeof verificationConfig?.handle === "string" &&
                            verificationConfig.handle.trim().length > 0))
                      ? "x"
                      : quest.verificationType === "event_check" &&
                          ((typeof verificationConfig?.targetUrl === "string" &&
                            verificationConfig.targetUrl.trim().length > 0) ||
                            typeof quest.actionUrl === "string")
                        ? "website"
                        : null;

  const usesWebsiteVerification =
    Boolean(
      quest &&
        inferredVerificationProvider === "website" &&
        (quest.completionMode === "integration_auto" || quest.verificationType === "event_check")
    );
  const usesDiscordVerification =
    Boolean(
      quest &&
        inferredVerificationProvider === "discord" &&
        (quest.completionMode === "integration_auto" || quest.verificationType === "bot_check") &&
        ((typeof verificationConfig?.inviteUrl === "string" &&
          verificationConfig.inviteUrl.trim().length > 0) ||
          quest.questType === "discord_join" ||
          Boolean(linkedProject?.discordUrl))
    );
  const usesTelegramVerification =
    Boolean(
      quest &&
        inferredVerificationProvider === "telegram" &&
        (quest.completionMode === "integration_auto" || quest.verificationType === "bot_check") &&
        ((typeof verificationConfig?.groupUrl === "string" &&
          verificationConfig.groupUrl.trim().length > 0) ||
          quest.questType === "telegram_join" ||
          Boolean(linkedProject?.telegramUrl))
    );
  const usesXVerification =
    Boolean(
      quest &&
        inferredVerificationProvider === "x" &&
        (quest.completionMode === "integration_auto" || quest.verificationType === "api_check") &&
        ((typeof verificationConfig?.profileUrl === "string" &&
          verificationConfig.profileUrl.trim().length > 0) ||
          (typeof verificationConfig?.handle === "string" &&
            verificationConfig.handle.trim().length > 0) ||
          quest.questType === "social_follow" ||
          typeof quest.actionUrl === "string")
    );
  const usesWalletVerification =
    Boolean(
      quest &&
        ((quest.proofType === "wallet" && quest.proofRequired) ||
          inferredVerificationProvider === "wallet" ||
          quest.verificationType === "wallet_check" ||
          quest.questType === "wallet_connect" ||
          quest.questType === "onchain_action")
    );

  const requiredAccount = useMemo(() => {
    if (usesDiscordVerification) return "discord";
    if (usesTelegramVerification) return "telegram";
    if (usesXVerification) return "x";
    if (usesWalletVerification) return "wallet";
    return null;
  }, [usesDiscordVerification, usesTelegramVerification, usesWalletVerification, usesXVerification]);

  const walletConnected = Boolean(profile?.wallet);
  const walletSnapshotSettled = Boolean(profile);

  const providerAccountConnected = requiredAccount
    ? requiredAccount === "wallet"
      ? walletConnected
      : connectedAccounts.some(
          (account) => account.provider === requiredAccount && account.status === "connected"
        )
    : true;
  const accountSnapshotSettled = connectedAccountsState === "ready";
  const accountReadyState = requiredAccount
    ? providerAccountConnected
      ? "Ready"
      : requiredAccount === "wallet"
        ? walletSnapshotSettled
          ? "Missing"
          : "Syncing"
      : !accountSnapshotSettled
        ? "Syncing"
        : "Missing"
    : "Not required";

  if (loading) {
    return <Notice tone="default" text="Loading mission..." />;
  }

  if (error) {
    return <Notice tone="error" text={error} />;
  }

  if (!quest) {
    return <Notice tone="default" text="Mission not found." />;
  }

  const currentQuest = quest;
  const missionClosed = currentQuest.status === "approved";

  const proofGuidance = getProofGuidance({
    proofRequired: currentQuest.proofRequired,
    proofType: currentQuest.proofType,
    verificationType: currentQuest.verificationType,
    verificationProvider: currentQuest.verificationProvider,
    completionMode: currentQuest.completionMode,
    questType: currentQuest.questType,
  });
  const derivedActionUrl = (() => {
    const config = currentQuest.verificationConfig;

    if (usesTelegramVerification) {
      const configGroupUrl = getStringConfigValue(config, "groupUrl", "telegramUrl", "targetUrl");
      return (
        (configGroupUrl && !isPlaceholderUrl(configGroupUrl) ? configGroupUrl : "") ||
        currentQuest.actionUrl ||
        linkedProject?.telegramUrl ||
        ""
      );
    }

    if (usesDiscordVerification) {
      const configInviteUrl = getStringConfigValue(config, "inviteUrl", "discordUrl", "targetUrl");
      return (
        (configInviteUrl && !isPlaceholderUrl(configInviteUrl) ? configInviteUrl : "") ||
        currentQuest.actionUrl ||
        linkedProject?.discordUrl ||
        ""
      );
    }

    if (usesXVerification) {
      const configProfileUrl = getStringConfigValue(config, "profileUrl", "targetUrl", "xUrl");
      return (
        (configProfileUrl && !isPlaceholderUrl(configProfileUrl) ? configProfileUrl : "") ||
        currentQuest.actionUrl ||
        ""
      );
    }

    return currentQuest.actionUrl || "";
  })();
  const nextMissionMove = missionClosed
    ? "This mission is already approved and closed, so there is no further action to route."
    : !providerAccountConnected && requiredAccount
      ? `Link ${requiredAccount === "wallet" ? "your wallet" : requiredAccount.toUpperCase()} first so this provider-aware route can actually verify.`
      : derivedActionUrl
        ? "Open the live destination first, then let Veltrix decide whether this clears instantly or waits in the queue."
        : "This mission still needs a configured destination before the live route can start.";
  const watchMissionCue =
    linkedRewards.length > 0
      ? `${linkedRewards.length} linked rewards are sitting behind this mission lane once it clears.`
      : linkedCampaign
        ? `${linkedCampaign.title} is the main campaign lane this mission rolls back into.`
        : "Watch the provider and proof state, because this mission is not yet tied to a larger unlock lane.";

  async function handleOpenTask() {
    if (missionClosed) {
      setMessage({
        tone: "success",
        text: "This mission is already complete and closed. No further action is required.",
      });
      return;
    }

    if (!derivedActionUrl) {
      setMessage({
        tone: "error",
        text: "This mission does not have a live destination configured yet.",
      });
      return;
    }

    if (!session?.access_token) {
      setMessage({
        tone: "error",
        text: "Please sign in again before starting this verification route.",
      });
      return;
    }

    if (!providerAccountConnected) {
      if (requiredAccount === "wallet") {
        if (!walletSnapshotSettled) {
          setMessage({
            tone: "default",
            text: "Veltrix is syncing your wallet readiness inside the live loadout now. Give it a second and try again.",
          });
          return;
        }

        setMessage({
          tone: "error",
          text: "Connect your wallet first so this mission can verify against the armed wallet identity.",
        });
        return;
      }

      if (!accountSnapshotSettled) {
        setMessage({
          tone: "default",
          text: `Syncing ${requiredAccount?.toUpperCase()} readiness inside your live loadout now. Give Veltrix a second and try again.`,
        });
        return;
      }

      setMessage({
        tone: "error",
        text: `Connect ${requiredAccount?.toUpperCase()} first so this mission can verify against the linked account.`,
      });
      return;
    }

    const integrationRoute = usesWebsiteVerification
      ? "/api/verify/visit"
      : usesDiscordVerification
        ? "/api/verify/discord"
        : usesTelegramVerification
          ? "/api/verify/telegram"
          : usesXVerification
            ? "/api/verify/x-follow"
            : null;

    setBusy(true);
    setMessage({
      tone: "default",
      text: usesWebsiteVerification
        ? "Veltrix is routing this website mission through the live grid now."
        : "Veltrix is opening the live verification route now.",
      });

    try {
      let missionWindow: Window | null = null;
      const shouldOpenExternalImmediately =
        Boolean(derivedActionUrl) && !usesWebsiteVerification;

      if (typeof window !== "undefined" && derivedActionUrl) {
        missionWindow = shouldOpenExternalImmediately
          ? window.open(derivedActionUrl, "_blank", "noopener,noreferrer")
          : window.open("", "_blank", "noopener,noreferrer");
      }

      if (integrationRoute) {
        const response = await fetch(integrationRoute, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            questId: currentQuest.id,
          }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Veltrix could not start this verification flow.");
        }

        const targetUrl =
          typeof payload?.targetUrl === "string" && payload.targetUrl.trim().length > 0
            ? payload.targetUrl.trim()
            : derivedActionUrl;
        const verificationStatus = payload?.status === "approved" ? "approved" : "pending";

        if ((usesWebsiteVerification || verificationStatus === "approved") && authUserId) {
          await updateQuestStatus(authUserId, currentQuest.id, "approved");
        } else if (authUserId) {
          await updateQuestStatus(authUserId, currentQuest.id, "pending");
        }

        await Promise.all([reload(), reloadProfile()]);
        setMessage({
          tone: verificationStatus === "approved" ? "success" : "default",
          text:
            payload?.message ||
            (usesWebsiteVerification
              ? "Website verification cleared. Opening the tracked destination now."
              : verificationStatus === "approved"
                ? "Verification cleared immediately. Veltrix has marked this mission as approved and closed."
                : "Verification started. Enter the destination and let Veltrix keep this mission pending until confirmation lands."),
        });

        if (missionWindow) {
          if (!shouldOpenExternalImmediately || missionWindow.location.href === "about:blank") {
            missionWindow.location.replace(targetUrl);
          }
        } else if (typeof window !== "undefined") {
          window.open(targetUrl, "_blank", "noopener,noreferrer");
        }

        if (
          verificationStatus === "pending" &&
          !usesWebsiteVerification &&
          typeof window !== "undefined"
        ) {
          returnRecheckCleanupRef.current?.();

          let handled = false;
          let timeoutId: number | null = null;

          const cleanup = () => {
            window.removeEventListener("focus", handleReturn);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (timeoutId !== null) {
              window.clearTimeout(timeoutId);
            }
            returnRecheckCleanupRef.current = null;
          };

          const runReturnCheck = async () => {
            if (handled) {
              return;
            }

            handled = true;
            cleanup();

            try {
              const retryResponse = await fetch(integrationRoute, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  questId: currentQuest.id,
                }),
              });

              const retryPayload = await retryResponse.json().catch(() => null);

              if (!retryResponse.ok || !retryPayload?.ok || retryPayload?.status !== "approved") {
                return;
              }

              if (authUserId) {
                await updateQuestStatus(authUserId, currentQuest.id, "approved");
              }

              await Promise.all([reload(), reloadProfile()]);
              setMessage({
                tone: "success",
                text:
                  retryPayload?.message ||
                  "Membership was confirmed after you returned. This mission is now approved and closed.",
              });
            } catch {
              // Leave the mission pending if the one-time return check cannot complete.
            }
          };

          function handleReturn() {
            void runReturnCheck();
          }

          function handleVisibilityChange() {
            if (document.visibilityState === "visible") {
              void runReturnCheck();
            }
          }

          window.addEventListener("focus", handleReturn, { once: true });
          document.addEventListener("visibilitychange", handleVisibilityChange);
          timeoutId = window.setTimeout(cleanup, 90_000);
          returnRecheckCleanupRef.current = cleanup;
        }
        return;
      }

      if (missionWindow) {
        missionWindow.location.replace(derivedActionUrl);
      } else if (typeof window !== "undefined") {
        window.open(derivedActionUrl, "_blank", "noopener,noreferrer");
      }
    } catch (nextError) {
      setMessage({
        tone: "error",
        text:
          nextError instanceof Error
            ? nextError.message
            : "Veltrix could not start this mission action.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (!authUserId) {
      setMessage({
        tone: "error",
        text: "You need an active session before submitting a mission.",
      });
      return;
    }

    if (usesWebsiteVerification) {
      setMessage({
        tone: "default",
        text: "This mission completes automatically after Veltrix confirms the website visit.",
      });
      return;
    }

    if (currentQuest.status === "approved") {
      setMessage({
        tone: "success",
        text: "This mission is already complete and closed.",
      });
      return;
    }

    if (currentQuest.proofRequired && currentQuest.proofType !== "none" && !proof.trim()) {
      setMessage({
        tone: "error",
        text: "Please add your proof before submitting.",
      });
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      await createQuestSubmission({
        authUserId,
        questId: currentQuest.id,
        proofText: proof.trim(),
        status: "pending",
      });
      await updateQuestStatus(authUserId, currentQuest.id, "pending");
      await reload();
      setMessage({
        tone: "success",
        text: "Your mission proof has been submitted and is now waiting for verification.",
      });
      setProof("");
    } catch (nextError) {
      setMessage({
        tone: "error",
        text:
          nextError instanceof Error
            ? nextError.message
            : "Veltrix could not submit this mission yet.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(192,255,0,0.12),rgba(0,204,255,0.1),rgba(0,0,0,0)_34%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
        {heroVisual ? (
          <>
            <ArtworkImage
              src={heroVisual}
              alt={currentQuest.title}
              tone="lime"
              fallbackLabel="Mission art offline"
              className="pointer-events-none absolute right-6 top-6 hidden h-[15rem] w-[min(24rem,38%)] rounded-[30px] xl:block"
              imgClassName="h-full w-full rounded-[30px] object-cover opacity-75 shadow-[0_28px_80px_rgba(0,0,0,0.42)]"
            />
            <div className="pointer-events-none absolute right-4 top-4 hidden h-[16rem] w-[42%] rounded-[32px] bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.14),transparent_40%)] xl:block" />
          </>
        ) : null}

        <p className="relative z-10 text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
          Mission Action
        </p>
        <div className="relative z-10 mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[15ch]">
            <h2 className="font-display text-balance text-3xl font-black tracking-[0.04em] text-white sm:text-5xl">
              {currentQuest.title}
            </h2>
            <p className="mt-3 text-sm text-lime-200">
              {linkedProject?.name ?? "Project"}
              {linkedCampaign ? ` // ${linkedCampaign.title}` : ""}
            </p>
          </div>
          <StatusChip label={currentQuest.status} tone={getStatusTone(currentQuest.status)} />
        </div>
        <p className="relative z-10 mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          {currentQuest.description || "No description yet for this mission."}
        </p>

        <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-4">
          <MetricTile label="Type" value={currentQuest.type} />
          <MetricTile label="XP" value={`+${currentQuest.xp}`} />
          <MetricTile label="Mode" value={currentQuest.completionMode ?? "manual"} />
          <MetricTile label="Provider" value={currentQuest.verificationProvider ?? "custom"} />
        </div>
      </section>

      {message ? <Notice tone={message.tone} text={message.text} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface
          eyebrow="Launch Protocol"
          title="Mission flow"
          description="Open the target, execute the move and let the provider route decide whether this clears instantly or waits in the queue."
        >
          <div className="space-y-4">
            <div className="metric-card rounded-[24px] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">
                Mission brief
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{proofGuidance}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <MiniStat label="Status" value={currentQuest.status} />
              <MiniStat label="Account ready" value={accountReadyState} />
            </div>

            {requiredAccount &&
            !providerAccountConnected &&
            (requiredAccount === "wallet" ? walletSnapshotSettled : accountSnapshotSettled) ? (
              <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                This mission needs a connected {requiredAccount.toUpperCase()} account before the
                verification route can start. Link it from{" "}
                <Link
                  href={requiredAccount === "wallet" ? "/profile/edit" : `/profile#${requiredAccount}`}
                  className="font-semibold text-white underline underline-offset-4"
                >
                  {requiredAccount === "wallet" ? "Profile edit" : "Profile"}
                </Link>
                .
              </div>
            ) : null}

            {requiredAccount &&
            !providerAccountConnected &&
            ((requiredAccount === "wallet" && !walletSnapshotSettled) ||
              (requiredAccount !== "wallet" && !accountSnapshotSettled)) ? (
              <div className="rounded-[24px] border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                Veltrix is syncing your{" "}
                {requiredAccount === "wallet"
                  ? "wallet"
                  : requiredAccount.toUpperCase()}{" "}
                account state across the live grid. This mission will unlock as soon as that
                refresh settles.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void handleOpenTask()}
                disabled={!derivedActionUrl || busy || missionClosed}
                className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {missionClosed
                  ? "Mission closed"
                  : busy
                  ? usesWebsiteVerification
                    ? "Routing launch..."
                    : "Processing..."
                  : derivedActionUrl
                    ? currentQuest.actionLabel ?? "Open mission"
                    : "No destination yet"}
              </button>

              {requiredAccount && !missionClosed ? (
                <Link
                  href={requiredAccount === "wallet" ? "/profile/edit" : `/profile#${requiredAccount}`}
                  className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  {requiredAccount === "wallet" ? "Manage wallet" : "Review connected accounts"}
                </Link>
              ) : null}
            </div>

            {!usesWebsiteVerification &&
            !usesDiscordVerification &&
            !usesTelegramVerification &&
            !usesXVerification ? (
              <div className="space-y-4">
                <div className="metric-card rounded-[24px] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">
                    Proof / transmission
                  </p>
                  <textarea
                    value={proof}
                    onChange={(event) => setProof(event.target.value)}
                    placeholder="Paste proof here..."
                    className="mt-4 min-h-36 w-full rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-300/50 focus:bg-white/[0.05]"
                  />
                </div>
                <button
                  onClick={() => void handleSubmit()}
                  disabled={busy || currentQuest.status === "approved"}
                  className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {currentQuest.status === "approved" ? "Mission approved" : "Submit mission"}
                </button>
              </div>
            ) : (
              <div className="metric-card rounded-[24px] p-4 text-sm leading-7 text-slate-300">
                {missionClosed
                  ? "This mission is closed. Verification landed successfully, the completion state is locked in, and no further action is required."
                  : usesWebsiteVerification
                    ? "This website mission verifies through a tracked visit and should clear without manual proof."
                    : usesDiscordVerification
                      ? "This Discord mission starts with a verification request and then waits for membership confirmation."
                      : usesTelegramVerification
                        ? "This Telegram mission starts with a verification request and then waits for membership confirmation."
                        : "This X mission starts with a verification request and then waits for follow confirmation."}
              </div>
            )}
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface
            eyebrow="Command read"
            title="Read the mission pressure before you open it"
            description="Start with the live state, the next routing move, and the one unlock cue worth watching."
            className="bg-[radial-gradient(circle_at_top_left,rgba(192,255,0,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]"
          >
            <div className="grid gap-3">
              <ReadTile
                label="Now"
                value={`${currentQuest.title} is currently ${currentQuest.status} with ${accountReadyState.toLowerCase()} account readiness and ${currentQuest.verificationType} verification.`}
              />
              <ReadTile label="Next" value={nextMissionMove} />
              <ReadTile label="Watch" value={watchMissionCue} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <MiniStat label="Status" value={currentQuest.status} />
              <MiniStat label="Verification" value={currentQuest.verificationType} />
              <MiniStat label="Proof" value={currentQuest.proofType} />
              <MiniStat label="Connected account" value={accountReadyState} />
            </div>
          </Surface>

          {linkedCampaign ? (
            <Surface
              eyebrow="Mission Lane"
              title="Linked campaign"
              description="This action rolls into the larger campaign lane and reward pressure behind it."
            >
              <Link
                href={`/campaigns/${linkedCampaign.id}`}
                className="panel-card block rounded-[26px] p-5 transition hover:border-lime-300/30 hover:bg-black/25"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white">{linkedCampaign.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{linkedCampaign.description}</p>
                  </div>
                  <StatusChip
                    label={linkedCampaign.featured ? "Featured" : `${linkedCampaign.completionRate}% live`}
                    tone={linkedCampaign.featured ? "positive" : "info"}
                  />
                </div>
              </Link>
            </Surface>
          ) : null}

          <Surface
            eyebrow="Unlock Pressure"
            title="Potential payoff"
            description="Rewards connected to the same campaign loop and mission cadence."
          >
            {linkedRewards.length > 0 ? (
              <div className="space-y-4">
                {linkedRewards.map((reward) => (
                  <Link
                    key={reward.id}
                    href={`/rewards/${reward.id}`}
                    className="metric-card flex items-start justify-between gap-4 rounded-[24px] px-4 py-4 transition hover:border-lime-300/30 hover:bg-black/25"
                  >
                    <div>
                      <p className="font-bold text-white">{reward.title}</p>
                      <p className="mt-1 text-sm text-slate-300">{reward.description}</p>
                    </div>
                    <StatusChip
                      label={reward.claimable ? "Claimable" : "Locked"}
                      tone={reward.claimable ? "positive" : "default"}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <Notice tone="default" text="No rewards are linked to this mission yet." />
            )}
          </Surface>
        </div>
      </div>
    </div>
  );
}

function useQuestAuth() {
  const {
    session,
    authUserId,
    profile,
    connectedAccounts,
    connectedAccountsState,
    reloadProfile,
  } = useAuth();

  return {
    session,
    authUserId,
    profile,
    connectedAccounts,
    connectedAccountsState,
    reloadProfile,
  };
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[24px] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black capitalize text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[20px] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize text-white">{value}</p>
    </div>
  );
}

function ReadTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-200/85">{label}</p>
      <p className="mt-3 text-sm leading-7 text-slate-200">{value}</p>
    </div>
  );
}

function Notice({
  text,
  tone,
}: {
  text: string;
  tone: "default" | "error" | "success";
}) {
  return (
    <div
      className={`rounded-[24px] px-4 py-6 text-sm ${
        tone === "error"
          ? "border border-rose-400/20 bg-rose-500/10 text-rose-200"
          : tone === "success"
            ? "border border-lime-300/20 bg-lime-400/10 text-lime-100"
            : "border border-white/8 bg-black/20 text-slate-300"
      }`}
    >
      {text}
    </div>
  );
}
