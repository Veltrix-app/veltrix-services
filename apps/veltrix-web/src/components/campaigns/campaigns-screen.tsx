"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Radar, TimerReset, Zap } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

type CampaignFilter = "all" | "featured" | "high-xp";

export function CampaignsScreen() {
  const { loading, error, campaigns, projects, quests } = useLiveUserData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CampaignFilter>("all");

  const enrichedCampaigns = useMemo(() => {
    return campaigns
      .map((campaign) => {
        const linkedProject = projects.find((project) => project.id === campaign.projectId);
        const questCount = quests.filter((quest) => quest.campaignId === campaign.id).length;

        return {
          ...campaign,
          projectName: linkedProject?.name ?? "Project",
          questCount,
          endsLabel: campaign.endsAt
            ? new Date(campaign.endsAt).toLocaleDateString("nl-NL", {
                day: "2-digit",
                month: "short",
              })
            : "Open run",
        };
      })
      .sort(
        (left, right) =>
          Number(right.featured) - Number(left.featured) ||
          right.xpBudget - left.xpBudget ||
          right.completionRate - left.completionRate
      );
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

    return items;
  }, [enrichedCampaigns, filter, query]);

  const [featuredCampaign, ...queueCampaigns] = filteredCampaigns;
  const pressureLanes = enrichedCampaigns.slice(0, 3);
  const snapshot = {
    total: enrichedCampaigns.length,
    featured: enrichedCampaigns.filter((campaign) => campaign.featured).length,
    avgCompletion:
      enrichedCampaigns.length > 0
        ? Math.round(
            enrichedCampaigns.reduce((sum, campaign) => sum + campaign.completionRate, 0) /
              enrichedCampaigns.length
          )
        : 0,
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_380px]">
        <div className="overflow-hidden rounded-[38px] border border-lime-300/12 bg-[radial-gradient(circle_at_top_left,rgba(192,255,0,0.18),transparent_26%),radial-gradient(circle_at_86%_10%,rgba(0,204,255,0.1),transparent_20%),linear-gradient(145deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
            <span>Mission Select</span>
            <span className="rounded-full border border-lime-300/16 bg-lime-300/10 px-3 py-1 tracking-[0.24em] text-lime-100">
              Launch Board
            </span>
          </div>

          {featuredCampaign ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_320px]">
                <div className="space-y-5">
                  <ArtworkPanel
                    src={featuredCampaign.bannerUrl ?? featuredCampaign.thumbnailUrl}
                    alt={featuredCampaign.title}
                    badge={featuredCampaign.projectName}
                    className="h-64"
                  />

                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-[14ch]">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-lime-300/16 bg-lime-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-lime-100">
                          {featuredCampaign.projectName}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                          {featuredCampaign.questCount} steps
                        </span>
                      </div>
                      <h3 className="font-display mt-4 text-balance text-[clamp(2.2rem,4vw,4.5rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                        {featuredCampaign.title}
                      </h3>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                        {featuredCampaign.description ||
                          "This mission lane is hot with real payout pressure, active objectives and live clear-rate telemetry."}
                      </p>
                    </div>

                    <StatusChip
                      label={featuredCampaign.featured ? "Prime lane" : `${featuredCampaign.completionRate}% live`}
                      tone={featuredCampaign.featured ? "positive" : "info"}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <FeatureStat label="XP budget" value={String(featuredCampaign.xpBudget)} />
                    <FeatureStat label="Steps" value={String(featuredCampaign.questCount)} />
                    <FeatureStat label="Clear rate" value={`${featuredCampaign.completionRate}%`} />
                    <FeatureStat label="Ends" value={featuredCampaign.endsLabel} />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/campaigns/${featuredCampaign.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-lime-200"
                    >
                      Launch lane
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/projects/${featuredCampaign.projectId}`}
                      className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:border-lime-300/30"
                    >
                      Open world
                    </Link>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/24 p-4">
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-lime-200">
                    Tactical queue
                  </p>
                  <div className="mt-4 space-y-3">
                    {queueCampaigns.slice(0, 4).map((campaign, index) => (
                      <Link
                        key={campaign.id}
                        href={`/campaigns/${campaign.id}`}
                        className="panel-card flex items-center gap-4 rounded-[24px] p-4 transition hover:border-lime-300/24 hover:bg-black/24"
                      >
                        <QueueThumb src={campaign.thumbnailUrl ?? campaign.bannerUrl} alt={campaign.title} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                            Queue {index + 1}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-white">{campaign.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                            {campaign.projectName}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-lime-200">{campaign.xpBudget} XP</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {pressureLanes.map((campaign, index) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="rounded-[26px] border border-white/8 bg-white/[0.04] p-4 transition hover:border-lime-300/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Pressure {index + 1}
                      </p>
                      <Zap className="h-4 w-4 text-lime-300" />
                    </div>
                    <p className="mt-3 truncate text-lg font-black text-white">{campaign.title}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MiniMetric label="XP" value={String(campaign.xpBudget)} />
                      <MiniMetric label="Steps" value={String(campaign.questCount)} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <EmptyNotice text="No live mission lanes are visible yet." />
          )}
        </div>

        <div className="space-y-6">
          <Surface
            eyebrow="Board Read"
            title="Lane pressure"
            description="Tactical read before you jump into the launch queue."
          >
            <div className="grid gap-4 sm:grid-cols-3 2xl:grid-cols-1">
              <MetricTile label="Campaigns" value={String(snapshot.total)} />
              <MetricTile label="Prime lanes" value={String(snapshot.featured)} />
              <MetricTile label="Avg clear" value={`${snapshot.avgCompletion}%`} />
            </div>

            <div className="mt-5 space-y-3">
              {pressureLanes.map((campaign, index) => (
                <div
                  key={campaign.id}
                  className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Signal {index + 1}
                      </p>
                      <p className="mt-2 truncate text-sm font-semibold text-white">{campaign.title}</p>
                    </div>
                    <span className="text-sm font-bold text-lime-200">{campaign.questCount} steps</span>
                  </div>
                </div>
              ))}
            </div>
          </Surface>

          <Surface
            eyebrow="Launch Filters"
            title="Refine lane board"
            description="Trim the mission board down to the strongest and most rewarding lanes."
          >
            <div className="space-y-4">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search missions, worlds, payout lanes..."
                className="glass-button w-full rounded-[22px] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-300/40"
              />

              <div className="flex flex-wrap gap-2">
                <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All lanes" />
                <FilterButton active={filter === "featured"} onClick={() => setFilter("featured")} label="Prime lanes" />
                <FilterButton active={filter === "high-xp"} onClick={() => setFilter("high-xp")} label="High XP" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InlineSignal icon={Radar} label="Board" value={String(filteredCampaigns.length)} accent="text-white" />
                <InlineSignal icon={TimerReset} label="Prime" value={String(snapshot.featured)} accent="text-lime-200" />
                <InlineSignal label="Avg clear" value={`${snapshot.avgCompletion}%`} accent="text-cyan-200" />
              </div>
            </div>
          </Surface>
        </div>
      </section>

      <Surface
        eyebrow="Mission Catalog"
        title="Choose your lane"
        description="The board should feel like a real mission-select screen, not a campaign index."
      >
        <div className="mt-1">
          {loading ? (
            <EmptyNotice text="Loading live mission lanes..." />
          ) : error ? (
            <ErrorNotice text={error} />
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="panel-card rounded-[32px] p-5 transition hover:-translate-y-0.5 hover:border-lime-300/28 hover:bg-black/24"
                >
                  <ArtworkPanel
                    src={campaign.bannerUrl ?? campaign.thumbnailUrl}
                    alt={campaign.title}
                    badge={campaign.projectName}
                    className="mb-5 h-44"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-2xl font-black text-white">{campaign.title}</p>
                      <p className="mt-2 text-sm text-lime-200">{campaign.projectName}</p>
                    </div>
                    <StatusChip
                      label={campaign.featured ? "Prime" : `${campaign.completionRate}% live`}
                      tone={campaign.featured ? "positive" : "info"}
                    />
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-300">
                    {campaign.description || "This mission lane is live, but still needs a stronger public briefing."}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    <MiniMetric label="XP" value={String(campaign.xpBudget)} />
                    <MiniMetric label="Steps" value={String(campaign.questCount)} />
                    <MiniMetric label="Ends" value={campaign.endsLabel} />
                    <MiniMetric label="Clear" value={`${campaign.completionRate}%`} />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Launch read
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">{campaign.questCount} mission steps ready</p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-lime-200">
                      Launch lane
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyNotice text="No mission lanes match this filter yet." />
          )}
        </div>
      </Surface>
    </div>
  );
}

function ArtworkPanel({
  src,
  alt,
  badge,
  className,
}: {
  src: string | null;
  alt: string;
  badge: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/70 ${className ?? "h-44"}`}>
      {src ? <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover opacity-82" /> : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,12,0.06),rgba(3,7,12,0.8)_58%,rgba(3,7,12,0.97))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(192,255,0,0.22),transparent_38%)]" />
      <div className="absolute left-4 top-4 rounded-full border border-lime-300/20 bg-black/45 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-lime-100">
        {badge}
      </div>
    </div>
  );
}

function QueueThumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] border border-white/10 bg-slate-950/80">
      {src ? <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover opacity-82" /> : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,12,0.04),rgba(3,7,12,0.82))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(192,255,0,0.24),transparent_40%)]" />
    </div>
  );
}

function FeatureStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[24px] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[24px] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.04] px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function InlineSignal({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon?: typeof Radar;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="metric-card rounded-[22px] px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        <span>{label}</span>
      </div>
      <p className={`mt-3 text-xl font-black ${accent}`}>{value}</p>
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
