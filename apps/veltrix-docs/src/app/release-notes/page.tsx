import Link from "next/link";
import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsSection } from "@/components/docs/docs-section";
import { listDocsReleaseNotes } from "@/lib/docs/release-notes/notes";

export default function ReleaseNotesPage() {
  const notes = listDocsReleaseNotes();

  return (
    <DocsPageFrame
      eyebrow="Release Notes"
      title="Track the product as it grows."
      description="Release notes will become the public evolution log for VYNTRO. This first surface establishes the section and gives the docs product a living timeline from day one."
      actions={[
        { href: "/", label: "Back to Overview" },
        { href: "/reference", label: "Open Reference" },
      ]}
      chips={["Launch log", "System milestones", "Living timeline"]}
      relatedHrefs={["/", "/project-docs", "/operator-docs", "/reference"]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Timeline posture</p>
          <h2 className="text-2xl font-black text-white">Public and product-facing.</h2>
          <p className="text-sm leading-7 text-slate-300">
            Release notes explain what changed and why it matters, without turning into a raw engineering changelog.
          </p>
        </div>
      }
    >
      <DocsSection
        eyebrow="Launch baseline"
        title="The first public release note layer starts with the major product arcs."
        description="This section will expand over time, but even the baseline should make it obvious how the product matured from individual modules into one connected operating system."
      >
        <div className="space-y-4">
          {notes.map((note, index) => (
            <Link
              key={note.slug}
              href={`/release-notes/${note.slug}`}
              className="block rounded-[26px] border border-white/8 bg-black/20 p-6 transition hover:border-white/14 hover:bg-white/[0.05]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="docs-kicker text-slate-500">0{index + 1}</p>
                  <h2 className="mt-3 text-2xl font-black text-white">{note.title}</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                  {note.dateLabel}
                </span>
              </div>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">{note.summary}</p>
            </Link>
          ))}
        </div>
      </DocsSection>
    </DocsPageFrame>
  );
}
