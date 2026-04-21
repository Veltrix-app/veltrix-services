import Link from "next/link";
import { ArrowRight, LifeBuoy, Rocket, ShieldCheck } from "lucide-react";

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? null;

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,255,85,0.12),transparent_24%),radial-gradient(circle_at_88%_10%,rgba(74,217,255,0.16),transparent_26%),linear-gradient(180deg,#071014_0%,#05090c_100%)] text-white">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-6">
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">Support</p>
            <h1 className="font-display mt-3 text-balance text-4xl font-black tracking-[0.03em] text-white sm:text-5xl">
              Get help with launch planning, rollout or product access.
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex rounded-full border border-white/12 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
          >
            Back to site
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(280px,360px)]">
          <div className="space-y-5">
            <p className="max-w-3xl text-base leading-8 text-slate-200">
              Use this surface if you want a walkthrough before launching, need help configuring a project, or want a
              direct support path for an existing Veltrix rollout.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <SupportTile
                icon={Rocket}
                title="Pre-launch support"
                description="Talk through launch architecture, rollout order and how your project should start in Veltrix."
              />
              <SupportTile
                icon={LifeBuoy}
                title="Product support"
                description="Get help with setup, linked accounts, project configuration or blocked delivery flows."
              />
              <SupportTile
                icon={ShieldCheck}
                title="Safety escalations"
                description="Use the operator consoles for live cases. Reach out here when you need higher-touch guidance."
              />
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.03] p-6">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
              Contact path
            </p>
            {supportEmail ? (
              <>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Public support is configured for this launch environment. Use the primary contact route below.
                </p>
                <a
                  href={`mailto:${supportEmail}`}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
                >
                  Email {supportEmail}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  A public support email is not configured in this environment yet. Until that is live, start in the
                  product or route support through your existing project onboarding contact.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
                  >
                    Start now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/home"
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                  >
                    Open product
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6 text-sm text-slate-400">
          <p>Need launch help, access help or a product walkthrough.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/sign-in" className="transition hover:text-white">
              Sign in
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function SupportTile({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Rocket;
  title: string;
  description: string;
}) {
  return (
    <div className="border border-white/8 bg-white/[0.02] p-5">
      <Icon className="h-5 w-5 text-lime-200" />
      <h2 className="mt-4 text-lg font-black text-white">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
    </div>
  );
}
