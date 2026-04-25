"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, CircleDotDashed, Layers3, ScrollText } from "lucide-react";
import { docsTopRoutes, getDocsTrackByPath, isDocsLinkLive } from "@/lib/docs/docs-nav";

export function DocsSidebar() {
  const pathname = usePathname();
  const activeTrack = getDocsTrackByPath(pathname);

  return (
    <aside className="docs-sidebar">
      <div className="flex h-full flex-col px-5 py-5 sm:px-6 sm:py-6">
        <div className="border-b border-white/8 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-lime-300/20 bg-lime-300/10 text-lime-200">
              <BookOpenText className="h-5 w-5" />
            </div>
            <div>
              <p className="docs-display docs-kicker text-lime-300">VYNTRO Docs</p>
              <p className="mt-2 text-sm text-slate-400">Public encyclopedia</p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-slate-300">
            The public operating manual for launches, community execution, member journeys and
            safety workflows.
          </p>
        </div>

        <nav className="mt-6 space-y-2">
          {docsTopRoutes.map((route) => {
            const active = route.href === "/" ? pathname === route.href : pathname.startsWith(route.href);

            return (
              <Link
                key={route.href}
                href={route.href}
                className={`block rounded-[22px] border px-4 py-4 transition ${
                  active
                    ? "border-lime-300/20 bg-lime-300/10 text-white"
                    : "border-white/8 bg-white/[0.02] text-slate-300 hover:border-white/12 hover:bg-white/[0.04]"
                }`}
              >
                <p className="text-sm font-bold">{route.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{route.summary}</p>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
          <p className="docs-kicker text-cyan-200">Current lane</p>
          <h2 className="mt-3 text-lg font-black text-white">{activeTrack.label}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{activeTrack.description}</p>

          <div className="mt-5 space-y-4">
            {activeTrack.sections.map((section) => (
              <div key={section.id} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">{section.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{section.summary}</p>

                <div className="mt-4 space-y-2">
                  {section.items.map((item) => {
                    const active = pathname === item.href;
                    const live = isDocsLinkLive(item);
                    const statusTone =
                      item.status === "live"
                        ? "text-cyan-200"
                        : item.status === "flagship"
                          ? "text-lime-200"
                          : "text-slate-500";

                    const content = (
                      <div
                        className={`rounded-[18px] border px-3 py-3 transition ${
                          active
                            ? "border-cyan-200/20 bg-cyan-200/10"
                            : "border-white/8 bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-white">{item.label}</p>
                          <span className={`text-[11px] font-bold uppercase tracking-[0.18em] ${statusTone}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{item.summary}</p>
                      </div>
                    );

                    return live ? (
                      <Link key={item.href} href={item.href}>
                        {content}
                      </Link>
                    ) : (
                      <div key={item.href} aria-disabled="true">
                        {content}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto grid gap-3 pt-6">
          <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-4">
            <p className="docs-kicker text-cyan-200">Best first move</p>
            <p className="mt-3 text-sm font-semibold text-white">
              {activeTrack.id === "project-docs"
                ? "Start from a workflow page if you're trying to complete something specific."
                : activeTrack.id === "operator-docs"
                  ? "Use workflow guides when the real question is about resolution, not just console structure."
                  : activeTrack.id === "reference"
                    ? "Open atlas and matrix pages first if you need the big system map before exact definitions."
                    : "Pick the lane that matches the work, then use search to jump into the exact surface or workflow."}
            </p>
          </div>

          <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <Layers3 className="h-4 w-4 text-cyan-200" />
              <p className="text-sm font-semibold text-white">Docs-safe snapshots</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Read-only examples shaped for public docs, without leaking unsafe operational detail.
            </p>
          </div>

          <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <ScrollText className="h-4 w-4 text-lime-200" />
              <p className="text-sm font-semibold text-white">Reference-backed</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Surfaces, workflows and exact system language stay cross-linked instead of drifting apart.
            </p>
          </div>

          <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <CircleDotDashed className="h-4 w-4 text-slate-300" />
              <p className="text-sm font-semibold text-white">Public by design</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Project and operator tracks are both public, but still separated so each audience can find the right layer fast.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
