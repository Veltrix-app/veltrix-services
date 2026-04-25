import Link from "next/link";

export function LegalPageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.11),transparent_24%),radial-gradient(circle_at_88%_10%,rgba(74,217,255,0.13),transparent_26%),linear-gradient(180deg,#071014_0%,#05090c_100%)] text-white">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-white/8 pb-6">
          <div className="max-w-3xl">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">{eyebrow}</p>
            <h1 className="font-display mt-3 text-balance text-4xl font-black tracking-[0.03em] text-white sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{intro}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/trust"
              className="inline-flex rounded-full border border-white/12 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              Trust Center
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-full border border-white/12 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              Back to site
            </Link>
            <Link
              href="/support"
              className="inline-flex rounded-full border border-white/12 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              Support
            </Link>
          </div>
        </header>

        <div className="space-y-5">{children}</div>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6 text-sm text-slate-400">
          <p>VYNTRO public launch materials and product policies.</p>
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
            <Link href="/trust" className="transition hover:text-white">
              Trust
            </Link>
            <Link href="/support" className="transition hover:text-white">
              Support
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-white/8 bg-white/[0.02] p-6 sm:p-7">
          <h2 className="text-[1.15rem] font-black text-white">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300 sm:text-base">{children}</div>
    </section>
  );
}
