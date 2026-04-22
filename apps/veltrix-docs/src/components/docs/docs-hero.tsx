import Link from "next/link";

type DocsHeroAction = {
  href: string;
  label: string;
};

export function DocsHero({
  eyebrow,
  title,
  description,
  actions,
  chips,
  rail,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  actions?: DocsHeroAction[];
  chips?: string[];
  rail?: React.ReactNode;
}>) {
  return (
    <section className="docs-panel rounded-[36px] p-6 sm:p-8 xl:p-10">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] xl:items-end">
        <div className="max-w-5xl">
          <p className="docs-display docs-kicker text-cyan-200">{eyebrow}</p>
          <h1 className="docs-display mt-4 max-w-[16ch] text-balance text-[clamp(2.15rem,4.8vw,4.6rem)] font-black leading-[0.94] tracking-[0.015em] text-white">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">{description}</p>

          {chips?.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-300"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          {actions?.length ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {actions.map((action, index) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                    index === 0
                      ? "bg-lime-300 text-slate-950 hover:bg-lime-200"
                      : "border border-white/10 text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {rail ? (
          <div className="rounded-[28px] border border-white/8 bg-black/20 p-5">{rail}</div>
        ) : null}
      </div>
    </section>
  );
}
