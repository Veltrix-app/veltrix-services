type DocsReferenceItem = {
  label: string;
  summary: string;
  meta?: string;
};

export function DocsReferenceBlock({
  title,
  description,
  items,
}: Readonly<{
  title: string;
  description?: string;
  items: DocsReferenceItem[];
}>) {
  return (
    <section className="docs-card rounded-[28px] p-5">
      <p className="docs-kicker text-cyan-200">{title}</p>
      {description ? <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p> : null}

      <div className="mt-5 divide-y divide-white/8 border-y border-white/8">
        {items.map((item) => (
          <div key={item.label} className="grid gap-3 py-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
            <div>
              <p className="text-sm font-black text-white">{item.label}</p>
              {item.meta ? (
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{item.meta}</p>
              ) : null}
            </div>
            <p className="text-sm leading-7 text-slate-300">{item.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
