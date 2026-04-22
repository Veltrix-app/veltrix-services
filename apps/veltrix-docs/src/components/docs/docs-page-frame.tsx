import { DocsHero } from "@/components/docs/docs-hero";
import { DocsRelatedPages } from "@/components/docs/docs-related-pages";

export function DocsPageFrame({
  eyebrow,
  title,
  description,
  actions,
  chips,
  rail,
  relatedHrefs,
  children,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  actions?: Array<{
    href: string;
    label: string;
  }>;
  chips?: string[];
  rail?: React.ReactNode;
  relatedHrefs?: string[];
  children: React.ReactNode;
}>) {
  return (
    <main className="docs-container">
      <DocsHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
        chips={chips}
        rail={rail}
      />

      {relatedHrefs?.length ? (
        <div className="mt-6">
          <DocsRelatedPages
            hrefs={relatedHrefs}
            description="Move between hubs, flagship pages and the exact reference layer without losing the system context."
          />
        </div>
      ) : null}

      <section className="mt-6 space-y-6">{children}</section>
    </main>
  );
}
