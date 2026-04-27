import { DocsSection } from "@/components/docs/docs-section";

export type DocsPlaybookExample = {
  label: string;
  meta?: string;
  trigger: string;
  copy: string;
  outcome: string;
};

export function DocsPlaybookSection({
  eyebrow = "Surface playbook",
  title,
  description,
  items,
}: Readonly<{
  eyebrow?: string;
  title: string;
  description?: string;
  items: DocsPlaybookExample[];
}>) {
  if (!items.length) {
    return null;
  }

  return (
    <DocsSection eyebrow={eyebrow} title={title} description={description}>
      <div className={`grid gap-4 ${items.length >= 3 ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
        {items.map((item) => (
          <article key={`${item.label}-${item.trigger}`} className="rounded-[26px] border border-white/8 bg-black/20 p-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-black text-white">{item.label}</p>
                {item.meta ? (
                  <span className="inline-flex rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                    {item.meta}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">When it appears</p>
              <p className="text-sm leading-6 text-slate-300">{item.trigger}</p>
            </div>

            <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lime-300">Example copy or control</p>
              <p className="mt-3 text-sm leading-7 text-white">&quot;{item.copy}&quot;</p>
            </div>

            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Why it matters</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.outcome}</p>
            </div>
          </article>
        ))}
      </div>
    </DocsSection>
  );
}
