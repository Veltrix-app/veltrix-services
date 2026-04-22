type DocsSnapshotStat = {
  label: string;
  value: string;
};

export function DocsSnapshotFrame({
  title,
  description,
  caption,
  stats,
  children,
}: Readonly<{
  title: string;
  description: string;
  caption: string;
  stats?: DocsSnapshotStat[];
  children: React.ReactNode;
}>) {
  return (
    <section className="docs-card rounded-[30px] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="docs-kicker text-cyan-200">Live snapshot</p>
          <h3 className="mt-4 text-2xl font-black text-white">{title}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
        </div>
        <span className="rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-lime-200">
          Read only
        </span>
      </div>

      {stats?.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]">
        <div className="border-b border-white/8 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{caption}</p>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </section>
  );
}
