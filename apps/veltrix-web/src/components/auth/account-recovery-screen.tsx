"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  buildRecoveryRedirectUrl,
  publicAuthRoutes,
} from "@/lib/account/public-auth";

export function AccountRecoveryScreen() {
  const searchParams = useSearchParams();
  const { session, loading, error, clearError, requestPasswordReset, updatePassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mode = useMemo(() => searchParams.get("mode"), [searchParams]);
  const resetMode = mode === "reset";

  async function handleResetLinkRequest(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    clearError();
    setSuccessMessage(null);

    const result = await requestPasswordReset(email, buildRecoveryRedirectUrl());

    if (result.ok) {
      setSuccessMessage("Reset link sent. Open the email and come back through the recovery link.");
    }
  }

  async function handlePasswordUpdate(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    clearError();
    setSuccessMessage(null);

    if (!password || password !== confirmPassword) {
      setSuccessMessage(null);
      return;
    }

    const result = await updatePassword(password);

    if (result.ok) {
      setSuccessMessage("Password updated. You can continue into your account now.");
    }
  }

  const localMismatchError =
    resetMode && password && confirmPassword && password !== confirmPassword
      ? "Passwords do not match yet."
      : null;

  return (
      <div className="mx-auto w-full max-w-[620px] rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_52px_rgba(0,0,0,0.24)] sm:p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200">
        Account recovery
      </p>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
        {resetMode ? "Set a new password" : "Recover account access"}
      </h1>
      <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
        {resetMode
          ? "Use a fresh password so you can continue back into your workspace without opening a new account."
          : "Request a recovery link to reset your password safely without losing your workspace and project context."}
      </p>

      {resetMode ? (
        <form className="mt-8" onSubmit={handlePasswordUpdate}>
          <div className="space-y-4">
            <input
              className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-lime-300/50"
              type="password"
              placeholder="New password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <input
              className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-lime-300/50"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          {localMismatchError ? (
            <div className="mt-4 rounded-[22px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {localMismatchError}
            </div>
          ) : null}

          {!session ? (
            <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
              Open this page from your recovery email so VYNTRO can validate the reset session first.
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-4 rounded-[22px] border border-lime-300/20 bg-lime-300/10 px-4 py-3 text-sm text-lime-100">
              {successMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !session || Boolean(localMismatchError)}
            className="mt-6 w-full rounded-full bg-lime-300 px-5 py-4 text-sm font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:bg-lime-300/40"
          >
            {loading ? "Working..." : "Save new password"}
          </button>
        </form>
      ) : (
        <form className="mt-8" onSubmit={handleResetLinkRequest}>
          <input
            className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-lime-300/50"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          {error ? (
            <div className="mt-4 rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-4 rounded-[22px] border border-lime-300/20 bg-lime-300/10 px-4 py-3 text-sm text-lime-100">
              {successMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-lime-300 px-5 py-4 text-sm font-black text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:bg-lime-300/40"
          >
            {loading ? "Working..." : "Send reset link"}
          </button>
        </form>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm text-slate-300">
        <Link href={publicAuthRoutes.signIn} className="font-semibold text-cyan-200 transition hover:text-cyan-100">
          Back to sign in
        </Link>
        <Link href={publicAuthRoutes.signUp} className="font-semibold text-lime-300 transition hover:text-lime-200">
          Create account instead
        </Link>
      </div>
    </div>
  );
}
