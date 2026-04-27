"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Compass } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Surface } from "@/components/ui/surface";
import type { SuccessMemberState } from "@/lib/success/member-activation";

export function MemberActivationCard() {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const [memberState, setMemberState] = useState<SuccessMemberState | null>(null);
  const [loading, setLoading] = useState(true);
  const visibleMemberState = accessToken ? memberState : null;
  const isLoading = accessToken ? loading : false;

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch("/api/success/member", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);

        if (!active) {
          return;
        }

        if (!response.ok || !payload?.ok) {
          setMemberState(null);
          return;
        }

        setMemberState(payload.memberState ?? null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [accessToken]);

  return (
    <Surface
      eyebrow="Member activation"
      title="Your next meaningful move"
      description="This keeps the member-side activation rail explicit, even when the product has multiple paths open."
    >
      {isLoading ? (
        <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
          Loading member activation...
        </div>
      ) : visibleMemberState ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lime-200">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {visibleMemberState.nextBestActionLabel ?? "Open your member path"}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {visibleMemberState.blockers[0] ?? "You can keep moving with the active path."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Lane" value={visibleMemberState.activationLane.replaceAll("_", " ")} />
            <StatTile label="Health" value={visibleMemberState.memberHealthState.replaceAll("_", " ")} />
            <StatTile label="Projects" value={String(visibleMemberState.joinedProjectCount)} />
          </div>

          <Link
            href={visibleMemberState.nextBestActionRoute ?? "/community/onboarding"}
            className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-lime-200"
          >
            {visibleMemberState.nextBestActionLabel ?? "Open member path"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
          No member activation state is available yet.
        </div>
      )}
    </Surface>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize text-white">{value}</p>
    </div>
  );
}
