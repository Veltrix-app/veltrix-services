import Link from "next/link";
import type {
  PublicTrustControl,
  PublicTrustDocument,
  PublicTrustSubprocessor,
} from "@/lib/trust/public-trust";
import { SubprocessorTable } from "@/components/marketing/subprocessor-table";

export function TrustCenterShell({
  controls,
  documents,
  subprocessors,
  faqs,
}: {
  controls: PublicTrustControl[];
  documents: PublicTrustDocument[];
  subprocessors: PublicTrustSubprocessor[];
  faqs: Array<{ question: string; answer: string }>;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.11),transparent_24%),radial-gradient(circle_at_88%_10%,rgba(74,217,255,0.13),transparent_26%),linear-gradient(180deg,#071014_0%,#05090c_100%)] text-white">
      <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-12 px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-white/8 pb-6">
          <div className="max-w-4xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">Trust Center</p>
            <h1 className="font-display mt-4 text-balance text-4xl font-black tracking-[0.03em] text-white sm:text-5xl">
              Security, privacy and operational trust for buyers, operators and reviewers.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
              This is the public trust surface for how Veltrix approaches operator identity, bounded visibility, incident communication, data lifecycle requests and vendor transparency.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/support"
              className="inline-flex rounded-full border border-white/12 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              Security or DPA request
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-full bg-lime-300 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-lime-200"
            >
              Back to site
            </Link>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_70px_rgba(0,0,0,0.2)] sm:p-7">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">Security posture</p>
            <h2 className="mt-3 text-2xl font-black text-white">One security substrate, three surfaces.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Veltrix is built around a public trust layer, customer-facing security controls and internal security operations that all pull from the same underlying policy and review system.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                "Public Trust Center",
                "Portal security workspace",
                "Internal security command",
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm font-semibold text-white">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_70px_rgba(0,0,0,0.2)] sm:p-7">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">Review routes</p>
            <h2 className="mt-3 text-2xl font-black text-white">Fast paths for buyers and operators.</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
              <p>Use support for security questions, privacy requests, DPA follow-up and buyer reviews.</p>
              <p>Use status for platform-wide incidents or degraded service posture.</p>
              <p>Use the subprocessor registry when legal or procurement teams need vendor context quickly.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {controls.map((control) => (
            <article key={control.title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">Control</p>
              <h2 className="mt-3 text-2xl font-black text-white">{control.title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">{control.summary}</p>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
                {control.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-lime-300" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">Documents</p>
              <h2 className="mt-3 text-2xl font-black text-white">Public materials for security review.</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {documents.map((document) => (
              <Link
                key={document.href}
                href={document.href}
                className="rounded-[24px] border border-white/8 bg-black/20 p-5 transition hover:border-lime-300/35 hover:bg-white/[0.05]"
              >
                <p className="text-sm font-black text-white">{document.label}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{document.summary}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="max-w-3xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">Subprocessors</p>
            <h2 className="mt-3 text-2xl font-black text-white">Current vendor registry.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              This list covers the main vendors Veltrix uses to operate infrastructure, payments and product delivery. It is intentionally public so buyers do not need to start from zero in review calls.
            </p>
          </div>
          <SubprocessorTable items={subprocessors} />
        </section>

        <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <div className="max-w-3xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">FAQ</p>
            <h2 className="mt-3 text-2xl font-black text-white">Fast answers for common review questions.</h2>
          </div>
          <div className="mt-6 divide-y divide-white/8 border-y border-white/8">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-5">
                <h3 className="text-lg font-black text-white">{faq.question}</h3>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6 text-sm text-slate-400">
          <p>Trust, privacy and security materials for Veltrix buyers, operators and reviewers.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/subprocessors" className="transition hover:text-white">
              Subprocessors
            </Link>
            <Link href="/status" className="transition hover:text-white">
              Status
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
