import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05090c] px-6">
      <div className="max-w-lg rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">Not found</p>
        <h1 className="mt-4 text-3xl font-black text-white">That surface does not exist yet.</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          The Veltrix web MVP is starting with the core shell, Home, Profile and account readiness.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-black"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
