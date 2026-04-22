import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsPlaybookSection, type DocsPlaybookExample } from "@/components/docs/docs-playbook-section";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsSection } from "@/components/docs/docs-section";
import { DocsSnapshotFrame } from "@/components/docs/docs-snapshot-frame";
import { DocsStateExplorer } from "@/components/docs/docs-state-explorer";
import {
  loadDocsStateExplorerDataset,
  loadDocsSurfaceSnapshot,
  type DocsReferenceEntry,
  type DocsReferenceSection,
  type DocsSnapshotSlug,
  type DocsStateExplorerSlug,
} from "@/lib/docs-data";

export function DocsFlagshipPage({
  eyebrow,
  title,
  description,
  actions,
  chips,
  relatedHrefs,
  rail,
  snapshotSlug,
  stateExplorerSlug,
  whatItIs,
  whereToFind,
  keyRules,
  controlAtlas,
  deepDive,
  playbookExamples,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  actions?: Array<{
    href: string;
    label: string;
  }>;
  chips?: string[];
  relatedHrefs: string[];
  rail?: React.ReactNode;
  snapshotSlug: DocsSnapshotSlug;
  stateExplorerSlug?: DocsStateExplorerSlug;
  whatItIs: {
    description: string;
    bullets: string[];
    asideTitle: string;
    asideBody: string;
  };
  whereToFind: {
    title: string;
    description: string;
    items: DocsReferenceEntry[];
  };
  keyRules: {
    title: string;
    description?: string;
    items: DocsReferenceEntry[];
  };
  controlAtlas?: {
    title: string;
    description?: string;
    sections: DocsReferenceSection[];
  };
  deepDive?: {
    title: string;
    description?: string;
    sections: DocsReferenceSection[];
  };
  playbookExamples?: {
    title: string;
    description?: string;
    items: DocsPlaybookExample[];
  };
}>) {
  const snapshot = loadDocsSurfaceSnapshot(snapshotSlug);
  const stateExplorer = stateExplorerSlug ? loadDocsStateExplorerDataset(stateExplorerSlug) : undefined;

  if (!snapshot) {
    return null;
  }

  const toneClasses = {
    cyan: "text-cyan-200 border-cyan-200/20 bg-cyan-200/10",
    lime: "text-lime-200 border-lime-300/20 bg-lime-300/10",
    slate: "text-slate-300 border-white/10 bg-white/[0.04]",
  } as const;

  return (
    <DocsPageFrame
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={actions}
      chips={chips}
      relatedHrefs={relatedHrefs}
      rail={rail}
    >
      <DocsSection
        eyebrow="What it is"
        title={snapshot.title}
        description={whatItIs.description}
        aside={
          <div className="space-y-3">
            <p className="text-sm font-black text-white">{whatItIs.asideTitle}</p>
            <p className="text-sm leading-6 text-slate-400">{whatItIs.asideBody}</p>
          </div>
        }
      >
        <ul className="grid gap-3 lg:grid-cols-3">
          {whatItIs.bullets.map((bullet) => (
            <li key={bullet} className="rounded-[22px] border border-white/8 bg-black/20 p-4 text-sm leading-7 text-slate-300">
              {bullet}
            </li>
          ))}
        </ul>
      </DocsSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <DocsSnapshotFrame
          title={snapshot.title}
          description={snapshot.summary}
          caption={`${snapshot.posture} / ${snapshot.refreshedFrom}`}
          stats={snapshot.stats}
        >
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-3">
              {snapshot.phases.map((phase) => (
                <div key={phase.title} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">{phase.label}</p>
                  <p className="mt-3 text-base font-black text-white">{phase.title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{phase.summary}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {snapshot.panels.map((panel) => (
                <div key={panel.title} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                  <p className="text-base font-black text-white">{panel.title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{panel.summary}</p>
                  <ul className="mt-4 space-y-2">
                    {panel.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-3 text-sm leading-6 text-slate-300">
                        <span className="mt-2 h-2 w-2 rounded-full bg-lime-300" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {snapshot.signals.map((signal) => (
                <div key={signal.label} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                      toneClasses[signal.tone ?? "slate"]
                    }`}
                  >
                    {signal.label}
                  </span>
                  <p className="mt-3 text-2xl font-black text-white">{signal.value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{signal.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </DocsSnapshotFrame>

        <DocsReferenceBlock
          title={whereToFind.title}
          description={whereToFind.description}
          items={whereToFind.items}
        />
      </div>

      <div className={`grid gap-6 ${stateExplorer ? "xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]" : ""}`}>
        {stateExplorer ? (
          <DocsStateExplorer
            eyebrow="How it works"
            title={stateExplorer.title}
            description={stateExplorer.summary}
            states={stateExplorer.states}
          />
        ) : null}

        <DocsReferenceBlock
          title={keyRules.title}
          description={keyRules.description}
          items={keyRules.items}
        />
      </div>

      {controlAtlas ? (
        <DocsSection eyebrow="Control anatomy" title={controlAtlas.title} description={controlAtlas.description}>
          <div className={`grid gap-4 ${controlAtlas.sections.length >= 3 ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
            {controlAtlas.sections.map((section) => (
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

      {deepDive ? (
        <DocsSection
          eyebrow="Scoring and signals"
          title={deepDive.title}
          description={deepDive.description}
        >
          <div className={`grid gap-4 ${deepDive.sections.length >= 3 ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
            {deepDive.sections.map((section) => (
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

      {playbookExamples ? (
        <DocsPlaybookSection
          title={playbookExamples.title}
          description={playbookExamples.description}
          items={playbookExamples.items}
        />
      ) : null}
    </DocsPageFrame>
  );
}
