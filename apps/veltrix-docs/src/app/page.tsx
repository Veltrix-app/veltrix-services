import Link from "next/link";
import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsSection } from "@/components/docs/docs-section";
import { DocsSnapshotFrame } from "@/components/docs/docs-snapshot-frame";
import { DocsStateExplorer } from "@/components/docs/docs-state-explorer";
import { docsTopRoutes, getDocsTrackById } from "@/lib/docs/docs-nav";

export default function DocsOverviewPage() {
  const projectTrack = getDocsTrackById("project-docs");
  const buyerTrack = getDocsTrackById("buyer-guides");
  const operatorTrack = getDocsTrackById("operator-docs");
  const referenceTrack = getDocsTrackById("reference");

  if (!projectTrack || !buyerTrack || !operatorTrack || !referenceTrack) {
    return null;
  }

  return (
    <DocsPageFrame
      eyebrow="Overview"
      title="The public operating manual for the full VYNTRO system."
      description="VYNTRO Docs explains the product as one connected system: launch setup, community execution, member journeys, bot activation, safety workflows and the exact states behind them."
      actions={[
        { href: "/project-docs", label: "Open Project Docs" },
        { href: "/buyer-guides", label: "Open Buyer Guides" },
        { href: "/operator-docs", label: "Open Operator Docs" },
      ]}
      chips={["Project Docs", "Buyer Guides", "Operator Docs", "Reference", "Release Notes"]}
      relatedHrefs={["/project-docs", "/buyer-guides", "/operator-docs", "/reference", "/release-notes"]}
      rail={
        <div className="space-y-4">
          <div>
            <p className="docs-kicker text-lime-300">Docs posture</p>
            <h2 className="mt-3 text-2xl font-black text-white">Built as a product surface.</h2>
          </div>
          <p className="text-sm leading-7 text-slate-300">
            Public, snapshot-first, reference-backed and structured to explain the whole system without dumping raw production state.
          </p>
          <div className="grid gap-3">
            <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
              <p className="text-sm font-black text-white">Three public tracks</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Project Docs, Buyer Guides and Operator Docs stay separate, but all stay open.</p>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
              <p className="text-sm font-black text-white">One system language</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Surfaces, workflows and exact rules all point back to the same reference layer.</p>
            </div>
          </div>
        </div>
      }
    >
      <DocsSection
        eyebrow="Start here"
        title="Choose the lane that matches the work."
        description="The docs product is encyclopedic by design. Each lane has its own job, and each one links back into the shared system language instead of becoming a disconnected knowledge base."
        aside={
          <div className="space-y-3">
            <p className="text-sm font-black text-white">Route model</p>
            <p className="text-sm leading-6 text-slate-400">
              Overview lands the product. Project Docs and Operator Docs explain the work surfaces. Reference keeps the exact language stable.
            </p>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {docsTopRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="rounded-[24px] border border-white/8 bg-black/20 p-5 transition hover:border-white/14 hover:bg-white/[0.04]"
            >
              <p className="text-lg font-black text-white">{route.label}</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{route.summary}</p>
            </Link>
          ))}
        </div>
      </DocsSection>

      <DocsSection
        eyebrow="Suggested starts"
        title="Start from the question you are actually trying to answer."
        description="Most people do not begin with a route name in mind. These entrypoints are the strongest first jumps if you want the docs to help with real work immediately."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          {[
            {
              href: "/project-docs/workflows/launch-a-project",
              eyebrow: "Founder path",
              title: "Launch a project",
              summary: "The strongest first read if you need to understand the clean order of operations from project readiness into the right builders.",
            },
            {
              href: "/buyer-guides/pricing-and-plans",
              eyebrow: "Buyer path",
              title: "Compare pricing and plans",
              summary: "The best entrypoint if the real question is how Free, Starter, Growth and Enterprise differ and when a human commercial path makes sense.",
            },
            {
              href: "/project-docs/workflows/build-a-campaign",
              eyebrow: "Growth path",
              title: "Build a campaign",
              summary: "The best entrypoint when the core question is how strategy turns into a mission structure members can actually move through.",
            },
            {
              href: "/operator-docs/workflows/review-a-trust-case",
              eyebrow: "Operator path",
              title: "Review a trust case",
              summary: "Start here when the work is already live and the real question is how signals, ownership, project input and resolution fit together.",
            },
          ].map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="rounded-[26px] border border-white/8 bg-black/20 p-5 transition hover:border-white/14 hover:bg-white/[0.04]"
            >
              <p className="docs-kicker text-cyan-200">{entry.eyebrow}</p>
              <p className="mt-4 text-xl font-black text-white">{entry.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{entry.summary}</p>
            </Link>
          ))}
        </div>
      </DocsSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <DocsSnapshotFrame
          title="How the docs system is structured"
          description="The public site is shaped like the product itself: project docs, buyer guides, operator docs, an exact reference layer and a visible release timeline."
          caption="Read-only architecture preview"
          stats={[
            { label: "Public tracks", value: "3" },
            { label: "Core hubs", value: "5" },
            { label: "Reference posture", value: "Exact" },
          ]}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
            <div className="grid gap-4">
              <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
                <p className="docs-kicker text-lime-300">Project Docs</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {projectTrack.sections.map((section) => (
                    <div key={section.id} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-sm font-black text-white">{section.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{section.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
                <p className="docs-kicker text-white/70">Buyer Guides</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {buyerTrack.sections.map((section) => (
                    <div key={section.id} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-sm font-black text-white">{section.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{section.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
                <p className="docs-kicker text-cyan-200">Operator Docs</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {operatorTrack.sections.map((section) => (
                    <div key={section.id} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-sm font-black text-white">{section.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{section.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
                <p className="docs-kicker text-cyan-200">Reference</p>
                <div className="mt-4 space-y-3">
                  {referenceTrack.sections.map((section) => (
                    <div key={section.id} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-sm font-black text-white">{section.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{section.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
                <p className="docs-kicker text-lime-300">Release Notes</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Public milestones keep the docs alive and make product evolution visible from day one.
                </p>
              </div>
            </div>
          </div>
        </DocsSnapshotFrame>

        <div className="grid gap-6">
          <DocsStateExplorer
            eyebrow="State explorer"
            title="Use the right documentation mode for the question in front of you."
            description="The docs product has different reading modes on purpose. They should feel connected, but not interchangeable."
            states={[
              {
                label: "Project Docs",
                summary: "Use this lane when you need to understand how a project team sets up a launch, builds missions, runs community operations or guides members.",
                bullets: [
                  "Surface-led pages explain where to find the feature and why it exists.",
                  "Workflow context shows how studios, launch, rewards and community operations connect.",
                  "Reference links keep builders grounded in the exact system rules.",
                ],
              },
              {
                label: "Operator Docs",
                summary: "Use this lane when the work is risk handling, payout safety, on-chain follow-through, escalation ownership or system health.",
                bullets: [
                  "Case-driven consoles stay bounded and explainable.",
                  "Resolution flows stay separated from project-facing builder language.",
                  "Runbooks and recovery context stay visible instead of buried in side notes.",
                ],
              },
              {
                label: "Reference",
                summary: "Use this lane when the question is about exact system language: states, permissions, case types, automations or command behavior.",
                bullets: [
                  "Shorter pages, denser definitions and less narrative copy.",
                  "Shared vocabulary stays stable across product and docs updates.",
                  "Other pages can link here instead of duplicating edge-case wording.",
                ],
                note: "Reference should read like the product's source-of-truth dictionary, not like a marketing page.",
              },
            ]}
          />

          <DocsReferenceBlock
            title="Core product pillars"
            description="These are the product layers the docs app needs to keep connected across every page family."
            items={[
              {
                label: "Project OS",
                meta: "Surface layer",
                summary: "Launch workspace, studios, rewards and the project-side operating model for execution.",
              },
              {
                label: "Community OS",
                meta: "Operating layer",
                summary: "Owner mode, captain mode, commands, automations, cohorts and community health.",
              },
              {
                label: "Member Journey",
                meta: "Experience layer",
                summary: "Onboarding, comeback, missions, recognition, rewards and notifications from the member side.",
              },
              {
                label: "Safety rails",
                meta: "Operator layer",
                summary: "Trust, payout, on-chain and escalation consoles with permissioned visibility and auditable actions.",
              },
            ]}
          />
        </div>
      </div>
    </DocsPageFrame>
  );
}
