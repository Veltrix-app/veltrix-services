"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Flame, Radar, Swords } from "lucide-react";
import { ArtworkImage } from "@/components/ui/artwork-image";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function RaidsScreen() {
  const { raids, loading, error } = useLiveUserData({
    datasets: ["raids"],
  });
  const sortedRaids = [...raids].sort(
    (left, right) => right.reward - left.reward || right.progress - left.progress
  );
  const [featuredRaid, ...queueRaids] = sortedRaids;
  const urgentCount = sortedRaids.filter((raid) => raid.progress >= 50).length;
  const spotlightRaids = sortedRaids.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_380px]">
        <div className="overflow-hidden rounded-[38px] border border-rose-300/12 bg-[radial-gradient(circle_at_top_left,rgba(255,90,90,0.18),transparent_26%),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(145deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-rose-300">
            <span>Raid Board</span>
            <span className="rounded-full border border-rose-300/16 bg-rose-300/10 px-3 py-1 tracking-[0.24em] text-rose-100">
              Live Operations
            </span>
          </div>

          {featuredRaid ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_320px]">
                <div className="space-y-5">
                  <ArtworkPanel src={featuredRaid.banner} alt={featuredRaid.title} badge={featuredRaid.community} className="h-64" />

                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-[14ch]">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-rose-300/16 bg-rose-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-rose-100">
                          {featuredRaid.community}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                          {featuredRaid.timer}
                        </span>
                      </div>
                      <h3 className="font-display mt-4 text-balance text-[clamp(2.2rem,4vw,4.5rem)] font-black leading-[0.92] tracking-[0.04em] text-white">
                        {featuredRaid.title}
                      </h3>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                        {featuredRaid.target}
                      </p>
                    </div>

                    <StatusChip label={`+${featuredRaid.reward} XP`} tone="info" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <FeatureStat label="Reward" value={`${featuredRaid.reward}`} />
                    <FeatureStat label="Progress" value={`${featuredRaid.progress}%`} />
                    <FeatureStat label="Squad" value={String(featuredRaid.participants)} />
                    <FeatureStat label="Timer" value={featuredRaid.timer} />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/raids/${featuredRaid.id}`}
                      prefetch={false}
                      className="inline-flex items-center gap-2 rounded-full bg-rose-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-rose-200"
                    >
                      Join raid
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <span className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white">
                      Squad target locked
                    </span>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/24 p-4">
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-rose-200">
                    Tactical queue
                  </p>
                  <div className="mt-4 space-y-3">
                    {queueRaids.slice(0, 4).map((raid, index) => (
                      <Link
                        key={raid.id}
                        href={`/raids/${raid.id}`}
                        prefetch={false}
                        className="panel-card flex items-center gap-4 rounded-[24px] p-4 transition hover:border-rose-300/24 hover:bg-black/24"
                      >
                        <QueueThumb src={raid.banner} alt={raid.title} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                            Queue {index + 1}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-white">{raid.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                            {raid.community}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-rose-200">{raid.reward} XP</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {spotlightRaids.map((raid, index) => (
                  <Link
                    key={raid.id}
                    href={`/raids/${raid.id}`}
                    prefetch={false}
                    className="rounded-[26px] border border-white/8 bg-white/[0.04] p-4 transition hover:border-rose-300/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Spotlight {index + 1}
                      </p>
                      <Swords className="h-4 w-4 text-rose-300" />
                    </div>
                    <p className="mt-3 truncate text-lg font-black text-white">{raid.title}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MiniMetric label="Reward" value={`${raid.reward}`} />
                      <MiniMetric label="Progress" value={`${raid.progress}%`} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <EmptyNotice text="No live raids are visible yet." />
          )}
        </div>

        <div className="space-y-6">
          <Surface
            eyebrow="Command read"
            title="Read the live raid board first"
            description="Raids should tell you what is hot now, which push deserves your next click and how much squad pressure is still missing."
            className="bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.08),transparent_28%),linear-gradient(180deg,rgba(16,22,34,0.96),rgba(9,13,22,0.96))]"
          >
            <div className="space-y-4">
              <div className="grid gap-3">
                <ReadTile
                  label="Now"
                  value={
                    featuredRaid
                      ? `${featuredRaid.title} is the lead live push, currently sitting at ${featuredRaid.progress}% progress with ${featuredRaid.participants} members on it.`
                      : "No raid is currently carrying the live board."
                  }
                />
                <ReadTile
                  label="Next"
                  value={
                    queueRaids[0]
                      ? `${queueRaids[0].title} is the next raid to open once the lead push is clear.`
                      : "There is no second raid queue pressuring the board right now."
                  }
                />
                <ReadTile
                  label="Watch"
                  value={`${urgentCount} urgent pushes are already hot, while ${sortedRaids.filter((raid) => raid.progress < 50).length} still need fresh squad pressure.`}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3 2xl:grid-cols-1">
                <MetricTile label="Open raids" value={String(sortedRaids.length)} />
                <MetricTile label="Urgent pushes" value={String(urgentCount)} />
                <MetricTile
                  label="Live squads"
                  value={String(sortedRaids.reduce((sum, raid) => sum + raid.participants, 0))}
                />
              </div>
            </div>
          </Surface>

          <Surface
            eyebrow="Raid Filters"
            title="Refine board"
            description="Read the live pushes by urgency, reward and squad momentum."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <SignalTile label="Open" value={String(sortedRaids.length)} accent="text-white" compact />
              <SignalTile label="Urgent" value={String(urgentCount)} accent="text-rose-200" compact />
              <SignalTile
                label="Ready"
                value={String(sortedRaids.filter((raid) => raid.progress >= 50).length)}
                accent="text-lime-200"
                compact
              />
            </div>
          </Surface>
        </div>
      </section>

      <Surface
        eyebrow="Raid Catalog"
        title="Choose your push"
        description="The raid board should feel like live operations, not just a task list."
      >
        {loading ? (
          <Notice tone="default" text="Loading raids..." />
        ) : error ? (
          <Notice tone="error" text={error} />
        ) : sortedRaids.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {sortedRaids.map((raid) => (
              <Link
                key={raid.id}
                href={`/raids/${raid.id}`}
                prefetch={false}
                className="panel-card rounded-[32px] p-5 transition hover:-translate-y-0.5 hover:border-rose-300/28 hover:bg-black/24"
              >
                <ArtworkPanel src={raid.banner} alt={raid.title} badge={raid.community} className="mb-5 h-44" />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-2xl font-black text-white">{raid.title}</p>
                    <p className="mt-2 text-sm text-rose-200">{raid.target}</p>
                  </div>
                  <StatusChip label={`+${raid.reward} XP`} tone="info" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <MiniMetric label="Timer" value={raid.timer} />
                  <MiniMetric label="Squad" value={String(raid.participants)} />
                  <MiniMetric label="Progress" value={`${raid.progress}%`} />
                  <MiniMetric label="State" value={raid.progress >= 50 ? "Hot" : "Building"} />
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      Raid state
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {raid.progress >= 50 ? "Momentum building fast" : "Needs fresh squad pressure"}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-rose-200">
                    Join raid
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Notice tone="default" text="No raids are live right now." />
        )}
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
      <ArtworkImage
        src={src}
        alt={alt}
        tone="rose"
        fallbackLabel="Raid art offline"
        className="absolute inset-0"
        imgClassName="h-full w-full object-cover opacity-84"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,12,0.06),rgba(3,7,12,0.82)_58%,rgba(3,7,12,0.98))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.24),transparent_38%)]" />
      <div className="absolute left-4 top-4 rounded-full border border-rose-300/20 bg-black/45 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-rose-100">
        {badge}
      </div>
    </div>
  );
}

function QueueThumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] border border-white/10 bg-slate-950/80">
      <ArtworkImage
        src={src}
        alt={alt}
        tone="rose"
        fallbackLabel="Raid art offline"
        className="absolute inset-0"
        imgClassName="h-full w-full object-cover opacity-85"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,12,0.04),rgba(3,7,12,0.82))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.24),transparent_40%)]" />
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

function ReadTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-7 text-slate-200">{value}</p>
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

function SignalTile({
  icon: Icon,
  label,
  value,
  accent,
  compact = false,
}: {
  icon?: typeof Flame;
  label: string;
  value: string;
  accent: string;
  compact?: boolean;
}) {
  return (
    <div className="metric-card rounded-[22px] px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        <span>{label}</span>
      </div>
      <p className={`mt-3 ${compact ? "text-xl" : "text-2xl"} font-black ${accent}`}>{value}</p>
    </div>
  );
}

function EmptyNotice({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-6 text-sm text-slate-300">
      {text}
    </div>
  );
}

function Notice({ text, tone }: { text: string; tone: "default" | "error" }) {
  return (
    <div
      className={`rounded-[24px] px-4 py-6 text-sm ${
        tone === "error"
          ? "border border-rose-400/20 bg-rose-500/10 text-rose-200"
          : "border border-white/8 bg-black/20 text-slate-300"
      }`}
    >
      {text}
    </div>
  );
}
