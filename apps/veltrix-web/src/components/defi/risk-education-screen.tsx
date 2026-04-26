"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpenCheck, ShieldCheck, WalletCards } from "lucide-react";
import {
  borrowLendingRiskTopics,
  getBorrowLendingRiskSummary,
  getRiskEducationChecklist,
  type BorrowLendingRiskTone,
} from "@/lib/defi/risk-education";

const toneStyles = {
  positive: {
    border: "border-lime-300/12",
    bg: "bg-lime-300/[0.055]",
    text: "text-lime-200",
    icon: ShieldCheck,
  },
  neutral: {
    border: "border-white/6",
    bg: "bg-white/[0.025]",
    text: "text-slate-300",
    icon: BookOpenCheck,
  },
  warning: {
    border: "border-amber-300/14",
    bg: "bg-amber-300/[0.055]",
    text: "text-amber-100",
    icon: AlertTriangle,
  },
} satisfies Record<BorrowLendingRiskTone, {
  border: string;
  bg: string;
  text: string;
  icon: typeof ShieldCheck;
}>;

export function BorrowRiskMiniPanel() {
  const summary = getBorrowLendingRiskSummary();
  const compactTopics = borrowLendingRiskTopics.filter((topic) => topic.slug !== "safe-order");

  return (
    <div className="rounded-[26px] border border-white/6 bg-[radial-gradient(circle_at_100%_0%,rgba(251,191,36,0.1),transparent_34%),linear-gradient(180deg,rgba(13,15,19,0.98),rgba(7,9,12,0.995))] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/14 bg-amber-300/10 text-amber-100">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">
            Risk education
          </p>
          <h3 className="mt-2 text-[1.05rem] font-black tracking-[-0.035em] text-white">
            {summary.headline}
          </h3>
        </div>
      </div>

      <p className="mt-4 text-[12px] leading-6 text-slate-400">{summary.copy}</p>

      <div className="mt-4 grid gap-2">
        {compactTopics.map((topic) => {
          const style = toneStyles[topic.tone];

          return (
            <div
              key={topic.slug}
              className={`rounded-[16px] border ${style.border} ${style.bg} px-3 py-2.5`}
            >
              <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${style.text}`}>
                {topic.eyebrow}
              </p>
              <p className="mt-1.5 text-[12px] font-semibold leading-5 text-white">
                {topic.title}
              </p>
            </div>
          );
        })}
      </div>

      <Link
        href="/defi/risk-guide"
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:border-lime-300/16 hover:text-lime-100"
      >
        {summary.primaryAction}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export function DefiRiskEducationScreen() {
  const summary = getBorrowLendingRiskSummary();
  const checklist = getRiskEducationChecklist();

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[30px] border border-white/6 bg-[radial-gradient(circle_at_14%_0%,rgba(251,191,36,0.12),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(190,255,74,0.12),transparent_28%),linear-gradient(180deg,rgba(13,15,19,0.99),rgba(6,7,10,0.995))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035),transparent_34%)]" />

        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="max-w-4xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-lime-300">
              Borrow/lending education
            </p>
            <h2 className="mt-4 max-w-3xl text-[clamp(1.8rem,3vw,3.6rem)] font-black leading-[0.94] tracking-[-0.05em] text-white">
              {summary.headline}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              {summary.copy} This page keeps the essentials short: wallet control, collateral,
              liquidation, repay and the safest order of operations.
            </p>
          </div>

          <div className="rounded-[24px] border border-lime-300/10 bg-lime-300/[0.055] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-lime-300/14 bg-lime-300/10 text-lime-200">
              <WalletCards className="h-5 w-5" />
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">
              VYNTRO posture
            </p>
            <p className="mt-2 text-[1.05rem] font-black tracking-[-0.03em] text-white">
              Product layer only, wallet signs every move.
            </p>
            <p className="mt-2 text-[12px] leading-6 text-slate-400">
              We make the route understandable and track proof. We do not custody funds, guarantee
              yield or hide the downside of borrowing.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {borrowLendingRiskTopics.map((topic) => {
          const style = toneStyles[topic.tone];
          const Icon = style.icon;

          return (
            <article
              key={topic.slug}
              className={`rounded-[24px] border ${style.border} ${style.bg} p-4`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-black/20 ${style.text}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className={`mt-4 text-[9px] font-black uppercase tracking-[0.22em] ${style.text}`}>
                {topic.eyebrow}
              </p>
              <h3 className="mt-2 text-[1rem] font-black tracking-[-0.035em] text-white">
                {topic.title}
              </h3>
              <p className="mt-3 text-[12px] leading-6 text-slate-400">{topic.summary}</p>
              <p className="mt-3 text-[11px] leading-5 text-slate-500">{topic.detail}</p>
              <div className="mt-4 rounded-[16px] border border-white/6 bg-black/20 px-3 py-2.5">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                  User move
                </p>
                <p className="mt-1.5 text-[11px] font-semibold leading-5 text-white">
                  {topic.userAction}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-[30px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,18,23,0.98),rgba(7,9,12,0.99))] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-lime-300">
              Conservative route
            </p>
            <h3 className="mt-3 text-[1.35rem] font-black tracking-[-0.04em] text-white">
              Keep the borrow flow sequential.
            </h3>
          </div>
          <Link
            href="/defi/borrow-lending"
            className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-black transition hover:bg-lime-200"
          >
            Open borrow/lending
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {checklist.map((item, index) => (
            <div
              key={item.label}
              className="rounded-[20px] border border-white/6 bg-black/20 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-300 text-[10px] font-black text-black">
                  {index + 1}
                </span>
                <span className="rounded-full border border-white/8 bg-white/[0.035] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                  {item.signal}
                </span>
              </div>
              <p className="mt-4 text-[13px] font-black tracking-[-0.025em] text-white">
                {item.label}
              </p>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
