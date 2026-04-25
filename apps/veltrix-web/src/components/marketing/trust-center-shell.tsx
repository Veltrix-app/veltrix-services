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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.16),transparent_22%),radial-gradient(circle_at_88%_10%,rgba(74,217,255,0.16),transparent_24%),linear-gradient(180deg,#071015_0%,#060b10_38%,#030507_100%)] text-white">
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-10 px-6 py-6 sm:px-10 lg:px-16 lg:py-7">
        <header className="grid gap-8 border-b border-white/8 pb-8 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] lg:items-end">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">
              <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(186,255,59,0.75)]" />
              Trust center
            </div>
            <h1 className="font-display mt-6 max-w-[12ch] text-balance text-[clamp(3.2rem,8vw,6.3rem)] font-black leading-[0.9] tracking-[-0.05em] text-white">
              Security, privacy and operator trust with buyer-level clarity.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
              This is the public trust surface for how VYNTRO approaches operator identity, bounded visibility,
              incident handling, data lifecycle requests and vendor transparency.
            </p>
          </div>

      <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(160deg,rgba(13,18,27,0.96),rgba(8,12,19,0.98)_62%,rgba(12,20,30,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-200">Review routes</p>
            <div className="mt-4 grid gap-4">
              <div className="rounded-[26px] border border-cyan-300/16 bg-cyan-300/[0.08] p-4">
                <p className="text-sm font-black text-white">Talk to VYNTRO when trust review is active.</p>
                <p className="mt-2 text-sm leading-7 text-slate-200">
                  Security review, DPA follow-up, SSO questions and enterprise trust posture should all land in one
                  clear buyer path.
                </p>
              </div>
              <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-black text-white">Use status and subprocessors as supporting rails.</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Buyers should not need to hunt through docs to understand vendor posture or current platform health.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/talk-to-sales?from=trust&intent=enterprise_review"
                className="inline-flex rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Talk to sales
              </Link>
              <Link
                href="/pricing"
                className="inline-flex rounded-full bg-lime-300 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-lime-200"
              >
                View pricing
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-3">
          {[
            {
              title: "Identity and access",
              body: "2FA, SSO posture, session visibility and account recovery should be obvious before a buyer opens a review call.",
              tone: "lime",
            },
            {
              title: "Data lifecycle",
              body: "Export, delete, privacy and incident language should read as one calm system instead of scattered documentation.",
              tone: "cyan",
            },
            {
              title: "Vendor transparency",
              body: "Subprocessors, status and supporting materials should stay current enough that buyers do not have to hunt for truth.",
              tone: "default",
            },
          ].map((item) => (
            <div
              key={item.title}
              className={`rounded-[30px] border p-5 shadow-[0_22px_70px_rgba(0,0,0,0.14)] ${
                item.tone === "lime"
                  ? "border-lime-300/18 bg-[linear-gradient(180deg,rgba(186,255,59,0.08),rgba(18,24,35,0.9))]"
                  : item.tone === "cyan"
                    ? "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(74,217,255,0.08),rgba(12,16,24,0.92))]"
                    : "border-white/10 bg-[linear-gradient(180deg,rgba(18,24,36,0.9),rgba(11,15,24,0.92))]"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Buyer checklist</p>
              <p className="mt-3 text-lg font-black tracking-[-0.02em] text-white">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {controls.map((control, index) => (
            <article
              key={control.title}
              className={`rounded-[22px] border p-5 shadow-[0_18px_52px_rgba(0,0,0,0.16)] ${
                index === 0
                  ? "border-lime-300/18 bg-[linear-gradient(180deg,rgba(186,255,59,0.08),rgba(18,24,35,0.9))]"
                  : "border-white/10 bg-[linear-gradient(180deg,rgba(18,24,36,0.9),rgba(11,15,24,0.92))]"
              }`}
            >
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">Control</p>
              <h2 className="mt-2 text-[1.15rem] font-black tracking-[-0.03em] text-white">{control.title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">{control.summary}</p>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-200">
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

      <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,36,0.9),rgba(11,15,24,0.92))] p-5 shadow-[0_18px_52px_rgba(0,0,0,0.16)] sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="max-w-2xl">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">Documents</p>
        <h2 className="mt-2 text-[1.15rem] font-black tracking-[-0.03em] text-white">Public materials for security review.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                A trust center should let buyers move quickly between privacy, terms, subprocessors and status without
                feeling like they dropped into a separate documentation site.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {documents.map((document) => (
                <Link
                  key={document.href}
                  href={document.href}
                  className="rounded-[24px] border border-white/10 bg-black/20 p-5 transition hover:border-lime-300/30 hover:bg-white/[0.05]"
                >
                  <p className="text-sm font-black text-white">{document.label}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{document.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="max-w-3xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">Subprocessors</p>
        <h2 className="mt-2 text-[1.15rem] font-black tracking-[-0.03em] text-white">Current vendor registry.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              This list covers the main vendors VYNTRO uses to operate infrastructure, payments and product delivery.
              It stays public so buyers do not need to start from zero in review calls.
            </p>
          </div>
          <SubprocessorTable items={subprocessors} />
        </section>

      <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,36,0.9),rgba(11,15,24,0.92))] p-5 shadow-[0_18px_52px_rgba(0,0,0,0.16)] sm:p-6">
          <div className="max-w-3xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">FAQ</p>
        <h2 className="mt-2 text-[1.15rem] font-black tracking-[-0.03em] text-white">Fast answers for common review questions.</h2>
          </div>
          <div className="mt-6 grid gap-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5"
              >
                <h3 className="text-lg font-black text-white">{faq.question}</h3>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

      <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,36,0.9),rgba(11,15,24,0.92))] p-5 shadow-[0_18px_52px_rgba(0,0,0,0.16)] sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">Next step</p>
        <h2 className="mt-2 text-[1.15rem] font-black tracking-[-0.03em] text-white">When the review gets specific, keep the route simple.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                VYNTRO keeps trust materials public, but real buyer review should still land in one clear commercial path so security, rollout and commercial questions stay connected.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/talk-to-sales?from=trust&intent=enterprise_review"
                className="inline-flex rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
              >
                Start buyer review
              </Link>
              <Link
                href="/status"
                className="inline-flex rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Open status
              </Link>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6 text-sm text-slate-400">
          <p>Trust, privacy and security materials for VYNTRO buyers, operators and reviewers.</p>
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
