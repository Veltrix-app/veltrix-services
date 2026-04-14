"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

type CampaignFilter = "all" | "featured" | "high-xp";

export function CampaignsScreen() {
  const { loading, error, campaigns, projects, quests } = useLiveUserData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CampaignFilter>("all");

  const enrichedCampaigns = useMemo(() => {
    return campaigns.map((campaign) => {
      const linkedProject = projects.find((project) => project.id === campaign.projectId);
      const questCount = quests.filter((quest) => quest.campaignId === campaign.id).length;

      return {
        ...campaign,
        projectName: linkedProject?.name ?? "Project",
        questCount,
      };
    });
  }, [campaigns, projects, quests]);

  const filteredCampaigns = useMemo(() => {
    let items = enrichedCampaigns;

    if (query.trim()) {
      const normalized = query.toLowerCase();
      items = items.filter((campaign) =>
        [campaign.title, campaign.description, campaign.projectName]
          .some((value) => value.toLowerCase().includes(normalized))
      );
    }

    if (filter === "featured") {
      items = items.filter((campaign) => campaign.featured);
    }

    if (filter === "high-xp") {
      items = items.filter((campaign) => campaign.xpBudget >= 500);
    }

    return items.sort((left, right) => Number(right.featured) - Number(left.featured) || right.xpBudget - left.xpBudget);
  }, [enrichedCampaigns, filter, query]);

  const featuredCount = enrichedCampaigns.filter((campaign) => campaign.featured).length;
  const averageCompletion =
    enrichedCampaigns.length > 0
      ? Math.round(
          enrichedCampaigns.reduce((sum, campaign) => sum + campaign.completionRate, 0) /
            enrichedCampaigns.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(192,255,0,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
            Mission Catalog
          </p>
          <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Campaign browsing is now reading from the live backend.
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Real titles, real projects, real XP budgets and real quest counts are now feeding the
            web mission board instead of placeholder copy.
          </p>
        </div>

        <Surface
          eyebrow="Snapshot"
          title="Campaign pressure"
          description="A quick read on how strong the live campaign catalog already is."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricTile label="Campaigns" value={String(enrichedCampaigns.length)} />
            <MetricTile label="Featured" value={String(featuredCount)} />
            <MetricTile label="Avg progress" value={`${averageCompletion}%`} />
          </div>
        </Surface>
      </section>

      <Surface
        eyebrow="Filters"
        title="Campaign search"
        description="Filter the live mission board by name, project, featured status or XP budget."
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search campaigns..."
            className="w-full rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-300/40 lg:max-w-md"
          />

          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
            <FilterButton
              active={filter === "featured"}
              onClick={() => setFilter("featured")}
              label="Featured"
            />
            <FilterButton
              active={filter === "high-xp"}
              onClick={() => setFilter("high-xp")}
              label="High XP"
            />
          </div>
        </div>
      </Surface>

      <Surface
        eyebrow="Catalog"
        title="Live campaigns"
        description="Each campaign card is now built from the same campaign rows the mobile app uses."
      >
        {loading ? (
          <EmptyNotice text="Loading live campaigns..." />
        ) : error ? (
          <ErrorNotice text={error} />
        ) : filteredCampaigns.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="rounded-[28px] border border-white/8 bg-black/20 p-5 transition hover:border-lime-300/30 hover:bg-black/25"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white">{campaign.title}</p>
                    <p className="mt-2 text-sm text-lime-200">{campaign.projectName}</p>
                  </div>
                  <StatusChip
                    label={campaign.featured ? "Featured" : `${campaign.completionRate}% live`}
                    tone={campaign.featured ? "positive" : "info"}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">{campaign.description}</p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MiniStat label="XP budget" value={String(campaign.xpBudget)} />
                  <MiniStat label="Quest count" value={String(campaign.questCount)} />
                  <MiniStat
                    label="Ends"
                    value={campaign.endsAt ? new Date(campaign.endsAt).toLocaleDateString("nl-NL") : "Open"}
                  />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyNotice text="No campaigns match this filter yet." />
        )}
      </Surface>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-lime-300/14 text-lime-200 ring-1 ring-lime-300/20"
          : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.08]"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyNotice({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-6 text-sm text-slate-300">
      {text}
    </div>
  );
}

function ErrorNotice({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">
      {text}
    </div>
  );
}
