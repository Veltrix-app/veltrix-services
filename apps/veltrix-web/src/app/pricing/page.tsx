import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LifeBuoy, Orbit } from "lucide-react";
import { GrowthAttributionBeacon } from "@/components/analytics/growth-attribution-beacon";
import { CheckoutSummaryCard } from "@/components/billing/checkout-summary-card";
import { PricingPlanGrid } from "@/components/billing/pricing-plan-grid";
import { EnterpriseCtaBand } from "@/components/marketing/enterprise-cta-band";
import { commercialPlanPresentation } from "@/lib/commercial/commercial-contract";
import { getPublicBillingPlan, getPublicBillingPlans } from "@/lib/billing/plan-catalog";

export const metadata: Metadata = {
  title: "Veltrix Pricing | Free, Starter, Growth and Enterprise",
  description:
    "Compare Veltrix plans, see what each tier includes, and choose the right commercial posture for launches, community execution and member journeys.",
};

const trustNotes = [
  {
    eyebrow: "Billing clarity",
    body: "Plan limits map to real operating pressure instead of hidden product gates.",
  },
  {
    eyebrow: "Upgrade posture",
    body: "Growth actions should warn early, then route cleanly into upgrade and continue.",
  },
  {
    eyebrow: "Buyer confidence",
    body: "Trust review, support and enterprise routing stay visible right inside the pricing flow.",
  },
] as const;

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.16),transparent_22%),radial-gradient(circle_at_86%_10%,rgba(74,217,255,0.16),transparent_24%),linear-gradient(180deg,#071015_0%,#060b10_38%,#030507_100%)] text-white">
      <GrowthAttributionBeacon
        eventType="pricing_view"
        eventPayload={{
          highlightedPlanId: highlightedPlanId ?? null,
          accountId: accountId ?? null,
          intent: intent ?? null,
          metric: metric ?? null,
          action: action ?? null,
          returnTo: returnTo ?? null,
          from: from ?? null,
        }}
      />

      <section className="mx-auto w-full max-w-[1480px] px-6 pb-10 pt-8 sm:px-10 lg:px-16 lg:pb-14 lg:pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(186,255,59,0.28),rgba(255,255,255,0.05))] shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
              <Orbit className="h-5 w-5 text-lime-200" />
            </div>
            <div>
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">Pricing</p>
              <p className="mt-1 text-sm text-slate-400">Self-serve first. Buyer path when needed.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/talk-to-sales?from=pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              <LifeBuoy className="h-4 w-4" />
              Talk to sales
            </Link>
            <Link
              href="/start"
              className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_18px_45px_rgba(186,255,59,0.2)] transition hover:bg-lime-200"
            >
              Start now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-end">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">
              <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(186,255,59,0.75)]" />
              Commercial posture
            </div>
            <h1 className="mt-6 max-w-[11ch] text-balance text-[clamp(3.5rem,8vw,6.6rem)] font-black leading-[0.9] tracking-[-0.05em] text-white">
              Pick the plan that matches your launch pressure.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
              Veltrix pricing is built around operating volume, live campaigns, project count and team pressure. Use
              Free to feel the product, Starter for the first real live team, Growth when Veltrix becomes the daily
              operating layer, and Enterprise when rollout shape needs a buyer conversation.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Free", "Starter", "Growth", "Enterprise"].map((label) => (
                <div
                  key={label}
                  className={`rounded-full border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] ${
                    label === "Growth"
                      ? "border-lime-300/28 bg-lime-300/[0.1] text-lime-200"
                      : "border-white/10 bg-white/[0.03] text-slate-200"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(160deg,rgba(13,18,27,0.96),rgba(8,12,19,0.98)_62%,rgba(12,20,30,0.98))] p-6 shadow-[0_36px_120px_rgba(0,0,0,0.3)]">
            <div className="pointer-events-none absolute inset-0" />
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-200">How to choose</p>
            <div className="mt-4 grid gap-4">
              <ChoiceCard
                title="Self-serve lane"
                body="If you already know your launch shape and want to move today, stay in Free, Starter or Growth."
                accent="lime"
              />
              <ChoiceCard
                title="Buyer lane"
                body="If security review, rollout planning or custom limits matter before checkout, open the enterprise path."
                accent="cyan"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-8 px-6 pb-16 sm:px-10 lg:grid-cols-[minmax(0,1.18fr)_380px] lg:px-16">
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
        <div className="mx-auto w-full max-w-[1480px] px-6 py-16 sm:px-10 lg:px-16">
          <div className="grid gap-5 xl:grid-cols-4">
            {commercialPlanPresentation.map((entry) => (
              <article
                key={entry.id}
                className={`rounded-[30px] border p-5 shadow-[0_22px_70px_rgba(0,0,0,0.14)] ${
                  entry.id === "growth"
                    ? "border-lime-300/20 bg-[linear-gradient(180deg,rgba(186,255,59,0.1),rgba(18,24,35,0.9))]"
                    : entry.id === "enterprise"
                      ? "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(74,217,255,0.1),rgba(12,16,24,0.92))]"
                      : "border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.9),rgba(11,15,24,0.92))]"
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-200">{entry.id}</p>
                <p className="mt-4 text-lg font-black tracking-[-0.02em] text-white">{entry.bestFor}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{entry.guidance}</p>
                <p className="mt-4 text-sm leading-7 text-slate-400">{entry.upgradeSignal}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-6 py-16 sm:px-10 lg:px-16">
        <div className="grid gap-5 lg:grid-cols-3">
          {trustNotes.map((note, index) => (
            <article
              key={note.eyebrow}
              className={`rounded-[30px] border p-5 shadow-[0_22px_70px_rgba(0,0,0,0.14)] ${
                index === 0
                  ? "border-lime-300/18 bg-[linear-gradient(180deg,rgba(186,255,59,0.08),rgba(18,24,35,0.9))]"
                  : index === 1
                    ? "border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.9),rgba(11,15,24,0.92))]"
                    : "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(74,217,255,0.08),rgba(12,16,24,0.92))]"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{note.eyebrow}</p>
              <p className="mt-4 text-sm leading-7 text-slate-200">{note.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-6 pb-18 sm:px-10 lg:px-16">
        <EnterpriseCtaBand
          title="Need custom limits, buyer review or rollout help before you buy?"
          body="Use the buyer path when security review, rollout shape, billing structure or enterprise posture matters more than clicking checkout right away."
          primaryHref="/talk-to-sales?from=pricing&intent=enterprise_review"
          primaryLabel="Open buyer intake"
          secondaryHref="/trust"
          secondaryLabel="Review trust center"
        />
      </section>
    </main>
  );
}

function ChoiceCard({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent: "lime" | "cyan";
}) {
  return (
    <div
      className={`rounded-[26px] border p-4 ${
        accent === "lime"
          ? "border-lime-300/18 bg-lime-300/[0.08]"
          : "border-cyan-300/16 bg-cyan-300/[0.08]"
      }`}
    >
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-200">{body}</p>
    </div>
  );
}
