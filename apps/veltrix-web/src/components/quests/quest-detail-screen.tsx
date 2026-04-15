"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";
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
  const { session, authUserId } = useQuestAuth();
  const { loading, error, quests, campaigns, rewards, projects, connectedAccounts, reload } =
    useLiveUserData();
  const [proof, setProof] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "default" | "error" | "success"; text: string } | null>(
    null
  );

  const quest = quests.find((item) => item.id === questId);
  const linkedCampaign = campaigns.find((item) => item.id === quest?.campaignId);
  const linkedProject = projects.find((item) => item.id === (quest?.projectId ?? linkedCampaign?.projectId));
  const linkedRewards = rewards.filter((item) => item.campaignId === quest?.campaignId).slice(0, 3);
  const heroVisual = linkedCampaign?.bannerUrl ?? linkedCampaign?.thumbnailUrl ?? linkedProject?.bannerUrl ?? null;

  const usesWebsiteVerification =
    quest?.questType === "url_visit" &&
    quest.verificationProvider === "website" &&
    quest.completionMode === "integration_auto";
  const usesDiscordVerification =
    quest?.questType === "discord_join" &&
    quest.verificationProvider === "discord" &&
    quest.completionMode === "integration_auto";
  const usesTelegramVerification =
    quest?.questType === "telegram_join" &&
    quest.verificationProvider === "telegram" &&
    quest.completionMode === "integration_auto";
  const usesXVerification =
    quest?.questType === "social_follow" &&
    quest.verificationProvider === "x" &&
    quest.completionMode === "integration_auto";

  const requiredAccount = useMemo(() => {
    if (usesDiscordVerification) return "discord";
    if (usesTelegramVerification) return "telegram";
    if (usesXVerification) return "x";
    return null;
  }, [usesDiscordVerification, usesTelegramVerification, usesXVerification]);

  const providerAccountConnected = requiredAccount
    ? connectedAccounts.some(
        (account) => account.provider === requiredAccount && account.status === "connected"
      )
    : true;

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

  const proofGuidance = getProofGuidance({
    proofRequired: currentQuest.proofRequired,
    proofType: currentQuest.proofType,
    verificationType: currentQuest.verificationType,
    verificationProvider: currentQuest.verificationProvider,
    completionMode: currentQuest.completionMode,
    questType: currentQuest.questType,
  });

  async function handleOpenTask() {
    if (!currentQuest.actionUrl) {
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
    setMessage(null);

    try {
      if (integrationRoute) {
        const response = await fetch(`${publicEnv.portalUrl}${integrationRoute}`, {
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

        if (!response.ok || !payload?.ok || typeof payload?.targetUrl !== "string") {
          throw new Error(payload?.error || "Veltrix could not start this verification flow.");
        }

        if (!usesWebsiteVerification && authUserId) {
          await createQuestSubmission({
            authUserId,
            questId: currentQuest.id,
            proofText:
              usesDiscordVerification
                ? "discord_membership_requested"
                : usesTelegramVerification
                  ? "telegram_membership_requested"
                  : "x_follow_requested",
            status: "pending",
          });
          await updateQuestStatus(authUserId, currentQuest.id, "pending");
        }

        await reload();
        setMessage({
          tone: "success",
          text:
            payload?.message ||
            (usesWebsiteVerification
              ? "Website verification cleared. Opening the tracked destination now."
              : "Verification started. Enter the destination and let Veltrix keep this mission pending until confirmation lands."),
        });

        window.open(payload.targetUrl, "_blank", "noopener,noreferrer");
        return;
      }

      window.open(currentQuest.actionUrl, "_blank", "noopener,noreferrer");
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
        tone: "default",
        text: "This mission is already approved.",
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
              <MiniStat
                label="Account ready"
                value={requiredAccount ? (providerAccountConnected ? "Ready" : "Missing") : "Not required"}
              />
            </div>

            {requiredAccount && !providerAccountConnected ? (
              <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                This mission needs a connected {requiredAccount.toUpperCase()} account before the
                verification route can start. Link it from{" "}
                <Link href="/profile" className="font-semibold text-white underline underline-offset-4">
                  Profile
                </Link>
                .
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void handleOpenTask()}
                disabled={!currentQuest.actionUrl || busy}
                className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy
                  ? "Processing..."
                  : currentQuest.actionUrl
                    ? currentQuest.actionLabel ?? "Open mission"
                    : "No destination yet"}
              </button>

              {requiredAccount ? (
                <Link
                  href="/profile"
                  className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Review connected accounts
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
                {usesWebsiteVerification
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
            eyebrow="Routing State"
            title="Verification read"
            description="Provider state, proof mode and account readiness all read from the same live backend state as mobile."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <MiniStat label="Status" value={currentQuest.status} />
              <MiniStat label="Verification" value={currentQuest.verificationType} />
              <MiniStat label="Proof" value={currentQuest.proofType} />
              <MiniStat
                label="Connected account"
                value={requiredAccount ? (providerAccountConnected ? "Ready" : "Missing") : "Not required"}
              />
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
  const { session, authUserId } = useAuth();

  return {
    session,
    authUserId,
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
