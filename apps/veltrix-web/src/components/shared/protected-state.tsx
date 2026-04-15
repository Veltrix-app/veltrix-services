"use client";

import Link from "next/link";
import { SignInScreen } from "@/components/auth/sign-in-screen";
import { useAuth } from "@/components/providers/auth-provider";

export function ProtectedState({
  children,
  allowPreview = false,
  previewLabel = "Public preview",
  previewCopy = "Explore the live grid first. Sign in only when you want to track progress, claim rewards or launch verified actions.",
}: {
  children: React.ReactNode;
  allowPreview?: boolean;
  previewLabel?: string;
  previewCopy?: string;
}) {
  const { initialized, session, authConfigured } = useAuth();

  if (!initialized) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-10 text-sm text-slate-300">
        Loading account surface...
      </div>
    );
  }

  if (!authConfigured || !session) {
    if (allowPreview) {
      return (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-lime-300/16 bg-[linear-gradient(135deg,rgba(192,255,0,0.12),rgba(0,204,255,0.08),rgba(255,255,255,0.02))] px-5 py-4">
            <div className="max-w-3xl">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">
                {previewLabel}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{previewCopy}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/sign-in"
                className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
              >
                Enter grid
              </Link>
              <Link
                href="/sign-in"
                className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Create pilot
              </Link>
            </div>
          </div>
          {children}
        </div>
      );
    }

    return <SignInScreen />;
  }

  return <>{children}</>;
}
