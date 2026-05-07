"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import {
  Archive,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Gem,
  History,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { LootboxCard } from "@/components/lootboxes/lootbox-card";
import { ShardBadge } from "@/components/ui/shard-badge";
import { useLiveUserData } from "@/hooks/use-live-user-data";
import { buildLootboxInventoryRead } from "@/lib/lootboxes/lootbox-inventory-read";

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
  const {
    loading,
    error,
    shardBalance,
    lootboxTiers,
    inventory,
    openLootbox,
    requestLootboxClaim,
    equipLootboxUtility,
  } =
    useLiveUserData({ datasets: ["lootboxes", "inventory"] });
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const [claimingItemId, setClaimingItemId] = useState<string | null>(null);
  const [equippingItemId, setEquippingItemId] = useState<string | null>(null);
  const [reveal, setReveal] = useState<LootboxReveal | null>(null);
  const [message, setMessage] = useState<{
    tone: "default" | "success" | "error";
    text: string;
  } | null>(null);
  const inventoryRead = useMemo(() => buildLootboxInventoryRead(inventory), [inventory]);

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

  async function handleRequestClaim(inventoryItemId: string) {
    setClaimingItemId(inventoryItemId);
    setMessage({ tone: "default", text: "Routing reward into operator review..." });
    const result = await requestLootboxClaim(inventoryItemId);

    if (!result.ok) {
      setMessage({
        tone: "error",
        text: result.error ?? "Lootbox fulfillment request failed.",
      });
      setClaimingItemId(null);
      return;
    }

    setMessage({
      tone: "success",
      text: `${result.inventoryItem?.label ?? "Lootbox reward"} is now in review.`,
    });
    setClaimingItemId(null);
  }

  async function handleEquipUtility(inventoryItemId: string) {
    const item = inventoryRead.items.find((row) => row.id === inventoryItemId);
    const utilityLabel = item?.utility.isProfileCosmetic ? "cosmetic" : "title";
    setEquippingItemId(inventoryItemId);
    setMessage({ tone: "default", text: `Equipping ${utilityLabel} on your public profile...` });
    const result = await equipLootboxUtility(inventoryItemId);

    if (!result.ok) {
      setMessage({
        tone: "error",
        text: result.error ?? "Lootbox equip failed.",
      });
      setEquippingItemId(null);
      return;
    }

    setMessage({
      tone: "success",
      text: `${result.equippedLabel ?? "Lootbox reward"} is now equipped.`,
    });
    setEquippingItemId(null);
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
          <HeroStat label="Claimable" value={String(inventoryRead.summary.claimable)} meta="ready rewards" />
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

      <InventoryVault
        read={inventoryRead}
        claimingItemId={claimingItemId}
        equippingItemId={equippingItemId}
        onRequestClaim={(inventoryItemId) => void handleRequestClaim(inventoryItemId)}
        onEquipUtility={(inventoryItemId) => void handleEquipUtility(inventoryItemId)}
      />

      {reveal ? <LootboxRevealDialog reveal={reveal} onClose={() => setReveal(null)} /> : null}
    </div>
  );
}

type InventoryRead = ReturnType<typeof buildLootboxInventoryRead>;
type InventoryReadItem = InventoryRead["items"][number];

function InventoryVault({
  read,
  claimingItemId,
  equippingItemId,
  onRequestClaim,
  onEquipUtility,
}: {
  read: InventoryRead;
  claimingItemId: string | null;
  equippingItemId: string | null;
  onRequestClaim: (inventoryItemId: string) => void;
  onEquipUtility: (inventoryItemId: string) => void;
}) {
  const activeItems = read.items.slice(0, 8);

  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_12%_0%,rgba(16,185,129,0.1),transparent_28%),linear-gradient(180deg,rgba(13,17,24,0.96),rgba(7,9,14,0.96))] p-4 shadow-[0_18px_52px_rgba(0,0,0,0.24)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-200">
              Reward vault
            </p>
            <h2 className="mt-2 text-[1rem] font-semibold tracking-[-0.03em] text-white">
              Claim and fulfillment lane
            </h2>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-slate-400">
              Lootbox unlocks now show whether they are ready, queued, applied or fulfilled.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <VaultMetric label="Total" value={read.summary.total} />
            <VaultMetric label="Claimable" value={read.summary.claimable} tone="success" />
            <VaultMetric label="Review" value={read.summary.pendingReview} tone="warning" />
            <VaultMetric label="High rarity" value={read.summary.highRarity} tone="rare" />
          </div>
        </div>

        <div className="mt-4 grid gap-2.5">
          {activeItems.length ? (
            activeItems.map((item) => (
              <InventoryRewardRow
                key={item.id}
                item={item}
                busy={claimingItemId === item.id}
                equipBusy={equippingItemId === item.id}
                onRequestClaim={() => onRequestClaim(item.id)}
                onEquipUtility={() => onEquipUtility(item.id)}
              />
            ))
          ) : (
            <div className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.025] p-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.035] text-slate-300">
                <Archive className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[12px] font-semibold text-white">No lootbox unlocks yet.</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Open a box and the reward will land here first.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.1),transparent_34%),linear-gradient(180deg,rgba(13,17,24,0.95),rgba(7,9,14,0.95))] p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300/18 bg-emerald-300/[0.08] text-emerald-100">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200">
              Fulfillment
            </p>
            <p className="mt-1 text-[1rem] font-semibold text-white">Operator-backed</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <FulfillmentStep
            icon={<Send className="h-3.5 w-3.5" />}
            label="Ready"
            value={`${read.summary.claimable} requestable`}
            tone="success"
          />
          <FulfillmentStep
            icon={<Clock3 className="h-3.5 w-3.5" />}
            label="In review"
            value={`${read.summary.pendingReview} queued`}
            tone="warning"
          />
          <FulfillmentStep
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            label="Claimed"
            value={`${read.summary.claimed} fulfilled`}
            tone="default"
          />
        </div>

        <div className="mt-4 rounded-[18px] border border-white/8 bg-black/20 p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
            Auto-applied
          </p>
          <p className="mt-2 text-[1.35rem] font-semibold tracking-[-0.04em] text-white">
            {read.summary.autoApplied}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Shard refunds stay visible in the vault without creating manual work.
          </p>
        </div>
      </aside>
    </section>
  );
}

function InventoryRewardRow({
  item,
  busy,
  equipBusy,
  onRequestClaim,
  onEquipUtility,
}: {
  item: InventoryReadItem;
  busy: boolean;
  equipBusy: boolean;
  onRequestClaim: () => void;
  onEquipUtility: () => void;
}) {
  const hasEquipUtility = item.utility.isTitle || item.utility.isProfileCosmetic;
  const canEquipUtility = item.utility.canEquipTitle || item.utility.canEquipCosmetic;
  const equipActionLabel = item.utility.isProfileCosmetic
    ? item.utility.cosmeticActionLabel
    : item.utility.equipActionLabel;

  return (
    <article className="grid gap-3 rounded-[18px] border border-white/8 bg-white/[0.025] p-3 transition hover:border-white/12 md:grid-cols-[minmax(0,1fr)_170px] md:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${getInventoryTone(item.rarity)}`}
        >
          <Gem className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[13px] font-semibold text-white">{item.label}</h3>
            <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${getStatusTone(item.statusTone)}`}>
              {item.statusLabel}
            </span>
          </div>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
            {item.rarity} / {item.itemType.replace(/_/g, " ")}
          </p>
          <p className="mt-2 line-clamp-1 text-[11px] leading-5 text-slate-400">
            {item.payloadSummary}
          </p>
          <p className="mt-1 line-clamp-1 text-[10px] leading-4 text-slate-500">
            {item.fulfillment.nextStep}
          </p>
          <FulfillmentTimeline steps={item.fulfillment.timeline} />
          <FulfillmentActivity events={item.fulfillment.events} />
          <LatestFulfillmentNote note={item.fulfillment.latestNote} />
        </div>
      </div>

      <div className="grid gap-2">
        {hasEquipUtility ? (
          <button
            type="button"
            onClick={onEquipUtility}
            disabled={!canEquipUtility || equipBusy}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-violet-300/18 bg-violet-300/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-violet-100 transition hover:border-violet-200/32 hover:bg-violet-300/[0.13] disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.035] disabled:text-slate-500"
          >
            <Trophy className="h-3.5 w-3.5" />
            {equipBusy ? "Equipping..." : equipActionLabel}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onRequestClaim}
          disabled={!item.canRequestClaim || busy}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100 transition hover:border-emerald-200/32 hover:bg-emerald-300/[0.13] disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.035] disabled:text-slate-500"
        >
          {item.canRequestClaim ? <Send className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {busy ? "Routing..." : item.primaryActionLabel}
        </button>
      </div>
    </article>
  );
}

function FulfillmentActivity({
  events,
}: {
  events: InventoryReadItem["fulfillment"]["events"];
}) {
  if (!events.length) {
    return null;
  }

  return (
    <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
      {events.map((event) => (
        <div
          key={event.id}
          className={`min-w-0 rounded-[12px] border px-2.5 py-2 ${getFulfillmentEventTone(event.tone)}`}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <History className="h-3 w-3 shrink-0 opacity-75" />
            <span className="truncate text-[8px] font-black uppercase tracking-[0.12em]">
              {event.label}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-[10px] leading-4 opacity-75">{event.detail}</p>
          {event.reference ? (
            <p className="mt-1 truncate text-[8px] font-black uppercase tracking-[0.12em] opacity-55">
              Ref {event.reference}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function LatestFulfillmentNote({
  note,
}: {
  note: InventoryReadItem["fulfillment"]["latestNote"];
}) {
  if (!note) {
    return null;
  }

  return (
    <div className="mt-2 flex min-w-0 items-start gap-2 rounded-[14px] border border-emerald-300/14 bg-emerald-300/[0.055] px-3 py-2">
      <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-100" />
      <div className="min-w-0">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-100/80">
          Latest update
        </p>
        <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-300">{note.note}</p>
        {note.reference ? (
          <p className="mt-1 truncate text-[8px] font-black uppercase tracking-[0.12em] text-emerald-100/55">
            Reference {note.reference}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FulfillmentTimeline({
  steps,
}: {
  steps: InventoryReadItem["fulfillment"]["timeline"];
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {steps.map((step, index) => (
        <div key={`${step.label}-${index}`} className="flex items-center gap-1.5">
          <span
            className={`inline-flex h-5 items-center rounded-full border px-2 text-[8px] font-black uppercase tracking-[0.12em] ${
              step.state === "complete"
                ? "border-emerald-300/18 bg-emerald-300/[0.075] text-emerald-100"
                : step.state === "current"
                  ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-100"
                  : "border-white/8 bg-white/[0.025] text-slate-500"
            }`}
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <span className="h-px w-3 bg-white/10" aria-hidden="true" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function VaultMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "rare";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-300/18 bg-emerald-300/[0.07] text-emerald-100"
      : tone === "warning"
        ? "border-amber-300/18 bg-amber-300/[0.07] text-amber-100"
        : tone === "rare"
          ? "border-violet-300/18 bg-violet-300/[0.07] text-violet-100"
          : "border-white/8 bg-white/[0.035] text-white";

  return (
    <div className={`min-w-24 rounded-[16px] border px-3 py-2 ${toneClass}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-1 text-[1rem] font-semibold">{value}</p>
    </div>
  );
}

function FulfillmentStep({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "success" | "warning" | "default";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-300/16 bg-emerald-300/[0.065] text-emerald-100"
      : tone === "warning"
        ? "border-amber-300/16 bg-amber-300/[0.065] text-amber-100"
        : "border-white/8 bg-white/[0.03] text-slate-200";

  return (
    <div className={`flex items-center justify-between gap-3 rounded-[16px] border px-3 py-2.5 ${toneClass}`}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/15">
          {icon}
        </span>
        <span className="truncate text-[11px] font-semibold">{label}</span>
      </div>
      <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.14em] opacity-70">
        {value}
      </span>
    </div>
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

function getStatusTone(tone: InventoryReadItem["statusTone"]) {
  switch (tone) {
    case "success":
      return "border-emerald-300/18 bg-emerald-300/[0.075] text-emerald-100";
    case "warning":
      return "border-amber-300/18 bg-amber-300/[0.075] text-amber-100";
    case "danger":
      return "border-rose-300/18 bg-rose-300/[0.075] text-rose-100";
    case "default":
    default:
      return "border-white/8 bg-white/[0.035] text-slate-300";
  }
}

function getFulfillmentEventTone(tone: InventoryReadItem["fulfillment"]["events"][number]["tone"]) {
  switch (tone) {
    case "success":
      return "border-emerald-300/16 bg-emerald-300/[0.06] text-emerald-100";
    case "warning":
      return "border-amber-300/16 bg-amber-300/[0.06] text-amber-100";
    case "danger":
      return "border-rose-300/16 bg-rose-300/[0.06] text-rose-100";
    case "default":
    default:
      return "border-white/8 bg-white/[0.028] text-slate-300";
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
