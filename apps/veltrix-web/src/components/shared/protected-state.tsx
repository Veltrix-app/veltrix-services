"use client";

import { SignInScreen } from "@/components/auth/sign-in-screen";
import { useAuth } from "@/components/providers/auth-provider";

export function ProtectedState({ children }: { children: React.ReactNode }) {
  const { initialized, session, authConfigured } = useAuth();

  if (!initialized) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-10 text-sm text-slate-300">
        Loading account surface...
      </div>
    );
  }

  if (!authConfigured || !session) {
    return <SignInScreen />;
  }

  return <>{children}</>;
}
