"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuth } from "@/components/providers/auth-provider";
import { useLiveUserData } from "@/hooks/use-live-user-data";

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
  const { authUserId } = useAuth();
  const { raids, loading, error, reload } = useLiveUserData();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "default" | "error" | "success"; text: string } | null>(null);

  const raid = raids.find((item) => item.id === raidId);

  if (loading) return <Notice tone="default" text="Loading raid..." />;
  if (error) return <Notice tone="error" text={error} />;
  if (!raid) return <Notice tone="default" text="Raid not found." />;
  const currentRaid = raid;

  async function handleConfirm() {
    if (!authUserId) {
      setMessage({ tone: "error", text: "You need an active session before confirming a raid." });
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      await confirmRaidForUser(authUserId, currentRaid.id);
      await reload();
      setMessage({ tone: "success", text: "Your raid has been confirmed." });
    } catch (nextError) {
      setMessage({
        tone: "error",
        text: nextError instanceof Error ? nextError.message : "Veltrix could not confirm this raid yet.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,80,80,0.14),rgba(0,0,0,0)_32%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="h-64 bg-[linear-gradient(135deg,rgba(255,90,90,0.16),rgba(0,0,0,0.18))]">
          {currentRaid.banner ? <img src={currentRaid.banner} alt={currentRaid.title} className="h-full w-full object-cover opacity-80" /> : null}
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-rose-300">Raid Detail</p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-[14ch]">
              <p className="text-sm font-semibold text-rose-200">{currentRaid.community}</p>
              <h2 className="font-display mt-2 text-balance text-[clamp(2.2rem,4vw,4.5rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                {currentRaid.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{currentRaid.target}</p>
            </div>
            <StatusChip label={`+${currentRaid.reward} XP`} tone="info" />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <MetricTile label="Timer" value={currentRaid.timer} />
            <MetricTile label="Participants" value={String(currentRaid.participants)} />
            <MetricTile label="Progress" value={`${currentRaid.progress}%`} />
            <MetricTile label="Steps" value={String(currentRaid.instructions.length)} />
          </div>
        </div>
      </section>

      {message ? <Notice tone={message.tone} text={message.text} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Surface
          eyebrow="Instructions"
          title="Complete these steps"
          description="Follow the push, complete the live operation, then write it back into your progress layer."
        >
          <div className="space-y-3">
            {currentRaid.instructions.length > 0 ? (
              currentRaid.instructions.map((step, index) => (
                <div key={`${currentRaid.id}-${index}`} className="metric-card flex items-start gap-4 rounded-[24px] px-4 py-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-300/30 bg-rose-300/10 text-sm font-black text-rose-200">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-slate-300">{step}</p>
                </div>
              ))
            ) : (
              <Notice tone="default" text="No instructions were configured for this raid yet." />
            )}
          </div>
        </Surface>

        <Surface
          eyebrow="Confirm"
          title="Raid completion"
          description="Once the push is done, confirm it to write the live completion state."
        >
          <div className="space-y-4">
            <div className="metric-card rounded-[24px] p-4 text-sm leading-7 text-slate-300">
              Confirming a raid writes the completion into the same live progress layer used by the mobile app and web board.
            </div>
            <button
              onClick={() => void handleConfirm()}
              disabled={busy}
              className="rounded-full bg-rose-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="metric-card rounded-[24px] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function Notice({ text, tone }: { text: string; tone: "default" | "error" | "success" }) {
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
