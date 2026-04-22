import Link from "next/link";
import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsSection } from "@/components/docs/docs-section";
import { DocsSnapshotFrame } from "@/components/docs/docs-snapshot-frame";
import { DocsStateExplorer } from "@/components/docs/docs-state-explorer";
import { getDocsTrackById } from "@/lib/docs/docs-nav";

export default function OperatorDocsPage() {
  const track = getDocsTrackById("operator-docs");

  if (!track) {
    return null;
  }

  return (
    <DocsPageFrame
      eyebrow="Operator Docs"
      title="Public docs for trust, payouts, on-chain recovery and operator follow-through."
      description="This track explains the deeper operational side of Veltrix. It is public, but structured to show how the consoles, cases, escalations and recovery paths work without exposing unsafe detail."
      actions={[
        { href: "/reference", label: "Open Reference" },
        { href: "/reference/control-atlas", label: "Open Control Atlas" },
        { href: "/release-notes", label: "Open Release Notes" },
      ]}
      chips={["Trust", "Payouts", "On-chain", "Escalations"]}
      relatedHrefs={[
        "/",
        "/project-docs",
        "/reference",
        "/reference/docs-coverage-map",
        "/reference/control-atlas",
        "/operator-docs/trust-console",
        "/operator-docs/payout-console",
        "/operator-docs/onchain-console",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Track focus</p>
          <h2 className="text-2xl font-black text-white">For internal operators and deep support work.</h2>
          <p className="text-sm leading-7 text-slate-300">
            The operator lane documents the case-driven consoles, escalations and runbooks that keep safety and recovery explainable.
          </p>
        </div>
      }
    >
      <DocsSection
        eyebrow="Coverage map"
        title="The operator lane is organized around cases, recovery and accountability."
        description="Operator Docs should make it obvious how an issue moves from signal to case to escalation to resolution. The docs need to explain the product posture without turning into a raw internal dump."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {track.sections.map((section) => (
            <div key={section.id} className="rounded-[26px] border border-white/8 bg-black/20 p-5">
              <p className="docs-kicker text-lime-300">{section.label}</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{section.summary}</p>

              <div className="mt-5 grid gap-3">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-[20px] border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/14 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-black text-white">{item.label}</p>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                          item.status === "flagship"
                            ? "text-lime-200"
                            : item.status === "live"
                              ? "text-cyan-200"
                              : "text-slate-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DocsSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <DocsSnapshotFrame
          title="How Operator Docs reads"
          description="The operator lane should show the difference between internal full-control consoles and project-bounded rails, while keeping the system readable for public docs users."
          caption="Operator documentation preview"
          stats={[
            { label: "Sections", value: String(track.sections.length) },
            { label: "Flagship pages", value: "3" },
            { label: "Audience", value: "Operators" },
          ]}
        >
          <div className="grid gap-4">
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
              <p className="docs-kicker text-cyan-200">Console layer</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {track.sections[0]?.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-[18px] border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/14 hover:bg-white/[0.05]"
                  >
                    <p className="text-sm font-black text-white">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
              <p className="docs-kicker text-white/70">Response workflows</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {track.sections[2]?.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-[18px] border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/14 hover:bg-white/[0.05]"
                  >
                    <p className="text-sm font-black text-white">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
              <p className="docs-kicker text-lime-300">Follow-through layer</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {track.sections[1]?.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-[18px] border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/14 hover:bg-white/[0.05]"
                  >
                    <p className="text-sm font-black text-white">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </DocsSnapshotFrame>

        <div className="grid gap-6">
          <DocsStateExplorer
            eyebrow="Reading modes"
            title="This lane should answer three operator questions."
            states={[
              {
                label: "What is wrong?",
                summary: "Operators need to understand the type of issue, its scope and why the system created a case in the first place.",
                bullets: [
                  "Console pages explain case types, severity and what evidence is surfaced publicly.",
                  "Snapshots should feel bounded, not like internal payload dumps.",
                  "Reference links carry the exact language for statuses and permissions.",
                ],
              },
              {
                label: "Who owns it?",
                summary: "Escalation and resolution flow only make sense if ownership, waiting state and next action stay visible.",
                bullets: [
                  "Escalation pages explain internal versus project-side follow-through.",
                  "Runbooks and history clarify what happens when issues move between teams.",
                  "Operator docs should always keep auditability in view.",
                ],
              },
              {
                label: "How do we recover?",
                summary: "The lane should show which moves are safe, which are internal-only and where project-bounded actions fit in.",
                bullets: [
                  "Trust, payout and on-chain coverage all need the same case-driven shape.",
                  "Project-safe actions and internal-only actions stay clearly separated.",
                  "The docs should make system recovery look deliberate instead of ad hoc.",
                ],
              },
            ]}
          />

          <DocsReferenceBlock
            title="Key objects behind this lane"
            items={[
              {
                label: "Permissioned consoles",
                meta: "Safety posture",
                summary: "Internal operators keep full control, while projects receive explicit visibility and action grants where the system allows it.",
              },
              {
                label: "Control atlas",
                meta: "Function layer",
                summary: "Grant controls, warning cues and recovery actions now have dedicated atlas pages so the main operator controls are easier to interpret directly.",
              },
              {
                label: "Case timelines",
                meta: "Explainability",
                summary: "Every action writes history, which is why trust, payout and on-chain all share the same case-driven language.",
              },
            ]}
          />
        </div>
      </div>
    </DocsPageFrame>
  );
}
