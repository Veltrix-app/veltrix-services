import Link from "next/link";
import { ArrowRight, BookOpen, LifeBuoy, ShieldCheck, Sparkles } from "lucide-react";
import { publicAuthRoutes } from "@/lib/account/public-auth";
import { GrowthAttributionBeacon } from "@/components/analytics/growth-attribution-beacon";

export default function StartPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.14),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(74,217,255,0.14),transparent_24%),linear-gradient(180deg,#081117_0%,#071014_36%,#05090c_100%)] px-6 py-10 text-white sm:px-10 lg:px-16">
      <GrowthAttributionBeacon eventType="anonymous_visit" eventPayload={{ surface: "start" }} />
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-6">
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.38em] text-lime-300">Veltrix</p>
            <h1 className="font-display mt-4 max-w-[12ch] text-balance text-4xl font-black tracking-[0.03em] text-white sm:text-6xl">
              Start from the right account path.
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
          >
            Back to site
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">New customer</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Create a fresh account and move into workspace setup.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              This path is for founders and operators who want to start a new Veltrix workspace, verify identity, and continue into first-run onboarding.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={publicAuthRoutes.signUp}
                className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3.5 text-sm font-black text-slate-950 transition hover:bg-lime-200"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
              >
                <LifeBuoy className="h-4 w-4" />
                Talk to us first
              </Link>
            </div>
          </section>

          <section className="rounded-[34px] border border-white/10 bg-black/20 p-6 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">Existing customer</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Sign in to continue</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Use this route if your workspace already exists and you want to open the product, recover access or accept a teammate invitation later in the flow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={publicAuthRoutes.signIn}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black text-slate-950 transition hover:bg-slate-100"
              >
                <ShieldCheck className="h-4 w-4" />
                Sign in
              </Link>
              <Link
                href={publicAuthRoutes.recover}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
              >
                Recover account
              </Link>
            </div>
          </section>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
            <Sparkles className="h-5 w-5 text-cyan-200" />
            <p className="mt-4 text-lg font-black text-white">Workspace-first entry</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Public auth should route into workspace creation and product setup, not into an unlabeled blank dashboard.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
            <ShieldCheck className="h-5 w-5 text-lime-300" />
            <p className="mt-4 text-lg font-black text-white">Verification is explicit</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              We show a real verification and recovery layer so customers always know whether they are verified, pending, or blocked.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
            <BookOpen className="h-5 w-5 text-cyan-200" />
            <p className="mt-4 text-lg font-black text-white">Docs stay close</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Teams that want to understand the product first can still move through docs and support before opening a workspace.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
