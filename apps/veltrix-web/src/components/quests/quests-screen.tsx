"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { ArtworkImage } from "@/components/ui/artwork-image";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

type QuestFilter = "all" | "open" | "high-xp";

function getQuestTone(status: string) {
  if (status === "approved") return "positive";
  if (status === "pending") return "warning";
  if (status === "rejected") return "danger";
  return "info";
}

export function QuestsScreen() {
  const { loading, error, quests, campaigns, projects, rewards } = useLiveUserData({
    datasets: ["quests", "campaigns", "projects", "rewards"],
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuestFilter>("all");

  const enrichedQuests = useMemo(() => {
    return quests
      .map((quest) => {
        const linkedCampaign = campaigns.find((campaign) => campaign.id === quest.campaignId);
        const linkedProject = projects.find(
          (project) => project.id === (quest.projectId ?? linkedCampaign?.projectId)
        );
        const rewardCount = rewards.filter((reward) => reward.campaignId === quest.campaignId).length;

        return {
          ...quest,
          campaignTitle: linkedCampaign?.title ?? "Mission lane",
          projectName: linkedProject?.name ?? "Project",
          campaignFeatured: linkedCampaign?.featured ?? false,
          imageUrl: linkedCampaign?.bannerUrl ?? linkedCampaign?.thumbnailUrl ?? linkedProject?.bannerUrl ?? null,
          rewardCount,
        };
      })
      .sort(
        (left, right) =>
          Number(right.campaignFeatured) - Number(left.campaignFeatured) ||
          Number(left.status === "approved") - Number(right.status === "approved") ||
          right.xp - left.xp
      );
  }, [campaigns, projects, quests, rewards]);

  const filteredQuests = useMemo(() => {
    let items = enrichedQuests;

    if (query.trim()) {
      const normalized = query.toLowerCase();
      items = items.filter((quest) =>
        [quest.title, quest.description, quest.projectName, quest.campaignTitle].some((value) =>
          value.toLowerCase().includes(normalized)
        )
      );
    }

    if (filter === "open") {
      items = items.filter((quest) => quest.status !== "approved");
    }

    if (filter === "high-xp") {
      items = items.filter((quest) => quest.xp >= 250);
    }

    return items;
  }, [enrichedQuests, filter, query]);

  const spotlightQuests = filteredQuests.slice(0, 3);
  const openCount = enrichedQuests.filter((quest) => quest.status !== "approved").length;
  const pendingCount = enrichedQuests.filter((quest) => quest.status === "pending").length;
  const rewardLinkedCount = enrichedQuests.filter((quest) => quest.rewardCount > 0).length;

  return (
    <div className="space-y-7">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_300px]">
        <div className="rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(74,217,255,0.12),transparent_26%),linear-gradient(180deg,rgba(13,15,18,0.99),rgba(6,8,11,0.99))] p-4 shadow-[0_20px_54px_rgba(0,0,0,0.24)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">Quest lanes</p>
            <h2 className="mt-2.5 text-[1rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.12rem]">
              Spotlight the missions that matter, then scan the rest fast
            </h2>
            <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-slate-400">
              Featured quests stay visual. Everything else stays dense, dark and easy to scan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <BoardStat label="Open quests" value={String(openCount)} />
            <BoardStat label="Pending" value={String(pendingCount)} />
            <BoardStat label="Reward-linked" value={String(rewardLinkedCount)} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Find</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Quest, project or mission lane..."
              className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-slate-500"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
            <FilterButton active={filter === "open"} onClick={() => setFilter("open")} label="Open" />
            <FilterButton active={filter === "high-xp"} onClick={() => setFilter("high-xp")} label="High XP" />
          </div>
        </div>
        </div>

        <div className="rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_bottom_right,rgba(74,217,255,0.12),transparent_28%),linear-gradient(180deg,rgba(13,14,18,0.98),rgba(8,9,12,0.98))] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Mission signal</p>
          <p className="mt-2.5 text-[1rem] font-semibold tracking-[-0.02em] text-white">
            Quest pressure
          </p>

          <div className="mt-4 space-y-2.5">
            <SignalCard label="Open now" value={String(openCount)} meta="active missions" />
            <SignalCard label="Pending" value={String(pendingCount)} meta="needs review" />
            <SignalCard label="Reward linked" value={String(rewardLinkedCount)} meta="payout-ready" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Spotlights"
          title="Featured quests"
          description="Only the top mission spotlights carry imagery, so the rest of the board can stay dense and calm."
        />

        {loading ? (
          <EmptyNotice text="Loading quest spotlights..." />
        ) : error ? (
          <EmptyNotice text={error} tone="error" />
        ) : spotlightQuests.length > 0 ? (
          <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]">
            {spotlightQuests.map((quest, index) => (
              <Link
                key={quest.id}
                href={`/quests/${quest.id}`}
                prefetch={false}
                className={`group relative overflow-hidden rounded-[26px] border border-white/6 bg-[linear-gradient(180deg,rgba(18,20,24,0.98),rgba(9,11,15,0.98))] shadow-[0_20px_56px_rgba(0,0,0,0.32)] transition hover:border-cyan-300/18 ${
                  index === 0 ? "min-h-[248px] p-4.5 sm:p-5" : "min-h-[208px] p-3.5 sm:p-4"
                }`}
              >
                {quest.campaignFeatured && quest.imageUrl ? (
                  <>
                    <ArtworkImage
                      src={quest.imageUrl}
                      alt={quest.title}
                      tone="cyan"
                      fallbackLabel="Quest art offline"
                      className="absolute inset-0"
                      imgClassName="h-full w-full object-cover opacity-28"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,11,0.18),rgba(5,7,11,0.92)_56%,rgba(5,7,11,0.98))]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,217,255,0.18),transparent_34%)]" />
                  </>
                ) : null}

                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <CardPill>{quest.projectName}</CardPill>
                      <CardPill>{quest.campaignTitle}</CardPill>
                    </div>
                    <StatusChip label={quest.status} tone={getQuestTone(quest.status)} />
                  </div>

                  <h3
                    className={`font-semibold leading-6 text-white ${
                      index === 0 ? "mt-6 text-[1.08rem]" : "mt-5 text-[0.94rem]"
                    }`}
                  >
                    {quest.title}
                  </h3>
                  <p className="mt-2.5 line-clamp-2 text-[12px] leading-5 text-slate-300">
                    {quest.description || "Mission lane with live verification pressure and a direct route into action."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <MetricPill label="XP" value={String(quest.xp)} />
                    <MetricPill label="Mode" value={quest.completionMode ?? "manual"} />
                    <MetricPill label="Rewards" value={String(quest.rewardCount)} />
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-white/6 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Open mission
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
          <EmptyNotice text="No featured quests are visible yet." />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Grid"
          title="All quests"
          description="Below the spotlight row, the quest board stays text-first and dense so you can scan more missions at once."
        />

        {loading ? (
          <EmptyNotice text="Loading quests..." />
        ) : error ? (
          <EmptyNotice text={error} tone="error" />
        ) : filteredQuests.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
            {filteredQuests.map((quest) => (
              <Link
                key={quest.id}
                href={`/quests/${quest.id}`}
                prefetch={false}
                className="group rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,17,20,0.98),rgba(7,9,12,0.98))] p-3.5 transition hover:border-cyan-300/16 hover:bg-[linear-gradient(180deg,rgba(15,19,22,0.98),rgba(8,10,13,0.98))]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[0.94rem] font-semibold text-white">{quest.title}</p>
                    <p className="mt-2 truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      {quest.projectName}
                    </p>
                  </div>
                  <StatusChip label={quest.status} tone={getQuestTone(quest.status)} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                  <span className="truncate">{quest.campaignTitle}</span>
                  <span>{quest.rewardCount} rewards</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <MetricPill label="XP" value={String(quest.xp)} />
                  <MetricPill label="Mode" value={quest.completionMode ?? "manual"} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Open mission
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
          <EmptyNotice text="No quests match this board filter yet." />
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
    <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-slate-300">
      {children}
    </span>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/20 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
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
