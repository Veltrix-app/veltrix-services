import Link from "next/link";
import type { PublicTrustSubprocessor } from "@/lib/trust/public-trust";

export function SubprocessorTable({ items }: { items: PublicTrustSubprocessor[] }) {
  if (!items.length) {
    return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-slate-300">
        No active subprocessors are published right now.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03]">
      <div className="grid grid-cols-1 gap-0 border-b border-white/8 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 md:grid-cols-[minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,1fr)_180px]">
        <p>Name</p>
        <p>Category</p>
        <p>Purpose and region</p>
        <p>Review</p>
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-1 gap-4 border-b border-white/8 px-6 py-5 last:border-b-0 md:grid-cols-[minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,1fr)_180px] md:items-start"
        >
          <div>
            <p className="text-base font-black text-white">{item.name}</p>
            {item.websiteUrl ? (
              <Link
                href={item.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-sm font-semibold text-lime-300 transition hover:text-lime-200"
              >
                Visit vendor
              </Link>
            ) : null}
          </div>
          <p className="text-sm leading-7 text-slate-300">{item.category}</p>
          <div className="space-y-2 text-sm leading-7 text-slate-300">
            <p>{item.purpose}</p>
            <p className="text-slate-400">{item.regionSummary}</p>
          </div>
          <div className="text-sm leading-7 text-slate-300">
            <p className="font-semibold text-white">{item.status.replaceAll("_", " ")}</p>
            <p className="text-slate-400">
              {item.lastReviewedAt ? `Last reviewed ${new Date(item.lastReviewedAt).toLocaleDateString("en-GB")}` : "Review date pending"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
