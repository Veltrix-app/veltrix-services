import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Compass,
  Gem,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import { GrowthAttributionBeacon } from "@/components/analytics/growth-attribution-beacon";
import { VyntroCursor } from "@/components/layout/vyntro-cursor";
import { EnterpriseCtaBand } from "@/components/marketing/enterprise-cta-band";
import { publicAuthRoutes } from "@/lib/account/public-auth";
import {
  launchAccessModes,
  launchFaqs,
  launchOperatingModel,
  launchPillars,
  launchProofPoints,
  launchSiteNav,
  launchWorkflows,
} from "@/lib/launch/public-site-content";

const heroStats = [
  { label: "Launch rails", value: "Campaigns" },
  { label: "Member loops", value: "Quests + raids" },
  { label: "Control layer", value: "Trust + rewards" },
] as const;

const productWorlds = [
  {
    label: "Project worlds",
    title: "Turn a project page into a launch world.",
    body: "Show story, missions, rewards, token context and member standing as one premium public surface.",
    image: "/assets/public-home/project-worlds.webp",
    icon: Compass,
    tone: "cyan",
  },
  {
    label: "Quest pressure",
    title: "Guide members into the next useful action.",
    body: "Quests, raids, XP and shards stay connected, so users understand where momentum comes from.",
    image: "/assets/public-home/quest-pressure.webp",
    icon: Swords,
    tone: "violet",
  },
  {
    label: "Reward engine",
    title: "Make rewards feel visible before users claim.",
    body: "Lootboxes, pass layers, shards and project rewards give the platform a stronger hunt loop.",
    image: "/assets/public-home/reward-engine.webp",
    icon: Trophy,
    tone: "lime",
  },
  {
    label: "Safety posture",
    title: "Keep token and trust context beside the action.",
    body: "Public trust, token routes and safety modules make launch decisions easier to read.",
    image: "/assets/public-home/safety-posture.webp",
    icon: ShieldCheck,
    tone: "teal",
  },
] as const;

const signalRail = [
  { label: "Portal", value: "Project setup, showcase and campaign studio" },
  { label: "Webapp", value: "Member missions, DeFi, rewards and lootboxes" },
  { label: "Bots", value: "Discord and Telegram activation routes" },
  { label: "Ops", value: "Trust, payout, support and release posture" },
] as const;

function toneClasses(tone: (typeof productWorlds)[number]["tone"]) {
  if (tone === "violet") {
    return {
      border: "border-violet-300/14",
      glow: "from-violet-400/24",
      text: "text-violet-100",
      icon: "border-violet-300/18 bg-violet-300/10 text-violet-100",
    };
  }

  if (tone === "lime") {
    return {
      border: "border-lime-300/14",
      glow: "from-lime-300/18",
      text: "text-lime-100",
      icon: "border-lime-300/18 bg-lime-300/10 text-lime-100",
    };
  }

  if (tone === "teal") {
    return {
      border: "border-teal-300/14",
      glow: "from-teal-300/18",
      text: "text-teal-100",
      icon: "border-teal-300/18 bg-teal-300/10 text-teal-100",
    };
  }

  return {
    border: "border-cyan-300/14",
    glow: "from-cyan-300/20",
    text: "text-cyan-100",
    icon: "border-cyan-300/18 bg-cyan-300/10 text-cyan-100",
  };
}

function SectionIntro({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="font-display text-[11px] font-black uppercase tracking-[0.34em] text-lime-300">
        {label}
      </p>
      <h2 className="font-display mt-4 text-balance text-4xl font-black tracking-[-0.04em] text-white sm:text-[3.2rem] sm:leading-[0.96]">
        {title}
      </h2>
      {body ? <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">{body}</p> : null}
    </div>
  );
}

export function PublicLaunchSite() {
  return (
    <main className="vyntro-shell-background min-h-screen overflow-hidden bg-[linear-gradient(180deg,#050607_0%,#030407_42%,#020304_100%)] text-white">
      <GrowthAttributionBeacon eventType="anonymous_visit" eventPayload={{ surface: "homepage" }} />
      <VyntroCursor />

      <header className="relative z-30 mx-auto flex w-full max-w-[1480px] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="motion-press flex items-center gap-3">
          <span className="relative h-12 w-12 overflow-hidden rounded-full border border-violet-300/20 bg-black shadow-[0_18px_46px_rgba(111,76,255,0.26)]">
            <Image
              src="/brand/logo/vyntro-logo.webp"
              alt=""
              fill
              priority
              unoptimized
              sizes="48px"
              className="object-cover"
            />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-[11px] font-black uppercase tracking-[0.34em] text-lime-300">
              VYNTRO
            </span>
            <span className="mt-1 block text-sm font-semibold text-slate-300">Launch OS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/8 bg-white/[0.035] px-2 py-2 backdrop-blur-2xl lg:flex">
          {launchSiteNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="motion-press rounded-full px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/talk-to-sales?from=homepage"
            className="motion-press hidden rounded-full border border-white/10 bg-white/[0.035] px-4 py-2.5 text-[12px] font-bold text-white transition hover:border-white/16 hover:bg-white/[0.06] sm:inline-flex"
          >
            Talk to sales
          </Link>
          <Link
            href={publicAuthRoutes.start}
            className="motion-press hidden items-center gap-2 rounded-full bg-lime-300 px-4 py-2.5 text-[12px] font-black text-slate-950 shadow-[0_18px_46px_rgba(186,255,59,0.22)] transition hover:bg-lime-200 md:inline-flex"
          >
            Start now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto min-h-[calc(100svh-88px)] w-full max-w-[1480px] px-5 pb-12 pt-4 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-x-[-12%] top-[-7rem] h-[44rem] bg-[radial-gradient(circle_at_18%_18%,rgba(190,255,74,0.18),transparent_30%),radial-gradient(circle_at_76%_20%,rgba(124,58,237,0.18),transparent_32%),radial-gradient(circle_at_82%_62%,rgba(34,211,238,0.14),transparent_32%)]" />
        <div className="motion-ambient-grid" />

        <div className="relative grid min-h-[calc(100svh-8.5rem)] gap-8 overflow-hidden rounded-[36px] border border-white/8 bg-[linear-gradient(135deg,rgba(11,15,22,0.92),rgba(4,5,8,0.96)_56%,rgba(11,7,20,0.94))] px-5 py-7 shadow-[0_30px_110px_rgba(0,0,0,0.36)] sm:px-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(420px,1.02fr)] lg:items-center lg:px-10">
          <Image
            src="/brand/slides/vyntro-community.png"
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="pointer-events-none absolute inset-0 object-cover object-right opacity-[0.32] [mask-image:linear-gradient(90deg,transparent_0%,black_46%,black_100%)]"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(4,5,8,0.98)_0%,rgba(4,5,8,0.9)_38%,rgba(4,5,8,0.48)_72%,rgba(4,5,8,0.2)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime-300/36 to-transparent" />

          <div className="relative z-10 min-w-0 max-w-3xl">
            <h1 className="font-display max-w-[8ch] text-[clamp(2.85rem,13vw,8.2rem)] font-black leading-[0.84] tracking-[-0.045em] text-white sm:max-w-[10ch] lg:text-[clamp(4.8rem,9vw,8.2rem)] lg:tracking-[-0.06em]">
              <span className="block">VYNTRO</span>
              <span className="block">Launch</span>
              <span className="block">OS</span>
            </h1>
            <p className="mt-6 max-w-[18rem] text-base leading-8 text-slate-200 sm:max-w-2xl sm:text-lg">
              A premium operating system for project launches, community execution, member journeys,
              rewards and trust posture.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={publicAuthRoutes.start}
                className="motion-press motion-button-glow inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3.5 text-sm font-black text-slate-950 shadow-[0_22px_56px_rgba(186,255,59,0.24)] transition hover:bg-lime-200"
              >
                Start now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="motion-press inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-6 py-3.5 text-sm font-bold text-white transition hover:border-white/16 hover:bg-white/[0.075]"
              >
                Review pricing
              </Link>
              <Link
                href="/talk-to-sales?from=homepage"
                className="motion-press inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-6 py-3.5 text-sm font-bold text-white transition hover:border-white/16 hover:bg-white/[0.075]"
              >
                Talk to sales
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[20px] border border-white/8 bg-black/24 px-4 py-4 backdrop-blur-xl"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-[15px] font-black tracking-[-0.02em] text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 min-h-[26rem] min-w-0 lg:min-h-[38rem]">
            <div className="motion-soft-float pointer-events-none absolute inset-x-[-10%] bottom-[-3rem] h-[30rem] lg:bottom-[-4rem] lg:h-[39rem]">
              <Image
                src="/assets/project-world/mission-lane.webp"
                alt=""
                fill
                priority
                unoptimized
                sizes="(min-width: 1024px) 680px, 92vw"
                className="object-contain drop-shadow-[0_0_70px_rgba(45,212,191,0.24)]"
              />
            </div>

            <div className="absolute right-0 top-0 w-[min(20rem,78vw)] rounded-[26px] border border-white/8 bg-black/38 p-4 backdrop-blur-xl shadow-[0_26px_72px_rgba(0,0,0,0.34)]">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">Live command</p>
              <p className="mt-2 text-xl font-black tracking-[-0.04em] text-white">
                Build the route before members arrive.
              </p>
              <div className="mt-4 grid gap-2">
                {launchProofPoints.slice(0, 3).map((proof) => (
                  <div key={proof} className="flex gap-2 rounded-[16px] border border-white/7 bg-white/[0.035] p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" />
                    <p className="text-[12px] leading-5 text-slate-300">{proof}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="relative z-10 mx-auto w-full max-w-[1480px] px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-end">
          <SectionIntro
            label="Platform Map"
            title="One product family for launch pressure."
            body="The public site should feel like the same premium system members enter after sign-in: sharp, guided, visual and built around real operational surfaces."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {signalRail.map((signal) => (
              <div
                key={signal.label}
                className="motion-surface motion-3d-card motion-light-sweep rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(17,20,27,0.96),rgba(8,10,14,0.98))] p-5"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">{signal.label}</p>
                <p className="mt-3 text-[15px] font-black tracking-[-0.02em] text-white">{signal.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {productWorlds.map((world) => {
            const Icon = world.icon;
            const tone = toneClasses(world.tone);

            return (
              <article
                key={world.label}
                className={`motion-surface motion-3d-card motion-light-sweep group relative min-h-[30.5rem] overflow-hidden rounded-[28px] border ${tone.border} bg-[linear-gradient(180deg,rgba(15,18,24,0.98),rgba(6,8,12,0.99))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.25)]`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.glow} via-transparent to-transparent opacity-80`} />
                <div className="pointer-events-none absolute inset-x-[-18%] bottom-[-2.25rem] h-[18.5rem] transition duration-500 group-hover:scale-[1.04]">
                  <Image
                    src={world.image}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 350px, 88vw"
                    className="object-contain opacity-[0.86] drop-shadow-[0_0_48px_rgba(45,212,191,0.16)]"
                  />
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[58%] bg-[linear-gradient(180deg,rgba(9,12,18,0.99)_0%,rgba(9,12,18,0.96)_58%,rgba(9,12,18,0.34)_82%,transparent_100%)]" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${tone.text}`}>
                        {world.label}
                      </p>
                      <h3 className="mt-3 text-2xl font-black leading-[1.02] tracking-[-0.05em] text-white">
                        {world.title}
                      </h3>
                    </div>
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${tone.icon}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{world.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="relative z-10 border-y border-white/7 bg-white/[0.018]">
        <div className="mx-auto grid w-full max-w-[1480px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:px-12">
          <SectionIntro
            label="Workflow"
            title="From setup to momentum without losing the plot."
            body="Founders, growth leads and operators get a clearer path through the same system instead of stitching together launch docs, bot commands, spreadsheets and one-off campaign tools."
          />

          <div className="grid gap-4">
            {launchWorkflows.map((workflow, index) => (
              <article
                key={workflow.role}
                className="motion-surface motion-3d-card motion-light-sweep rounded-[26px] border border-white/7 bg-[linear-gradient(180deg,rgba(16,19,26,0.98),rgba(7,9,13,0.99))] p-5 shadow-[0_20px_62px_rgba(0,0,0,0.2)]"
              >
                <div className="grid gap-4 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-start">
                  <p className="font-display text-3xl font-black tracking-[-0.06em] text-lime-300/90">
                    0{index + 1}
                  </p>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                      {workflow.role}
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-[-0.04em] text-white">{workflow.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{workflow.summary}</p>
                  </div>
                  <Activity className="hidden h-5 w-5 text-cyan-200 sm:block" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-[1480px] px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <div className="relative min-h-[30rem] overflow-hidden rounded-[34px] border border-white/8 bg-[linear-gradient(135deg,rgba(12,16,22,0.98),rgba(4,6,10,0.99))] shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
            <Image
              src="/brand/slides/vyntro-raids.png"
              alt=""
              fill
              unoptimized
              sizes="(min-width: 1024px) 760px, 100vw"
              className="object-cover opacity-65"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,5,8,0.96),rgba(4,5,8,0.5),rgba(4,5,8,0.2))]" />
            <div className="absolute bottom-0 left-0 max-w-xl p-6 sm:p-8">
              <p className="font-display text-[11px] font-black uppercase tracking-[0.34em] text-rose-200">
                Campaign pressure
              </p>
              <h2 className="mt-4 text-4xl font-black leading-[0.96] tracking-[-0.05em] text-white sm:text-5xl">
                Raids, quests and rewards should feel like one live lane.
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {launchPillars.map((pillar, index) => {
              const Icon = index === 0 ? Compass : index === 3 ? Bot : index === 4 ? ShieldCheck : Sparkles;

              return (
                <article
                  key={pillar.name}
                  className="motion-surface motion-3d-card motion-light-sweep rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(16,19,26,0.98),rgba(7,9,13,0.99))] p-4"
                >
                  <div className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.035] text-lime-200">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-black tracking-[-0.02em] text-white">{pillar.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{pillar.summary}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="safety" className="relative z-10 border-y border-white/7 bg-white/[0.018]">
        <div className="mx-auto grid w-full max-w-[1480px] gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-12">
          <div>
            <SectionIntro
              label="Operating Model"
              title="Launch work needs a control room, not scattered tasks."
              body="The public story now mirrors the product: configure, activate, guide and recover with a clear operational spine."
            />

            <div className="mt-8 grid gap-3">
              {launchOperatingModel.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(16,19,26,0.98),rgba(7,9,13,0.99))] p-5"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">{item.step}</p>
                  <h3 className="mt-2 text-lg font-black tracking-[-0.03em] text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,19,26,0.98),rgba(7,9,13,0.99))] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
              <Image
                src="/assets/project-world/token-and-trust.webp"
                alt=""
                width={640}
                height={400}
                unoptimized
                className="pointer-events-none absolute -right-24 -top-8 w-[26rem] opacity-[0.58] drop-shadow-[0_0_48px_rgba(45,212,191,0.16)]"
              />
              <div className="relative z-10 max-w-md">
                <p className="font-display text-[11px] font-black uppercase tracking-[0.34em] text-cyan-200">
                  Safety Rails
                </p>
                <h3 className="mt-4 text-3xl font-black leading-[1] tracking-[-0.05em] text-white">
                  Trust, payouts, on-chain and incidents stay explainable.
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Operators get bounded controls, project-safe handoffs and recovery surfaces that keep launch pressure
                  visible instead of letting issues disappear into generic support workflows.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {launchAccessModes.map((mode) => (
                <div
                  key={mode.name}
                  className="rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(16,19,26,0.98),rgba(7,9,13,0.99))] p-5"
                >
                  <Gem className="h-5 w-5 text-lime-300" />
                  <h3 className="mt-4 text-lg font-black tracking-[-0.03em] text-white">{mode.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{mode.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="relative z-10 mx-auto w-full max-w-[1480px] px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <SectionIntro
            label="FAQ"
            title="Buyer clarity without flattening the product."
          />

          <div className="grid gap-4">
            {launchFaqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(16,19,26,0.98),rgba(7,9,13,0.99))] p-5"
              >
                <h3 className="text-lg font-black tracking-[-0.03em] text-white">{faq.question}</h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-[1480px] px-5 py-16 sm:px-8 lg:px-12">
        <EnterpriseCtaBand
          eyebrow="Buyer path"
          title="Need security review, rollout help or a higher-touch enterprise posture?"
          body="VYNTRO stays self-serve first, but serious buyers should have a premium path into trust review, commercial guidance and rollout planning without losing momentum."
          primaryHref="/talk-to-sales?from=homepage&intent=enterprise_review"
          primaryLabel="Open buyer intake"
          secondaryHref="/trust"
          secondaryLabel="Review trust center"
        />
      </section>

      <footer className="relative z-10 mx-auto flex w-full max-w-[1480px] flex-wrap items-center justify-between gap-5 border-t border-white/8 px-5 py-8 text-sm text-slate-400 sm:px-8 lg:px-12">
        <p>VYNTRO is the operating system for launch execution, community operations and member journeys.</p>
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
    </main>
  );
}
