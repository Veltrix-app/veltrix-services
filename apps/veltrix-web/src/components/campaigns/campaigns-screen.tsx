"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import { XpValue, isXpDisplay } from "@/components/ui/xp-badge";
import { useLiveUserData } from "@/hooks/use-live-user-data";

type CampaignFilter = "all" | "featured" | "high-xp";

export function CampaignsScreen() {
  const { loading, error, campaigns, projects, quests } = useLiveUserData({
    datasets: ["campaigns", "projects", "quests"],
  });
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
        [campaign.title, campaign.description, campaign.projectName].some((value) =>
          value.toLowerCase().includes(normalized)
        )
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

  const spotlightCampaigns = filteredCampaigns.slice(0, 3);
  const campaignCount = enrichedCampaigns.length;
  const featuredCount = enrichedCampaigns.filter((campaign) => campaign.featured).length;
  const averageClearRate =
    enrichedCampaigns.length > 0
      ? Math.round(
          enrichedCampaigns.reduce((sum, campaign) => sum + campaign.completionRate, 0) /
            enrichedCampaigns.length
        )
      : 0;

  return (
    <div className="space-y-7">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_300px]">
        <div className="rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(163,230,53,0.12),transparent_26%),linear-gradient(180deg,rgba(13,15,18,0.99),rgba(6,8,11,0.99))] p-4 shadow-[0_20px_54px_rgba(0,0,0,0.24)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-300">Campaign lanes</p>
            <h2 className="mt-2.5 text-[1rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.12rem]">
              Featured lanes first, dense board underneath
            </h2>
            <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-slate-400">
              Open the strongest campaigns first, then scan the rest in one pass.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <BoardStat label="Campaigns" value={String(campaignCount)} />
            <BoardStat label="Featured" value={String(featuredCount)} />
            <BoardStat label="Avg clear" value={`${averageClearRate}%`} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Find</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Campaign, project or theme..."
              className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-slate-500"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
            <FilterButton active={filter === "featured"} onClick={() => setFilter("featured")} label="Featured" />
            <FilterButton active={filter === "high-xp"} onClick={() => setFilter("high-xp")} label="High XP" />
          </div>
        </div>
        </div>

        <div className="rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_bottom_right,rgba(163,230,53,0.12),transparent_28%),linear-gradient(180deg,rgba(13,14,18,0.98),rgba(8,9,12,0.98))] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Lane signal</p>
          <p className="mt-2.5 text-[1rem] font-semibold tracking-[-0.02em] text-white">
            Campaign density
          </p>

          <div className="mt-4 space-y-2.5">
            <SignalCard label="Featured live" value={String(featuredCount)} meta="priority lanes" />
            <SignalCard label="Average clear" value={`${averageClearRate}%`} meta="board health" />
            <SignalCard label="Open lanes" value={String(campaignCount)} meta="campaign rows" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Spotlights"
          title="Campaigns worth opening first"
          description="A short top lane for the campaigns currently carrying the strongest reward and completion pressure."
        />

        {loading ? (
          <EmptyNotice text="Loading campaign spotlights..." />
        ) : error ? (
          <EmptyNotice text={error} tone="error" />
        ) : spotlightCampaigns.length > 0 ? (
          <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]">
            {spotlightCampaigns.map((campaign, index) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                prefetch={false}
                className={`group relative overflow-hidden rounded-[25px] border border-white/6 bg-[linear-gradient(180deg,rgba(18,20,24,0.98),rgba(8,10,13,0.98))] shadow-[0_20px_56px_rgba(0,0,0,0.32)] transition hover:border-lime-300/18 ${
                  index === 0 ? "min-h-[240px] p-4.5 sm:p-5" : "min-h-[204px] p-3.5 sm:p-4"
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,230,53,0.14),transparent_35%),linear-gradient(180deg,rgba(10,12,15,0.12),rgba(10,12,15,0.88))]" />
                <div className="relative flex h-full flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <CardPill>{campaign.projectName}</CardPill>
                      <CardPill>{campaign.questCount} steps</CardPill>
                    </div>
                    <StatusChip
                      label={campaign.featured ? "Featured" : `${campaign.completionRate}% live`}
                      tone={campaign.featured ? "positive" : "info"}
                    />
                  </div>

                  <h3
                    className={`font-semibold leading-6 text-white ${
                      index === 0 ? "mt-6 text-[1.08rem]" : "mt-5 text-[0.94rem]"
                    }`}
                  >
                    {campaign.title}
                  </h3>
                  <p className="mt-2.5 line-clamp-2 text-[12px] leading-5 text-slate-300">
                    {campaign.description || "Live campaign lane with budget, mission flow and completion pressure."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <MetricPill label="XP" value={String(campaign.xpBudget)} />
                    <MetricPill label="Clear" value={`${campaign.completionRate}%`} />
                    <MetricPill label="Ends" value={campaign.endsLabel} />
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-white/6 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Open lane
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-lime-200 transition group-hover:translate-x-0.5">
                      View
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyNotice text="No campaign spotlights are visible yet." />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Grid"
          title="All campaign lanes"
          description="Compact slabs keep the board legible fast: title first, action next, reward context secondary."
        />

        {loading ? (
          <EmptyNotice text="Loading campaign board..." />
        ) : error ? (
          <EmptyNotice text={error} tone="error" />
        ) : filteredCampaigns.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
            {filteredCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                prefetch={false}
                className="group rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,17,20,0.98),rgba(7,9,12,0.98))] p-3.5 transition hover:border-lime-300/16 hover:bg-[linear-gradient(180deg,rgba(18,21,19,0.98),rgba(8,10,13,0.98))]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[0.94rem] font-semibold text-white">{campaign.title}</p>
                    <p className="mt-2 truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      {campaign.projectName}
                    </p>
                  </div>
                  <StatusChip
                    label={campaign.featured ? "Featured" : "Live"}
                    tone={campaign.featured ? "positive" : "default"}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{campaign.questCount} steps</span>
                  <span>{campaign.endsLabel}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <MetricPill label="XP" value={String(campaign.xpBudget)} />
                  <MetricPill label="Clear" value={`${campaign.completionRate}%`} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Open lane
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-lime-200">
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyNotice text="No campaigns match this board filter yet." />
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
        <h2 className="mt-2 text-[0.98rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.08rem]">
          {title}
        </h2>
        <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-400">{description}</p>
      </div>
      <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400">
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

function BoardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-1.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-white">{value}</p>
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
    <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-3.5 py-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-[13px] font-semibold text-white">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">{meta}</p>
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
      className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
        active
          ? "border border-lime-300/16 bg-lime-300/10 text-lime-100"
          : "border border-white/8 bg-white/[0.03] text-slate-400 hover:border-white/12 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function CardPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-slate-300">
      {children}
    </span>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  const hasXpBadge = isXpDisplay(label, value);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/20 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
      <span>{label}</span>
      {hasXpBadge ? <XpValue size="xs">{value}</XpValue> : <span className="text-white">{value}</span>}
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
      className={`rounded-[24px] border px-4 py-5 text-sm ${
        tone === "error"
          ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
          : "border-white/8 bg-black/20 text-slate-300"
      }`}
    >
      {text}
    </div>
  );
}
