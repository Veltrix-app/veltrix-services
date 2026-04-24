import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  buildPublicAuthPathWithNext,
  publicAuthRoutes,
} from "@/lib/account/public-auth";
import type { PublicBillingPlan } from "@/lib/billing/plan-catalog";

function buildPricingSelectionHref(params: {
  planId: string;
  accountId?: string | null;
  intent?: string | null;
  metric?: string | null;
  action?: string | null;
  returnTo?: string | null;
  from?: string | null;
}) {
  const target = new URL("/pricing", "https://veltrix-web.vercel.app");
  target.searchParams.set("plan", params.planId);

  if (params.accountId) {
    target.searchParams.set("accountId", params.accountId);
  }

  if (params.intent) {
    target.searchParams.set("intent", params.intent);
  }

  if (params.metric) {
    target.searchParams.set("metric", params.metric);
  }

  if (params.action) {
    target.searchParams.set("action", params.action);
  }

  if (params.returnTo) {
    target.searchParams.set("returnTo", params.returnTo);
  }

  if (params.from) {
    target.searchParams.set("from", params.from);
  }

  return `${target.pathname}${target.search}`;
}

function buildSalesHref(params: {
  planId: string;
  accountId?: string | null;
  intent?: string | null;
  returnTo?: string | null;
  from?: string | null;
}) {
  const target = new URL("/talk-to-sales", "https://veltrix-web.vercel.app");
  target.searchParams.set("plan", params.planId);
  target.searchParams.set("intent", params.intent === "enterprise_review" ? "enterprise_review" : "demo");

  if (params.accountId) {
    target.searchParams.set("accountId", params.accountId);
  }

  if (params.returnTo) {
    target.searchParams.set("returnTo", params.returnTo);
  }

  target.searchParams.set("from", params.from ?? "pricing");

  return `${target.pathname}${target.search}`;
}

export function PricingPlanGrid({
  plans,
  highlightPlanId,
  accountId,
  intent,
  metric,
  action,
  returnTo,
  from,
}: {
  plans: PublicBillingPlan[];
  highlightPlanId?: string | null;
  accountId?: string | null;
  intent?: string | null;
  metric?: string | null;
  action?: string | null;
  returnTo?: string | null;
  from?: string | null;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {plans.map((plan) => {
        const isHighlighted = plan.id === highlightPlanId;
        const isGrowth = !highlightPlanId && plan.id === "growth";
        const isEmphasized = isHighlighted || isGrowth;
        const selectionHref = buildPricingSelectionHref({
          planId: plan.id,
          accountId,
          intent,
          metric,
          action,
          returnTo,
          from,
        });
        const signupHref = buildPublicAuthPathWithNext(
          publicAuthRoutes.signUp,
          selectionHref
        );
        const enterpriseHref = buildSalesHref({
          planId: plan.id,
          accountId,
          intent: "enterprise_review",
          returnTo,
          from: from ?? "pricing",
        });

        return (
          <article
            key={plan.id}
            className={`flex h-full flex-col border p-6 ${
              isEmphasized
                ? "border-lime-300/60 bg-lime-300/[0.08]"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">
                  {plan.id === "enterprise" ? "Sales-managed" : "Self-serve"}
                </p>
                <h2 className="mt-3 text-3xl font-black text-white">{plan.name}</h2>
              </div>
              {isEmphasized ? (
                <span className="rounded-full border border-lime-300/50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-lime-200">
                  {isHighlighted ? "Selected" : "Popular"}
                </span>
              ) : null}
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-300">{plan.description}</p>

            <div className="mt-6 border-y border-white/10 py-5">
              <p className="text-sm text-slate-400">
                {plan.isEnterprise ? "Custom" : `EUR ${plan.priceMonthly}/month`}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                {plan.trialDays > 0 ? `${plan.trialDays}-day trial` : "No trial needed"}
              </p>
            </div>

            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-200">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <div className="mt-8 flex-1 rounded-3xl border border-white/10 bg-black/15 p-4 text-sm text-slate-300">
              <p>Projects: {plan.projectsLimit}</p>
              <p>Campaigns: {plan.campaignsLimit}</p>
              <p>Quests: {plan.questsLimit}</p>
              <p>Raids: {plan.raidsLimit}</p>
              <p>Providers: {plan.providersLimit}</p>
              <p>Billable seats: {plan.includedBillableSeats}</p>
            </div>

            <div className="mt-6">
              {plan.isEnterprise ? (
                <Link
                  href={enterpriseHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                >
                  {accountId ? "Review enterprise path" : "Talk to sales"}
                </Link>
              ) : (
                <Link
                  href={accountId ? selectionHref : signupHref}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition ${
                    isEmphasized
                      ? "bg-lime-300 text-slate-950 hover:bg-lime-200"
                      : "border border-white/12 text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {accountId ? "Choose this plan" : plan.isFreeTier ? "Start free" : "Continue to signup"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
