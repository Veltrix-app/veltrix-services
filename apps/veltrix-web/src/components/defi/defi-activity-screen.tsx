"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, History, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusChip } from "@/components/ui/status-chip";
import { useDefiActivity } from "@/hooks/use-defi-activity";
import type { DefiActivityCategory, DefiActivityItem } from "@/lib/defi/defi-activity";

type FilterValue = "all" | DefiActivityCategory;

const filters: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "All proof" },
  { value: "vault", label: "Vaults" },
  { value: "market", label: "Borrow / lending" },
  { value: "xp", label: "XP claims" },
];

function shortenWallet(address?: string | null) {
  if (!address) return "No wallet";
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusTone(status: string, tone: string) {
  if (tone === "danger") return "danger";
  if (tone === "warning") return "warning";
  if (tone === "info") return "info";
  if (status === "confirmed") return "positive";
  return "default";
}

export function DefiActivityScreen() {
  const { session, profile } = useAuth();
  const [filter, setFilter] = useState<FilterValue>("all");
  const activity = useDefiActivity({
    accessToken: session?.access_token,
    wallet: profile?.wallet,
  });
  const filteredItems = useMemo(() => {
    if (filter === "all") {
      return activity.activity.items;
    }

    return activity.activity.items.filter((item) => item.category === filter);
  }, [activity.activity.items, filter]);
  const walletReady = Boolean(profile?.wallet);
  const summary = activity.activity.summary;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative overflow-hidden rounded-[30px] border border-white/6 bg-[radial-gradient(circle_at_12%_0%,rgba(190,255,74,0.13),transparent_28%),radial-gradient(circle_at_90%_18%,rgba(74,217,255,0.1),transparent_28%),linear-gradient(180deg,rgba(13,15,19,0.99),rgba(6,7,10,0.995))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03),transparent_35%)]" />
          <div className="relative z-10 max-w-4xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-lime-300">
              DeFi proof center
            </p>
            <h2 className="mt-4 max-w-3xl text-[clamp(1.7rem,2.8vw,3.25rem)] font-black leading-[0.96] tracking-[-0.05em] text-white">
              One timeline for every vault, lending and XP proof.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              This is the audit trail users need before the XP economy gets bigger: wallet-linked
              transactions, proof status, XP claims and the exact Basescan reference when funds
              moved.
            </p>
          </div>

          <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ActivityMetric label="Proof items" value={String(summary.totalItems)} />
            <ActivityMetric label="Confirmed tx" value={String(summary.confirmedTransactions)} />
            <ActivityMetric label="XP claims" value={String(summary.xpClaims)} />
            <ActivityMetric label="Wallet" value={shortenWallet(profile?.wallet)} />
          </div>
        </div>

        <div className="rounded-[28px] border border-lime-300/10 bg-lime-300/[0.055] p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-lime-300/14 bg-lime-300/10 text-lime-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
            Proof posture
          </p>
          <h3 className="mt-2 text-[1.15rem] font-black tracking-[-0.04em] text-white">
            {walletReady ? "Verified wallet history" : "Connect wallet first"}
          </h3>
          <p className="mt-2 text-[12px] leading-6 text-slate-400">
            {walletReady
              ? "The timeline is scoped to your verified wallet and account."
              : "Preview is visible, but proof history needs a signed-in account with a verified wallet."}
          </p>
          <button
            type="button"
            onClick={activity.refresh}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:border-white/12 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh proof
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <ActivityMetric label="Vault tx" value={String(summary.vaultTransactions)} />
        <ActivityMetric label="Market tx" value={String(summary.marketTransactions)} />
        <ActivityMetric label="Pending" value={String(summary.pendingTransactions)} />
        <ActivityMetric label="Failed" value={String(summary.failedTransactions)} />
      </section>

      <section className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,15,19,0.99),rgba(6,7,10,0.995))] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
              Activity timeline
            </p>
            <h3 className="mt-2 text-[1.25rem] font-black tracking-[-0.04em] text-white">
              Proof history
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((nextFilter) => (
              <button
                key={nextFilter.value}
                type="button"
                onClick={() => setFilter(nextFilter.value)}
                className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                  filter === nextFilter.value
                    ? "bg-lime-300 text-black"
                    : "border border-white/8 bg-white/[0.035] text-slate-400 hover:text-white"
                }`}
              >
                {nextFilter.label}
              </button>
            ))}
          </div>
        </div>

        {activity.status === "loading" ? (
          <div className="mt-5 rounded-[22px] border border-white/6 bg-white/[0.025] p-5 text-[13px] leading-6 text-slate-400">
            Reading wallet proof history...
          </div>
        ) : null}

        {activity.error ? (
          <div className="mt-5 rounded-[22px] border border-rose-300/14 bg-rose-300/[0.06] p-5 text-[13px] leading-6 text-rose-100">
            {activity.error}
          </div>
        ) : null}

        {activity.warning ? (
          <div className="mt-5 rounded-[22px] border border-amber-300/14 bg-amber-300/[0.055] p-5 text-[13px] leading-6 text-amber-100">
            {activity.warning}
          </div>
        ) : null}

        {filteredItems.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {filteredItems.map((item) => (
              <ActivityItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : activity.status !== "loading" ? (
          <EmptyActivityState walletReady={walletReady} />
        ) : null}
      </section>
    </div>
  );
}

function ActivityItemCard({ item }: { item: DefiActivityItem }) {
  return (
    <div className="group grid gap-4 rounded-[22px] border border-white/6 bg-white/[0.025] p-4 transition hover:border-white/10 hover:bg-white/[0.04] lg:grid-cols-[190px_minmax(0,1fr)_auto]">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
          {item.routeLabel}
        </p>
        <p className="mt-2 text-[12px] font-semibold text-white">{formatDate(item.timestamp)}</p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip label={item.status} tone={getStatusTone(item.status, item.tone)} />
          <span className="rounded-full border border-white/6 bg-black/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
            {item.actionLabel}
          </span>
        </div>
        <h4 className="mt-3 text-[1rem] font-black tracking-[-0.035em] text-white">
          {item.title}
        </h4>
        <p className="mt-1.5 text-[12px] leading-5 text-slate-400">{item.description}</p>
        {item.txHash ? (
          <p className="mt-2 break-all text-[10px] font-semibold text-slate-500">
            {item.txHash}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-start lg:justify-end">
        {item.href ? (
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:border-white/12 hover:text-white"
          >
            Basescan
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/12 bg-lime-300/[0.08] px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-lime-200">
            Internal proof
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyActivityState({ walletReady }: { walletReady: boolean }) {
  return (
    <div className="mt-5 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-white/[0.035] text-lime-200">
        <History className="h-5 w-5" />
      </div>
      <h4 className="mt-4 text-[1.05rem] font-black tracking-[-0.035em] text-white">
        {walletReady ? "No proof yet" : "Wallet proof locked"}
      </h4>
      <p className="mx-auto mt-2 max-w-xl text-[13px] leading-6 text-slate-400">
        {walletReady
          ? "Start with a vault deposit, market supply or XP claim. Confirmed actions will land here automatically."
          : "Connect a verified wallet to load your private DeFi proof history."}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link
          href="/defi/vaults"
          className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-black transition hover:bg-lime-200"
        >
          Open vaults
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/defi/borrow-lending"
          className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:text-white"
        >
          Open lending
        </Link>
      </div>
    </div>
  );
}

function ActivityMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-black/20 px-3.5 py-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-[13px] font-semibold text-white">{value}</p>
    </div>
  );
}
