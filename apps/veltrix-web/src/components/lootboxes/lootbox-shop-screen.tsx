"use client";

import { useState } from "react";
import Image from "next/image";
import { Archive, BadgeCheck, Gem, Sparkles, X } from "lucide-react";
import { LootboxCard } from "@/components/lootboxes/lootbox-card";
import { ShardBadge } from "@/components/ui/shard-badge";
import { Surface } from "@/components/ui/surface";
import { useLiveUserData } from "@/hooks/use-live-user-data";

type LootboxReveal = {
  tierLabel: string;
  tierAssetPath: string;
  shardSpend: number;
  shardRefund: number;
  balance: number;
  item: {
    label: string;
    rarity: string;
    item_type: string;
  };
};

export function LootboxShopScreen() {
  const { loading, error, shardBalance, lootboxTiers, inventory, openLootbox } =
    useLiveUserData({ datasets: ["lootboxes", "inventory"] });
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const [reveal, setReveal] = useState<LootboxReveal | null>(null);
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

    const openedTier = lootboxTiers.find((tier) => tier.id === tierId);
    setReveal({
      tierLabel: openedTier?.label ?? "Lootbox",
      tierAssetPath: openedTier?.assetPath ?? "/assets/lootboxes/common-lootbox.webp",
      shardSpend: result.result.shardSpend,
      shardRefund: result.result.shardRefund,
      balance: result.result.balance,
      item: result.result.inventoryItem,
    });
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
      <section className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_88%_14%,rgba(168,85,247,0.18),transparent_25%),radial-gradient(circle_at_12%_10%,rgba(16,185,129,0.14),transparent_24%),linear-gradient(180deg,rgba(12,16,22,0.99),rgba(5,7,11,0.99))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/20 to-transparent" />
        <div className="pointer-events-none absolute bottom-3 right-8 hidden h-40 w-40 opacity-65 sm:block">
          <Image
            src="/assets/lootboxes/mythic-lootbox.webp"
            alt=""
            fill
            sizes="160px"
            className="object-contain drop-shadow-[0_26px_50px_rgba(168,85,247,0.22)]"
            priority
          />
        </div>
        <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
          <div className="min-w-0">
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
          <div className="grid gap-2 rounded-[20px] border border-white/8 bg-black/25 p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                Vault balance
              </span>
              <ShardBadge value={shardBalance} className="py-1.5" />
            </div>
            <p className="text-[11px] leading-5 text-slate-400">
              Spend shards on boxes. Unlocks land directly in your inventory vault.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-5 grid gap-2.5 sm:grid-cols-3">
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

      <InventoryVault inventory={inventory} />

      <Surface
        eyebrow="Inventory"
        title="Recent unlocks"
        description="New lootbox results land here before the full cosmetics and perk inventory grows out."
      >
        {inventory.length ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {inventory.slice(0, 9).map((item) => (
              <div
                key={item.id}
                className={`rounded-[16px] border p-3 ${getInventoryTone(item.rarity)}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white">
                    <Gem className="h-3.5 w-3.5" />
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

      {reveal ? <LootboxRevealDialog reveal={reveal} onClose={() => setReveal(null)} /> : null}
    </div>
  );
}

function InventoryVault({
  inventory,
}: {
  inventory: Array<{ rarity: string; item_type: string }>;
}) {
  const rarityCounts = ["common", "rare", "epic", "legendary", "mythic"].map((rarity) => ({
    rarity,
    count: inventory.filter((item) => item.rarity === rarity).length,
  }));
  const cosmeticCount = inventory.filter((item) => item.item_type.includes("cosmetic")).length;

  return (
    <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
      <div className="rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(13,17,24,0.92),rgba(7,9,14,0.9))] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-200">
              Vault read
            </p>
            <h2 className="mt-2 text-[1rem] font-semibold tracking-[-0.03em] text-white">
              Inventory quality mix
            </h2>
          </div>
          <span className="rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">
            {inventory.length} unlocks
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-5">
          {rarityCounts.map((item) => (
            <div
              key={item.rarity}
              className={`rounded-[15px] border px-3 py-2.5 ${getInventoryTone(item.rarity)}`}
            >
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                {item.rarity}
              </p>
              <p className="mt-2 text-[1rem] font-semibold text-white">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[22px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_34%),linear-gradient(180deg,rgba(13,17,24,0.92),rgba(7,9,14,0.9))] p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300/18 bg-emerald-300/[0.08] text-emerald-100">
            <Archive className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200">
              Cosmetic lane
            </p>
            <p className="mt-1 text-[1rem] font-semibold text-white">{cosmeticCount} owned</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-400">
          Profile frames, glows and aura outcomes will become the visible identity layer.
        </p>
      </div>
    </section>
  );
}

function LootboxRevealDialog({
  reveal,
  onClose,
}: {
  reveal: LootboxReveal;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-xl">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.24),transparent_30%),radial-gradient(circle_at_20%_12%,rgba(16,185,129,0.13),transparent_24%),linear-gradient(180deg,rgba(12,15,22,0.98),rgba(4,6,10,0.99))] p-5 shadow-[0_34px_110px_rgba(0,0,0,0.62)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.035] text-slate-300 transition hover:border-white/14 hover:text-white"
          aria-label="Close lootbox reveal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid gap-5 sm:grid-cols-[190px_1fr] sm:items-center">
          <div className="relative flex min-h-48 items-center justify-center">
            <div className="absolute inset-x-6 bottom-8 h-14 rounded-full bg-black/50 blur-2xl" />
            <Image
              src={reveal.tierAssetPath}
              alt={reveal.tierLabel}
              width={260}
              height={260}
              className="relative h-44 w-44 object-contain drop-shadow-[0_26px_42px_rgba(0,0,0,0.52)]"
              sizes="176px"
            />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
              Lootbox opened
            </p>
            <h2 className="mt-3 text-[1.35rem] font-black tracking-[-0.05em] text-white">
              {reveal.item.label}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${getInventoryTone(reveal.item.rarity)}`}>
                {reveal.item.rarity}
              </span>
              <span className="rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-300">
                {reveal.item.item_type.replace(/_/g, " ")}
              </span>
            </div>

            <div className="mt-5 grid gap-2">
              <RevealRead label="Spent" value={`${reveal.shardSpend} shards`} />
              <RevealRead label="Refund" value={`${reveal.shardRefund} shards`} />
              <RevealRead label="Balance" value={`${reveal.balance} shards`} />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-300 px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-black transition hover:brightness-105"
            >
              <BadgeCheck className="h-4 w-4" />
              Add to vault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RevealRead({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-white/8 bg-white/[0.035] px-3 py-2.5">
      <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <span className="text-[11px] font-semibold text-white">{value}</span>
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

function getInventoryTone(rarity: string) {
  switch (rarity) {
    case "mythic":
      return "border-rose-300/22 bg-rose-300/[0.075] text-rose-100";
    case "legendary":
      return "border-amber-300/22 bg-amber-300/[0.075] text-amber-100";
    case "epic":
      return "border-violet-300/22 bg-violet-300/[0.075] text-violet-100";
    case "rare":
      return "border-sky-300/22 bg-sky-300/[0.075] text-sky-100";
    case "common":
    default:
      return "border-white/8 bg-white/[0.03] text-slate-200";
  }
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
