"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ArtworkImage } from "@/components/ui/artwork-image";
import { RaidBadgeMark } from "@/components/raids/raid-badge-mark";
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

async function confirmRaidForUser(authUserId: string, raidId: string) {
  const supabase = createSupabaseBrowserClient();

  const { data: existing } = await supabase
    .from("user_progress")
    .select(
      "joined_communities, confirmed_raids, claimed_rewards, opened_lootbox_ids, unlocked_reward_ids, quest_statuses"
    )
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  const confirmedRaids = Array.isArray(existing?.confirmed_raids)
    ? [...new Set([...(existing?.confirmed_raids ?? []), raidId])]
    : [raidId];

  const { error } = await supabase.from("user_progress").upsert({
    auth_user_id: authUserId,
    joined_communities: existing?.joined_communities ?? [],
    confirmed_raids: confirmedRaids,
    claimed_rewards: existing?.claimed_rewards ?? [],
    opened_lootbox_ids: existing?.opened_lootbox_ids ?? [],
    unlocked_reward_ids: existing?.unlocked_reward_ids ?? [],
    quest_statuses: existing?.quest_statuses ?? {},
  });

  if (error) throw error;

  const { error: completionError } = await supabase.from("raid_completions").insert({
    auth_user_id: authUserId,
    raid_id: raidId,
  });

  if (completionError && !completionError.message.toLowerCase().includes("duplicate")) {
    throw completionError;
  }
}

export function RaidDetailScreen() {
  const params = useParams<{ id: string }>();
  const raidId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { authUserId, session, reloadProfile } = useAuth();
  const { raids, loading, error, reload } = useLiveUserData({
    datasets: ["raids"],
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "default" | "error" | "success"; text: string } | null>(null);

  const raid = raids.find((item) => item.id === raidId);

  if (loading) return <Notice tone="default" text="Loading raid..." />;
  if (error) return <Notice tone="error" text={error} />;
  if (!raid) return <Notice tone="default" text="Raid not found." />;
  const currentRaid = raid;
  const nextRaidMove =
    currentRaid.instructions.length > 0
      ? `Run the ${currentRaid.instructions.length}-step push first, then confirm the result back into your live progress layer.`
      : "This raid still needs clearer execution steps before the push is fully readable.";
  const watchRaidCue = `${currentRaid.timer} is the live timer cue, while ${currentRaid.progress}% progress and ${currentRaid.participants} participants show how crowded the push already is.`;

  async function handleConfirm() {
    if (!authUserId) {
      setMessage({ tone: "error", text: "You need an active session before confirming a raid." });
      return;
    }

    if (!session?.access_token) {
      setMessage({ tone: "error", text: "Please sign in again before confirming this raid." });
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      await confirmRaidForUser(authUserId, currentRaid.id);
      let xpAward: UserXpAwardResponse | null = null;
      let xpAwardError: string | null = null;
      try {
        xpAward = await claimUserXpAward({
          accessToken: session.access_token,
          sourceType: XP_SOURCE_TYPES.raid,
          sourceId: currentRaid.id,
          baseXp: currentRaid.reward,
          campaignId: currentRaid.campaignId,
          metadata: {
            raidTitle: currentRaid.title,
            community: currentRaid.community,
            timer: currentRaid.timer,
          },
        });
      } catch (error) {
        xpAwardError =
          error instanceof Error
            ? error.message
            : "XP sync could not finish for this confirmed raid.";
      }
      await Promise.all([reload(), reloadProfile()]);
      const successText = "Your raid has been confirmed.";
      setMessage({
        tone: "success",
        text: xpAwardError
          ? `${successText} XP sync needs attention: ${xpAwardError}`
          : describeXpAward(xpAward, successText),
      });
    } catch (nextError) {
      setMessage({
        tone: "error",
        text: nextError instanceof Error ? nextError.message : "VYNTRO could not confirm this raid yet.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[22px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.14),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(255,196,0,0.08),transparent_22%),linear-gradient(180deg,rgba(12,14,18,0.99),rgba(7,9,11,0.99))] p-4 shadow-[0_20px_54px_rgba(0,0,0,0.24)]">
        <RaidBadgeMark
          className="absolute right-[22rem] top-8 hidden h-24 w-24 opacity-[0.12] xl:inline-flex"
          imageClassName="rotate-[8deg]"
        />
        <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_300px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <RaidBadgeMark className="h-8 w-8 opacity-90" />
              <StatusChip label={currentRaid.community} tone="info" />
              <StatusChip label={`+${currentRaid.reward} XP`} tone="info" />
            </div>
            <p className="mt-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-rose-300">Raid</p>
            <h2 className="mt-2.5 max-w-[18ch] text-[1.06rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.22rem]">
              {currentRaid.title}
            </h2>
            <p className="mt-2.5 max-w-3xl text-[13px] leading-5 text-slate-300">{currentRaid.target}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <MetricPill label="Timer" value={currentRaid.timer} />
              <MetricPill label="People" value={String(currentRaid.participants)} />
              <MetricPill label="Progress" value={`${currentRaid.progress}%`} />
              <MetricPill label="Steps" value={String(currentRaid.instructions.length)} />
            </div>
          </div>

          <div className="space-y-3 rounded-[20px] border border-white/8 bg-white/[0.03] p-3.5">
            {currentRaid.banner ? (
              <div className="relative overflow-hidden rounded-[20px] border border-white/8 bg-black/30">
                <ArtworkImage
                  src={currentRaid.banner}
                  alt={currentRaid.title}
                  tone="rose"
                  fallbackLabel="Raid art offline"
                  className="aspect-[1.15/1] w-full"
                  imgClassName="h-full w-full object-cover opacity-78"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,11,0.12),rgba(6,8,11,0.82))]" />
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <MetricTile label="Timer" value={currentRaid.timer} />
              <MetricTile label="Reward" value={`+${currentRaid.reward}`} />
              <MetricTile label="Progress" value={`${currentRaid.progress}%`} />
              <MetricTile label="Participants" value={String(currentRaid.participants)} />
            </div>
          </div>
        </div>
      </section>

      {message ? <Notice tone={message.tone} text={message.text} /> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_300px]">
        <Surface
          eyebrow="Raid read"
          title="Complete these steps"
          description="Follow the push, complete the live operation, then write it back into your progress layer."
        >
          <div className="space-y-2.5">
            {currentRaid.instructions.length > 0 ? (
              currentRaid.instructions.map((step, index) => (
                <div key={`${currentRaid.id}-${index}`} className="metric-card flex items-start gap-4 rounded-[16px] px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-300/30 bg-rose-300/10 text-sm font-black text-rose-200">
                    {index + 1}
                  </div>
                  <p className="text-[11px] leading-5 text-slate-300">{step}</p>
                </div>
              ))
            ) : (
              <Notice tone="default" text="No instructions were configured for this raid yet." />
            )}
          </div>
        </Surface>

        <Surface
          eyebrow="Signal rail"
          title="Read the live push before you confirm it"
          description="Start with the current pressure, the next action, and the one timer cue that matters before you write the raid back."
          className="bg-[radial-gradient(circle_at_top_left,rgba(255,120,120,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]"
        >
          <div className="space-y-3.5">
            <ReadTile
              label="Now"
              value={`${currentRaid.title} is sitting at ${currentRaid.progress}% progress with ${currentRaid.participants} participants already in the push.`}
            />
            <ReadTile label="Next" value={nextRaidMove} />
            <ReadTile label="Watch" value={watchRaidCue} />
            <div className="metric-card rounded-[16px] p-3 text-[11px] leading-5 text-slate-300">
              Confirming a raid writes the completion into the same live progress layer used by the mobile app and web board.
            </div>
            {currentRaid.sourceUrl ? (
              <a
                href={currentRaid.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-100 transition hover:border-rose-200/40 hover:text-rose-100"
              >
                Open source post
              </a>
            ) : null}
            <button
              onClick={() => void handleConfirm()}
              disabled={busy}
              className="rounded-full bg-rose-300 px-3.5 py-2 text-[12px] font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Confirming..." : "Confirm raid"}
            </button>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[14px] p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-[0.8rem] font-semibold text-white">{value}</p>
    </div>
  );
}

function ReadTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-rose-200/85">{label}</p>
      <p className="mt-1 text-[10px] leading-5 text-slate-200">{value}</p>
    </div>
  );
}

function Notice({ text, tone }: { text: string; tone: "default" | "error" | "success" }) {
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
