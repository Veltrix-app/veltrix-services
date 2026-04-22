"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";
import { DocsSearch } from "@/components/docs/docs-search";
import { getDocsTrackByPath } from "@/lib/docs/docs-nav";

export function DocsHeader() {
  const pathname = usePathname();
  const activeTrack = getDocsTrackByPath(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-[linear-gradient(180deg,rgba(5,10,14,0.96),rgba(5,10,14,0.88))] backdrop-blur-2xl">
      <div className="docs-container py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <DocsBreadcrumbs />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-white">{activeTrack.label}</p>
              <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                Public docs
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">{activeTrack.summary}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DocsSearch />

            <Link
              href="/release-notes"
              className="rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              Release notes
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
