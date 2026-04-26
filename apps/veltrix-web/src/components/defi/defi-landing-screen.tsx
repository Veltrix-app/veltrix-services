"use client";

import Link from "next/link";
import { ArrowRight, Layers3, ShieldCheck, Wallet } from "lucide-react";

const defiRoutes = [
  {
    href: "/defi/vaults",
    label: "Vault missions",
    eyebrow: "Lower complexity",
    icon: Wallet,
    description:
      "Deposit and withdraw through curated vault routes while VYNTRO tracks proof for future XP.",
    stats: ["No custody", "Deposit / withdraw", "XP-ready proof"],
  },
  {
    href: "/defi/borrow-lending",
    label: "Borrow / lending",
    eyebrow: "Advanced route",
    icon: Layers3,
    description:
      "Supply, enable collateral, borrow, repay and monitor positions with explicit safety gates.",
    stats: ["Live Base reads", "Collateral gate", "Repay first posture"],
  },
] as const;

export function DefiLandingScreen() {
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[30px] border border-white/6 bg-[radial-gradient(circle_at_12%_0%,rgba(190,255,74,0.14),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(74,217,255,0.12),transparent_28%),linear-gradient(180deg,rgba(13,15,19,0.99),rgba(6,7,10,0.995))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035),transparent_35%)]" />

        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="max-w-4xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-lime-300">
              DeFi product layer
            </p>
            <h2 className="mt-4 max-w-3xl text-[clamp(1.8rem,3vw,3.6rem)] font-black leading-[0.94] tracking-[-0.05em] text-white">
              Choose the DeFi route before money moves.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              VYNTRO keeps DeFi understandable: first pick the route, then connect a verified
              wallet, review live Base reads and sign only from your own wallet. We never take
              custody and we do not guarantee yield.
            </p>
          </div>

          <div className="rounded-[24px] border border-lime-300/10 bg-lime-300/[0.055] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-lime-300/14 bg-lime-300/10 text-lime-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">
              Safety posture
            </p>
            <p className="mt-2 text-[1.05rem] font-black tracking-[-0.03em] text-white">
              Calm discovery first, transactions second.
            </p>
            <p className="mt-2 text-[12px] leading-6 text-slate-400">
              Borrowing adds liquidation risk, so that flow is separated from vault deposits and
              asks users to explicitly confirm risk before signing.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {defiRoutes.map((route) => {
          const Icon = route.icon;

          return (
            <Link
              key={route.href}
              href={route.href}
              className="group relative overflow-hidden rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,18,23,0.98),rgba(7,9,12,0.99))] p-5 transition hover:border-lime-300/16 hover:bg-white/[0.04] sm:p-6"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-lime-300/10 blur-3xl" />
              </div>

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-lime-200">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="mt-2 h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-lime-200" />
              </div>

              <div className="relative z-10 mt-7">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">
                  {route.eyebrow}
                </p>
                <h3 className="mt-3 text-[1.45rem] font-black tracking-[-0.045em] text-white">
                  {route.label}
                </h3>
                <p className="mt-3 max-w-2xl text-[13px] leading-6 text-slate-400">
                  {route.description}
                </p>
              </div>

              <div className="relative z-10 mt-6 grid gap-2 sm:grid-cols-3">
                {route.stats.map((stat) => (
                  <span
                    key={stat}
                    className="rounded-full border border-white/6 bg-black/20 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300"
                  >
                    {stat}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
