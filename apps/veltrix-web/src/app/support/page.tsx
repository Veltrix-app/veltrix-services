import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { SupportIntakeForm } from "@/components/support/support-intake-form";
import { SupportLaneGrid } from "@/components/support/support-lane-grid";
import { loadPublicStatusOverview } from "@/lib/status/public-status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VYNTRO Support",
  description:
    "Contact VYNTRO support through a structured intake and check current platform service posture before or during a rollout.",
};

export default async function SupportPage() {
  const overview = await loadPublicStatusOverview().catch(() => null);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.12),transparent_24%),radial-gradient(circle_at_88%_10%,rgba(74,217,255,0.16),transparent_26%),linear-gradient(180deg,#071014_0%,#05090c_100%)] text-white">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-12 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-white/8 pb-6">
          <div className="max-w-4xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">Support</p>
            <h1 className="font-display mt-4 text-balance text-4xl font-black tracking-[0.03em] text-white sm:text-5xl">
              One clear path for help, status and incident-safe communication.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
              Use support when you need product help, billing help, rollout help, or a real operator to route a live
              issue into the right workspace. Use status when the problem looks platform-wide.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/status"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              Open status
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
            >
              Back to site
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_54px_rgba(0,0,0,0.18)]">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
              Before you submit
            </p>
          <h2 className="mt-3 text-[1.45rem] font-black text-white">Choose the cleanest route first</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Support intake is for specific help requests. Status is for platform-wide posture. Keeping those separate
              makes the queue faster and the public communication calmer.
            </p>
          </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_54px_rgba(0,0,0,0.18)]">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">
              Current status
            </p>
          <h2 className="mt-3 text-[1.45rem] font-black text-white">
              {overview ? overview.overallStatus.replaceAll("_", " ") : "Status unavailable"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {overview
                ? overview.activeIncidents.length > 0
                  ? `${overview.activeIncidents.length} active incident${overview.activeIncidents.length === 1 ? "" : "s"} currently visible.`
                  : "No active public incidents are currently visible."
                : "The status surface is not available right now."}
            </p>
            <Link
              href="/status"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-lime-300 transition hover:text-lime-200"
            >
              Review service status
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section>
          <div className="max-w-3xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">Support lanes</p>
            <h2 className="font-display mt-4 text-4xl font-black tracking-[0.03em] text-white sm:text-5xl">
              Route the issue into the right operator lane.
            </h2>
          </div>
          <div className="mt-8">
            <SupportLaneGrid />
          </div>
        </section>

        <SupportIntakeForm />

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6 text-sm text-slate-400">
          <p>VYNTRO support keeps customer requests, service status and incident language bounded and clear.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/status" className="transition hover:text-white">
              Status
            </Link>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
