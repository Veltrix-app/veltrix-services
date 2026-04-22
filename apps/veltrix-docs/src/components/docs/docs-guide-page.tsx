import { notFound } from "next/navigation";
import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsSection } from "@/components/docs/docs-section";
import { DocsStateExplorer } from "@/components/docs/docs-state-explorer";
import { getDocsGuidePage } from "@/lib/docs/docs-guide-pages";

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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <DocsReferenceBlock
          title={page.whereToFind.title}
          description={page.whereToFind.description}
          items={page.whereToFind.items}
        />

        <DocsReferenceBlock
          title={page.surfaceAnatomy.title}
          description={page.surfaceAnatomy.description}
          items={page.surfaceAnatomy.items}
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
          title={page.keyRules.title}
          description={page.keyRules.description}
          items={page.keyRules.items}
        />
      </div>
    </DocsPageFrame>
  );
}
