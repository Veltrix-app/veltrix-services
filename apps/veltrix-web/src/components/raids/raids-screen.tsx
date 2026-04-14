"use client";

import Link from "next/link";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function RaidsScreen() {
  const { raids, loading, error } = useLiveUserData();

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,80,80,0.14),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-rose-300">
          Raids
        </p>
        <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
          Live actions your community can complete right now.
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          The raid layer now ships on web too, with the same live backend rows, timers, reward payouts
          and instruction loops as mobile.
        </p>
      </section>

      <Surface
        eyebrow="Raid Board"
        title="Open coordinated pushes"
        description="Every active raid on the backend is now reachable from the web surface."
      >
        {loading ? (
          <Notice tone="default" text="Loading raids..." />
        ) : error ? (
          <Notice tone="error" text={error} />
        ) : raids.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {raids.map((raid) => (
              <Link
                key={raid.id}
                href={`/raids/${raid.id}`}
                className="overflow-hidden rounded-[28px] border border-white/8 bg-black/20 transition hover:border-rose-300/30 hover:bg-black/25"
              >
                <div className="h-44 bg-[linear-gradient(135deg,rgba(255,90,90,0.16),rgba(0,0,0,0.18))]">
                  {raid.banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={raid.banner} alt={raid.title} className="h-full w-full object-cover opacity-80" />
                  ) : null}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-rose-200">{raid.community}</p>
                      <p className="mt-2 text-xl font-black text-white">{raid.title}</p>
                      <p className="mt-2 text-sm text-slate-300">{raid.target}</p>
                    </div>
                    <StatusChip label={`+${raid.reward} XP`} tone="info" />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Timer" value={raid.timer} />
                    <MiniStat label="Participants" value={String(raid.participants)} />
                    <MiniStat label="Progress" value={`${raid.progress}%`} />
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
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
