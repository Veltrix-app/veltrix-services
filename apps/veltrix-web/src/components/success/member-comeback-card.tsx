"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Surface } from "@/components/ui/surface";
import type { SuccessMemberState } from "@/lib/success/member-activation";

export function MemberComebackCard() {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const [memberState, setMemberState] = useState<SuccessMemberState | null>(null);
  const visibleMemberState = accessToken ? memberState : null;

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;

    async function load() {
      const response = await fetch("/api/success/member", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!active || !response.ok || !payload?.ok) {
        return;
      }

      setMemberState(payload.memberState ?? null);
    }

    void load();

    return () => {
      active = false;
    };
  }, [accessToken]);

  if (!visibleMemberState || visibleMemberState.activationLane !== "comeback") {
    return null;
  }

  return (
    <Surface
      eyebrow="Comeback rail"
      title="A dedicated path back into momentum"
      description="When member activity drifts, the product should offer one clear re-entry path instead of dumping everything back on the screen."
    >
      <div className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-amber-200">
          <RefreshCcw className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {visibleMemberState.nextBestActionLabel ?? "Resume momentum"}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {visibleMemberState.blockers[0] ?? "Open the comeback lane to get back into motion."}
          </p>
        </div>
      </div>

      <Link
        href={visibleMemberState.nextBestActionRoute ?? "/community/comeback"}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
      >
        Resume now
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Surface>
  );
}
