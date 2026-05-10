"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowRightLeft,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  History,
  Layers3,
  ShieldCheck,
  Wallet,
  WalletCards,
} from "lucide-react";
import { DefiRouteNav } from "@/components/defi/defi-route-nav";
import { DefiSafetyPanel } from "@/components/defi/defi-safety-panel";
import { FeatureBadgeMark } from "@/components/ui/feature-badge-mark";

const DEFI_HERO_IMAGE = "/assets/defi/defi-hero.webp";

function toBackgroundImage(value: string) {
  return `url("${value.replaceAll('"', '\\"')}")`;
}

const defiShowcaseRoutes = [
  {
    href: "/defi/swap",
    label: "Swap",
    eyebrow: "Asset route",
    icon: ArrowRightLeft,
    image: "/brand/defi/defi-swap-purple.png",
    badge: "swap",
    accent: "violet",
    description:
      "Move into the right asset before vaults, lending or trading missions with a VYNTRO-native route finder.",
    shortDescription: "Route into the right asset before vaults, lending or competitions.",
    signal: "Best route",
    proof: "Quote safety",
  },
  {
    href: "/defi/vaults",
    label: "Vault missions",
    eyebrow: "Lower complexity",
    icon: Wallet,
    image: "/brand/defi/defi-vaults-green.png",
    badge: "vaults",
    accent: "lime",
    description:
      "Deposit and withdraw through curated vault routes while VYNTRO tracks proof for future XP.",
    shortDescription: "Curated deposit and withdraw routes with proof for future XP.",
    signal: "Lower risk",
    proof: "Vault proof",
  },
  {
    href: "/defi/borrow-lending",
    label: "Borrow / lending",
    eyebrow: "Advanced route",
    icon: Layers3,
    image: "/brand/defi/defi-borrow-lending-blue.png",
    badge: "lending",
    accent: "blue",
    description:
      "Supply, enable collateral, borrow, repay and monitor positions with explicit safety gates.",
    shortDescription: "Supply, borrow, repay and monitor risk behind clear safety gates.",
    signal: "Advanced",
    proof: "Risk gates",
  },
  {
    href: "/trading-arena",
    label: "Trading Arena",
    eyebrow: "Competition layer",
    icon: BarChart3,
    image: "/brand/defi/defi-trading-arena-gold.png",
    badge: "leaderboard",
    accent: "amber",
    description:
      "Launch or join snapshot and live-tracked trading competitions with cost caps, rewards and leaderboards.",
    shortDescription: "Snapshot and live-tracked competitions with rewards and leaderboards.",
    signal: "Competitive",
    proof: "Cost caps",
  },
] as const;

const accentClasses = {
  violet: {
    icon: "border-violet-300/15 bg-violet-400/16 text-violet-200 shadow-[0_0_34px_rgba(168,85,247,0.16)]",
    label: "text-violet-200",
    glow: "bg-violet-500/20",
    line: "from-violet-300/60 via-violet-300/18",
  },
  lime: {
    icon: "border-lime-300/15 bg-lime-300/14 text-lime-200 shadow-[0_0_34px_rgba(190,255,74,0.14)]",
    label: "text-lime-200",
    glow: "bg-lime-300/18",
    line: "from-lime-300/60 via-lime-300/18",
  },
  blue: {
    icon: "border-blue-300/15 bg-blue-400/14 text-blue-200 shadow-[0_0_34px_rgba(59,130,246,0.16)]",
    label: "text-blue-200",
    glow: "bg-blue-400/18",
    line: "from-blue-300/60 via-blue-300/18",
  },
  amber: {
    icon: "border-amber-300/15 bg-amber-300/14 text-amber-200 shadow-[0_0_34px_rgba(245,158,11,0.15)]",
    label: "text-amber-200",
    glow: "bg-amber-300/18",
    line: "from-amber-300/60 via-amber-300/18",
  },
} as const;

const secondaryRoutes = [
  {
    href: "/defi/portfolio",
    label: "Portfolio dashboard",
    eyebrow: "Command read",
    icon: WalletCards,
    description:
      "One wallet-scoped overview for vaults, supplied markets, borrowed markets, claimable XP and the next safe action.",
    signal: "Wallet read",
    action: "Open cockpit",
  },
  {
    href: "/defi/risk-guide",
    label: "Risk guide",
    eyebrow: "Education layer",
    icon: BookOpenCheck,
    description:
      "Compact guidance for collateral, liquidation, repay discipline and non-custodial wallet flow.",
    signal: "Route rules",
    action: "Read safety",
  },
  {
    href: "/defi/activity",
    label: "Activity proof",
    eyebrow: "Proof center",
    icon: History,
    description:
      "Review vault transactions, lending actions, XP claims and Basescan references in one wallet-scoped timeline.",
    signal: "Proof log",
    action: "Review proof",
  },
] as const;

const commandStats = [
  { label: "Custody", value: "Never held" },
  { label: "Routes", value: "Separated" },
  { label: "XP", value: "Proof-backed" },
] as const;

export function DefiLandingScreen() {
  return (
    <section className="relative -mt-2 overflow-hidden pb-4">
      <div className="pointer-events-none absolute inset-x-[-8%] top-[-10rem] h-[28rem] bg-[linear-gradient(115deg,rgba(190,255,74,0.08),transparent_28%),linear-gradient(90deg,transparent,rgba(0,132,255,0.08)_54%,transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35 [mask-image:linear-gradient(180deg,black,transparent_72%)]" />

      <DefiHero />

      <div className="relative mt-3">
        <DefiRouteNav compact />
      </div>

      <div className="relative mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_25.5rem] xl:items-start">
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            {secondaryRoutes.map((route) => {
              const Icon = route.icon;

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className="group relative min-h-[12.25rem] overflow-hidden rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)_54%,rgba(0,0,0,0.18))] p-4 shadow-[0_18px_64px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-lime-300/20 hover:bg-white/[0.055]"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-lime-300/45 via-cyan-200/10 to-transparent" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-lime-300/12 bg-lime-300/[0.07] text-lime-200 shadow-[0_0_34px_rgba(190,255,74,0.08)]">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-lime-200" />
                  </div>
                  <p className="mt-4 text-[9px] font-black uppercase tracking-[0.22em] text-lime-300">
                    {route.eyebrow}
                  </p>
                  <h3 className="mt-2 text-[1.08rem] font-black tracking-normal text-white">
                    {route.label}
                  </h3>
                  <p className="mt-2 text-[12px] leading-5 text-slate-400">
                    {route.description}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/24 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-slate-300">
                      <CheckCircle2 className="h-3 w-3 text-lime-300" />
                      {route.signal}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.13em] text-cyan-200">
                      {route.action}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {defiShowcaseRoutes.map((route) => {
              const Icon = route.icon;
              const accent = accentClasses[route.accent];

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className="group relative isolate min-h-[18rem] overflow-hidden rounded-[26px] border border-white/8 bg-[#05070b] shadow-[0_22px_70px_rgba(0,0,0,0.30)] transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_30px_92px_rgba(0,0,0,0.42)]"
                >
                  <Image
                    src={route.image}
                    alt={`${route.label} cinematic VYNTRO DeFi artwork`}
                    fill
                    priority={route.href === "/defi/swap"}
                    sizes="(min-width: 1536px) 18vw, (min-width: 1280px) 34vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover object-center opacity-[0.7] saturate-125 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-[0.9]"
                  />

                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,3,7,0.94)_0%,rgba(2,3,7,0.72)_46%,rgba(2,3,7,0.1)_100%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,3,7,0.04)_0%,transparent_30%,rgba(2,3,7,0.9)_100%)]" />
                  <FeatureBadgeMark
                    badge={route.badge}
                    className="absolute right-5 top-12 z-[1] h-28 w-28 opacity-[0.32] mix-blend-screen transition duration-500 group-hover:scale-105 group-hover:opacity-[0.48]"
                    imageClassName="rotate-[9deg]"
                    sizes="128px"
                  />
                  <div className={`absolute -left-24 top-1 h-40 w-40 rounded-full ${accent.glow} blur-3xl transition duration-700 group-hover:opacity-90`} />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/18 via-white/5 to-transparent" />
                  <div className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r ${accent.line} to-transparent`} />
                  <ArrowRight className="absolute right-4 top-4 z-10 h-4 w-4 text-white/36 transition group-hover:translate-x-0.5 group-hover:text-white/78" />

                  <div className="relative z-10 flex min-h-[18rem] max-w-[19rem] flex-col justify-end p-5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-xl ${accent.icon}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <p
                      className={`mt-4 text-[8px] font-black uppercase tracking-[0.28em] ${accent.label}`}
                    >
                      {route.eyebrow}
                    </p>
                    <h2 className="mt-2 text-3xl font-black leading-[0.95] tracking-normal text-white [text-shadow:0_18px_55px_rgba(0,0,0,0.72)]">
                      {route.label}
                    </h2>
                    <p className="mt-2.5 max-w-[17rem] text-[0.76rem] leading-5 text-slate-100/78 [text-shadow:0_16px_42px_rgba(0,0,0,0.85)]">
                      {route.shortDescription}
                    </p>
                    <div className="mt-4 grid grid-cols-2 border-t border-white/10 pt-3">
                      <div className="pr-3">
                        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-500">
                          Signal
                        </p>
                        <p className="mt-1 text-[11px] font-black text-white">{route.signal}</p>
                      </div>
                      <div className="border-l border-white/10 pl-3">
                        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-500">
                          Proof
                        </p>
                        <p className="mt-1 text-[11px] font-black text-white">{route.proof}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <DefiSafetyPanel
          compact
          route="overview"
          showGlobalContract
          className="xl:sticky xl:top-4"
        />
      </div>
    </section>
  );
}

function DefiHero() {
  return (
    <section className="motion-surface motion-light-sweep relative overflow-hidden rounded-[34px] border border-white/7 bg-[#05080b] shadow-[0_32px_110px_rgba(0,0,0,0.38)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.98] brightness-[0.96] contrast-110 saturate-125"
        style={{ backgroundImage: toBackgroundImage(DEFI_HERO_IMAGE) }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_18%,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_18%_52%,rgba(34,211,238,0.13),transparent_28%),linear-gradient(90deg,rgba(1,3,7,0.9),rgba(2,4,10,0.68)_35%,rgba(3,4,10,0.24)_62%,rgba(3,5,9,0.72)),linear-gradient(180deg,rgba(4,6,10,0.04),rgba(3,5,8,0.76))]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#050608] to-transparent" />

      <div className="relative z-10 grid min-h-[560px] gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_410px] xl:items-end">
        <div className="max-w-4xl self-end pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <HeroChip tone="lime">Never custody</HeroChip>
            <HeroChip tone="cyan">Route separated</HeroChip>
            <HeroChip tone="violet">Proof before XP</HeroChip>
          </div>

          <h1 className="mt-7 max-w-[12ch] text-[3.4rem] font-black leading-[0.88] tracking-normal text-white [text-shadow:0_18px_70px_rgba(0,0,0,0.72)] sm:text-[4.8rem] xl:text-[6.6rem]">
            DeFi command center
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-100 sm:text-[1rem]">
            Choose the route before capital moves. Swap, vaults, lending, trading and proof history stay separated so every wallet action starts with a safer next move.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/defi/swap"
              className="motion-press inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-lime-200"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Open swap
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/defi/portfolio"
              className="motion-press inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl transition hover:border-cyan-300/24 hover:bg-cyan-300/10"
            >
              Portfolio read
              <WalletCards className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid max-w-3xl gap-2.5 sm:grid-cols-3">
            {commandStats.map((stat) => (
              <HeroSignal key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>

        <div className="motion-surface relative overflow-hidden rounded-[28px] border border-white/9 bg-black/48 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.13),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_45%)]" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Safety posture</p>
                <h2 className="mt-2 text-[1.35rem] font-black text-white">Move only after the route is clear.</h2>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/18 bg-cyan-300/10 text-cyan-100">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
              <div className="h-full w-[82%] rounded-full bg-[linear-gradient(90deg,#74f7ff,#beff4a,#c4b5fd)] shadow-[0_0_24px_rgba(116,247,255,0.28)]" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <HeroPanelMetric label="Custody" value="0" sub="VYNTRO never holds funds" />
              <HeroPanelMetric label="Routes" value="4" sub="Swap, vaults, lending, trading" />
              <HeroPanelMetric label="Proof" value="On" sub="Activity before XP" />
              <HeroPanelMetric label="Risk" value="Split" sub="Each route isolated" />
            </div>

            <Link
              href="/defi/risk-guide"
              className="mt-4 block rounded-[20px] border border-white/8 bg-white/[0.04] p-3.5 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.06]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Next safe move</p>
              <p className="mt-2 line-clamp-2 text-[13px] font-black leading-5 text-white">
                Review route discipline before signing a transaction.
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-lime-200">Open risk guide</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/60" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroChip({ children, tone }: { children: string; tone: "lime" | "cyan" | "violet" }) {
  const toneClass =
    tone === "lime"
      ? "border-lime-300/18 bg-lime-300/14 text-lime-100"
      : tone === "cyan"
        ? "border-cyan-300/18 bg-cyan-300/12 text-cyan-100"
        : "border-violet-300/18 bg-violet-300/12 text-violet-100";

  return (
    <span className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] backdrop-blur-xl ${toneClass}`}>
      {children}
    </span>
  );
}

function HeroSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/26 px-3.5 py-3 backdrop-blur-md">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-[13px] font-black text-white">{value}</p>
    </div>
  );
}

function HeroPanelMetric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/28 p-3.5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-[1.35rem] font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold leading-4 text-slate-400">{sub}</p>
    </div>
  );
}
