import type { Metadata } from "next";
import Link from "next/link";
import { StatusHero } from "@/components/status/status-hero";
import { StatusIncidentTimeline } from "@/components/status/status-incident-timeline";
import { loadPublicStatusOverview } from "@/lib/status/public-status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Veltrix Status",
  description:
    "Track current Veltrix service posture, active incidents, degraded components, and recently resolved incident history.",
};

function toneClasses(status: string) {
  switch (status) {
    case "major_outage":
      return "border-rose-400/20 bg-rose-500/10 text-rose-200";
    case "partial_outage":
      return "border-amber-400/20 bg-amber-500/10 text-amber-200";
    case "degraded":
      return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
    case "maintenance":
      return "border-white/12 bg-white/[0.06] text-white";
    default:
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }
}

export default async function StatusPage() {
  const overview = await loadPublicStatusOverview();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.08),transparent_24%),radial-gradient(circle_at_88%_10%,rgba(74,217,255,0.10),transparent_26%),linear-gradient(180deg,#071014_0%,#05090c_100%)] text-white">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex rounded-full border border-white/12 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
          >
            Back to site
          </Link>
          <Link
            href="/support"
            className="inline-flex rounded-full bg-lime-300 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-lime-200"
          >
            Contact support
          </Link>
        </header>

        <StatusHero overview={overview} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {overview.components.map((component) => (
            <article
              key={component.componentKey}
              className={`rounded-[24px] border p-5 shadow-[0_14px_50px_rgba(0,0,0,0.18)] ${toneClasses(component.status)}`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-80">
                {component.componentLabel}
              </p>
              <p className="mt-3 text-lg font-black">{component.status.replaceAll("_", " ")}</p>
              <p className="mt-3 text-sm leading-7 opacity-90">{component.publicMessage}</p>
            </article>
          ))}
        </section>

        <StatusIncidentTimeline
          title="Active incidents"
          description="When service is degraded, this is the source of truth for what is affected and the latest public recovery update."
          incidents={overview.activeIncidents}
          emptyTitle="No active incidents"
          emptyDescription="No active public incidents are currently visible. The platform is operating within normal bounds."
        />

        <StatusIncidentTimeline
          title="Recently resolved"
          description="Resolved incidents stay visible for context so teams can understand what happened and when service stabilized again."
          incidents={overview.resolvedIncidents}
          emptyTitle="No recent resolved incidents"
          emptyDescription="There are no recently resolved public incidents to review right now."
        />
      </div>
    </main>
  );
}
