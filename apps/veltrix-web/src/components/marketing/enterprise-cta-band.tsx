import Link from "next/link";

export function EnterpriseCtaBand({
  eyebrow = "Enterprise path",
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(186,255,59,0.18),rgba(10,14,22,0.98)_30%,rgba(8,12,20,0.98)_68%,rgba(74,217,255,0.14))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] sm:p-6 lg:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(74,217,255,0.15),transparent_26%),linear-gradient(120deg,rgba(255,255,255,0.02),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">
            <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(186,255,59,0.7)]" />
            {eyebrow}
          </div>
          <h2 className="mt-5 max-w-[14ch] text-balance text-3xl font-black tracking-[-0.04em] text-white sm:text-[2.8rem] sm:leading-[0.96]">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base sm:leading-8">{body}</p>
        </div>

        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(186,255,59,0.22)] transition hover:bg-lime-200"
          >
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
