"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowRightLeft,
  BarChart3,
  BookOpenCheck,
  History,
  Layers3,
  Wallet,
  WalletCards,
} from "lucide-react";
import { DefiRouteNav } from "@/components/defi/defi-route-nav";
import { DefiSafetyPanel } from "@/components/defi/defi-safety-panel";

const defiShowcaseRoutes = [
  {
    href: "/defi/swap",
    label: "Swap",
    eyebrow: "Asset route",
    icon: ArrowRightLeft,
    image: "/brand/defi/defi-swap-purple.png",
    accent: "violet",
    description:
      "Move into the right asset before vaults, lending or trading missions with a VYNTRO-native route finder.",
    shortDescription: "Route into the right asset before vaults, lending or competitions.",
  },
  {
    href: "/defi/vaults",
    label: "Vault missions",
    eyebrow: "Lower complexity",
    icon: Wallet,
    image: "/brand/defi/defi-vaults-green.png",
    accent: "lime",
    description:
      "Deposit and withdraw through curated vault routes while VYNTRO tracks proof for future XP.",
    shortDescription: "Curated deposit and withdraw routes with proof for future XP.",
  },
  {
    href: "/defi/borrow-lending",
    label: "Borrow / lending",
    eyebrow: "Advanced route",
    icon: Layers3,
    image: "/brand/defi/defi-borrow-lending-blue.png",
    accent: "blue",
    description:
      "Supply, enable collateral, borrow, repay and monitor positions with explicit safety gates.",
    shortDescription: "Supply, borrow, repay and monitor risk behind clear safety gates.",
  },
  {
    href: "/trading-arena",
    label: "Trading Arena",
    eyebrow: "Competition layer",
    icon: BarChart3,
    image: "/brand/defi/defi-trading-arena-gold.png",
    accent: "amber",
    description:
      "Launch or join snapshot and live-tracked trading competitions with cost caps, rewards and leaderboards.",
    shortDescription: "Snapshot and live-tracked competitions with rewards and leaderboards.",
  },
] as const;

const accentClasses = {
  violet: {
    icon: "border-violet-300/15 bg-violet-400/16 text-violet-200 shadow-[0_0_34px_rgba(168,85,247,0.16)]",
    label: "text-violet-200",
    glow: "bg-violet-500/20",
  },
  lime: {
    icon: "border-lime-300/15 bg-lime-300/14 text-lime-200 shadow-[0_0_34px_rgba(190,255,74,0.14)]",
    label: "text-lime-200",
    glow: "bg-lime-300/18",
  },
  blue: {
    icon: "border-blue-300/15 bg-blue-400/14 text-blue-200 shadow-[0_0_34px_rgba(59,130,246,0.16)]",
    label: "text-blue-200",
    glow: "bg-blue-400/18",
  },
  amber: {
    icon: "border-amber-300/15 bg-amber-300/14 text-amber-200 shadow-[0_0_34px_rgba(245,158,11,0.15)]",
    label: "text-amber-200",
    glow: "bg-amber-300/18",
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
  },
  {
    href: "/defi/risk-guide",
    label: "Risk guide",
    eyebrow: "Education layer",
    icon: BookOpenCheck,
    description:
      "Compact guidance for collateral, liquidation, repay discipline and non-custodial wallet flow.",
  },
  {
    href: "/defi/activity",
    label: "Activity proof",
    eyebrow: "Proof center",
    icon: History,
    description:
      "Review vault transactions, lending actions, XP claims and Basescan references in one wallet-scoped timeline.",
  },
] as const;

export function DefiLandingScreen() {
  return (
    <section className="relative -mt-2 overflow-hidden pb-3">
      <div className="pointer-events-none absolute inset-x-[-10%] top-[-18rem] h-[34rem] bg-[radial-gradient(circle_at_50%_50%,rgba(0,132,255,0.12),transparent_62%)]" />

      <div className="relative">
        <DefiRouteNav compact />
      </div>

      <div className="relative mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {secondaryRoutes.map((route) => {
          const Icon = route.icon;

          return (
            <Link
              key={route.href}
              href={route.href}
              className="group rounded-[22px] border border-white/7 bg-white/[0.025] p-3.5 transition hover:border-white/12 hover:bg-white/[0.045]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-black/22 text-lime-200">
                  <Icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-lime-200" />
              </div>
              <p className="mt-3.5 text-[9px] font-black uppercase tracking-[0.22em] text-lime-300">
                {route.eyebrow}
              </p>
              <h3 className="mt-1.5 text-[0.98rem] font-black tracking-[-0.04em] text-white">
                {route.label}
              </h3>
              <p className="mt-1.5 max-h-10 overflow-hidden text-[11px] leading-5 text-slate-400">
                {route.description}
              </p>
            </Link>
          );
        })}

        <DefiSafetyPanel compact route="overview" showGlobalContract />
      </div>

      <div className="relative mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {defiShowcaseRoutes.map((route) => {
          const Icon = route.icon;
          const accent = accentClasses[route.accent];

          return (
            <Link
              key={route.href}
              href={route.href}
              className="group relative isolate min-h-[13.75rem] overflow-hidden rounded-[22px] border border-white/8 bg-[#05070b] shadow-[0_18px_54px_rgba(0,0,0,0.26)] transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-[0_24px_72px_rgba(0,0,0,0.36)] max-sm:min-h-[18rem]"
            >
              <Image
                src={route.image}
                alt={`${route.label} cinematic VYNTRO DeFi artwork`}
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover object-center opacity-[0.66] saturate-125 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-[0.84]"
              />

              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,3,7,0.94)_0%,rgba(2,3,7,0.72)_46%,rgba(2,3,7,0.16)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,3,7,0.1)_0%,transparent_35%,rgba(2,3,7,0.78)_100%)]" />
              <div className={`absolute -left-24 top-1 h-40 w-40 rounded-full ${accent.glow} blur-3xl transition duration-700 group-hover:opacity-90`} />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/18 via-white/5 to-transparent" />
              <ArrowRight className="absolute right-4 top-4 z-10 h-4 w-4 text-white/36 transition group-hover:translate-x-0.5 group-hover:text-white/78" />

              <div className="relative z-10 flex min-h-[13.75rem] max-w-[18rem] flex-col justify-center p-[1.125rem] max-sm:min-h-[18rem]">
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
                <h2 className="mt-2 text-[clamp(1.35rem,1.8vw,2.15rem)] font-black leading-[0.92] tracking-[-0.06em] text-white [text-shadow:0_18px_55px_rgba(0,0,0,0.72)]">
                  {route.label}
                </h2>
                <p className="mt-2.5 max-w-[17rem] text-[0.76rem] leading-5 text-slate-100/78 [text-shadow:0_16px_42px_rgba(0,0,0,0.85)]">
                  {route.shortDescription}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
