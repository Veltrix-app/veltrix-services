import Link from "next/link";

export default function BillingCanceledPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#071116_0%,#05090c_100%)] px-6 py-20 text-white sm:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl border border-white/10 bg-white/[0.03] p-8">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">Checkout canceled</p>
        <h1 className="mt-4 text-4xl font-black">No billing changes were applied.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
          You can return to pricing, keep using your current workspace posture, or talk to Veltrix if you want help
          choosing the right plan.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="inline-flex rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
          >
            Back to pricing
          </Link>
          <Link
            href="/support"
            className="inline-flex rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
          >
            Talk to us
          </Link>
        </div>
      </div>
    </main>
  );
}
