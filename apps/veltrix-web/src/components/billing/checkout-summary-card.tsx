"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  buildPublicAuthPathWithNext,
  publicAuthRoutes,
} from "@/lib/account/public-auth";
import type { PublicBillingPlan } from "@/lib/billing/plan-catalog";

function buildSupportHref(params: {
  accountId?: string | null;
  returnTo?: string | null;
  intent?: string | null;
}) {
  const target = new URL("/support", "https://veltrix-web.vercel.app");
  target.searchParams.set("intent", params.intent === "pay_and_continue" ? "pay_and_continue" : "enterprise");

  if (params.accountId) {
    target.searchParams.set("accountId", params.accountId);
  }

  if (params.returnTo) {
    target.searchParams.set("returnTo", params.returnTo);
  }

  return `${target.pathname}${target.search}`;
}

export function CheckoutSummaryCard({
  plan,
  accountId,
  intent,
  metric,
  action,
  returnTo,
}: {
  plan: PublicBillingPlan;
  accountId?: string | null;
  intent?: string | null;
  metric?: string | null;
  action?: string | null;
  returnTo?: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, loading, authConfigured } = useAuth();
  const [checkoutState, setCheckoutState] = useState<"idle" | "working">("idle");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const nextHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const checkoutLabel =
    intent === "pay_and_continue"
      ? "Pay and continue"
      : plan.trialDays > 0
        ? "Start trial"
        : "Continue to checkout";

  const supportHref = buildSupportHref({ accountId, returnTo, intent });

  async function handleCheckout() {
    if (!accountId || !session?.access_token || !plan.isCheckoutEnabled) {
      return;
    }

    try {
      setCheckoutState("working");
      setCheckoutError(null);

      const successParams = new URLSearchParams({
        plan: plan.id,
      });

      if (returnTo) {
        successParams.set("continueTo", returnTo);
      }

      if (intent) {
        successParams.set("intent", intent);
      }

      if (metric) {
        successParams.set("metric", metric);
      }

      if (action) {
        successParams.set("action", action);
      }

      const response = await fetch("/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          planId: plan.id,
          customerAccountId: accountId,
          successPath: `/billing/success?${successParams.toString()}`,
          cancelPath: nextHref,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok || typeof payload.url !== "string") {
        throw new Error(payload?.error ?? "Checkout could not be started.");
      }

      window.location.assign(payload.url);
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Checkout could not be started."
      );
      setCheckoutState("idle");
    }
  }

  return (
    <aside className="sticky top-6 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,36,0.96),rgba(10,14,22,0.98))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.12),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(74,217,255,0.1),transparent_26%),linear-gradient(125deg,rgba(255,255,255,0.04),transparent_34%)]" />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200">
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(74,217,255,0.7)]" />
          Selected plan
        </div>
        <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white">{plan.name}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">{plan.description}</p>

        {intent === "pay_and_continue" ? (
      <div className="mt-5 rounded-[22px] border border-amber-300/25 bg-[linear-gradient(180deg,rgba(245,158,11,0.14),rgba(20,15,12,0.82))] px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">
              Pay and continue
            </p>
            <p className="mt-3 text-sm leading-7 text-amber-50/90">
              This route came from a blocked growth action. Upgrade the workspace, finish checkout,
              and then jump straight back into the product flow.
            </p>
            {metric || action ? (
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-amber-100/80">
                {metric ? metric.replace(/_/g, " ") : "capacity"} · {action ? action.replace(/_/g, " ") : "continue"}
              </p>
            ) : null}
          </div>
        ) : null}

      <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Commercial posture</p>
          <p className="mt-3 text-[2.25rem] font-black tracking-[-0.05em] text-white">
            {plan.isEnterprise ? "Custom" : `EUR ${plan.priceMonthly}`}
            {!plan.isEnterprise ? (
              <span className="ml-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">/ month</span>
            ) : null}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
            {plan.trialDays > 0 ? `${plan.trialDays}-day trial on first subscription` : "No checkout trial"}
          </p>
        </div>

        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Included in lane</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {plan.features.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

      <div className="mt-6 grid gap-3 rounded-[22px] border border-white/10 bg-black/20 p-4 sm:grid-cols-2">
          <CapacityCell label="Projects" value={plan.projectsLimit} />
          <CapacityCell label="Campaigns" value={plan.campaignsLimit} />
          <CapacityCell label="Quests" value={plan.questsLimit} />
          <CapacityCell label="Raids" value={plan.raidsLimit} />
          <CapacityCell label="Providers" value={plan.providersLimit} />
          <CapacityCell label="Billable seats" value={plan.includedBillableSeats} />
        </div>

        {checkoutError ? (
          <div className="mt-5 rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {checkoutError}
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {plan.isEnterprise ? (
            <Link
              href={supportHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-white/90"
            >
              Talk to Veltrix
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : accountId ? (
            loading ? (
              <button
                type="button"
                disabled
                className="inline-flex w-full items-center justify-center rounded-full bg-lime-300/40 px-5 py-3 text-sm font-black text-slate-950"
              >
                Loading billing access...
              </button>
            ) : !authConfigured ? (
              <div className="rounded-[22px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Public auth is not configured yet, so checkout cannot confirm workspace access.
              </div>
            ) : !session ? (
              <div className="space-y-3">
                <Link
                  href={buildPublicAuthPathWithNext(publicAuthRoutes.signIn, nextHref)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
                >
                  Sign in to continue billing
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={buildPublicAuthPathWithNext(publicAuthRoutes.signUp, nextHref)}
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Create account access
                </Link>
              </div>
            ) : plan.isFreeTier ? (
              <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                Free is already the default workspace posture. Select a paid plan to increase capacity.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void handleCheckout()}
                disabled={checkoutState === "working"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(186,255,59,0.18)] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-lime-300/40"
              >
                {checkoutState === "working" ? "Opening checkout..." : checkoutLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            )
          ) : (
            <div className="space-y-3">
              <Link
                href={buildPublicAuthPathWithNext(publicAuthRoutes.signUp, nextHref)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(186,255,59,0.18)] transition hover:bg-lime-200"
              >
                {plan.isFreeTier ? "Start free" : "Create account"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={buildPublicAuthPathWithNext(publicAuthRoutes.signIn, nextHref)}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Sign in
              </Link>
            </div>
          )}

          <Link
            href={supportHref}
            className="inline-flex w-full items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Need help with billing?
          </Link>
        </div>
      </div>
    </aside>
  );
}

function CapacityCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
