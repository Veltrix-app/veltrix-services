import Link from "next/link";
import { ArrowRight, BookOpen, LifeBuoy, Orbit, ShieldCheck, Sparkles } from "lucide-react";
import { publicAuthRoutes } from "@/lib/account/public-auth";
import { GrowthAttributionBeacon } from "@/components/analytics/growth-attribution-beacon";
import { EnterpriseCtaBand } from "@/components/marketing/enterprise-cta-band";

const startCards = [
  {
    icon: Sparkles,
    title: "Workspace-first entry",
    body: "Public auth should route into workspace creation and product setup, not into an unlabeled blank dashboard.",
    accent: "cyan",
  },
  {
    icon: ShieldCheck,
    title: "Verification stays explicit",
    body: "We show a real verification and recovery layer so customers always know whether they are verified, pending or blocked.",
    accent: "lime",
  },
  {
    icon: BookOpen,
    title: "Docs stay close",
    body: "Teams that want to understand the product first can still move through docs and trust before opening a workspace.",
    accent: "cyan",
  },
] as const;

export default function StartPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.16),transparent_22%),radial-gradient(circle_at_82%_14%,rgba(74,217,255,0.16),transparent_24%),linear-gradient(180deg,#071015_0%,#060b10_38%,#030507_100%)] text-white">
      <GrowthAttributionBeacon eventType="anonymous_visit" eventPayload={{ surface: "start" }} />

      <section className="mx-auto w-full max-w-[1480px] px-6 pb-14 pt-8 sm:px-10 lg:px-16 lg:pb-16 lg:pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(186,255,59,0.28),rgba(255,255,255,0.05))] shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
              <Orbit className="h-5 w-5 text-lime-200" />
            </div>
            <div>
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">Start</p>
              <p className="mt-1 text-sm text-slate-400">Choose the right entry path, fast.</p>
            </div>
          </div>

          <Link
            href="/"
            className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Back to site
          </Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,1.02fr)] lg:items-end">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(74,217,255,0.7)]" />
              Entry posture
            </div>
            <h1 className="mt-6 max-w-[11ch] text-balance text-[clamp(3.4rem,8vw,6.7rem)] font-black leading-[0.9] tracking-[-0.05em] text-white">
              Start from the path that matches your launch state.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
              Veltrix should make one thing obvious here: whether you need to create a fresh workspace, sign back into
              an existing one, or open the buyer path before you touch the product at all.
            </p>
          </div>

          <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(160deg,rgba(13,18,27,0.96),rgba(8,12,19,0.98)_62%,rgba(12,20,30,0.98))] p-6 shadow-[0_36px_120px_rgba(0,0,0,0.3)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-lime-300">Fast routing</p>
            <div className="mt-4 grid gap-4">
              <div className="rounded-[28px] border border-lime-300/20 bg-lime-300/[0.08] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime-200">New customer</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">
                  Create a fresh account and move straight into workspace setup.
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  This path is for founders and operators who want to start a new Veltrix workspace, verify identity
                  and continue into first-run onboarding.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={publicAuthRoutes.signUp}
                    className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
                  >
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/talk-to-sales?from=start"
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                  >
                    <LifeBuoy className="h-4 w-4" />
                    Talk to us first
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,36,0.88),rgba(11,15,24,0.9))] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-200">Existing customer</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">Sign in and continue.</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Use this route if your workspace already exists and you want to open the product, recover access or
                  pick back up where the launch left off.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={publicAuthRoutes.signIn}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Sign in
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                  >
                    Review pricing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {startCards.map((card) => {
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

        <section className="mt-10">
          <EnterpriseCtaBand
            eyebrow="Guided help"
            title="Need rollout help before the workspace even exists?"
            body="If the next step is still unclear, open the buyer path instead of forcing yourself through a blind self-serve start."
            primaryHref="/talk-to-sales?from=start&intent=enterprise_review"
            primaryLabel="Open buyer intake"
            secondaryHref="/trust"
            secondaryLabel="Review trust"
          />
        </section>
      </section>
    </main>
  );
}
