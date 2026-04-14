import { activityFeed, activeMissions, projectsPreview, rewardMoments } from "@/lib/demo-data";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";

export function HomeScreen() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(192,255,0,0.12),rgba(0,0,0,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
            Active Mission
          </p>
          <h3 className="mt-4 max-w-xl text-3xl font-black tracking-tight text-white sm:text-5xl">
            Chainwars Community Starter is one verification away from turning claimable.
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            The webapp MVP starts with a clear mission-control surface: active quests, pending
            verification, visible reward pressure and connected account readiness in one place.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[0.99]">
              Resume mission
            </button>
            <button className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
              Review connected accounts
            </button>
          </div>
        </div>

        <Surface
          eyebrow="Progression"
          title="Momentum stack"
          description="A lightweight but high-signal snapshot of where the user stands."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Tier</p>
              <p className="mt-3 text-3xl font-black text-white">Raider II</p>
              <p className="mt-2 text-sm text-slate-300">240 XP to Raider III</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Streak</p>
              <p className="mt-3 text-3xl font-black text-white">7 days</p>
              <p className="mt-2 text-sm text-slate-300">1 verified action keeps it alive</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Claimable</p>
              <p className="mt-3 text-3xl font-black text-white">1</p>
              <p className="mt-2 text-sm text-slate-300">Starter access is ready</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Pending</p>
              <p className="mt-3 text-3xl font-black text-white">2</p>
              <p className="mt-2 text-sm text-slate-300">Community verifications running</p>
            </div>
          </div>
        </Surface>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Surface
          eyebrow="Mission Board"
          title="Active missions"
          description="The first consumer web surface should make the next action obvious."
        >
          <div className="space-y-4">
            {activeMissions.map((mission) => (
              <div
                key={mission.title}
                className="rounded-[26px] border border-white/8 bg-black/20 p-5 transition hover:border-lime-300/30 hover:bg-black/25"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-white">{mission.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{mission.hint}</p>
                  </div>
                  <StatusChip
                    label={mission.stage}
                    tone={mission.stage.includes("Awaiting") ? "warning" : mission.stage.includes("Review") ? "info" : "positive"}
                  />
                </div>
                <p className="mt-4 text-sm font-semibold text-lime-200">Reward path: {mission.reward}</p>
              </div>
            ))}
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface
            eyebrow="Payoff"
            title="Reward pressure"
            description="Rewards should feel like outcomes, not back-office rows."
          >
            <div className="space-y-4">
              {rewardMoments.map((reward) => (
                <div
                  key={reward.title}
                  className="flex items-center justify-between gap-4 rounded-[24px] border border-white/8 bg-black/20 px-4 py-4"
                >
                  <div>
                    <p className="font-bold text-white">{reward.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{reward.rarity}</p>
                  </div>
                  <StatusChip
                    label={reward.state}
                    tone={reward.state === "Claimable" ? "positive" : reward.state.includes("away") ? "warning" : "default"}
                  />
                </div>
              ))}
            </div>
          </Surface>

          <Surface
            eyebrow="Radar"
            title="Recent activity"
            description="A simple activity feed keeps the surface alive even before live subscriptions."
          >
            <div className="space-y-3">
              {activityFeed.map((item) => (
                <div key={item} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>

      <Surface
        eyebrow="Ecosystem"
        title="Project worlds"
        description="Projects on web should feel like branded mission worlds, not bland list rows."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {projectsPreview.map((project) => (
            <div
              key={project.name}
              className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-black text-white">{project.name}</p>
                <StatusChip label={project.status} tone="info" />
              </div>
              <p className="mt-2 text-sm text-lime-200">{project.chain}</p>
              <p className="mt-4 text-sm leading-6 text-slate-300">{project.description}</p>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
