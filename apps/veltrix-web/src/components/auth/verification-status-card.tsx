"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { publicAuthRoutes } from "@/lib/account/public-auth";

export function VerificationStatusCard() {
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const email = searchParams.get("email");
  const error = searchParams.get("error_description") ?? searchParams.get("error");

  const mode = useMemo(() => {
    if (error) {
      return "error";
    }

    if (session) {
      return "verified";
    }

    return "pending";
  }, [error, session]);

  return (
    <div className="mx-auto w-full max-w-[620px] rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">
        Account verification
      </p>

      {mode === "verified" ? (
        <>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Your account is verified
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            The verification link is good and your session is active. Continue into the product and the next onboarding layer.
          </p>
          <div className="mt-6 rounded-[22px] border border-lime-300/20 bg-lime-300/10 px-4 py-4 text-sm leading-7 text-lime-100">
            Account access is ready. The next phase will route you into workspace and first-project setup.
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={publicAuthRoutes.postAuth}
              className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
            >
              Continue
            </Link>
            <Link
              href={publicAuthRoutes.signIn}
              className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              Open sign in
            </Link>
          </div>
        </>
      ) : null}

      {mode === "pending" ? (
        <>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Check your inbox
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            We have opened the verification step. Use the link from your email to activate the account and continue into workspace setup.
          </p>
          <div className="mt-6 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-300">
            {email ? `Verification email was requested for ${email}. ` : null}
            After confirmation, this page will become your clean next step instead of dropping you into the product blindly.
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={publicAuthRoutes.signIn}
              className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
            >
              Already verified? Sign in
            </Link>
            <Link
              href={publicAuthRoutes.signUp}
              className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              Use another email
            </Link>
          </div>
        </>
      ) : null}

      {mode === "error" ? (
        <>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Verification did not complete
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            The current verification link is stale or invalid. Open a fresh signup or sign-in flow and request a clean email.
          </p>
          <div className="mt-6 rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm leading-7 text-rose-200">
            {error}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={publicAuthRoutes.signUp}
              className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
            >
              Create account again
            </Link>
            <Link
              href={publicAuthRoutes.signIn}
              className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              Try sign in
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
