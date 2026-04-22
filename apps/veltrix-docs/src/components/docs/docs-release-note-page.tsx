import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsSection } from "@/components/docs/docs-section";
import { getDocsRelatedPages } from "@/lib/docs/docs-nav";
import { loadDocsReleaseNote } from "@/lib/docs/release-notes/notes";

export function DocsReleaseNotePage({
  slug,
}: Readonly<{
  slug: string;
}>) {
  const note = loadDocsReleaseNote(slug);

  if (!note) {
    return null;
  }

  const relatedPages = getDocsRelatedPages(note.relatedHrefs).map((page) => ({
    label: page.label,
    meta: `${page.kind} · ${page.status}`,
    summary: page.summary,
  }));

  return (
    <DocsPageFrame
      eyebrow="Release Notes"
      title={note.title}
      description={note.summary}
      actions={[
        { href: "/release-notes", label: "Back to Release Notes" },
        { href: "/", label: "Docs Overview" },
      ]}
      chips={["Milestone", note.dateLabel]}
      relatedHrefs={note.relatedHrefs}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Milestone date</p>
          <h2 className="text-2xl font-black text-white">{note.dateLabel}</h2>
          <p className="text-sm leading-7 text-slate-300">
            Release notes stay public and product-facing, so people can understand what changed and why it matters without reading internal engineering notes.
          </p>
        </div>
      }
    >
      <DocsSection
        eyebrow="Why it matters"
        title={note.title}
        description={note.summary}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {note.highlights.map((highlight, index) => (
            <div key={highlight} className="rounded-[24px] border border-white/8 bg-black/20 p-5">
              <p className="docs-kicker text-lime-300">0{index + 1}</p>
              <p className="mt-4 text-sm leading-7 text-slate-300">{highlight}</p>
            </div>
          ))}
        </div>
      </DocsSection>

      <DocsReferenceBlock
        title="Connected docs surfaces"
        description="These are the pages and tracks that best explain the product layers touched by this milestone."
        items={relatedPages}
      />
    </DocsPageFrame>
  );
}
