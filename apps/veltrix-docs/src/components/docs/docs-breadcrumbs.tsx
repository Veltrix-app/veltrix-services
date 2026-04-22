"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { getDocsBreadcrumbs } from "@/lib/docs/docs-nav";

export function DocsBreadcrumbs() {
  const pathname = usePathname();
  const breadcrumbs = getDocsBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
      {breadcrumbs.map((crumb, index) => {
        const last = index === breadcrumbs.length - 1;

        return (
          <div key={crumb.href} className="flex items-center gap-2">
            {last ? (
              <span className="text-slate-300">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="transition hover:text-white">
                {crumb.label}
              </Link>
            )}

            {!last ? <ChevronRight className="h-3.5 w-3.5 text-slate-600" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
