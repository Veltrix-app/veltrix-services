"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { docsAllLinks, docsTracks } from "@/lib/docs/docs-pages";
import { getDocsTrackByPath } from "@/lib/docs/docs-nav";
import { listDocsReleaseNotes } from "@/lib/docs/release-notes/notes";

type DocsSearchEntry = {
  href: string;
  label: string;
  summary: string;
  category: string;
  searchText: string;
};

const docsSearchEntries = [
  ...docsTracks.map((track) => ({
    href: track.href,
    label: track.label,
    summary: track.summary,
    category: "Track",
    searchText: `${track.label} ${track.summary} ${track.description}`,
  })),
  ...docsAllLinks.map((page) => ({
    href: page.href,
    label: page.label,
    summary: page.summary,
    category:
      page.kind === "surface"
        ? "Surface"
        : page.kind === "workflow"
        ? "Workflow"
          : page.kind === "reference"
            ? "Reference"
            : "Timeline",
    searchText: `${page.label} ${page.summary} ${page.kind} ${page.status}`,
  })),
  ...listDocsReleaseNotes().map((note) => ({
    href: `/release-notes/${note.slug}`,
    label: note.title,
    summary: note.summary,
    category: "Release note",
    searchText: `${note.title} ${note.summary} ${note.highlights.join(" ")}`,
  })),
].reduce<DocsSearchEntry[]>((entries, currentEntry) => {
  if (!entries.some((entry) => entry.href === currentEntry.href)) {
    entries.push(currentEntry);
  }

  return entries;
}, []);

const docsQuickJumpEntries = [
  "/project-docs/workflows/launch-a-project",
  "/project-docs/workflows/build-a-campaign",
  "/project-docs/community-os",
  "/operator-docs/workflows/review-a-trust-case",
  "/operator-docs/payout-console",
  "/reference/entities-and-relationships",
  "/reference/permission-matrices",
  "/release-notes/public-launch",
]
  .map((href) => docsSearchEntries.find((entry) => entry.href === href))
  .filter((entry): entry is DocsSearchEntry => Boolean(entry));

export function DocsSearch() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const pathname = usePathname();
  const activeTrack = getDocsTrackByPath(pathname);
  const normalizedQuery = query.trim().toLowerCase();
  const showResults = isFocused || normalizedQuery.length > 0;

  const results = useMemo(() => {
    if (!normalizedQuery) {
      return docsQuickJumpEntries;
    }

    return docsSearchEntries
      .map((entry) => {
        const label = entry.label.toLowerCase();
        const summary = entry.summary.toLowerCase();
        const category = entry.category.toLowerCase();
        const searchText = entry.searchText.toLowerCase();
        let score = 0;

        if (label === normalizedQuery) {
          score += 140;
        } else if (label.startsWith(normalizedQuery)) {
          score += 100;
        } else if (label.includes(normalizedQuery)) {
          score += 72;
        }

        if (summary.includes(normalizedQuery)) {
          score += 28;
        }

        if (category.includes(normalizedQuery)) {
          score += 18;
        }

        if (searchText.includes(normalizedQuery)) {
          score += 10;
        }

        if (activeTrack.href !== "/" && entry.href.startsWith(activeTrack.href)) {
          score += 6;
        }

        if (entry.category === "Workflow") {
          score += 4;
        }

        return { entry, score };
      })
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || left.entry.label.localeCompare(right.entry.label))
      .map(({ entry }) => entry)
      .slice(0, 8);
  }, [activeTrack.href, normalizedQuery]);

  return (
    <div className="relative min-w-[300px] max-w-[520px] flex-1 xl:flex-none">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-white/14 hover:bg-white/[0.05]">
        <label className="flex items-center gap-3">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 120)}
            placeholder="Search surfaces, workflows, states or release notes"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>
      </div>

      {showResults ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.65rem)] z-30 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,14,20,0.98),rgba(8,14,20,0.94))] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3 px-2 pb-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">
              {normalizedQuery ? `Search results in ${activeTrack.label}` : "Quick jump"}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {results.length} visible
            </p>
          </div>

          <div className="space-y-2">
            {results.map((entry) => (
              <Link
                key={`${entry.category}-${entry.href}`}
                href={entry.href}
                onClick={() => setQuery("")}
                className="block rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-3 transition hover:border-white/14 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-black text-white">{entry.label}</p>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-lime-200">
                    {entry.category}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{entry.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
