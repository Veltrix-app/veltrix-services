"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Flame, Radar } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function RaidsScreen() {
  const { raids, loading, error } = useLiveUserData();
  const sortedRaids = [...raids].sort((left, right) => right.reward - left.reward || right.progress - left.progress);
  const [featuredRaid, ...queueRaids] = sortedRaids;
  const urgentCount = sortedRaids.filter((raid) => raid.progress >= 50).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[36px] border border-rose-300/16 bg-[radial-gradient(circle_at_top_left,rgba(255,90,90,0.18),transparent_42%),linear-gradient(145deg,rgba(9,15,21,0.98),rgba(3,7,12,0.92))] p-6 shadow-[0_28px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.34em] text-rose-300">
            <span>Raid Board</span>
            <span className="rounded-full border border-rose-300/16 bg-rose-300/10 px-3 py-1 tracking-[0.24em] text-rose-100">
              Live Pressure
            </span>
          </div>

          {featuredRaid ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-rose-300/16 bg-rose-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-rose-100">
                        {featuredRaid.community}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                        {featuredRaid.timer}
                      </span>
                    </div>
                    <h3 className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                      {featuredRaid.title}
                    </h3>
                    <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                      {featuredRaid.target}
                    </p>
                  </div>

                  <StatusChip label={`+${featuredRaid.reward} XP`} tone="info" />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <HeroStat label="Reward" value={`${featuredRaid.reward} XP`} />
                  <HeroStat label="Progress" value={`${featuredRaid.progress}%`} />
                  <HeroStat label="Participants" value={String(featuredRaid.participants)} />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/raids/${featuredRaid.id}`}
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

              <div className="space-y-3 rounded-[28px] border border-white/10 bg-black/24 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  Live queue
                </p>
                {queueRaids.slice(0, 4).map((raid, index) => (
                  <Link
                    key={raid.id}
                    href={`/raids/${raid.id}`}
                    className="panel-card flex items-center justify-between gap-4 rounded-[24px] p-4 transition hover:border-rose-300/24 hover:bg-black/24"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                        Queue {index + 1}
                      </p>
                      <p className="mt-2 truncate text-lg font-black text-white">{raid.title}</p>
                      <p className="mt-1 text-sm text-slate-300">{raid.community}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-rose-200">{raid.reward} XP</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                        {raid.timer}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 px-5 py-8 text-sm text-slate-300">
              No live raids are visible yet.
            </div>
          )}
        </div>

        <Surface
          eyebrow="Signals"
          title="Raid pressure"
          description="See how many coordinated pushes are hot, urgent, and ready for the squad."
        >
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <MetricTile label="Open raids" value={String(sortedRaids.length)} />
            <MetricTile label="Urgent pushes" value={String(urgentCount)} />
            <MetricTile label="Live squads" value={String(sortedRaids.reduce((sum, raid) => sum + raid.participants, 0))} />
          </div>

          <div className="mt-5 space-y-3">
            <SignalTile icon={Flame} label="Hot now" value={String(urgentCount)} accent="text-rose-200" />
            <SignalTile icon={AlertTriangle} label="Need action" value={String(sortedRaids.filter((raid) => raid.progress < 50).length)} accent="text-amber-200" />
            <SignalTile icon={Radar} label="Board" value={String(sortedRaids.length)} accent="text-cyan-200" />
          </div>
        </Surface>
      </section>

      <Surface
        eyebrow="Raid Grid"
        title="Choose your push"
        description="Track live raid opportunities with stronger urgency, payout and squad-readiness hierarchy."
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
                className="panel-card overflow-hidden rounded-[30px] transition hover:-translate-y-0.5 hover:border-rose-300/28 hover:bg-black/24"
              >
                <div className="relative h-44 bg-[linear-gradient(135deg,rgba(255,90,90,0.18),rgba(0,0,0,0.18))]">
                  {raid.banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={raid.banner} alt={raid.title} className="h-full w-full object-cover opacity-80" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-rose-300/16 bg-rose-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-rose-100">
                          {raid.community}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                          {raid.timer}
                        </span>
                      </div>
                      <p className="mt-4 text-2xl font-black leading-tight text-white">{raid.title}</p>
                      <p className="mt-3 text-sm text-slate-300">{raid.target}</p>
                    </div>
                    <StatusChip label={`+${raid.reward} XP`} tone="info" />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Timer" value={raid.timer} />
                    <MiniStat label="Participants" value={String(raid.participants)} />
                    <MiniStat label="Progress" value={`${raid.progress}%`} />
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
                      Join
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
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

function SignalTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="metric-card rounded-[22px] px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className={`mt-3 text-2xl font-black ${accent}`}>{value}</p>
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
