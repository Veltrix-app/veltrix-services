"use client";

import { useEffect, useState } from "react";
import { Radar } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Surface } from "@/components/ui/surface";
import type { ProjectBenchmarkOverview } from "@/lib/analytics/customer-overview";

export function ProjectBenchmarkCard({ projectId }: { projectId: string }) {
  const { session } = useAuth();
  const [summary, setSummary] = useState<ProjectBenchmarkOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken || !projectId) {
      setSummary(null);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics/project-overview?projectId=${encodeURIComponent(projectId)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          }
        );
        const payload = (await response.json().catch(() => null)) as
          | {
              ok?: boolean;
              summary?: ProjectBenchmarkOverview | null;
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
  }, [projectId, session?.access_token]);

  return (
    <Surface
      eyebrow="Project analytics"
      title="Peer benchmark"
      description="This shows whether the project is building real launch density or just sitting with surface-level setup."
    >
      {loading ? (
        <CardNotice text="Loading project benchmark..." />
      ) : summary ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-200">
              <Radar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{summary.projectName}</p>
              <p className="mt-1 text-sm text-slate-300">{summary.recommendedMove}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <StatTile label="Peer band" value={summary.benchmark.labelText} />
            <StatTile label="Launch score" value={String(summary.benchmark.currentValue)} />
            <StatTile label="Live quests" value={String(summary.liveQuestCount)} />
            <StatTile label="Providers" value={String(summary.providerCount)} />
          </div>

          <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Peer cohort
            </p>
            <p className="mt-2 text-sm leading-6 text-white">
              {summary.benchmark.cohortLabel
                ? `${summary.benchmark.cohortLabel} (${summary.benchmark.cohortSize} projects)`
                : "Benchmark building as more comparable projects enter this lane."}
            </p>
            <p className="mt-3 text-sm text-slate-300">
              {summary.benchmark.available
                ? `Median peer score: ${summary.benchmark.medianValue ?? 0}.`
                : "This project is helping establish the peer band before a safe comparison can be shown."}
            </p>
          </div>
        </div>
      ) : (
        <CardNotice text="No project benchmark is available yet." />
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
