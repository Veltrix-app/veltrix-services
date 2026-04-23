import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { CheckoutSummaryCard } from "@/components/billing/checkout-summary-card";
import { PricingPlanGrid } from "@/components/billing/pricing-plan-grid";
import { getPublicBillingPlan, getPublicBillingPlans } from "@/lib/billing/plan-catalog";

export const metadata: Metadata = {
  title: "Veltrix Pricing | Free, Starter, Growth and Enterprise",
  description:
    "Compare Veltrix plans, see what each tier includes, and choose the right commercial posture for launches, community execution and member journeys.",
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{
    plan?: string;
    accountId?: string;
    intent?: string;
    metric?: string;
    action?: string;
    returnTo?: string;
    from?: string;
  }>;
}) {
  const {
    plan: highlightedPlanId,
    accountId,
    intent,
    metric,
    action,
    returnTo,
    from,
  } = await searchParams;
  const plans = getPublicBillingPlans();
  const spotlightPlan =
    (highlightedPlanId ? getPublicBillingPlan(highlightedPlanId) : null) ??
    getPublicBillingPlan("growth");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.12),transparent_28%),radial-gradient(circle_at_86%_10%,rgba(74,217,255,0.14),transparent_22%),linear-gradient(180deg,#071116_0%,#060d12_38%,#04080b_100%)] text-white">
      <section className="border-b border-white/8">
        <div className="mx-auto w-full max-w-[1480px] px-6 py-8 sm:px-10 lg:px-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.34em] text-cyan-200">Pricing</p>
              <h1 className="mt-4 max-w-[12ch] text-balance text-[clamp(3rem,8vw,6.5rem)] font-black leading-[0.9]">
                Choose the commercial posture that fits your launch.
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
              >
                <LifeBuoy className="h-4 w-4" />
                Talk to us
              </Link>
              <Link
                href="/start"
                className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
              >
                Start now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <p className="mt-8 max-w-3xl text-base leading-8 text-slate-200">
            Veltrix pricing is built around scale and operating pressure, not around hiding the product behind dozens
            of fragmented feature gates. Use Free to feel the system, move into Starter when a real team is operating,
            and step into Growth when you need more launch volume and commercial headroom.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-8 px-6 py-16 sm:px-10 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:px-16">
        <div>
          <PricingPlanGrid
            plans={plans}
            highlightPlanId={highlightedPlanId ?? null}
            accountId={accountId ?? null}
            intent={intent ?? null}
            metric={metric ?? null}
            action={action ?? null}
            returnTo={returnTo ?? null}
            from={from ?? null}
          />
        </div>
        {spotlightPlan ? (
          <CheckoutSummaryCard
            plan={spotlightPlan}
            accountId={accountId ?? null}
            intent={intent ?? null}
            metric={metric ?? null}
            action={action ?? null}
            returnTo={returnTo ?? null}
          />
        ) : null}
      </section>

      <section className="border-y border-white/8 bg-white/[0.02]">
        <div className="mx-auto grid w-full max-w-[1480px] gap-8 px-6 py-16 sm:px-10 lg:grid-cols-3 lg:px-16">
          <div className="border border-white/8 bg-black/15 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-lime-300">Scale gates</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Limits focus on projects, campaigns, quests, raids, providers and billable seats so pricing stays legible.
            </p>
          </div>
          <div className="border border-white/8 bg-black/15 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Upgrade posture</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Veltrix should warn before a hard limit hits and then offer a direct upgrade path instead of a dead end.
            </p>
          </div>
          <div className="border border-white/8 bg-black/15 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-300">Enterprise</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Enterprise is reserved for custom commercial posture, high-touch onboarding and bespoke operational needs.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
