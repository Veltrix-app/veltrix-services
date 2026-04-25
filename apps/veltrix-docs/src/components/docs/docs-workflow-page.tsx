import { notFound } from "next/navigation";
import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsSection } from "@/components/docs/docs-section";
import { DocsSnapshotFrame } from "@/components/docs/docs-snapshot-frame";
import { DocsStateExplorer } from "@/components/docs/docs-state-explorer";
import type { DocsReferenceSection } from "@/lib/docs-data";
import { getDocsRelatedPages } from "@/lib/docs/docs-nav";
import { getDocsWorkflowPage } from "@/lib/docs/docs-workflow-pages";

export function DocsWorkflowPage({
  track,
  slug,
}: Readonly<{
  track: "project-docs" | "operator-docs";
  slug: string;
}>) {
  const page = getDocsWorkflowPage(track, slug);

  if (!page) {
    notFound();
  }

  const connectedSurfaces = getDocsRelatedPages(page.relatedHrefs)
    .filter((relatedPage) => relatedPage.href !== `/${track}/workflows/${slug}`)
    .map((relatedPage) => ({
      label: relatedPage.label,
      meta: `${relatedPage.kind} / ${relatedPage.status}`,
      summary: relatedPage.summary,
    }));

  return (
    <DocsPageFrame
      eyebrow={page.eyebrow}
      title={page.title}
      description={page.description}
      actions={page.actions}
      chips={page.chips}
      relatedHrefs={page.relatedHrefs}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">{page.rail.eyebrow}</p>
          <h2 className="text-2xl font-black text-white">{page.rail.title}</h2>
          <p className="text-sm leading-7 text-slate-300">{page.rail.body}</p>
        </div>
      }
    >
      <DocsSection
        eyebrow="Workflow outcome"
        title={page.outcome.title}
        description={page.outcome.description}
        aside={
          <div className="space-y-3">
            <p className="text-sm font-black text-white">{page.outcome.asideTitle}</p>
            <p className="text-sm leading-6 text-slate-400">{page.outcome.asideBody}</p>
          </div>
        }
      >
        <ul className="grid gap-3 lg:grid-cols-3">
          {page.outcome.bullets.map((bullet) => (
            <li key={bullet} className="rounded-[22px] border border-white/8 bg-black/20 p-4 text-sm leading-7 text-slate-300">
              {bullet}
            </li>
          ))}
        </ul>
      </DocsSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
        <DocsSnapshotFrame
          title={`${page.outcome.title} snapshot`}
          description={`A docs-safe view of how this ${track === "project-docs" ? "project" : "operator"} workflow moves through VYNTRO today.`}
          caption={`Read-only workflow model / ${track === "project-docs" ? "Project track" : "Operator track"}`}
          stats={[
            {
              label: "Track",
              value: track === "project-docs" ? "Project" : "Operator",
            },
            {
              label: "Steps",
              value: String(page.stepFlow.states.length),
            },
            {
              label: "Connected surfaces",
              value: String(page.involvedSurfaces.items.length),
            },
          ]}
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {page.stepFlow.states.map((state, index) => (
                <div key={state.label} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">Step {String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-3 text-base font-black text-white">{state.label}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{state.summary}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {page.handoffs.items.slice(0, 3).map((handoff) => (
                <div key={handoff.label} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                  {handoff.meta ? (
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lime-200">{handoff.meta}</p>
                  ) : null}
                  <p className="mt-3 text-base font-black text-white">{handoff.label}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{handoff.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </DocsSnapshotFrame>

        <DocsReferenceBlock
          title={page.involvedSurfaces.title}
          description={page.involvedSurfaces.description}
          items={page.involvedSurfaces.items}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <DocsStateExplorer
          eyebrow="Step flow"
          title={page.stepFlow.title}
          description={page.stepFlow.description}
          states={page.stepFlow.states}
        />

        <DocsReferenceBlock
          title={page.handoffs.title}
          description={page.handoffs.description}
          items={page.handoffs.items}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <DocsReferenceBlock
          title="Connected surfaces"
          description="These are the docs pages that best explain the objects, consoles and exact system rules this workflow depends on."
          items={connectedSurfaces}
        />

        <DocsReferenceBlock
          title={page.keyRules.title}
          description={page.keyRules.description}
          items={page.keyRules.items}
        />
      </div>

      {page.deepDive ? (
        <DocsSection eyebrow="System model" title={page.deepDive.title} description={page.deepDive.description}>
          <div className={`grid gap-4 ${page.deepDive.sections.length >= 3 ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
            {page.deepDive.sections.map((section: DocsReferenceSection) => (
              <DocsReferenceBlock
                key={section.title}
                title={section.title}
                description={section.description}
                items={section.items}
              />
            ))}
          </div>
        </DocsSection>
      ) : null}
    </DocsPageFrame>
  );
}
