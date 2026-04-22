import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsReferenceMatrix } from "@/components/docs/docs-reference-matrix";
import { DocsSection } from "@/components/docs/docs-section";
import { DocsStateExplorer } from "@/components/docs/docs-state-explorer";
import { getDocsRelatedPages } from "@/lib/docs/docs-nav";
import { loadDocsReferenceDataset, loadDocsStateExplorerDataset, type DocsReferenceSlug, type DocsStateExplorerSlug } from "@/lib/docs-data";

export function DocsReferencePage({
  eyebrow,
  title,
  description,
  referenceSlug,
  stateExplorerSlug,
  relatedHrefs,
  rail,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  referenceSlug: DocsReferenceSlug;
  stateExplorerSlug?: DocsStateExplorerSlug;
  relatedHrefs: string[];
  rail?: React.ReactNode;
}>) {
  const dataset = loadDocsReferenceDataset(referenceSlug);
  const stateExplorer = stateExplorerSlug ? loadDocsStateExplorerDataset(stateExplorerSlug) : undefined;
  const connectedPages = getDocsRelatedPages(relatedHrefs).map((page) => ({
    label: page.label,
    meta: `${page.kind} / ${page.status}`,
    summary: page.summary,
  }));

  if (!dataset) {
    return null;
  }

  return (
    <DocsPageFrame
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={[
        { href: "/reference", label: "Back to Reference" },
        { href: "/project-docs", label: "Project Docs" },
      ]}
      chips={["Reference page", "Exact system layer"]}
      relatedHrefs={relatedHrefs}
      rail={rail}
    >
      <DocsSection
        eyebrow="What this defines"
        title={dataset.title}
        description={dataset.summary}
        aside={
          <div className="space-y-3">
            <p className="text-sm font-black text-white">Reference posture</p>
            <p className="text-sm leading-6 text-slate-400">
              Reference pages exist to define exact system language once, then let other docs pages link back instead of duplicating edge-case wording.
            </p>
          </div>
        }
      >
        <DocsReferenceBlock title={dataset.title} items={dataset.entries} />
      </DocsSection>

      <div className={`grid gap-6 ${dataset.matrix ? "xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]" : ""}`}>
        {dataset.matrix ? <DocsReferenceMatrix matrix={dataset.matrix} /> : null}

        <DocsReferenceBlock
          title="Connected docs surfaces"
          description="These are the main pages that depend on this exact reference language."
          items={connectedPages}
        />
      </div>

      {stateExplorer ? (
        <DocsStateExplorer
          eyebrow="State context"
          title={stateExplorer.title}
          description={stateExplorer.summary}
          states={stateExplorer.states}
        />
      ) : null}
    </DocsPageFrame>
  );
}
