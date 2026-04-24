import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { GrowthAttributionBeacon } from "@/components/analytics/growth-attribution-beacon";
import { EnterpriseCtaBand } from "@/components/marketing/enterprise-cta-band";
import { RequestDemoForm } from "@/components/marketing/request-demo-form";
import {
  commercialPlanPresentation,
  getCommercialPlanPresentation,
  resolveConversationMode,
} from "@/lib/commercial/commercial-contract";

export const metadata: Metadata = {
  title: "Talk to Sales | Veltrix",
  description:
    "Request a Veltrix walkthrough, buyer review or enterprise intake without slowing self-serve customers down.",
};

export default async function TalkToSalesPage({
  searchParams,
}: {
  searchParams: Promise<{
    plan?: string;
    intent?: string;
    from?: string;
    accountId?: string;
    returnTo?: string;
  }>;
}) {
  const { plan, intent, from, accountId, returnTo } = await searchParams;
  const defaultMode = resolveConversationMode({ plan, intent });
  const highlightedPlan = getCommercialPlanPresentation(plan ?? null);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.14),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(74,217,255,0.14),transparent_24%),linear-gradient(180deg,#071116_0%,#061015_42%,#04080b_100%)] px-6 py-10 text-white sm:px-10 lg:px-16">
      <GrowthAttributionBeacon
        eventType="anonymous_visit"
        eventPayload={{
          surface: "talk_to_sales",
          plan: plan ?? null,
          intent: intent ?? null,
          from: from ?? null,
        }}
      />

      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-10">
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-white/8 pb-6">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.36em] text-lime-300">Commercial path</p>
            <h1 className="mt-4 max-w-[12ch] text-balance text-[clamp(3rem,8vw,6rem)] font-black leading-[0.92] text-white">
              Start self-serve, or bring us in when the launch needs a tighter path.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200">
              Veltrix is self-serve first, but serious buyers should never have to guess where security review,
              custom limits or a guided rollout conversation starts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              View pricing
            </Link>
            <Link
              href="/start"
              className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
            >
              Start self-serve
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <Sparkles className="h-5 w-5 text-cyan-200" />
            <p className="mt-4 text-lg font-black text-white">Short, high-signal intake</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              This route is meant to start a real commercial conversation, not make buyers fill out a procurement thesis.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <ShieldCheck className="h-5 w-5 text-lime-300" />
            <p className="mt-4 text-lg font-black text-white">Enterprise clarity</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Security review, SSO posture, billing structure and rollout help all have a clear place to land.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <Building2 className="h-5 w-5 text-cyan-200" />
            <p className="mt-4 text-lg font-black text-white">Commercial truth</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Every request drops into the same internal growth queue that Veltrix uses to run leads and follow-up calmly.
            </p>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.04fr)_minmax(340px,0.96fr)]">
          <RequestDemoForm
            defaultMode={defaultMode}
            defaultPlan={plan ?? null}
            defaultIntent={intent ?? null}
            defaultFrom={from ?? null}
            defaultAccountId={accountId ?? null}
            defaultReturnTo={returnTo ?? null}
          />

          <div className="space-y-6">
            <div className="rounded-[34px] border border-white/10 bg-black/20 p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-cyan-200">Path guidance</p>
              <h2 className="mt-4 text-2xl font-black text-white">When to self-serve vs when to talk to us.</h2>
              <div className="mt-6 space-y-4">
                {commercialPlanPresentation.map((entry) => (
                  <div key={entry.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-white">{entry.id}</p>
                      {highlightedPlan?.id === entry.id ? (
                        <span className="rounded-full border border-lime-300/35 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-lime-200">
                          In focus
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-100">{entry.bestFor}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{entry.guidance}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{entry.upgradeSignal}</p>
                  </div>
                ))}
              </div>
            </div>

            <EnterpriseCtaBand
              eyebrow="Buyer rails"
              title="Need pricing, trust and docs to line up before the call?"
              body="Use the public buyer path if you want to review packages, security posture and launch workflow context before you open the conversation."
              primaryHref="/pricing"
              primaryLabel="Open pricing"
              secondaryHref="/trust"
              secondaryLabel="Open trust center"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
