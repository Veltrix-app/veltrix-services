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
import { XP_SOURCE_TYPES } from "@/lib/xp/xp-economy";
import {
  claimUserXpAward,
  describeXpAward,
  type UserXpAwardResponse,
} from "@/lib/xp/xp-award-client";

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
    return "Link your X account, follow the project profile and let VYNTRO wait for follow confirmation instead of asking for manual proof.";
  }

  if (
    questType === "telegram_join" &&
    verificationProvider === "telegram" &&
    completionMode === "integration_auto"
  ) {
    return "Link your Telegram account, join the group and let VYNTRO wait for membership confirmation instead of asking for manual proof.";
  }

  if (
    questType === "discord_join" &&
    verificationProvider === "discord" &&
    completionMode === "integration_auto"
  ) {
    return "Link your Discord account, join the server and let VYNTRO wait for membership confirmation instead of asking for manual proof.";
  }

  if (
    questType === "url_visit" &&
    verificationProvider === "website" &&
    completionMode === "integration_auto"
  ) {
    return "Open the tracked destination and VYNTRO will complete this mission automatically after the website visit is confirmed.";
  }

  if (!proofRequired || proofType === "none") {
    return "No manual proof is required here. Complete the action and transmit once the move is finished.";
  }

  if (proofType === "url") {
    return "Paste the direct URL that proves you completed the action.";
  }

  if (proofType === "tx_hash") {
    return "Paste the onchain transaction hash so VYNTRO can verify the action cleanly.";
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
        ? "Open the live destination first, then let VYNTRO decide whether this clears instantly or waits in the queue."
        : "This mission still needs a configured destination before the live route can start.";
  const watchMissionCue =
    linkedRewards.length > 0
      ? `${linkedRewards.length} linked rewards are sitting behind this mission lane once it clears.`
      : linkedCampaign
        ? `${linkedCampaign.title} is the main campaign lane this mission rolls back into.`
        : "Watch the provider and proof state, because this mission is not yet tied to a larger unlock lane.";

  async function awardApprovedQuestXp(): Promise<UserXpAwardResponse | null> {
    if (!session?.access_token || currentQuest.xp <= 0) {
      return null;
    }

    return claimUserXpAward({
      accessToken: session.access_token,
      sourceType: XP_SOURCE_TYPES.quest,
      sourceId: currentQuest.id,
      baseXp: currentQuest.xp,
      projectId: currentQuest.projectId,
      campaignId: currentQuest.campaignId,
      metadata: {
        questTitle: currentQuest.title,
        questType: currentQuest.questType,
        verificationProvider: inferredVerificationProvider,
        completionMode: currentQuest.completionMode,
        globalXp: currentQuest.xp,
        projectPoints: currentQuest.projectPoints,
      },
    });
  }

  async function tryAwardApprovedQuestXp() {
    try {
      return {
        xpAward: await awardApprovedQuestXp(),
        xpAwardError: null as string | null,
      };
    } catch (error) {
      return {
        xpAward: null,
        xpAwardError:
          error instanceof Error
            ? error.message
            : "XP sync could not finish for this completed mission.",
      };
    }
  }

  function describeCompletionWithXp(
    fallback: string,
    result: { xpAward: UserXpAwardResponse | null; xpAwardError: string | null }
  ) {
    if (result.xpAwardError) {
      return `${fallback} The mission is closed, but XP sync needs attention: ${result.xpAwardError}`;
    }

    return describeXpAward(result.xpAward, fallback);
  }

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
            text: "VYNTRO is syncing your wallet readiness inside the live loadout now. Give it a second and try again.",
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
          text: `Syncing ${requiredAccount?.toUpperCase()} readiness inside your live loadout now. Give VYNTRO a second and try again.`,
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
        ? "VYNTRO is routing this website mission through the live grid now."
        : "VYNTRO is opening the live verification route now.",
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
          throw new Error(payload?.error || "VYNTRO could not start this verification flow.");
        }

        const targetUrl =
          typeof payload?.targetUrl === "string" && payload.targetUrl.trim().length > 0
            ? payload.targetUrl.trim()
            : derivedActionUrl;
        const verificationStatus = payload?.status === "approved" ? "approved" : "pending";
        let xpAwardResult: {
          xpAward: UserXpAwardResponse | null;
          xpAwardError: string | null;
        } = { xpAward: null, xpAwardError: null };

        if ((usesWebsiteVerification || verificationStatus === "approved") && authUserId) {
          await updateQuestStatus(authUserId, currentQuest.id, "approved");
          xpAwardResult = await tryAwardApprovedQuestXp();
        } else if (authUserId) {
          await updateQuestStatus(authUserId, currentQuest.id, "pending");
        }

        await Promise.all([reload(), reloadProfile()]);
        const completionText =
          payload?.message ||
          (usesWebsiteVerification
            ? "Website verification cleared. Opening the tracked destination now."
            : verificationStatus === "approved"
              ? "Verification cleared immediately. VYNTRO has marked this mission as approved and closed."
              : "Verification started. Enter the destination and let VYNTRO keep this mission pending until confirmation lands.");
        setMessage({
          tone: usesWebsiteVerification || verificationStatus === "approved" ? "success" : "default",
          text:
            usesWebsiteVerification || verificationStatus === "approved"
              ? describeCompletionWithXp(completionText, xpAwardResult)
              : completionText,
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

              const xpAwardResult = await tryAwardApprovedQuestXp();
              await Promise.all([reload(), reloadProfile()]);
              const completionText =
                retryPayload?.message ||
                "Membership was confirmed after you returned. This mission is now approved and closed.";
              setMessage({
                tone: "success",
                text: describeCompletionWithXp(completionText, xpAwardResult),
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
            : "VYNTRO could not start this mission action.",
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
        text: "This mission completes automatically after VYNTRO confirms the website visit.",
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
            : "VYNTRO could not submit this mission yet.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[22px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.12),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(0,204,255,0.12),transparent_24%),linear-gradient(180deg,rgba(12,14,18,0.99),rgba(7,9,11,0.99))] p-4 shadow-[0_20px_54px_rgba(0,0,0,0.24)]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_300px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip label={linkedProject?.name ?? "Project"} tone="info" />
              {linkedCampaign ? <StatusChip label={linkedCampaign.title} tone="info" /> : null}
              <StatusChip label={currentQuest.status} tone={getStatusTone(currentQuest.status)} />
            </div>

            <p className="mt-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-lime-300">Mission</p>
            <h2 className="mt-2.5 max-w-[18ch] text-[1.06rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.22rem]">
              {currentQuest.title}
            </h2>
            <p className="mt-2.5 max-w-3xl text-[13px] leading-5 text-slate-300">
              {currentQuest.description || "No description yet for this mission."}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <MetricPill label="Type" value={currentQuest.type} />
              <MetricPill label="XP" value={`+${currentQuest.xp}`} />
              {currentQuest.projectPoints !== currentQuest.xp ? (
                <MetricPill label="Project pts" value={`${currentQuest.projectPoints}`} />
              ) : null}
              <MetricPill label="Mode" value={currentQuest.completionMode ?? "manual"} />
              <MetricPill label="Provider" value={currentQuest.verificationProvider ?? "custom"} />
            </div>
          </div>

          <div className="space-y-3 rounded-[20px] border border-white/8 bg-white/[0.03] p-3.5">
            {heroVisual ? (
              <div className="relative overflow-hidden rounded-[20px] border border-white/8 bg-black/30">
                <ArtworkImage
                  src={heroVisual}
                  alt={currentQuest.title}
                  tone="lime"
                  fallbackLabel="Mission art offline"
                  className="aspect-[1.15/1] w-full"
                  imgClassName="h-full w-full object-cover opacity-76"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,11,0.12),rgba(6,8,11,0.82))]" />
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <MetricTile label="Status" value={currentQuest.status} />
              <MetricTile label="Account" value={accountReadyState} />
              <MetricTile label="Proof" value={currentQuest.proofType} />
              <MetricTile label="Route" value={currentQuest.verificationType} />
            </div>
          </div>
        </div>
      </section>

      {message ? <Notice tone={message.tone} text={message.text} /> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_300px]">
        <Surface
          eyebrow="Mission read"
          title="Mission flow"
          description="Open the target, execute the move and let the provider route decide whether this clears instantly or waits in the queue."
        >
          <div className="space-y-3.5">
            <div className="metric-card rounded-[20px] p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">
                Mission brief
              </p>
              <p className="mt-2.5 text-[13px] leading-6 text-slate-300">{proofGuidance}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MiniStat label="Status" value={currentQuest.status} />
              <MiniStat label="Account ready" value={accountReadyState} />
            </div>

            {requiredAccount &&
            !providerAccountConnected &&
            (requiredAccount === "wallet" ? walletSnapshotSettled : accountSnapshotSettled) ? (
              <div className="rounded-[20px] border border-amber-400/20 bg-amber-500/10 p-3.5 text-[13px] text-amber-100">
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
              <div className="rounded-[20px] border border-cyan-300/20 bg-cyan-400/10 p-3.5 text-[13px] text-cyan-100">
                VYNTRO is syncing your{" "}
                {requiredAccount === "wallet"
                  ? "wallet"
                  : requiredAccount.toUpperCase()}{" "}
                account state across the live grid. This mission will unlock as soon as that
                refresh settles.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => void handleOpenTask()}
                disabled={!derivedActionUrl || busy || missionClosed}
                className="rounded-full bg-lime-300 px-4 py-2.5 text-[12px] font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="glass-button rounded-full px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  {requiredAccount === "wallet" ? "Manage wallet" : "Review connected accounts"}
                </Link>
              ) : null}
            </div>

            {!usesWebsiteVerification &&
            !usesDiscordVerification &&
            !usesTelegramVerification &&
            !usesXVerification ? (
              <div className="space-y-3.5">
                <div className="metric-card rounded-[20px] p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">
                    Proof / transmission
                  </p>
                  <textarea
                    value={proof}
                    onChange={(event) => setProof(event.target.value)}
                    placeholder="Paste proof here..."
                    className="mt-3 min-h-32 w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-3.5 py-3 text-[13px] text-white outline-none transition placeholder:text-slate-500 focus:border-lime-300/50 focus:bg-white/[0.05]"
                  />
                </div>
                <button
                  onClick={() => void handleSubmit()}
                  disabled={busy || currentQuest.status === "approved"}
                  className="glass-button rounded-full px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {currentQuest.status === "approved" ? "Mission approved" : "Submit mission"}
                </button>
              </div>
            ) : (
              <div className="metric-card rounded-[16px] p-3 text-[11px] leading-5 text-slate-300">
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

        <div className="space-y-5">
          <Surface
            eyebrow="Signal rail"
            title="Read the mission pressure before you open it"
            description="Start with the live state, the next routing move, and the one unlock cue worth watching."
            className="bg-[radial-gradient(circle_at_top_left,rgba(192,255,0,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]"
          >
            <div className="grid gap-2.5">
              <ReadTile
                label="Now"
                value={`${currentQuest.title} is currently ${currentQuest.status} with ${accountReadyState.toLowerCase()} account readiness and ${currentQuest.verificationType} verification.`}
              />
              <ReadTile label="Next" value={nextMissionMove} />
              <ReadTile label="Watch" value={watchMissionCue} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
            className="panel-card block rounded-[18px] p-3.5 transition hover:border-lime-300/30 hover:bg-black/25"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-white">{linkedCampaign.title}</p>
                    <p className="mt-1.5 text-[12px] text-slate-300">{linkedCampaign.description}</p>
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
              <div className="space-y-3">
                {linkedRewards.map((reward) => (
                  <Link
                    key={reward.id}
                    href={`/rewards/${reward.id}`}
                    className="metric-card flex items-start justify-between gap-4 rounded-[16px] px-3 py-2.5 transition hover:border-lime-300/30 hover:bg-black/25"
                  >
                    <div>
                      <p className="text-[12px] font-semibold text-white">{reward.title}</p>
                      <p className="mt-1 text-[11px] text-slate-300">{reward.description}</p>
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
    <div className="metric-card rounded-[14px] p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-[0.8rem] font-semibold capitalize text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[14px] px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-[10px] font-semibold capitalize text-white">{value}</p>
    </div>
  );
}

function ReadTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-lime-200/85">{label}</p>
      <p className="mt-1 text-[10px] leading-5 text-slate-200">{value}</p>
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
      className={`rounded-[18px] px-3.5 py-4 text-[12px] ${
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

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/20 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
      <span>{label}</span>
      <span className="text-white">{value}</span>
    </span>
  );
}
