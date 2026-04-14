"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

type ProjectFilter = "all" | "featured" | "ecosystem";

export function ProjectsScreen() {
  const { loading, error, projects, campaigns } = useLiveUserData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");

  const enrichedProjects = useMemo(() => {
    return projects.map((project) => {
      const linkedCampaigns = campaigns.filter((campaign) => campaign.projectId === project.id);
      return {
        ...project,
        campaignCount: linkedCampaigns.length,
        featured: linkedCampaigns.some((campaign) => campaign.featured),
      };
    });
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

  const featuredCount = enrichedProjects.filter((project) => project.featured).length;
  const ecosystemCount = enrichedProjects.filter((project) => project.campaignCount > 0).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(0,204,255,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            Project Discovery
          </p>
          <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Browse the live project worlds behind every campaign lane.
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            The web catalog now behaves more like a proper ecosystem radar: real backend projects,
            real campaign density and cleaner scanability instead of placeholder rows.
          </p>
        </div>

        <Surface
          eyebrow="Snapshot"
          title="Portfolio read"
          description="Quick visibility into how much of the ecosystem is already campaign-ready."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricTile label="Projects" value={String(enrichedProjects.length)} />
            <MetricTile label="Featured" value={String(featuredCount)} />
            <MetricTile label="Live ecosystems" value={String(ecosystemCount)} />
          </div>
        </Surface>
      </section>

      <Surface
        eyebrow="World Browser"
        title="Project worlds"
        description="Project cards should feel like selectable worlds inside the grid."
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects..."
            className="glass-button w-full rounded-[22px] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 lg:max-w-md"
          />

          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
            <FilterButton
              active={filter === "featured"}
              onClick={() => setFilter("featured")}
              label="Featured"
            />
            <FilterButton
              active={filter === "ecosystem"}
              onClick={() => setFilter("ecosystem")}
              label="Live ecosystems"
            />
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <EmptyNotice text="Loading live projects..." />
          ) : error ? (
            <ErrorNotice text={error} />
          ) : filteredProjects.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="panel-card rounded-[28px] p-5 transition hover:border-cyan-300/30 hover:bg-black/25"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-black text-white">{project.name}</p>
                      <p className="mt-2 text-sm text-cyan-200">
                        {project.chain ?? "Chain not set"} • {project.category ?? "General"}
                      </p>
                    </div>
                    <div className="shrink-0 self-start">
                      <StatusChip
                        label={project.featured ? "Featured" : project.campaignCount > 0 ? "Live" : "Draft"}
                        tone={project.featured ? "positive" : project.campaignCount > 0 ? "info" : "default"}
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-300">{project.description}</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Campaigns" value={String(project.campaignCount)} />
                    <MiniStat label="Members" value={project.members.toLocaleString()} />
                    <MiniStat label="Website" value={project.website ? "Linked" : "Missing"} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyNotice text="No projects match this filter yet." />
          )}
        </div>
      </Surface>
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
