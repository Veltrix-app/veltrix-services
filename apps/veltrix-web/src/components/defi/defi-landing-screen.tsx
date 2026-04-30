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
  ShieldCheck,
  Wallet,
  WalletCards,
} from "lucide-react";
import { DefiRouteNav } from "@/components/defi/defi-route-nav";

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
    <section className="relative -mt-2 overflow-hidden pb-4">
      <div className="pointer-events-none absolute inset-x-[-10%] top-[-18rem] h-[34rem] bg-[radial-gradient(circle_at_50%_50%,rgba(0,132,255,0.12),transparent_62%)]" />

      <div className="relative grid gap-5 lg:grid-cols-2 2xl:gap-6">
        {defiShowcaseRoutes.map((route) => {
          const Icon = route.icon;
          const accent = accentClasses[route.accent];

          return (
            <Link
              key={route.href}
              href={route.href}
              className="group relative isolate min-h-[22.5rem] overflow-hidden rounded-[30px] border border-white/10 bg-[#05070b] shadow-[0_26px_80px_rgba(0,0,0,0.34)] transition duration-300 hover:-translate-y-0.5 hover:border-white/18 hover:shadow-[0_34px_110px_rgba(0,0,0,0.44)] max-sm:min-h-[24rem]"
            >
              <Image
                src={route.image}
                alt={`${route.label} cinematic VYNTRO DeFi artwork`}
                fill
                sizes="(min-width: 1536px) 820px, (min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center opacity-[0.76] saturate-125 transition duration-700 group-hover:scale-[1.035] group-hover:opacity-[0.88]"
              />

              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,3,7,0.96)_0%,rgba(2,3,7,0.86)_30%,rgba(2,3,7,0.36)_61%,rgba(2,3,7,0.08)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,3,7,0.18)_0%,transparent_42%,rgba(2,3,7,0.72)_100%)]" />
              <div className={`absolute -left-20 top-8 h-56 w-56 rounded-full ${accent.glow} blur-3xl transition duration-700 group-hover:opacity-90`} />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/18 via-white/5 to-transparent" />

              <div className="relative z-10 flex min-h-[22.5rem] max-w-[34rem] flex-col justify-center p-7 sm:p-8 lg:p-9 max-sm:min-h-[24rem]">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full border backdrop-blur-xl ${accent.icon}`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <p
                  className={`mt-8 text-[11px] font-black uppercase tracking-[0.34em] ${accent.label}`}
                >
                  {route.eyebrow}
                </p>
                <h2 className="mt-4 text-[clamp(2rem,3vw,3.85rem)] font-black leading-[0.9] tracking-[-0.07em] text-white [text-shadow:0_18px_55px_rgba(0,0,0,0.72)]">
                  {route.label}
                </h2>
                <p className="mt-5 max-w-[25rem] text-[0.98rem] leading-7 text-slate-100/86 [text-shadow:0_16px_42px_rgba(0,0,0,0.85)] sm:text-[1.04rem]">
                  {route.description}
                </p>

                <div className="mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/28 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/78 opacity-0 backdrop-blur-xl transition duration-300 group-hover:translate-x-1 group-hover:opacity-100 max-sm:opacity-100">
                  Open route
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="relative mt-5">
        <DefiRouteNav compact />
      </div>

      <div className="relative mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-3 md:grid-cols-3">
          {secondaryRoutes.map((route) => {
            const Icon = route.icon;

            return (
              <Link
                key={route.href}
                href={route.href}
                className="group rounded-[24px] border border-white/7 bg-white/[0.025] p-4 transition hover:border-white/12 hover:bg-white/[0.045]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-black/22 text-lime-200">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <ArrowRight className="mt-2 h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-lime-200" />
                </div>
                <p className="mt-5 text-[9px] font-black uppercase tracking-[0.22em] text-lime-300">
                  {route.eyebrow}
                </p>
                <h3 className="mt-2 text-[1.05rem] font-black tracking-[-0.04em] text-white">
                  {route.label}
                </h3>
                <p className="mt-2 text-[12px] leading-6 text-slate-400">{route.description}</p>
              </Link>
            );
          })}
        </div>

        <aside className="rounded-[24px] border border-lime-300/10 bg-[radial-gradient(circle_at_100%_0%,rgba(190,255,74,0.1),transparent_34%),linear-gradient(180deg,rgba(10,13,17,0.78),rgba(6,7,10,0.86))] p-4">
          <ShieldCheck className="h-5 w-5 text-lime-200" />
          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.22em] text-lime-300">
            Safety posture
          </p>
          <h3 className="mt-2 text-[1.05rem] font-black tracking-[-0.04em] text-white">
            Calm discovery first, transactions second.
          </h3>
          <p className="mt-2 text-[12px] leading-6 text-slate-400">
            VYNTRO never takes custody and does not guarantee yield. Borrowing adds liquidation
            risk, so advanced actions stay separated behind explicit safety gates.
          </p>
        </aside>
      </div>
    </section>
  );
}
