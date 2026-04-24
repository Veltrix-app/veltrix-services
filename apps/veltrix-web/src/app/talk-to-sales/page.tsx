import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Orbit, ShieldCheck, Sparkles } from "lucide-react";
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

const intentCards = [
  {
    icon: Sparkles,
    title: "Short, high-signal intake",
    body: "This route is meant to start a real commercial conversation, not make buyers fill out a procurement thesis.",
    accent: "cyan",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise clarity",
    body: "Security review, SSO posture, billing structure and rollout help all have a clear place to land.",
    accent: "lime",
  },
  {
    icon: Building2,
    title: "Commercial truth",
    body: "Every request drops into the same internal growth queue that Veltrix uses to run leads and follow-up calmly.",
    accent: "cyan",
  },
] as const;

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.16),transparent_22%),radial-gradient(circle_at_82%_14%,rgba(74,217,255,0.16),transparent_24%),linear-gradient(180deg,#071015_0%,#060b10_38%,#030507_100%)] text-white">
      <GrowthAttributionBeacon
        eventType="anonymous_visit"
        eventPayload={{
          surface: "talk_to_sales",
          plan: plan ?? null,
          intent: intent ?? null,
          from: from ?? null,
        }}
      />

      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-10 px-6 py-8 sm:px-10 lg:px-16 lg:py-10">
        <header className="grid gap-8 border-b border-white/8 pb-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-end">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">
              <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(186,255,59,0.75)]" />
              Commercial path
            </div>
            <h1 className="mt-6 max-w-[11ch] text-balance text-[clamp(3.2rem,8vw,6.4rem)] font-black leading-[0.9] tracking-[-0.05em] text-white">
              Start self-serve, or bring us in when the launch needs a tighter path.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
              Veltrix is self-serve first, but serious buyers should never have to guess where security review,
              custom limits or a guided rollout conversation starts.
            </p>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(160deg,rgba(13,18,27,0.96),rgba(8,12,19,0.98)_62%,rgba(12,20,30,0.98))] p-6 shadow-[0_36px_120px_rgba(0,0,0,0.3)]">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04]">
                <Orbit className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-200">Routing help</p>
                <p className="mt-2 text-lg font-black text-white">Choose the lane that matches the buyer.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
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
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          {intentCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className={`rounded-[30px] border p-5 shadow-[0_22px_70px_rgba(0,0,0,0.14)] ${
                  card.accent === "lime"
                    ? "border-lime-300/18 bg-[linear-gradient(180deg,rgba(186,255,59,0.08),rgba(18,24,35,0.9))]"
                    : "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(74,217,255,0.08),rgba(12,16,24,0.92))]"
                }`}
              >
                <Icon className={`h-5 w-5 ${card.accent === "lime" ? "text-lime-300" : "text-cyan-200"}`} />
                <p className="mt-4 text-lg font-black tracking-[-0.02em] text-white">{card.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">{card.body}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)]">
          <RequestDemoForm
            defaultMode={defaultMode}
            defaultPlan={plan ?? null}
            defaultIntent={intent ?? null}
            defaultFrom={from ?? null}
            defaultAccountId={accountId ?? null}
            defaultReturnTo={returnTo ?? null}
          />

          <div className="space-y-6">
            <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,36,0.9),rgba(11,15,24,0.92))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.16)] sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-cyan-200">Path guidance</p>
              <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-white">
                When to self-serve vs when to talk to us.
              </h2>
              <div className="mt-6 space-y-4">
                {commercialPlanPresentation.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-[24px] border p-4 ${
                      highlightedPlan?.id === entry.id
                        ? "border-lime-300/22 bg-lime-300/[0.1]"
                        : entry.id === "enterprise"
                          ? "border-cyan-300/16 bg-cyan-300/[0.08]"
                          : "border-white/8 bg-white/[0.03]"
                    }`}
                  >
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
