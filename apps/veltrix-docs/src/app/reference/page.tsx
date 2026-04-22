import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsSection } from "@/components/docs/docs-section";
import { DocsStateExplorer } from "@/components/docs/docs-state-explorer";
import { getDocsTrackById } from "@/lib/docs/docs-nav";

export default function ReferencePage() {
  const track = getDocsTrackById("reference");

  if (!track) {
    return null;
  }

  return (
    <DocsPageFrame
      eyebrow="Reference"
      title="Exact system definitions for the full Veltrix product."
      description="Reference pages are the exact layer of the docs product. They should explain the states, commands, permissions and case models that other pages rely on."
      actions={[
        { href: "/project-docs", label: "Project Docs" },
        { href: "/operator-docs", label: "Operator Docs" },
      ]}
      chips={["Exact states", "Permissions", "Cases", "Commands"]}
      relatedHrefs={[
        "/",
        "/project-docs",
        "/operator-docs",
        "/reference/lifecycle-states",
        "/reference/permissions",
        "/reference/status-labels",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Reference posture</p>
          <h2 className="text-2xl font-black text-white">Dense, exact and cross-linked.</h2>
          <p className="text-sm leading-7 text-slate-300">
            This lane is where the system vocabulary stays stable when surface pages get richer or more narrative.
          </p>
        </div>
      }
    >
      <DocsSection
        eyebrow="Reference map"
        title="Every exact page belongs to a system cluster."
        description="Reference should feel like a product atlas, not a miscellaneous appendix. The clusters below are the foundation that other docs pages link into."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {track.sections.map((section) => (
            <DocsReferenceBlock
              key={section.id}
              title={section.label}
              description={section.summary}
              items={section.items.map((item) => ({
                label: item.label,
                meta: item.status,
                summary: item.summary,
              }))}
            />
          ))}
        </div>
      </DocsSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <DocsStateExplorer
          eyebrow="Reference modes"
          title="Reference pages usually answer one of these three questions."
          states={[
            {
              label: "State",
              summary: "What exact lifecycle, readiness or waiting posture does the product use here?",
              bullets: [
                "Lifecycle states keep launch and operator surfaces aligned.",
                "Status labels explain what users see in the UI and what those labels really mean.",
                "State pages should remove ambiguity, not add story.",
              ],
            },
            {
              label: "Permission",
              summary: "Who can see this, who can act on it and what is the safe default?",
              bullets: [
                "Permissions are split between visibility and action grants.",
                "Project-facing consoles default to bounded access instead of broad visibility.",
                "Reference language must stay exact because other pages depend on it.",
              ],
            },
            {
              label: "Case model",
              summary: "What case types exist, how do they differ and how do they move through the system?",
              bullets: [
                "Trust, payout and on-chain all use case-driven operating models.",
                "Case reference needs to stay crisp so console docs can stay readable.",
                "Public docs can explain the model without exposing raw internal payloads.",
              ],
            },
          ]}
        />

        <DocsReferenceBlock
          title="Reference usage rules"
          items={[
            {
              label: "Use exact wording",
              meta: "Copy rule",
              summary: "If a term is product-significant, the reference page should define it once and the rest of the docs should link back.",
            },
            {
              label: "Prefer compact structures",
              meta: "Layout rule",
              summary: "These pages should feel denser and faster to scan than the larger surface pages in the public tracks.",
            },
            {
              label: "Stay close to the system",
              meta: "Product rule",
              summary: "Reference pages should reflect real states, permissions and case types, not generic support-language approximations.",
            },
          ]}
        />
      </div>
    </DocsPageFrame>
  );
}
