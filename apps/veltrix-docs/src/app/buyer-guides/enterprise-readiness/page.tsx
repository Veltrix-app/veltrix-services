import Link from "next/link";
import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsSection } from "@/components/docs/docs-section";

export default function BuyerGuideEnterpriseReadinessPage() {
  return (
    <DocsPageFrame
      eyebrow="Buyer Guides"
      title="Enterprise readiness is about controls, onboarding and review posture, not just a custom quote."
      description="Veltrix Enterprise is the path for teams that need higher-trust rollout handling: security review, SSO/SAML, admin policy controls, onboarding structure and a bounded commercial handoff."
      actions={[
        { href: "/buyer-guides/pricing-and-plans", label: "Open Pricing and Plans" },
        { href: "/operator-docs/incident-handling", label: "Open Incident Handling" },
      ]}
      chips={["Security review", "SSO/SAML", "Onboarding", "High-touch rollout"]}
      relatedHrefs={["/buyer-guides", "/buyer-guides/pricing-and-plans", "/operator-docs/incident-handling", "/project-docs", "/reference/permissions"]}
    >
      <DocsSection
        eyebrow="What enterprise means here"
        title="The enterprise path should feel like a stronger operating contract, not a mystery tier."
        description="That means enterprise buyers should be able to see which controls, policies and review surfaces already exist before a custom rollout discussion begins."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {[
            {
              title: "Security and policy",
              summary: "Public Trust Center posture, enterprise SSO/SAML, 2FA policy enforcement for admin roles and portal security controls form the core security layer.",
            },
            {
              title: "Commercial and onboarding",
              summary: "Enterprise conversations should cover onboarding structure, workspace readiness, billing posture and the level of human rollout support required.",
            },
            {
              title: "Operational maturity",
              summary: "Support, success, analytics, business controls and release discipline already exist around the core product, which gives enterprise buyers confidence that the system can be operated seriously.",
            },
            {
              title: "Bounded review path",
              summary: "A buyer should know where to send security or DPA questions, where subprocessors live and how incidents and status are communicated.",
            },
          ].map((card) => (
            <div key={card.title} className="rounded-[24px] border border-white/8 bg-black/20 p-5">
              <p className="text-base font-black text-white">{card.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{card.summary}</p>
            </div>
          ))}
        </div>
      </DocsSection>

      <DocsSection
        eyebrow="Review sequence"
        title="The cleanest enterprise motion is pricing, trust, intake, then rollout."
        description="Enterprise buyers should not have to reverse-engineer the path themselves. The product and docs should make that route obvious."
      >
        <div className="grid gap-4 lg:grid-cols-4">
          {[
            "Confirm package fit and why enterprise is needed.",
            "Review trust, privacy, subprocessors and incident posture.",
            "Open the enterprise intake path with concrete requirements.",
            "Move into onboarding and workspace rollout planning.",
          ].map((step, index) => (
            <div key={step} className="rounded-[22px] border border-white/8 bg-black/20 p-5">
              <p className="docs-kicker text-cyan-200">Step 0{index + 1}</p>
              <p className="mt-4 text-sm leading-7 text-slate-300">{step}</p>
            </div>
          ))}
        </div>
      </DocsSection>

      <DocsReferenceBlock
        title="Buyer review anchors"
        items={[
          {
            label: "Trust Center",
            meta: "Public review surface",
            summary: "Use this as the entrypoint for security posture, data handling, subprocessors and reporting routes.",
          },
          {
            label: "Pricing and Plans",
            meta: "Commercial fit",
            summary: "Use this to explain why a team belongs in Growth versus Enterprise and which operating needs justify the step up.",
          },
          {
            label: "Talk to sales",
            meta: "Human handoff",
            summary: "Use this when the buyer is ready to start security review, onboarding discussion or custom commercial scoping.",
          },
        ]}
      />

      <div className="rounded-[26px] border border-white/8 bg-black/20 p-5">
        <p className="docs-kicker text-lime-300">Enterprise next steps</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { href: "/buyer-guides/pricing-and-plans", label: "Open Pricing and Plans" },
            { href: "/operator-docs/incident-handling", label: "Review Incident Handling" },
            { href: "/project-docs/workflows/launch-a-project", label: "See Launch Workflow" },
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
