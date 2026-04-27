"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Building2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Surface } from "@/components/ui/surface";
import type { SuccessAccountSummary } from "@/lib/success/account-activation";

export function AccountActivationCard() {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const [summary, setSummary] = useState<SuccessAccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const visibleSummary = accessToken ? summary : null;
  const isLoading = accessToken ? loading : false;

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch("/api/success/account", {
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
          setSummary(null);
          return;
        }

        setSummary(payload.summary ?? null);
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
      eyebrow="Workspace activation"
      title="How your workspace is progressing"
      description="This keeps the account-side activation story visible inside the member app, not only in the portal."
    >
      {isLoading ? (
        <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
          Loading workspace activation...
        </div>
      ) : visibleSummary ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-200">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{visibleSummary.accountName}</p>
              <p className="mt-1 text-sm text-slate-300">
                {visibleSummary.blockers[0] ?? "The workspace is moving without hard blockers."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Stage" value={visibleSummary.activationStage.replaceAll("_", " ")} />
            <StatTile label="Workspace health" value={visibleSummary.workspaceHealthState.replaceAll("_", " ")} />
            <StatTile label="Plan" value={visibleSummary.billingPlanId ?? "free"} />
          </div>

          <Link
            href={visibleSummary.nextBestActionRoute ?? "/getting-started"}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
          >
            {visibleSummary.nextBestActionLabel ?? "Open workspace next move"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
          No workspace activation context is available yet.
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
