import Link from "next/link";
import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsSection } from "@/components/docs/docs-section";

const planRows = [
  {
    name: "Free",
    posture: "Small teams validating fit",
    limits: ["1 project", "1 active campaign", "10 live quests", "1 live raid", "2 billable seats", "1 provider"],
  },
  {
    name: "Starter",
    posture: "Small live teams running real programs",
    limits: ["2 projects", "5 active campaigns", "50 live quests", "5 live raids", "5 billable seats", "Discord + Telegram"],
  },
  {
    name: "Growth",
    posture: "Serious launch operators running multiple flows",
    limits: ["5 projects", "25 active campaigns", "250 live quests", "20 live raids", "15 billable seats", "Advanced automations + captain ops"],
  },
  {
    name: "Enterprise",
    posture: "High-touch teams with security, onboarding and custom posture requirements",
    limits: ["Custom limits", "Enterprise SSO/SAML", "Policy controls", "High-touch onboarding", "Commercial review path"],
  },
];

export default function BuyerGuidePricingAndPlansPage() {
  return (
    <DocsPageFrame
      eyebrow="Buyer Guides"
      title="Pricing and plans should make scale, posture and commercial path obvious."
      description="Veltrix pricing is intentionally capacity-led. The core product story stays coherent across packages, while scale, operating depth and enterprise controls determine where a team fits best."
      actions={[
        { href: "/buyer-guides/launch-operations", label: "Open Launch Operations" },
        { href: "/buyer-guides/enterprise-readiness", label: "Open Enterprise Readiness" },
      ]}
      chips={["Free", "Starter", "Growth", "Enterprise"]}
      relatedHrefs={["/buyer-guides", "/buyer-guides/launch-operations", "/buyer-guides/enterprise-readiness", "/project-docs", "/operator-docs"]}
    >
      <DocsSection
        eyebrow="Plan ladder"
        title="Use package limits to decide when self-serve is enough and when the team needs more structure."
        description="The commercial contract is mostly about capacity and operating depth. Teams should not need to relearn the product each time they move up the ladder."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {planRows.map((plan) => (
            <div key={plan.name} className="rounded-[26px] border border-white/8 bg-black/20 p-5">
              <p className="docs-kicker text-cyan-200">{plan.name}</p>
              <p className="mt-4 text-sm leading-7 text-slate-300">{plan.posture}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {plan.limits.map((limit) => (
                  <span
                    key={limit}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300"
                  >
                    {limit}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DocsSection>

      <DocsSection
        eyebrow="Commercial posture"
        title="Veltrix is self-serve first, but enterprise-ready when launch operations demand it."
        description="The right buyer motion depends less on company size alone and more on how much coordination, trust review, onboarding help and policy control the team needs around the core launch stack."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Choose self-serve",
              summary: "Use Free, Starter or Growth when the team can start directly, owns its own setup and mainly needs a clear path to activation and upgrade.",
            },
            {
              title: "Choose enterprise",
              summary: "Use Enterprise when security review, policy controls, SSO/SAML, onboarding structure or high-touch rollout support are part of the buying motion.",
            },
            {
              title: "Upgrade triggers",
              summary: "Plan pressure should feel explainable: usage limits, provider depth, captain ops, automation posture and buyer review signals are the main upgrade cues.",
            },
          ].map((card) => (
            <div key={card.title} className="rounded-[22px] border border-white/8 bg-black/20 p-5">
              <p className="text-base font-black text-white">{card.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{card.summary}</p>
            </div>
          ))}
        </div>
      </DocsSection>

      <DocsReferenceBlock
        title="Decision rules"
        items={[
          {
            label: "Free should stay real",
            meta: "Product-led growth",
            summary: "The free tier needs enough real utility to validate the system, but its scale limits should naturally reveal why larger teams need paid capacity.",
          },
          {
            label: "Growth is the operator tier",
            meta: "Commercial positioning",
            summary: "Growth is where multi-project, multi-campaign launch operators should feel the product open up without needing full enterprise process.",
          },
          {
            label: "Enterprise is a control posture",
            meta: "Buyer narrative",
            summary: "Enterprise should read as a high-trust operating path for teams with security review, onboarding and policy requirements, not as a vague catch-all upsell.",
          },
        ]}
      />

      <div className="rounded-[26px] border border-white/8 bg-black/20 p-5">
        <p className="docs-kicker text-lime-300">Next read</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { href: "/buyer-guides/launch-operations", label: "Launch Operations" },
            { href: "/buyer-guides/enterprise-readiness", label: "Enterprise Readiness" },
            { href: "/project-docs/workflows/launch-a-project", label: "Launch a Project" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4 text-sm font-black text-white transition hover:border-white/14 hover:bg-white/[0.05]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </DocsPageFrame>
  );
}
