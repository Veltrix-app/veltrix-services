import Link from "next/link";
import { DocsPageFrame } from "@/components/docs/docs-page-frame";

export default function NotFound() {
  return (
    <DocsPageFrame
      eyebrow="Not Found"
      title="This docs route does not exist yet."
      description="The page you tried to open is outside the current docs slice or the route was typed incorrectly. The safest move is to jump back into the main documentation lanes."
      actions={[
        { href: "/", label: "Docs Overview" },
        { href: "/reference", label: "Reference" },
      ]}
      chips={["Docs-safe fallback"]}
      relatedHrefs={["/", "/project-docs", "/operator-docs", "/reference", "/release-notes"]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Quick recovery</p>
          <p className="text-sm leading-7 text-slate-300">
            Use the docs lanes below to re-enter the product map instead of getting stranded on a dead end.
          </p>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            href: "/project-docs",
            title: "Project Docs",
            summary: "Launch setup, studios, community execution and member-facing flows.",
          },
          {
            href: "/operator-docs",
            title: "Operator Docs",
            summary: "Trust, payouts, on-chain recovery, escalations and runbooks.",
          },
          {
            href: "/reference",
            title: "Reference",
            summary: "Exact language for states, permissions, case types and commands.",
          },
          {
            href: "/release-notes",
            title: "Release Notes",
            summary: "Public milestones and product evolution across the platform.",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[24px] border border-white/8 bg-black/20 p-5 transition hover:border-white/14 hover:bg-white/[0.04]"
          >
            <p className="text-lg font-black text-white">{item.title}</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">{item.summary}</p>
          </Link>
        ))}
      </div>
    </DocsPageFrame>
  );
}
