"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Radio, Sparkles } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

type ProjectFilter = "all" | "featured" | "ecosystem";

export function ProjectsScreen() {
  const { loading, error, projects, campaigns } = useLiveUserData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");

  const enrichedProjects = useMemo(() => {
    return projects
      .map((project) => {
        const linkedCampaigns = campaigns.filter((campaign) => campaign.projectId === project.id);
        const completionRate =
          linkedCampaigns.length > 0
            ? Math.round(
                linkedCampaigns.reduce((sum, campaign) => sum + campaign.completionRate, 0) /
                  linkedCampaigns.length
              )
            : 0;

        return {
          ...project,
          campaignCount: linkedCampaigns.length,
          featured: linkedCampaigns.some((campaign) => campaign.featured),
          liveXp: linkedCampaigns.reduce((sum, campaign) => sum + campaign.xpBudget, 0),
          completionRate,
        };
      })
      .sort(
        (left, right) =>
          Number(right.featured) - Number(left.featured) ||
          right.campaignCount - left.campaignCount ||
          right.members - left.members
      );
  }, [projects, campaigns]);

  const filteredProjects = useMemo(() => {
    let items = enrichedProjects;

    if (query.trim()) {
      const normalized = query.toLowerCase();
      items = items.filter((project) =>
        [project.name, project.description, project.category, project.chain]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalized))
      );
    }

    if (filter === "featured") {
      items = items.filter((project) => project.featured);
    }

    if (filter === "ecosystem") {
      items = items.filter((project) => project.campaignCount > 0);
    }

    return items;
  }, [enrichedProjects, filter, query]);

  const [featuredWorld, ...queueWorlds] = filteredProjects;
  const snapshot = {
    total: enrichedProjects.length,
    featured: enrichedProjects.filter((project) => project.featured).length,
    live: enrichedProjects.filter((project) => project.campaignCount > 0).length,
  };
  const hottestWorlds = enrichedProjects.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="overflow-hidden rounded-[36px] border border-cyan-300/16 bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.18),transparent_42%),linear-gradient(145deg,rgba(9,15,21,0.98),rgba(3,7,12,0.92))] p-6 shadow-[0_28px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            <span>World Browser</span>
            <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 tracking-[0.24em] text-cyan-100">
              Ecosystem Radar
            </span>
          </div>

          {featuredWorld ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {featuredWorld.chain ? (
                        <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100">
                          {featuredWorld.chain}
                        </span>
                      ) : null}
                      {featuredWorld.category ? (
                        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                          {featuredWorld.category}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                      Enter {featuredWorld.name}
                    </h3>
                    <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                      {featuredWorld.description ||
                        "This world is live on the grid with active campaign density, member traction and payout lanes."}
                    </p>
                  </div>

                  <StatusChip
                    label={featuredWorld.featured ? "Prime World" : "Live World"}
                    tone={featuredWorld.featured ? "positive" : "info"}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <HeroStat label="Campaign lanes" value={String(featuredWorld.campaignCount)} />
                  <HeroStat label="Live XP" value={String(featuredWorld.liveXp)} />
                  <HeroStat label="Citizens" value={featuredWorld.members.toLocaleString()} />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/projects/${featuredWorld.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                  >
                    Enter world
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/communities/${featuredWorld.id}`}
                    className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30"
                  >
                    Open command view
                  </Link>
                </div>
              </div>

              <div className="space-y-3 rounded-[28px] border border-white/10 bg-black/24 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  World queue
                </p>
                {queueWorlds.slice(0, 3).map((project, index) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="panel-card flex items-center justify-between gap-4 rounded-[24px] p-4 transition hover:border-cyan-300/24 hover:bg-black/24"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                        Queue {index + 1}
                      </p>
                      <p className="mt-2 truncate text-lg font-black text-white">{project.name}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {project.campaignCount} lanes ready
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-cyan-200">{project.liveXp} XP</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                        {project.chain || "Open grid"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 px-5 py-8 text-sm text-slate-300">
              No live worlds are visible yet.
            </div>
          )}
        </div>

        <Surface
          eyebrow="Signals"
          title="Grid pulse"
          description="A tight read on which worlds are hottest on the network right now."
        >
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <MetricTile label="Worlds online" value={String(snapshot.total)} />
            <MetricTile label="Prime zones" value={String(snapshot.featured)} />
            <MetricTile label="Live ecosystems" value={String(snapshot.live)} />
          </div>

          <div className="mt-5 space-y-3">
            {hottestWorlds.map((project, index) => (
              <div
                key={project.id}
                className="metric-card flex items-center justify-between rounded-[22px] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    Hot slot {index + 1}
                  </p>
                  <p className="mt-2 truncate text-sm font-semibold text-white">{project.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-cyan-200">{project.campaignCount} lanes</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    {project.members.toLocaleString()} users
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <Surface
        eyebrow="World Grid"
        title="Choose your next world"
        description="Filter the grid fast, then dive into the worlds with the strongest mission density, audience pull and reward pressure."
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full flex-col gap-4 xl:max-w-xl">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search worlds, chains, categories..."
              className="glass-button w-full rounded-[22px] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40"
            />
            <div className="flex flex-wrap gap-2">
              <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All worlds" />
              <FilterButton
                active={filter === "featured"}
                onClick={() => setFilter("featured")}
                label="Prime worlds"
              />
              <FilterButton
                active={filter === "ecosystem"}
                onClick={() => setFilter("ecosystem")}
                label="Live ecosystems"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
            <InlineSignal icon={Sparkles} label="Prime" value={String(snapshot.featured)} accent="text-cyan-200" />
            <InlineSignal icon={Radio} label="Live" value={String(snapshot.live)} accent="text-lime-200" />
            <InlineSignal label="Catalog" value={String(filteredProjects.length)} accent="text-white" />
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <EmptyNotice text="Loading live worlds..." />
          ) : error ? (
            <ErrorNotice text={error} />
          ) : filteredProjects.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="panel-card rounded-[30px] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/28 hover:bg-black/24"
                >
                  <div className="flex min-h-[96px] items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        {project.chain ? (
                          <span className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-100">
                            {project.chain}
                          </span>
                        ) : null}
                        {project.category ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                            {project.category}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-4 text-2xl font-black leading-tight text-white">{project.name}</p>
                    </div>
                    <StatusChip
                      label={project.featured ? "Prime" : project.campaignCount > 0 ? "Live" : "Idle"}
                      tone={project.featured ? "positive" : project.campaignCount > 0 ? "info" : "default"}
                    />
                  </div>

                  <p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-300">
                    {project.description || "World data is live, but this faction still needs a stronger public briefing."}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Lanes" value={String(project.campaignCount)} />
                    <MiniStat label="XP" value={String(project.liveXp)} />
                    <MiniStat label="Users" value={project.members.toLocaleString()} />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Completion pulse
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">{project.completionRate}% avg clear</p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                      Enter
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyNotice text="No worlds match this filter yet." />
          )}
        </div>
      </Surface>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/24 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[20px] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function InlineSignal({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon?: typeof Sparkles;
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
          ? "bg-cyan-300/14 text-cyan-200 ring-1 ring-cyan-300/20"
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
