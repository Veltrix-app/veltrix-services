"use client";

import Link from "next/link";
import { ArrowRight, Radar, Shield, Sparkles, Swords, Trophy } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuth } from "@/components/providers/auth-provider";
import { useLiveUserData } from "@/hooks/use-live-user-data";

function getQuestTone(status: string) {
  if (status === "approved") return "positive";
  if (status === "pending") return "warning";
  if (status === "rejected") return "danger";
  return "info";
}

export function HomeScreen() {
  const { profile } = useAuth();
  const {
    loading,
    error,
    projects,
    campaigns,
    raids,
    rewards,
    quests,
    notifications,
    approvedQuestCount,
    pendingQuestCount,
    claimableRewardCount,
  } = useLiveUserData();

  const featuredCampaign = campaigns[0] ?? null;
  const featuredProject = projects.find((project) => project.id === featuredCampaign?.projectId) ?? null;
  const quickQueue = campaigns.slice(1, 4);
  const liveRaids = raids.slice(0, 3);
  const rewardMoments = rewards.slice(0, 3);
  const activityFeed = notifications.slice(0, 4);
  const projectsPreview = projects.slice(0, 3);
  const activeMissions = quests.slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.28fr)_420px]">
        <div className="relative overflow-hidden rounded-[38px] border border-cyan-300/10 bg-[radial-gradient(circle_at_top_left,rgba(192,255,0,0.18),transparent_22%),radial-gradient(circle_at_82%_18%,rgba(0,204,255,0.22),transparent_24%),linear-gradient(135deg,rgba(7,18,24,0.98),rgba(4,9,13,0.95))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <HeroArtwork
            src={featuredCampaign?.bannerUrl ?? featuredCampaign?.thumbnailUrl ?? featuredProject?.bannerUrl ?? null}
            alt={featuredCampaign?.title ?? featuredProject?.name ?? "Veltrix"}
          />

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-[13ch]">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.34em] text-lime-300">
                Mission Launcher
              </p>
              <h3 className="font-display mt-4 text-balance text-[clamp(2.4rem,5vw,5.2rem)] font-black leading-[0.9] tracking-[0.03em] text-white">
                {featuredCampaign?.title ?? "Grid standing by"}
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                {featuredCampaign?.description ??
                  "The command layer is hot. As soon as live lanes hit your account, this board becomes your main launch surface."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {featuredProject ? <StatusChip label={featuredProject.name} tone="info" /> : null}
              <StatusChip
                label={featuredCampaign ? (featuredCampaign.featured ? "Prime lane" : "Live lane") : "Stand by"}
                tone={featuredCampaign?.featured ? "positive" : "default"}
              />
            </div>
          </div>

          <div className="relative z-10 mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={featuredCampaign ? `/campaigns/${featuredCampaign.id}` : "/campaigns"}
              className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
            >
              {featuredCampaign ? "Launch mission" : "Open board"}
            </Link>
            <Link
              href={featuredProject ? `/projects/${featuredProject.id}` : "/projects"}
              className="glass-button rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Enter world
            </Link>
          </div>

          <div className="relative z-10 mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4 sm:grid-cols-3">
              <FeatureStat label="XP budget" value={featuredCampaign ? String(featuredCampaign.xpBudget) : "0"} />
              <FeatureStat label="Mission heat" value={String(quests.length)} />
              <FeatureStat label="Signals" value={String(notifications.length)} />
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/24 p-4">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
                Queue preview
              </p>
              <div className="mt-4 space-y-3">
                {quickQueue.length > 0 ? (
                  quickQueue.map((campaign, index) => (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.id}`}
                      className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.04] px-3 py-3 transition hover:border-cyan-300/20"
                    >
                      <MiniArtwork
                        src={campaign.thumbnailUrl ?? campaign.bannerUrl}
                        alt={campaign.title}
                        accent="cyan"
                        className="h-14 w-14 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                          Queue {index + 1}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-white">{campaign.title}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-cyan-300" />
                    </Link>
                  ))
                ) : (
                  <Notice text="No queued missions yet." tone="default" compact />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Surface
            eyebrow="Pilot Status"
            title={profile?.username ?? "Guest Pilot"}
            description="Identity, current standing and mission readiness."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricTile label="Tier" value={profile?.contributionTier ?? "Explorer"} />
              <MetricTile label="Level" value={String(profile?.level ?? 1)} />
              <MetricTile label="Streak" value={String(profile?.streak ?? 0)} />
              <MetricTile label="Pending" value={String(pendingQuestCount)} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <SignalPill icon={Shield} label="Clear" value={String(approvedQuestCount)} />
              <SignalPill icon={Sparkles} label="Ready" value={String(claimableRewardCount)} />
              <SignalPill icon={Radar} label="Feed" value={String(notifications.length)} />
            </div>
          </Surface>

          <Surface
            eyebrow="Signal Feed"
            title="Command updates"
            description="Recent approvals, waits and unlocks from the live grid."
          >
            <div className="space-y-3">
              {activityFeed.length > 0 ? (
                activityFeed.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-3">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{item.body}</p>
                  </div>
                ))
              ) : (
                <Notice text="No live notifications yet." tone="default" compact />
              )}
            </div>
          </Surface>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Surface
          eyebrow="Mission Board"
          title="Active mission lanes"
          description="The next move should be obvious, rewarding and fast to open."
        >
          {loading ? (
            <Notice text="Loading live missions..." tone="default" />
          ) : error ? (
            <Notice text={error} tone="error" />
          ) : activeMissions.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {activeMissions.map((mission) => (
                <Link
                  key={mission.id}
                  href={`/quests/${mission.id}`}
                  className="panel-card rounded-[28px] p-5 transition hover:border-lime-300/24"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-white">{mission.title}</p>
                      <p className="mt-2 text-sm text-slate-300">
                        {mission.verificationProvider
                          ? `${mission.verificationProvider} verification`
                          : "Custom action flow"}
                      </p>
                    </div>
                    <StatusChip label={mission.status} tone={getQuestTone(mission.status)} />
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
                    <p className="text-sm font-semibold text-lime-200">+{mission.xp} XP payout</p>
                    <span className="font-display text-[11px] uppercase tracking-[0.22em] text-cyan-300">
                      Open mission
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Notice text="No active mission lanes yet." tone="default" />
          )}
        </Surface>

        <Surface
          eyebrow="World Browser"
          title="Hot worlds"
          description="The quickest route into the most active ecosystems on the grid."
        >
          <div className="space-y-4">
            {projectsPreview.length > 0 ? (
              projectsPreview.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="panel-card rounded-[26px] p-4 transition hover:border-cyan-300/24"
                >
                  <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                    <MiniArtwork
                      src={project.bannerUrl}
                      alt={project.name}
                      accent="cyan"
                      className="h-24 w-full"
                    />
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-black text-white">{project.name}</p>
                          <p className="mt-1 text-sm text-lime-200">{project.category ?? "World"}</p>
                        </div>
                        <StatusChip label={project.chain ?? "Live"} tone="info" />
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <Notice text="No worlds online yet." tone="default" />
            )}
          </div>
        </Surface>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Surface
          eyebrow="Live Raids"
          title="Squad pressure"
          description="High-urgency coordinated pushes happening right now."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {liveRaids.length > 0 ? (
              liveRaids.map((raid) => (
                <Link
                  key={raid.id}
                  href={`/raids/${raid.id}`}
                  className="panel-card rounded-[28px] p-4 transition hover:border-rose-300/24"
                >
                  <MiniArtwork src={raid.banner} alt={raid.title} accent="rose" className="mb-4 h-28" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-rose-200">{raid.community}</p>
                      <p className="mt-1 text-lg font-black text-white">{raid.title}</p>
                    </div>
                    <Swords className="h-4 w-4 shrink-0 text-rose-300" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MiniMetric label="Timer" value={raid.timer} />
                    <MiniMetric label="Reward" value={`+${raid.reward}`} />
                  </div>
                </Link>
              ))
            ) : (
              <Notice text="No live raids yet." tone="default" />
            )}
          </div>
        </Surface>

        <Surface
          eyebrow="Loot Vault"
          title="Unlock pressure"
          description="Claimable and high-desire rewards currently on your radar."
        >
          <div className="space-y-4">
            {rewardMoments.length > 0 ? (
              rewardMoments.map((reward) => (
                <Link
                  key={reward.id}
                  href={`/rewards/${reward.id}`}
                  className="panel-card rounded-[26px] p-4 transition hover:border-amber-300/24"
                >
                  <div className="grid gap-4 sm:grid-cols-[108px_minmax(0,1fr)]">
                    <MiniArtwork src={reward.imageUrl} alt={reward.title} accent="amber" className="h-24 w-full" />
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-black text-white">{reward.title}</p>
                          <p className="mt-1 text-sm text-amber-200">{reward.rarity}</p>
                        </div>
                        <StatusChip label={reward.claimable ? "Claimable" : "Locked"} tone={reward.claimable ? "positive" : "default"} />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <MiniMetric label="Cost" value={`${reward.cost} XP`} />
                        <MiniMetric label="Type" value={reward.rewardType} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <Notice text="No reward pressure yet." tone="default" />
            )}
          </div>
        </Surface>
      </section>

      <Surface
        eyebrow="Grid Read"
        title="Live board state"
        description="A clean systems readout from the same live surfaces as the mobile app."
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <FeatureStat label="Approved" value={String(approvedQuestCount)} />
          <FeatureStat label="Projects" value={String(projects.length)} />
          <FeatureStat label="Campaigns" value={String(campaigns.length)} />
          <FeatureStat label="Rewards ready" value={String(claimableRewardCount)} />
        </div>
      </Surface>
    </div>
  );
}

function HeroArtwork({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return null;
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        className="pointer-events-none absolute right-6 top-6 hidden h-[18rem] w-[min(35rem,44%)] rounded-[32px] object-cover opacity-78 shadow-[0_30px_90px_rgba(0,0,0,0.46)] xl:block"
      />
      <div className="pointer-events-none absolute right-4 top-4 hidden h-[19rem] w-[46%] rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.14),transparent_42%)] xl:block" />
    </>
  );
}

function MiniArtwork({
  src,
  alt,
  accent,
  className,
}: {
  src: string | null;
  alt: string;
  accent: "cyan" | "rose" | "amber";
  className?: string;
}) {
  const accentLayer =
    accent === "rose"
      ? "bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.24),transparent_42%)]"
      : accent === "amber"
        ? "bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.24),transparent_42%)]"
        : "bg-[radial-gradient(circle_at_top_left,rgba(0,204,255,0.24),transparent_42%)]";

  return (
    <div className={`relative overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/70 ${className ?? "h-24"}`}>
      {src ? <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover opacity-82" /> : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,12,0.04),rgba(3,7,12,0.82))]" />
      <div className={`absolute inset-0 ${accentLayer}`} />
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

function SignalPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
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

function Notice({
  text,
  tone,
  compact = false,
}: {
  text: string;
  tone: "default" | "error";
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] px-4 ${compact ? "py-4" : "py-6"} text-sm ${
        tone === "error"
          ? "border border-rose-400/20 bg-rose-500/10 text-rose-200"
          : "border border-white/8 bg-black/20 text-slate-300"
      }`}
    >
      {text}
    </div>
  );
}
