import Link from "next/link";
import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsSection } from "@/components/docs/docs-section";

export default function BuyerGuideLaunchOperationsPage() {
  return (
    <DocsPageFrame
      eyebrow="Buyer Guides"
      title="Launch operations is the clearest way to understand what Veltrix actually replaces."
      description="Veltrix is not just a quest page or an airdrop surface. The product is designed as one operating system for launch planning, content execution, community motion, trust handling and recovery loops."
      actions={[
        { href: "/project-docs", label: "Open Project Docs" },
        { href: "/operator-docs", label: "Open Operator Docs" },
        { href: "/buyer-guides/enterprise-readiness", label: "Open Enterprise Readiness" },
      ]}
      chips={["Launch Workspace", "Studios", "Community OS", "Trust and recovery"]}
      relatedHrefs={["/buyer-guides", "/project-docs", "/operator-docs", "/reference/entities-and-relationships", "/buyer-guides/pricing-and-plans"]}
    >
      <DocsSection
        eyebrow="Operating model"
        title="Veltrix keeps launch, execution and recovery in one product spine."
        description="That matters commercially because buyers do not need to stitch together one tool for tasks, another for community, another for trust review and another for incident handling."
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Launch Workspace",
              summary: "Readiness, sequencing and builder entry points turn launch planning into one stable control surface.",
            },
            {
              title: "Studios and builders",
              summary: "Campaigns, quests, raids and rewards are shaped inside dedicated builders that still share one system language.",
            },
            {
              title: "Community execution",
              summary: "Owners, captains, commands and automations keep live launch motion connected to the same workspace truth.",
            },
            {
              title: "Trust and recovery",
              summary: "Support, incidents, trust, payout and on-chain follow-through are part of the platform instead of outsourced to side spreadsheets.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] border border-white/8 bg-black/20 p-5">
              <p className="text-base font-black text-white">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.summary}</p>
            </div>
          ))}
        </div>
      </DocsSection>

      <DocsSection
        eyebrow="Why buyers care"
        title="The value is operational continuity, not just more surfaces."
        description="When teams evaluate Veltrix, the important question is whether they can run a launch program with less fragmentation, clearer ownership and safer follow-through."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {[
            {
              title: "Less handoff loss",
              summary: "Planning, builders, community execution and recovery share one account and workspace model, so teams do not lose context every time work moves.",
            },
            {
              title: "Safer scale-up",
              summary: "Billing, support, security, analytics and success surfaces already exist around the launch workflow, which makes scale less fragile.",
            },
            {
              title: "Cleaner buyer story",
              summary: "A buyer can understand the platform as a launch operating system instead of a loose bundle of growth and ops features.",
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
        title="Best follow-up pages"
        items={[
          {
            label: "Project Docs",
            meta: "Product lane",
            summary: "Use this when the team wants to inspect launch workspace, studios, community OS and the project-facing build path in more detail.",
          },
          {
            label: "Operator Docs",
            meta: "Recovery lane",
            summary: "Use this when the buyer needs to see how incidents, trust, payouts and on-chain issues are handled after launch is already live.",
          },
          {
            label: "Trust Center",
            meta: "Buyer review",
            summary: "Use this when security, privacy and incident posture become part of the evaluation path.",
          },
        ]}
      />

      <div className="rounded-[26px] border border-white/8 bg-black/20 p-5">
        <p className="docs-kicker text-lime-300">Continue evaluation</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { href: "/buyer-guides/pricing-and-plans", label: "Pricing and Plans" },
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
