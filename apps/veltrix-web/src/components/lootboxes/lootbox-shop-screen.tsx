"use client";

import { useState } from "react";
import { Archive, Sparkles } from "lucide-react";
import { LootboxCard } from "@/components/lootboxes/lootbox-card";
import { ShardBadge } from "@/components/ui/shard-badge";
import { Surface } from "@/components/ui/surface";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function LootboxShopScreen() {
  const { loading, error, shardBalance, lootboxTiers, inventory, openLootbox } =
    useLiveUserData({ datasets: ["lootboxes", "inventory"] });
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    tone: "default" | "success" | "error";
    text: string;
  } | null>(null);

  async function handleOpen(tierId: string) {
    setBusyTier(tierId);
    setMessage({ tone: "default", text: "Opening lootbox..." });
    const result = await openLootbox(tierId);

    if (!result.ok || !result.result) {
      setMessage({ tone: "error", text: result.error ?? "Lootbox open failed." });
      setBusyTier(null);
      return;
    }

    setMessage({
      tone: "success",
      text: `Unlocked ${result.result.inventoryItem.label}.`,
    });
    setBusyTier(null);
  }

  if (loading) {
    return <Notice text="Loading lootboxes..." />;
  }

  if (error) {
    return <Notice text={error} tone="error" />;
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(12,16,22,0.99),rgba(5,7,11,0.99))] p-5 shadow-[0_22px_62px_rgba(0,0,0,0.28)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/20 to-transparent" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">
              Shard Vault
            </p>
            <h1 className="mt-3 text-[1.28rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.46rem]">
              VYNTRO lootboxes
            </h1>
            <p className="mt-2 max-w-2xl text-[12px] leading-5 text-slate-400">
              Earned shards turn featured quests and raids into a platform-wide chase layer.
            </p>
          </div>
          <ShardBadge value={shardBalance} className="py-1.5" />
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
          <HeroStat label="Balance" value={String(shardBalance)} meta="available shards" />
          <HeroStat label="Boxes" value={String(lootboxTiers.length)} meta="tier catalog" />
          <HeroStat label="Inventory" value={String(inventory.length)} meta="owned unlocks" />
        </div>
      </section>

      {message ? <Notice text={message.text} tone={message.tone === "error" ? "error" : "default"} /> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {lootboxTiers.map((tier) => (
          <LootboxCard
            key={tier.id}
            tier={tier}
            busy={busyTier === tier.id}
            onOpen={() => void handleOpen(tier.id)}
          />
        ))}
      </div>

      <Surface
        eyebrow="Inventory"
        title="Recent unlocks"
        description="New lootbox results land here before the full cosmetics and perk inventory grows out."
      >
        {inventory.length ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {inventory.slice(0, 9).map((item) => (
              <div key={item.id} className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-300/18 bg-emerald-300/[0.08] text-emerald-100">
                    <Archive className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-white">{item.label}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-slate-500">
                      {item.rarity} / {item.item_type}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[16px] border border-white/8 bg-white/[0.025] p-4 text-[12px] text-slate-400">
            No lootbox unlocks yet.
          </div>
        )}
      </Surface>
    </div>
  );
}

function HeroStat({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.035] px-3.5 py-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-2 flex items-center gap-2 text-white">
        <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
        <span className="text-[1rem] font-semibold">{value}</span>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">{meta}</p>
    </div>
  );
}

function Notice({ text, tone = "default" }: { text: string; tone?: "default" | "error" }) {
  return (
    <div
      className={`rounded-[18px] border px-4 py-3 text-[13px] ${
        tone === "error"
          ? "border-rose-300/20 bg-rose-500/[0.08] text-rose-100"
          : "border-white/8 bg-white/[0.03] text-slate-300"
      }`}
    >
      {text}
    </div>
  );
}
