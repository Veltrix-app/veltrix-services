import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  Compass,
  Orbit,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { publicAuthRoutes } from "@/lib/account/public-auth";
import { GrowthAttributionBeacon } from "@/components/analytics/growth-attribution-beacon";
import { EnterpriseCtaBand } from "@/components/marketing/enterprise-cta-band";
import {
  launchAccessModes,
  launchFaqs,
  launchOperatingModel,
  launchPillars,
  launchProofPoints,
  launchSiteNav,
  launchWorkflows,
} from "@/lib/launch/public-site-content";

const storySections = [
  {
    eyebrow: "Launch",
    title: "Shape the launch system before the pressure hits.",
    body:
      "Set campaign architecture, quests, raids, rewards and readiness from one operating layer instead of juggling separate product lanes.",
  },
  {
    eyebrow: "Operate",
    title: "Keep community execution connected to real product state.",
    body:
      "Bots, captain workflows and activation loops stay attached to the same launch system, so operators can move faster without losing clarity.",
  },
  {
    eyebrow: "Grow",
    title: "Give members a cleaner path back into action.",
    body:
      "Onboarding, comeback and next-best-action flows stop feeling like disconnected campaigns and start working like one guided journey.",
  },
  {
    eyebrow: "Control",
    title: "Keep trust, payouts and recovery visible when things drift.",
    body:
      "When launches get messy, teams need ownership, bounded project actions and a real command surface instead of support theatre.",
  },
] as const;

const heroPreviewMetrics = [
  { label: "Launch lanes", value: "4" },
  { label: "Live rails", value: "Bots + webapp" },
  { label: "Risk visibility", value: "Always on" },
] as const;

function pillarIcon(index: number) {
  if (index === 0) {
    return <Compass className="h-5 w-5 text-lime-200" />;
  }

  if (index === 3) {
    return <Bot className="h-5 w-5 text-cyan-200" />;
  }

  if (index === 4) {
    return <ShieldCheck className="h-5 w-5 text-lime-200" />;
  }

  return <Sparkles className="h-5 w-5 text-white/70" />;
}

export function PublicLaunchSite() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.18),transparent_23%),radial-gradient(circle_at_88%_10%,rgba(74,217,255,0.16),transparent_24%),linear-gradient(180deg,#071015_0%,#060b10_34%,#030507_100%)] text-white">
      <GrowthAttributionBeacon eventType="anonymous_visit" eventPayload={{ surface: "homepage" }} />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_18%),radial-gradient(circle_at_78%_22%,rgba(74,217,255,0.05),transparent_16%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-[1480px] flex-wrap items-center justify-between gap-5 px-6 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(186,255,59,0.28),rgba(255,255,255,0.05))] shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
            <Orbit className="h-5 w-5 text-lime-200" />
          </div>
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">Veltrix</p>
            <p className="mt-1 text-sm text-slate-400">Launch operating system</p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 backdrop-blur-xl lg:flex">
          {launchSiteNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/talk-to-sales?from=homepage"
            className="hidden rounded-full border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08] sm:inline-flex"
          >
            Talk to sales
          </Link>
          <Link
            href={publicAuthRoutes.start}
            className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-2.5 text-sm font-black text-slate-950 shadow-[0_18px_45px_rgba(186,255,59,0.22)] transition hover:bg-lime-200"
          >
            Start now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-[1480px] px-6 pb-14 pt-5 sm:px-10 lg:px-16 lg:pb-18 lg:pt-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)] lg:items-end">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(74,217,255,0.75)]" />
              Launch. Operate. Grow. Control.
            </div>

            <h1 className="font-display mt-6 max-w-[12ch] text-balance text-[clamp(3.7rem,9vw,7.5rem)] font-black leading-[0.88] tracking-[-0.05em] text-white">
              The premium operating system for serious project launches.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
              Veltrix gives teams one dark, calm command layer for launch execution, community operations, member
              journeys and recovery rails when launches start to drift.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={publicAuthRoutes.start}
                className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3.5 text-sm font-black text-slate-950 shadow-[0_20px_50px_rgba(186,255,59,0.22)] transition hover:bg-lime-200"
              >
                Start now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Review pricing
              </Link>
              <Link
                href="/talk-to-sales?from=homepage"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Talk to sales
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {launchProofPoints.map((proof) => (
                <div
                  key={proof}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm leading-6 text-slate-200 backdrop-blur-xl"
                >
                  {proof}
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(160deg,rgba(13,18,27,0.96),rgba(7,11,18,0.96)_58%,rgba(10,18,28,0.98))] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.34)] sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.14),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(74,217,255,0.12),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_34%)]" />
            <div className="relative z-10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">Launch preview</p>
                  <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white sm:text-[2rem]">
                    One board for the launch lane and the pressure around it.
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-200">
                  Galxe clarity, translated
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {heroPreviewMetrics.map((metric, index) => (
                  <div
                    key={metric.label}
                    className={`rounded-[24px] border px-4 py-4 ${
                      index === 0
                        ? "border-lime-300/20 bg-lime-300/[0.08]"
                        : "border-white/8 bg-white/[0.03]"
                    }`}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
                    <p className="mt-3 text-lg font-black text-white">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4">
                {storySections.map((section, index) => (
                  <div
                    key={section.eyebrow}
                    className={`grid gap-4 rounded-[28px] border p-5 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-start ${
                      index === 0
                        ? "border-lime-300/20 bg-[linear-gradient(180deg,rgba(186,255,59,0.12),rgba(19,26,38,0.94))]"
                        : "border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.86),rgba(11,15,24,0.88))]"
                    }`}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{section.eyebrow}</p>
                    <div>
                      <p className="text-lg font-black text-white">{section.title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-300">{section.body}</p>
                    </div>
                    <div className="hidden items-center justify-end sm:flex">{pillarIcon(index)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="relative z-10 border-y border-white/8 bg-white/[0.02]">
        <div className="mx-auto grid w-full max-w-[1480px] gap-10 px-6 py-18 sm:px-10 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] lg:px-16">
          <div className="max-w-xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">
              Product storyline
            </p>
            <h2 className="font-display mt-4 text-balance text-4xl font-black tracking-[-0.04em] text-white sm:text-[3.35rem] sm:leading-[0.96]">
              A clearer top-to-bottom story than a quest marketplace.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
              Veltrix should read like a launch operating system. The page starts with the product promise, moves into
              how teams use it, and then explains the control rails that make it trustworthy.
            </p>
          </div>

          <div className="grid gap-4">
            {launchWorkflows.map((workflow, index) => (
              <article
                key={workflow.role}
                className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,23,35,0.88),rgba(10,15,24,0.9))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-300">
                      0{index + 1} · {workflow.role}
                    </p>
                    <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">{workflow.title}</h3>
                  </div>
                  <Activity className="mt-1 h-5 w-5 text-cyan-200" />
                </div>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{workflow.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="relative z-10 mx-auto w-full max-w-[1480px] px-6 py-18 sm:px-10 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="max-w-xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">Platform map</p>
            <h2 className="font-display mt-4 text-balance text-4xl font-black tracking-[-0.04em] text-white sm:text-[3.2rem] sm:leading-[0.96]">
              Every launch rail stays inside one premium product family.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
              Portal, community automation, member journey, billing, support and recovery should feel like parts of one
              system instead of stitched-together surfaces.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {launchPillars.map((pillar, index) => (
              <div
                key={pillar.name}
                className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.9),rgba(11,15,24,0.9))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.14)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">0{index + 1}</p>
                    <h3 className="mt-3 text-xl font-black tracking-[-0.02em] text-white">{pillar.name}</h3>
                  </div>
                  {pillarIcon(index)}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">{pillar.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="relative z-10 border-y border-white/8 bg-white/[0.02]">
        <div className="mx-auto grid w-full max-w-[1480px] gap-8 px-6 py-18 sm:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-16">
          <div className="rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.92),rgba(10,14,22,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.16)] sm:p-7">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">
              Operating model
            </p>
            <div className="mt-5 grid gap-4">
              {launchOperatingModel.map((item) => (
                <div
                  key={item.step}
                  className="grid gap-4 rounded-[26px] border border-white/8 bg-white/[0.03] p-4 sm:grid-cols-[92px_minmax(0,1fr)]"
                >
                  <p className="font-display text-sm font-bold uppercase tracking-[0.24em] text-lime-300">{item.step}</p>
                  <div>
                    <h3 className="text-xl font-black tracking-[-0.02em] text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.92),rgba(10,14,22,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.16)] sm:p-7">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">Access posture</p>
              <div className="mt-5 grid gap-4">
                {launchAccessModes.map((mode) => (
                  <div key={mode.name} className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-lg font-black tracking-[-0.02em] text-white">{mode.name}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{mode.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.92),rgba(10,14,22,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.16)] sm:p-7">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">Safety rails</p>
              <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-white">
                Trust, payouts, on-chain and incidents stay explainable.
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Operators get bounded controls, project-safe handoffs and recovery surfaces that keep launch pressure
                visible instead of letting issues disappear into generic support workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="relative z-10 mx-auto w-full max-w-[1480px] px-6 py-18 sm:px-10 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.74fr)_minmax(0,1.26fr)]">
          <div className="max-w-xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">FAQ</p>
            <h2 className="font-display mt-4 text-balance text-4xl font-black tracking-[-0.04em] text-white sm:text-[3.1rem] sm:leading-[0.96]">
              Launch questions, answered with buyer-level clarity.
            </h2>
          </div>

          <div className="grid gap-4">
            {launchFaqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.9),rgba(11,15,24,0.9))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.14)]"
              >
                <h3 className="text-lg font-black text-white">{faq.question}</h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-[1480px] px-6 py-18 sm:px-10 lg:px-16">
        <EnterpriseCtaBand
          eyebrow="Buyer path"
          title="Need security review, rollout help or a higher-touch enterprise posture?"
          body="Veltrix stays self-serve first, but serious buyers should have a premium path into trust review, commercial guidance and rollout planning without losing momentum."
          primaryHref="/talk-to-sales?from=homepage&intent=enterprise_review"
          primaryLabel="Open buyer intake"
          secondaryHref="/trust"
          secondaryLabel="Review trust center"
        />
      </section>

      <section className="relative z-10 mx-auto w-full max-w-[1480px] px-6 pb-18 sm:px-10 lg:px-16">
        <div className="grid gap-8 border-t border-white/8 py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">Launch ready</p>
            <h2 className="font-display mt-4 text-balance text-4xl font-black tracking-[-0.04em] text-white sm:text-[3.1rem] sm:leading-[0.96]">
              Start in the product now, or open the buyer path before the next launch window lands.
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={publicAuthRoutes.start}
              className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3.5 text-sm font-black text-slate-950 shadow-[0_20px_50px_rgba(186,255,59,0.22)] transition hover:bg-lime-200"
            >
              Start now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/talk-to-sales?from=homepage"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Talk to sales
            </Link>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 py-8 text-sm text-slate-400">
          <p>Veltrix is the operating system for launch execution, community operations and member journeys.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/trust" className="transition hover:text-white">
              Trust
            </Link>
            <Link href="/subprocessors" className="transition hover:text-white">
              Subprocessors
            </Link>
            <Link href="/support" className="transition hover:text-white">
              Support
            </Link>
            <Link href="/talk-to-sales?from=homepage" className="transition hover:text-white">
              Talk to sales
            </Link>
            <Link href="/rewards/disclaimer" className="transition hover:text-white">
              Reward disclaimer
            </Link>
            <Link href={publicAuthRoutes.signIn} className="transition hover:text-white">
              Sign in
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
