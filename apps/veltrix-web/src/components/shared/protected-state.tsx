"use client";

import Link from "next/link";
import { SignInScreen } from "@/components/auth/sign-in-screen";
import { useAuth } from "@/components/providers/auth-provider";
import { publicAuthRoutes } from "@/lib/account/public-auth";

export function ProtectedState({
  children,
  allowPreview = false,
  previewLabel = "Product preview",
  previewCopy = "Browse the current experience first. Sign in when you want to save progress, claim rewards or unlock community actions.",
  showPreviewBanner = true,
}: {
  children: React.ReactNode;
  allowPreview?: boolean;
  previewLabel?: string;
  previewCopy?: string;
  showPreviewBanner?: boolean;
}) {
  const { initialized, session, authConfigured } = useAuth();

  if (!initialized) {
    if (allowPreview) {
      if (!showPreviewBanner) {
        return <>{children}</>;
      }

      return (
        <PreviewShell previewLabel={previewLabel} previewCopy={previewCopy} isHydrating>
          {children}
        </PreviewShell>
      );
    }

    return (
      <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-5 py-6 text-sm text-slate-300">
        Loading account...
      </div>
    );
  }

  if (!authConfigured || !session) {
    if (allowPreview) {
      if (!showPreviewBanner) {
        return <>{children}</>;
      }

      return (
        <PreviewShell previewLabel={previewLabel} previewCopy={previewCopy}>
          {children}
        </PreviewShell>
      );
    }

    return <SignInScreen />;
  }

  return <>{children}</>;
}

function PreviewShell({
  children,
  previewLabel,
  previewCopy,
  isHydrating = false,
}: {
  children: React.ReactNode;
  previewLabel: string;
  previewCopy: string;
  isHydrating?: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-lime-300/16 bg-[linear-gradient(135deg,rgba(192,255,0,0.12),rgba(0,204,255,0.08),rgba(255,255,255,0.02))] px-4 py-4">
        <div className="max-w-3xl">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">
            {previewLabel}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {isHydrating ? "Opening the live session layer. You can already scan the preview while your account state loads." : previewCopy}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={publicAuthRoutes.signIn}
            className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
          >
            Sign in
          </Link>
          <Link
            href={publicAuthRoutes.signUp}
            className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Create account
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
