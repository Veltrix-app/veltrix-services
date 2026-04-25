"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Gem,
  Layers3,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  buildDefiMissionOverview,
  getPrimaryVaultMission,
  type DefiVaultMission,
} from "@/lib/defi/defi-missions-read-model";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusChip } from "@/components/ui/status-chip";

const overview = buildDefiMissionOverview();
const primaryVault = getPrimaryVaultMission();

const accentStyles = {
  lime: {
    text: "text-lime-200",
    softText: "text-lime-300",
    border: "border-lime-300/16",
    bg: "bg-lime-300/10",
    glow: "rgba(190,255,74,0.2)",
    gradient:
      "radial-gradient(circle_at_18%_12%,rgba(190,255,74,0.18),transparent_28%),linear-gradient(180deg,rgba(13,16,18,0.99),rgba(7,9,12,0.99))",
  },
  cyan: {
    text: "text-cyan-100",
    softText: "text-cyan-200",
    border: "border-cyan-300/16",
    bg: "bg-cyan-300/10",
    glow: "rgba(103,232,249,0.18)",
    gradient:
      "radial-gradient(circle_at_18%_12%,rgba(74,217,255,0.16),transparent_28%),linear-gradient(180deg,rgba(13,16,18,0.99),rgba(7,9,12,0.99))",
  },
  violet: {
    text: "text-violet-100",
    softText: "text-violet-200",
    border: "border-violet-300/16",
    bg: "bg-violet-300/10",
    glow: "rgba(167,139,250,0.18)",
    gradient:
      "radial-gradient(circle_at_18%_12%,rgba(167,139,250,0.16),transparent_28%),linear-gradient(180deg,rgba(13,16,18,0.99),rgba(7,9,12,0.99))",
  },
  amber: {
    text: "text-amber-100",
    softText: "text-amber-200",
    border: "border-amber-300/16",
    bg: "bg-amber-300/10",
    glow: "rgba(251,191,36,0.16)",
    gradient:
      "radial-gradient(circle_at_18%_12%,rgba(251,191,36,0.14),transparent_28%),linear-gradient(180deg,rgba(13,16,18,0.99),rgba(7,9,12,0.99))",
  },
} satisfies Record<DefiVaultMission["accent"], Record<string, string>>;

function shortenWallet(address?: string | null) {
  if (!address) return "Not connected";
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function DefiMissionsScreen() {
  const { session, profile } = useAuth();
  const [selectedSlug, setSelectedSlug] = useState(primaryVault.slug);
  const [flowPreviewOpen, setFlowPreviewOpen] = useState(false);

  const selectedVault = useMemo(
    () => overview.vaults.find((vault) => vault.slug === selectedSlug) ?? primaryVault,
    [primaryVault, selectedSlug]
  );
  const walletReady = Boolean(profile?.wallet);
  const selectedAccent = accentStyles[selectedVault.accent];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_320px]">
        <div className="relative overflow-hidden rounded-[28px] border border-white/6 bg-[radial-gradient(circle_at_12%_4%,rgba(190,255,74,0.13),transparent_22%),radial-gradient(circle_at_84%_12%,rgba(74,217,255,0.12),transparent_24%),linear-gradient(180deg,rgba(13,15,19,0.995),rgba(6,7,10,0.995))] p-4 shadow-[0_22px_72px_rgba(0,0,0,0.36)] sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025),transparent_34%)]" />

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-300">
                {overview.productName}
              </p>
              <h2 className="mt-4 max-w-3xl text-[clamp(1.45rem,2.4vw,2.7rem)] font-black leading-[0.98] tracking-[-0.045em] text-white">
                {overview.heroTitle}
              </h2>
              <p className="mt-4 max-w-3xl text-[13px] leading-6 text-slate-400 sm:text-sm">
                {overview.heroDescription}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <HeroMetric label="Vaults" value={String(overview.vaults.length)} />
              <HeroMetric label="Mode" value="Preview" />
              <HeroMetric label="Custody" value="None" />
            </div>
          </div>

          <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {overview.vaults.map((vault) => {
              const active = vault.slug === selectedVault.slug;
              const accent = accentStyles[vault.accent];

              return (
                <button
                  key={vault.slug}
                  type="button"
                  onClick={() => setSelectedSlug(vault.slug)}
                  className={`group rounded-[22px] border p-3.5 text-left transition ${
                    active
                      ? `${accent.border} ${accent.bg} shadow-[0_18px_48px_rgba(0,0,0,0.28)]`
                      : "border-white/6 bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-black/24 ${accent.text}`}
                    >
                      <Gem className="h-4 w-4" />
                    </span>
                    <StatusChip label={vault.chain} tone={active ? "positive" : "default"} />
                  </div>
                  <p className="mt-4 text-[0.96rem] font-semibold tracking-[-0.02em] text-white">
                    {vault.title}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-400">
                    {vault.intent}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {vault.apyLabel}
                    </span>
                    <ArrowRight
                      className={`h-4 w-4 transition ${
                        active ? accent.softText : "text-slate-500 group-hover:text-white"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="relative z-10 mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedSlug(primaryVault.slug)}
              className="rounded-full bg-lime-300 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-lime-200"
            >
              {overview.primaryCta}
            </button>
            <a
              href="#risk-notes"
              className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300 transition hover:border-white/12 hover:text-white"
            >
              {overview.secondaryCta}
            </a>
          </div>
        </div>

        <aside className="rounded-[26px] border border-white/6 bg-[radial-gradient(circle_at_bottom_right,rgba(190,255,74,0.12),transparent_28%),linear-gradient(180deg,rgba(13,15,18,0.99),rgba(7,9,12,0.99))] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
            Wallet posture
          </p>
          <p className="mt-3 text-[1rem] font-semibold text-white">
            {walletReady ? "Ready to verify" : session ? "Wallet needed" : "Preview mode"}
          </p>
          <p className="mt-2 text-[12px] leading-5 text-slate-400">
            {walletReady
              ? `${shortenWallet(profile?.wallet)} can be checked when verification ships.`
              : "Connect a wallet before we can verify vault shares or hold duration."}
          </p>

          <div className="mt-4 space-y-2.5">
            <WalletRead label="Access" value={session ? "Signed in" : "Preview"} icon={Wallet} />
            <WalletRead label="Network" value="Base first" icon={Layers3} />
            <WalletRead label="Safety" value="Non-custodial" icon={ShieldCheck} />
          </div>

          <Link
            href="/profile/edit"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-lime-300/18 bg-lime-300/12 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-lime-100 transition hover:bg-lime-300/18"
          >
            {walletReady ? "Manage wallet" : "Connect wallet"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.38fr)_360px]">
        <div
          className={`relative overflow-hidden rounded-[28px] border ${selectedAccent.border} p-4 shadow-[0_22px_64px_rgba(0,0,0,0.3)] sm:p-5`}
          style={{ background: selectedAccent.gradient }}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl"
            style={{ backgroundColor: selectedAccent.glow }}
          />

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${selectedAccent.softText}`}>
                Selected mission
              </p>
              <h3 className="mt-3 text-[1.28rem] font-semibold tracking-[-0.035em] text-white sm:text-[1.55rem]">
                {selectedVault.title}
              </h3>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-400">
                {selectedVault.intent}
              </p>
            </div>
            <StatusChip label={selectedVault.chain} tone="positive" />
          </div>

          <div className="relative z-10 mt-5 grid gap-3 md:grid-cols-4">
            <MissionMetric label="Asset" value={selectedVault.asset} />
            <MissionMetric label="Yield" value={selectedVault.apyLabel} />
            <MissionMetric label="Liquidity" value={selectedVault.liquidityLabel} />
            <MissionMetric label="Withdrawal" value={selectedVault.withdrawalLabel} />
          </div>

          <div className="relative z-10 mt-5 grid gap-3 md:grid-cols-4">
            {selectedVault.steps.map((step, index) => (
              <div
                key={step.label}
                className={`rounded-[20px] border p-3.5 ${
                  step.state === "ready"
                    ? "border-lime-300/18 bg-lime-300/10"
                    : step.state === "next"
                      ? "border-white/10 bg-white/[0.04]"
                      : "border-white/6 bg-black/18"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    0{index + 1}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      step.state === "ready"
                        ? "bg-lime-300"
                        : step.state === "next"
                          ? "bg-cyan-200"
                          : "bg-white/18"
                    }`}
                  />
                </div>
                <p className="mt-3 text-[13px] font-semibold text-white">{step.label}</p>
                <p className="mt-2 text-[11px] leading-5 text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-black/22 p-3.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Launch action
              </p>
              <p className="mt-1.5 text-[13px] font-semibold text-white">{selectedVault.actionLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setFlowPreviewOpen((current) => !current)}
              className="rounded-full bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-lime-200"
            >
              {flowPreviewOpen ? "Hide flow" : "Preview flow"}
            </button>
          </div>

          {flowPreviewOpen ? (
            <div className="relative z-10 mt-3 grid gap-2 rounded-[20px] border border-white/8 bg-black/20 p-3.5 sm:grid-cols-3">
              <FlowPreviewStep
                label="Now"
                value="Read-only page"
                description="Users can understand the vault route before any transaction UI exists."
              />
              <FlowPreviewStep
                label="Next"
                value="On-chain check"
                description="We verify vault shares and duration from the connected wallet."
              />
              <FlowPreviewStep
                label="Then"
                value="XP economy"
                description="Hold time, tiers and sponsored reward pools become the growth layer."
              />
            </div>
          ) : null}
        </div>

        <aside id="risk-notes" className="space-y-4">
          <div className="rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,15,18,0.99),rgba(7,9,12,0.99))] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-300">
              Reward layer
            </p>
            <p className="mt-3 text-[1rem] font-semibold text-white">
              {selectedVault.rewardPreview.label}
            </p>
            <p className="mt-2 text-[12px] leading-5 text-slate-400">
              {selectedVault.rewardPreview.description}
            </p>
            <div className="mt-4 rounded-[18px] border border-white/6 bg-white/[0.03] p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Status
              </p>
              <p className="mt-2 text-[13px] font-semibold text-white">
                {selectedVault.rewardPreview.phase}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,15,18,0.99),rgba(7,9,12,0.99))] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-200">
              Risk note
            </p>
            <p className="mt-3 text-[13px] font-semibold text-white">{selectedVault.riskLabel}</p>
            <p className="mt-2 text-[12px] leading-5 text-slate-400">
              {overview.disclosure}
            </p>
            <p className="mt-3 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {selectedVault.subtleProtocolLabel}
            </p>
          </div>
        </aside>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {overview.productRails.map((rail) => (
          <div
            key={rail.label}
            className="rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,15,18,0.98),rgba(7,9,12,0.98))] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  {rail.label}
                </p>
                <p className="mt-2 text-[0.96rem] font-semibold text-white">{rail.value}</p>
              </div>
              <Sparkles className="h-4 w-4 text-lime-200" />
            </div>
            <p className="mt-3 text-[12px] leading-5 text-slate-400">{rail.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-black/20 px-3 py-2.5 text-right">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-[12px] font-semibold text-white">{value}</p>
    </div>
  );
}

function WalletRead({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[17px] border border-white/6 bg-white/[0.03] px-3 py-2.5">
      <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-[11px] font-semibold text-white">{value}</span>
    </div>
  );
}

function MissionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-black/20 px-3.5 py-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-[13px] font-semibold text-white">{value}</p>
    </div>
  );
}

function FlowPreviewStep({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-white/[0.03] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-[12px] font-semibold text-white">{value}</p>
      <p className="mt-1.5 text-[10px] leading-4 text-slate-400">{description}</p>
    </div>
  );
}
