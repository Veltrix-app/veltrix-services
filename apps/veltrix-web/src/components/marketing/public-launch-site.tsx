import Link from "next/link";
import { ArrowRight, Bot, Compass, LifeBuoy, ShieldCheck, Sparkles } from "lucide-react";
import {
  launchAccessModes,
  launchFaqs,
  launchOperatingModel,
  launchPillars,
  launchProofPoints,
  launchSiteNav,
  launchWorkflows,
} from "@/lib/launch/public-site-content";

export function PublicLaunchSite() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.14),transparent_26%),radial-gradient(circle_at_88%_12%,rgba(74,217,255,0.16),transparent_24%),linear-gradient(180deg,#081117_0%,#071014_35%,#05090c_100%)] text-white">
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.02),transparent_38%),radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_54%)]" />
        <div className="absolute inset-y-0 left-[58%] hidden w-px bg-white/8 lg:block" />

        <header className="relative z-10 mx-auto flex w-full max-w-[1480px] items-center justify-between gap-4 px-6 py-6 sm:px-10 lg:px-16">
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.38em] text-lime-300">Veltrix</p>
            <p className="mt-2 text-sm text-slate-300">Launch execution, community operations and member journeys.</p>
          </div>

          <nav className="hidden items-center gap-8 lg:flex">
            {launchSiteNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/support"
              className="hidden rounded-full border border-white/12 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06] sm:inline-flex"
            >
              Book demo
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex rounded-full bg-lime-300 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-lime-200"
            >
              Start now
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid w-full max-w-[1480px] gap-12 px-6 pb-18 pt-10 sm:px-10 lg:min-h-[calc(100svh-88px)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-end lg:px-16 lg:pb-20 lg:pt-16">
          <div className="max-w-4xl pb-2">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">
              Public launch
            </p>
            <h1 className="font-display mt-6 max-w-[13ch] text-balance text-[clamp(3.3rem,9vw,8rem)] font-black leading-[0.88] tracking-[0.02em] text-white">
              Run launches, community execution and member journeys from one system.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
              Veltrix gives projects one operating layer for campaigns, quests, raids, rewards, bots, safety workflows
              and the member experience in between.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3.5 text-sm font-black text-slate-950 transition hover:bg-lime-200"
              >
                Start now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
              >
                Book a walkthrough
              </Link>
            </div>

            <div className="mt-12 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-3">
              {launchProofPoints.map((proof) => (
                <p key={proof} className="max-w-xs text-sm leading-7 text-slate-300">
                  {proof}
                </p>
              ))}
            </div>
          </div>

          <div className="grid gap-6 pb-2">
            {launchPillars.map((pillar, index) => (
              <div key={pillar.name} className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
                      0{index + 1}
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">{pillar.name}</h2>
                  </div>
                  {index === 0 ? (
                    <Compass className="mt-1 h-5 w-5 text-lime-200" />
                  ) : index === 3 ? (
                    <Bot className="mt-1 h-5 w-5 text-cyan-200" />
                  ) : index === 4 ? (
                    <ShieldCheck className="mt-1 h-5 w-5 text-lime-200" />
                  ) : (
                    <Sparkles className="mt-1 h-5 w-5 text-slate-300" />
                  )}
                </div>
                <p className="mt-3 max-w-sm text-sm leading-7 text-slate-300">{pillar.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto w-full max-w-[1480px] px-6 py-18 sm:px-10 lg:px-16">
        <div className="max-w-2xl">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">
            Workflow proof
          </p>
          <h2 className="font-display mt-4 max-w-[11ch] text-balance text-4xl font-black tracking-[0.03em] text-white sm:text-5xl">
            One product layer for the people who actually run the launch.
          </h2>
        </div>

        <div className="mt-10 divide-y divide-white/8 border-y border-white/8">
          {launchWorkflows.map((workflow) => (
            <div key={workflow.role} className="grid gap-5 py-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">{workflow.role}</p>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,0.32fr)]">
                <h3 className="text-2xl font-black text-white">{workflow.title}</h3>
                <p className="max-w-xl text-sm leading-7 text-slate-300">{workflow.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.02]">
        <div className="mx-auto grid w-full max-w-[1480px] gap-10 px-6 py-18 sm:px-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:px-16">
          <div className="max-w-xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
              Operating model
            </p>
            <h2 className="font-display mt-4 max-w-[10ch] text-balance text-4xl font-black tracking-[0.03em] text-white sm:text-5xl">
              Launch systems, not isolated tools.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
              The point of Veltrix is not to add another dashboard. It is to give teams one continuous operating model
              from launch setup to member action to risk handling.
            </p>
          </div>

          <div className="divide-y divide-white/8 border-y border-white/8">
            {launchOperatingModel.map((item) => (
              <div key={item.step} className="grid gap-4 py-6 md:grid-cols-[110px_minmax(0,1fr)]">
                <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-cyan-200">{item.step}</p>
                <div>
                  <h3 className="text-2xl font-black text-white">{item.title}</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{item.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="border-y border-white/8 bg-black/18">
        <div className="mx-auto grid w-full max-w-[1480px] gap-8 px-6 py-18 sm:px-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:px-16">
          <div className="max-w-xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
              Platform map
            </p>
            <h2 className="font-display mt-4 max-w-[10ch] text-balance text-4xl font-black tracking-[0.03em] text-white sm:text-5xl">
              Built for launches that keep moving after day one.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
              Veltrix connects the work of setting up a launch, operating the community, guiding members and keeping
              risk visible in one product family.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {launchPillars.map((pillar) => (
              <div key={pillar.name} className="border border-white/8 bg-white/[0.02] px-5 py-5">
                <h3 className="text-lg font-black text-white">{pillar.name}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{pillar.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-6 py-18 sm:px-10 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
          <div className="max-w-xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">
              Access posture
            </p>
            <h2 className="font-display mt-4 max-w-[10ch] text-balance text-4xl font-black tracking-[0.03em] text-white sm:text-5xl">
              Open product when you want speed, higher-touch support when you want it.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
              Veltrix launches with both paths on purpose. Projects can start directly, and teams that want a more
              guided rollout can still use a founder-led entry path.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {launchAccessModes.map((mode, index) => (
              <div key={mode.name} className="border border-white/8 bg-white/[0.02] p-6">
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
                  0{index + 1}
                </p>
                <h3 className="mt-3 text-2xl font-black text-white">{mode.name}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">{mode.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="mx-auto w-full max-w-[1480px] px-6 py-18 sm:px-10 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="max-w-xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">
              Safety and observability
            </p>
            <h2 className="font-display mt-4 max-w-[11ch] text-balance text-4xl font-black tracking-[0.03em] text-white sm:text-5xl">
              Trust, payouts, on-chain and incident handling stay in view.
            </h2>
          </div>

          <div className="grid gap-5 border-t border-white/8 pt-4 md:grid-cols-2 md:border-t-0 md:pt-0">
            <div className="border-b border-white/8 pb-5 md:border-b-0 md:border-r md:pr-6">
              <h3 className="text-lg font-black text-white">Case-driven operator consoles</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Internal teams get full control while projects receive bounded visibility, explicit grants and auditable
                action workflows.
              </p>
            </div>
            <div className="pb-5 md:pl-6">
              <h3 className="text-lg font-black text-white">Health, escalations and runbooks</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Operators can see what is failing, what is waiting on project input and what the next recovery move
                should be.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-white/8 bg-white/[0.02]">
        <div className="mx-auto w-full max-w-[1480px] px-6 py-18 sm:px-10 lg:px-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
            <div className="max-w-xl">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">FAQ</p>
              <h2 className="font-display mt-4 text-4xl font-black tracking-[0.03em] text-white sm:text-5xl">
                Launch questions, answered fast.
              </h2>
            </div>

            <div className="divide-y divide-white/8 border-y border-white/8">
              {launchFaqs.map((faq) => (
                <div key={faq.question} className="py-6">
                  <h3 className="text-lg font-black text-white">{faq.question}</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-6 py-18 sm:px-10 lg:px-16">
        <div className="grid gap-8 border-y border-white/8 py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="max-w-2xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">
              Launch ready
            </p>
            <h2 className="font-display mt-4 text-balance text-4xl font-black tracking-[0.03em] text-white sm:text-5xl">
              Start in the product, or talk to us before your next launch window opens.
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3.5 text-sm font-black text-slate-950 transition hover:bg-lime-200"
            >
              Start now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              <LifeBuoy className="h-4 w-4" />
              Talk to us
            </Link>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-slate-400">
          <p>Veltrix is the operating system for project launches, community execution and member journeys.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/support" className="transition hover:text-white">
              Support
            </Link>
            <Link href="/rewards/disclaimer" className="transition hover:text-white">
              Reward disclaimer
            </Link>
            <Link href="/sign-in" className="transition hover:text-white">
              Sign in
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
