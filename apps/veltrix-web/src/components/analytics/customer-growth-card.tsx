"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BarChart3 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Surface } from "@/components/ui/surface";
import type { CustomerGrowthOverview } from "@/lib/analytics/customer-overview";
import { publicEnv } from "@/lib/env";

export function CustomerGrowthCard() {
  const { session } = useAuth();
  const [summary, setSummary] = useState<CustomerGrowthOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      setSummary(null);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch("/api/analytics/customer-overview", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              ok?: boolean;
              summary?: CustomerGrowthOverview | null;
            }
          | null;

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
  }, [session?.access_token]);

  return (
    <Surface
      eyebrow="Growth analytics"
      title="How your workspace stacks up"
      description="This pulls the same benchmark logic into the member app, so progress feels like a real operating signal instead of a private portal-only metric."
    >
      {loading ? (
        <CardNotice text="Loading growth analytics..." />
      ) : summary ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lime-200">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{summary.accountName}</p>
              <p className="mt-1 text-sm text-slate-300">
                {summary.recommendedMove}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <StatTile label="Peer band" value={summary.benchmark.labelText} />
            <StatTile label="Score" value={String(summary.benchmark.currentValue)} />
            <StatTile label="Campaigns" value={String(summary.activeCampaignCount)} />
            <StatTile label="Providers" value={String(summary.providerCount)} />
          </div>

          <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Peer cohort
            </p>
            <p className="mt-2 text-sm leading-6 text-white">
              {summary.benchmark.cohortLabel
                ? `${summary.benchmark.cohortLabel} (${summary.benchmark.cohortSize} workspaces)`
                : "Benchmark building while more workspaces enter this peer set."}
            </p>
            <p className="mt-3 text-sm text-slate-300">
              {summary.firstTouchSource
                ? `First touch: ${summary.firstTouchSource}`
                : "Attribution context is still building for this workspace."}
              {summary.conversionTouchSource
                ? ` / Conversion touch: ${summary.conversionTouchSource}`
                : ""}
            </p>
          </div>

          <a
            href={`${publicEnv.portalUrl}/account`}
            className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-lime-200"
          >
            Open workspace analytics
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      ) : (
        <CardNotice text="No workspace analytics are available for this account yet." />
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

function CardNotice({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
      {text}
    </div>
  );
}
