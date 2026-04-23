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
    <aside className="border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Selected plan</p>
      <h2 className="mt-4 text-3xl font-black text-white">{plan.name}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">{plan.description}</p>

      {intent === "pay_and_continue" ? (
        <div className="mt-5 rounded-[24px] border border-amber-300/25 bg-amber-300/10 px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">
            Pay and continue
          </p>
          <p className="mt-3 text-sm leading-7 text-amber-50/90">
            This route came from a blocked growth action. Upgrade the workspace, finish checkout,
            and then jump straight back into the product flow.
          </p>
          {(metric || action) ? (
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-amber-100/80">
              {metric ? `${metric.replace(/_/g, " ")}` : "capacity"} · {action ? action.replace(/_/g, " ") : "continue"}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 border-y border-white/10 py-5">
        <p className="text-sm text-slate-400">
          {plan.isEnterprise ? "Custom" : `EUR ${plan.priceMonthly}/month`}
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
          {plan.trialDays > 0 ? `${plan.trialDays}-day trial on first subscription` : "No checkout trial"}
        </p>
      </div>

      <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-200">
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <div className="mt-6 rounded-3xl border border-white/10 bg-black/15 p-4 text-sm text-slate-300">
        <p>Projects: {plan.projectsLimit}</p>
        <p>Campaigns: {plan.campaignsLimit}</p>
        <p>Quests: {plan.questsLimit}</p>
        <p>Raids: {plan.raidsLimit}</p>
        <p>Providers: {plan.providersLimit}</p>
        <p>Billable seats: {plan.includedBillableSeats}</p>
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
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
                className="inline-flex w-full items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-lime-300/40"
            >
              {checkoutState === "working" ? "Opening checkout..." : checkoutLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          )
        ) : (
          <div className="space-y-3">
            <Link
              href={buildPublicAuthPathWithNext(publicAuthRoutes.signUp, nextHref)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
            >
              {plan.isFreeTier ? "Start free" : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={buildPublicAuthPathWithNext(publicAuthRoutes.signIn, nextHref)}
              className="inline-flex w-full items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              Sign in
            </Link>
          </div>
        )}

        <Link
          href={supportHref}
          className="inline-flex w-full items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
        >
          Need help with billing?
        </Link>
      </div>
    </aside>
  );
}
