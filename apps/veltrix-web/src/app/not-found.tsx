import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05090c] px-6">
    <div className="max-w-lg rounded-[24px] border border-white/10 bg-white/[0.04] p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">Not found</p>
        <h1 className="mt-4 text-3xl font-black text-white">That surface does not exist.</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          The page you were looking for is not available in this launch route.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-black"
        >
          Back to Veltrix
        </Link>
      </div>
    </div>
  );
}
