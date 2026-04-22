import type { DocsReferenceMatrix } from "@/lib/docs-data/types";

export function DocsReferenceMatrix({
  matrix,
}: Readonly<{
  matrix: DocsReferenceMatrix;
}>) {
  return (
    <section className="docs-card rounded-[28px] p-5">
      <p className="docs-kicker text-lime-300">{matrix.title}</p>
      {matrix.description ? <p className="mt-3 text-sm leading-7 text-slate-400">{matrix.description}</p> : null}

      <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
        <div className="grid grid-cols-[minmax(180px,1.1fr)_repeat(auto-fit,minmax(120px,1fr))] border-b border-white/8 bg-white/[0.03]">
          <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Reference row</div>
          {matrix.columns.map((column) => (
            <div
              key={column}
              className="border-l border-white/8 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200"
            >
              {column}
            </div>
          ))}
        </div>

        {matrix.rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[minmax(180px,1.1fr)_repeat(auto-fit,minmax(120px,1fr))] border-b border-white/8 last:border-b-0"
          >
            <div className="px-4 py-4">
              <p className="text-sm font-black text-white">{row.label}</p>
              {row.summary ? <p className="mt-2 text-sm leading-6 text-slate-400">{row.summary}</p> : null}
            </div>
            {row.values.map((value, index) => (
              <div key={`${row.label}-${matrix.columns[index]}`} className="border-l border-white/8 px-4 py-4 text-sm leading-6 text-slate-300">
                {value}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
