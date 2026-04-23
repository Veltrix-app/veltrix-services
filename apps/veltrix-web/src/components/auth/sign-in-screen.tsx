"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { buildPublicAuthPathWithNext, publicAuthRoutes } from "@/lib/account/public-auth";

export function SignInScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, loading, error, clearError, authConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nextHref = searchParams.get("next");

  async function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    clearError();

    const result = await signIn(email, password);

    if (result.ok) {
      router.replace(nextHref || publicAuthRoutes.postAuth);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[560px] rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
        Existing account
      </p>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
        Sign in to your workspace
      </h1>
      <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
        Access your account, open your projects, and continue the launches, missions and community work already in motion.
      </p>

      <form className="mt-8" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <input
            className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-lime-300/50"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-lime-300/50"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? (
          <div className="mt-4 rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {!authConfigured ? (
          <div className="mt-4 rounded-[22px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Public sign-in is not configured yet. Add the web auth environment variables to turn account access on.
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !authConfigured}
          className="mt-6 w-full rounded-full bg-lime-300 px-5 py-4 text-sm font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:bg-lime-300/40"
        >
          {loading ? "Working..." : "Sign in"}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm text-slate-300">
        <Link href={publicAuthRoutes.recover} className="font-semibold text-cyan-200 transition hover:text-cyan-100">
          Forgot password?
        </Link>
        <p>
          New to Veltrix?{" "}
          <Link
            href={buildPublicAuthPathWithNext(publicAuthRoutes.signUp, nextHref)}
            className="font-semibold text-lime-300 transition hover:text-lime-200"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
