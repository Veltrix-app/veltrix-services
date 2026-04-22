import { notFound } from "next/navigation";
import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsSection } from "@/components/docs/docs-section";
import { DocsSnapshotFrame } from "@/components/docs/docs-snapshot-frame";
import { DocsStateExplorer } from "@/components/docs/docs-state-explorer";
import { getDocsGuidePage } from "@/lib/docs/docs-guide-pages";
import { getDocsRelatedPages } from "@/lib/docs/docs-nav";

export function DocsGuidePage({
  track,
  slug,
}: Readonly<{
  track: "project-docs" | "operator-docs";
  slug: string;
}>) {
  const page = getDocsGuidePage(track, slug);

  if (!page) {
    notFound();
  }

  const connectedSurfaces = getDocsRelatedPages(page.relatedHrefs)
    .filter((relatedPage) => relatedPage.href !== `/${track}/${slug}`)
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
          <p className="docs-kicker text-cyan-200">{page.rail.eyebrow}</p>
          <h2 className="text-2xl font-black text-white">{page.rail.title}</h2>
          <p className="text-sm leading-7 text-slate-300">{page.rail.body}</p>
        </div>
      }
    >
      <DocsSection
        eyebrow="What it is"
        title={page.surfaceTitle}
        description={page.whatItIs.description}
        aside={
          <div className="space-y-3">
            <p className="text-sm font-black text-white">{page.whatItIs.asideTitle}</p>
            <p className="text-sm leading-6 text-slate-400">{page.whatItIs.asideBody}</p>
          </div>
        }
      >
        <ul className="grid gap-3 lg:grid-cols-3">
          {page.whatItIs.bullets.map((bullet) => (
            <li key={bullet} className="rounded-[22px] border border-white/8 bg-black/20 p-4 text-sm leading-7 text-slate-300">
              {bullet}
            </li>
          ))}
        </ul>
      </DocsSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <DocsSnapshotFrame
          title={`${page.surfaceTitle} snapshot`}
          description={`A docs-safe visual model of how ${page.surfaceTitle} is structured in the current Veltrix product system.`}
          caption={`Read-only docs model / ${track === "project-docs" ? "Project track" : "Operator track"}`}
          stats={[
            {
              label: "Track",
              value: track === "project-docs" ? "Project" : "Operator",
            },
            {
              label: "Primary lens",
              value: page.chips[0] ?? "Surface",
            },
            {
              label: "Workflow depth",
              value: page.howItWorks ? `${page.howItWorks.states.length} states` : "Reference-led",
            },
          ]}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {page.surfaceAnatomy.items.map((item) => (
              <div key={item.label} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                <p className="text-base font-black text-white">{item.label}</p>
                {item.meta ? (
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">{item.meta}</p>
                ) : null}
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.summary}</p>
              </div>
            ))}
          </div>
        </DocsSnapshotFrame>

        <DocsReferenceBlock
          title={page.whereToFind.title}
          description={page.whereToFind.description}
          items={page.whereToFind.items}
        />
      </div>

      <div className={`grid gap-6 ${page.howItWorks ? "xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]" : ""}`}>
        {page.howItWorks ? (
          <DocsStateExplorer
            eyebrow="How it works"
            title={page.howItWorks.title}
            description={page.howItWorks.description}
            states={page.howItWorks.states}
          />
        ) : null}

        <DocsReferenceBlock
          title="Connected surfaces"
          description="These pages help explain the surrounding system so this surface or workflow never reads in isolation."
          items={connectedSurfaces}
        />
      </div>

      <DocsReferenceBlock
        title={page.keyRules.title}
        description={page.keyRules.description}
        items={page.keyRules.items}
      />
    </DocsPageFrame>
  );
}
