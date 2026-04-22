import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDocsRelatedPages, isDocsLinkLive } from "@/lib/docs/docs-nav";

export function DocsRelatedPages({
  title = "Related pages",
  description,
  hrefs,
}: Readonly<{
  title?: string;
  description?: string;
  hrefs: string[];
}>) {
  const pages = getDocsRelatedPages(hrefs);

  if (!pages.length) {
    return null;
  }

  return (
    <section className="docs-card rounded-[28px] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="docs-kicker text-cyan-200">{title}</p>
          {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{description}</p> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {pages.map((page) => {
          const live = isDocsLinkLive(page);
          const badgeTone =
            page.status === "live"
              ? "text-cyan-200"
              : page.status === "flagship"
                ? "text-lime-200"
                : "text-slate-500";

          const content = (
            <div className="rounded-[22px] border border-white/8 bg-black/20 p-4 transition hover:border-white/14 hover:bg-white/[0.04]">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-black text-white">{page.label}</h3>
                <span className={`text-[11px] font-bold uppercase tracking-[0.18em] ${badgeTone}`}>
                  {page.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{page.summary}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
                <span>{live ? "Open page" : "Planned page"}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          );

          return live ? (
            <Link key={page.href} href={page.href}>
              {content}
            </Link>
          ) : (
            <div key={page.href}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
