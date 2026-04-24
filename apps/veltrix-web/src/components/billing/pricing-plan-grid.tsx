import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  buildPublicAuthPathWithNext,
  publicAuthRoutes,
} from "@/lib/account/public-auth";
import type { PublicBillingPlan } from "@/lib/billing/plan-catalog";
import { getCommercialPlanPresentation } from "@/lib/commercial/commercial-contract";

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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
      {plans.map((plan) => {
        const isHighlighted = plan.id === highlightPlanId;
        const isGrowth = !highlightPlanId && plan.id === "growth";
        const isEmphasized = isHighlighted || isGrowth;
        const commercialPresentation = getCommercialPlanPresentation(plan.id);
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
        const layoutClass =
          plan.id === "enterprise"
            ? "md:col-span-2 xl:col-span-12"
            : plan.id === "growth"
              ? "xl:col-span-5"
              : plan.id === "starter"
                ? "xl:col-span-4"
                : "xl:col-span-3";

        return (
          <article
            key={plan.id}
          className={`group relative flex h-full flex-col overflow-hidden rounded-[24px] border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:-translate-y-0.5 ${layoutClass} ${
              plan.id === "enterprise"
                ? "border-cyan-300/20 bg-[linear-gradient(135deg,rgba(74,217,255,0.14),rgba(12,16,24,0.98)_34%,rgba(11,15,23,0.98)_68%,rgba(186,255,59,0.1))]"
                : isEmphasized
                  ? "border-lime-300/26 bg-[linear-gradient(180deg,rgba(186,255,59,0.12),rgba(18,24,35,0.94)_22%,rgba(10,14,22,0.96))]"
                  : "border-white/10 bg-[linear-gradient(180deg,rgba(18,24,36,0.92),rgba(10,14,22,0.96))]"
            }`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.04),transparent_32%,transparent_72%,rgba(255,255,255,0.02))]" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isEmphasized
                          ? "bg-lime-300 shadow-[0_0_18px_rgba(186,255,59,0.75)]"
                          : plan.isEnterprise
                            ? "bg-cyan-300 shadow-[0_0_18px_rgba(74,217,255,0.7)]"
                            : "bg-white/60"
                      }`}
                    />
                    {plan.id === "enterprise" ? "High-touch" : "Self-serve"}
                  </div>
                  <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white">{plan.name}</h2>
                </div>
                {isEmphasized ? (
                  <span className="rounded-full border border-lime-300/35 bg-lime-300/[0.1] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-lime-200">
                    {isHighlighted ? "Selected" : "Recommended"}
                  </span>
                ) : plan.isEnterprise ? (
                  <span className="rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-200">
                    Buyer path
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-300">{plan.description}</p>

              <div className="mt-6 grid gap-4 border-y border-white/10 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Monthly posture</p>
                  <p className="mt-2 text-[2.2rem] font-black tracking-[-0.05em] text-white">
                    {plan.isEnterprise ? "Custom" : `EUR ${plan.priceMonthly}`}
                    {!plan.isEnterprise ? (
                      <span className="ml-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">/ month</span>
                    ) : null}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Best for</p>
                  <p className="mt-2 max-w-[26ch] text-sm font-semibold leading-6 text-white">
                    {commercialPresentation?.bestFor ?? "Commercial posture"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {plan.features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

        <div className="grid gap-3 rounded-[22px] border border-white/10 bg-black/20 p-4 sm:grid-cols-2">
                  <CapacityRow label="Projects" value={plan.projectsLimit} />
                  <CapacityRow label="Campaigns" value={plan.campaignsLimit} />
                  <CapacityRow label="Quests" value={plan.questsLimit} />
                  <CapacityRow label="Raids" value={plan.raidsLimit} />
                  <CapacityRow label="Providers" value={plan.providersLimit} />
                  <CapacityRow label="Billable seats" value={plan.includedBillableSeats} />
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Guidance</p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">
                    {commercialPresentation?.guidance ?? plan.description}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {commercialPresentation?.upgradeSignal ?? "Scale up when operating pressure increases."}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                {plan.isEnterprise ? (
                  <Link
                    href={enterpriseHref}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-white/90"
                  >
                    {accountId ? "Review enterprise path" : "Talk to sales"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    href={accountId ? selectionHref : signupHref}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition ${
                      isEmphasized
                        ? "bg-lime-300 text-slate-950 shadow-[0_18px_40px_rgba(186,255,59,0.2)] hover:bg-lime-200"
                        : "border border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    {accountId ? "Choose this plan" : plan.isFreeTier ? "Start free" : "Continue to signup"}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CapacityRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
