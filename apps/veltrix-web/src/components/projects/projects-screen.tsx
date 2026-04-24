"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

type ProjectFilter = "all" | "featured" | "ecosystem";

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function ProjectsScreen() {
  const { loading, error, projects, campaigns } = useLiveUserData({
    datasets: ["projects", "campaigns"],
  });
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
          activityScore: linkedCampaigns.length * 1000 + project.members,
        };
      })
      .sort(
        (left, right) =>
          Number(right.featured) - Number(left.featured) ||
          right.activityScore - left.activityScore ||
          right.liveXp - left.liveXp
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

  const spotlightProjects = filteredProjects.slice(0, 4);
  const hotProjects = filteredProjects.filter((project) => project.campaignCount > 0).slice(0, 8);
  const projectColumns = [hotProjects.slice(0, 4), hotProjects.slice(4, 8)];
  const totalMembers = enrichedProjects.reduce((sum, project) => sum + project.members, 0);
  const snapshot = {
    total: enrichedProjects.length,
    featured: enrichedProjects.filter((project) => project.featured).length,
    live: enrichedProjects.filter((project) => project.campaignCount > 0).length,
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-3.5 xl:grid-cols-[minmax(0,1.48fr)_280px]">
        <div className="rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_26%),linear-gradient(180deg,rgba(13,14,18,0.98),rgba(8,9,12,0.98))] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">Spaces</p>
            <h2 className="mt-2.5 text-[0.96rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.08rem]">
              Spotlight spaces first, then scan the grid
            </h2>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
              Fast filters, compact slabs and enough density to compare more ecosystems at once.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <BoardStat label="Spaces" value={String(snapshot.total)} />
            <BoardStat label="Featured" value={String(snapshot.featured)} />
            <BoardStat label="Live" value={String(snapshot.live)} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Find</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Project, chain or category..."
              className="w-full bg-transparent text-[12px] text-white outline-none placeholder:text-slate-500"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
            <FilterButton active={filter === "featured"} onClick={() => setFilter("featured")} label="Featured" />
            <FilterButton active={filter === "ecosystem"} onClick={() => setFilter("ecosystem")} label="Live" />
          </div>
        </div>
        </div>

        <div className="rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_28%),linear-gradient(180deg,rgba(13,14,18,0.98),rgba(8,9,12,0.98))] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Space signal</p>
          <p className="mt-2 text-[0.96rem] font-semibold tracking-[-0.02em] text-white">
            Directory density
          </p>

          <div className="mt-4 space-y-2.5">
            <SignalCard label="Live spaces" value={String(snapshot.live)} meta="active ecosystems" />
            <SignalCard label="Featured" value={String(snapshot.featured)} meta="priority rows" />
            <SignalCard label="Members" value={formatCompactNumber(totalMembers)} meta="network reach" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="New spaces"
          title="Spaces worth opening first"
          description="A short top lane keeps the strongest ecosystems visible before the denser directory."
        />

        {loading ? (
          <EmptyNotice text="Loading project spotlights..." />
        ) : error ? (
          <EmptyNotice text={error} tone="error" />
        ) : spotlightProjects.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.44fr)_repeat(3,minmax(0,1fr))]">
            {spotlightProjects.map((project, index) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                prefetch={false}
                className={`group relative overflow-hidden rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,17,20,0.98),rgba(8,10,13,0.98))] transition hover:border-cyan-300/16 hover:bg-[linear-gradient(180deg,rgba(16,19,22,0.98),rgba(9,11,14,0.98))] ${
                  index === 0 ? "min-h-[208px] p-4 sm:p-4.5" : "min-h-[168px] p-3"
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_35%),linear-gradient(180deg,rgba(10,12,15,0.05),rgba(10,12,15,0.88))]" />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {project.chain ? <CardPill>{project.chain}</CardPill> : null}
                      {project.category ? <CardPill>{project.category}</CardPill> : null}
                    </div>
                    <StatusChip
                      label={project.featured ? "Featured" : project.campaignCount > 0 ? "Live" : "Idle"}
                      tone={project.featured ? "positive" : project.campaignCount > 0 ? "info" : "default"}
                    />
                  </div>

                  <p className={`font-semibold leading-5 text-white ${index === 0 ? "mt-5 text-[0.98rem]" : "mt-4 text-[0.86rem]"}`}>
                    {project.name}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-400">
                    {project.description || "Project lane with active campaign pressure and community motion."}
                  </p>

                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    <MetricPill label="Campaigns" value={String(project.campaignCount)} />
                    <MetricPill label="Members" value={formatCompactNumber(project.members)} />
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-white/6 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      {project.completionRate}% clear
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition group-hover:translate-x-0.5">
                      View
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyNotice text="No project spotlights are visible yet." />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Hot spaces"
          title="Activity read"
          description="A ranked read helps you scan where the most community and campaign motion sits."
        />

        {loading ? (
          <EmptyNotice text="Loading activity lanes..." />
        ) : error ? (
          <EmptyNotice text={error} tone="error" />
        ) : hotProjects.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {projectColumns.map((column, columnIndex) => (
              <div
                key={columnIndex}
                className="rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,14,18,0.98),rgba(8,9,12,0.98))] p-3.5"
              >
                <div className="flex items-center justify-between gap-3 border-b border-white/6 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Space</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Participation</p>
                </div>

                <div className="divide-y divide-white/6">
                  {column.map((project, index) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      prefetch={false}
                      className="grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3 py-3.5 transition first:pt-3.5 hover:text-cyan-100"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        {String(columnIndex * 4 + index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-white">{project.name}</p>
                        <p className="mt-1 truncate text-[10px] uppercase tracking-[0.18em] text-slate-500">
                          {project.chain ?? project.category ?? "Project"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-semibold text-white">{formatCompactNumber(project.members)}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                          {project.campaignCount} lanes
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNotice text="No live project activity is visible yet." />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="All spaces"
          title="Directory"
          description="The main directory stays grid-first and compact so you can compare more ecosystems fast."
        />

        {loading ? (
          <EmptyNotice text="Loading projects..." />
        ) : error ? (
          <EmptyNotice text={error} tone="error" />
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                prefetch={false}
                className="group rounded-[20px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,15,18,0.98),rgba(8,10,13,0.98))] p-3 transition hover:border-cyan-300/16 hover:bg-[linear-gradient(180deg,rgba(15,18,20,0.98),rgba(9,11,14,0.98))]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[0.86rem] font-semibold text-white">{project.name}</p>
                    <p className="mt-1.5 truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      {project.chain ?? project.category ?? "Project"}
                    </p>
                  </div>
                  <StatusChip
                    label={project.featured ? "Featured" : project.campaignCount > 0 ? "Live" : "Idle"}
                    tone={project.featured ? "positive" : project.campaignCount > 0 ? "info" : "default"}
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                  <span>{project.campaignCount} lanes</span>
                  <span>{formatCompactNumber(project.members)} members</span>
                </div>

                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  <MetricPill label="XP" value={formatCompactNumber(project.liveXp)} />
                  <MetricPill label="Members" value={formatCompactNumber(project.members)} />
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-white/6 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Open space
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-200">
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyNotice text="No projects match this board filter yet." />
        )}
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-1.5 text-[0.94rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.02rem]">
          {title}
        </h2>
        <p className="mt-1 max-w-3xl text-[11px] leading-5 text-slate-400">{description}</p>
      </div>
      <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400">
        <ArrowRight className="h-3 w-3" />
      </span>
    </div>
  );
}

function BoardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-[11px] font-semibold text-white">{value}</p>
    </div>
  );
}

function SignalCard({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-[12px] font-semibold text-white">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-slate-500">{meta}</p>
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
      className={`rounded-full px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] transition ${
        active
          ? "border border-cyan-300/16 bg-cyan-300/10 text-cyan-100"
          : "border border-white/8 bg-white/[0.03] text-slate-400 hover:border-white/12 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function CardPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-1 text-[7px] font-bold uppercase tracking-[0.14em] text-slate-300">
      {children}
    </span>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/20 px-2 py-[3px] text-[7px] font-bold uppercase tracking-[0.12em] text-slate-400">
      <span>{label}</span>
      <span className="text-white">{value}</span>
    </span>
  );
}

function EmptyNotice({
  text,
  tone = "default",
}: {
  text: string;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`rounded-[18px] border px-3.5 py-4 text-[12px] ${
        tone === "error"
          ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
          : "border-white/8 bg-black/20 text-slate-300"
      }`}
    >
      {text}
    </div>
  );
}
