import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { getLootboxOpenAvailability } from "@/components/lootboxes/lootbox-card-state";

const LOOTBOX_SHARD_PILE_SRC = "/assets/lootboxes/shards-pile.webp";

const LOOTBOX_BACKGROUND_BY_TIER: Record<string, string> = {
  common: "/assets/lootboxes/common-background.webp",
  rare: "/assets/lootboxes/rare-background.webp",
  epic: "/assets/lootboxes/epic-background.webp",
  legendary: "/assets/lootboxes/legendary-background.webp",
  mythic: "/assets/lootboxes/mythic-background.webp",
};

const LOOTBOX_THEME_BY_TIER: Record<
  string,
  {
    border: string;
    kicker: string;
    chip: string;
    price: string;
    glow: string;
    aura: string;
    odds: string;
    button: string;
    hunt: string;
  }
> = {
  common: {
    border: "border-white/10 hover:border-slate-200/24",
    kicker: "text-slate-200/85",
    chip: "border-white/10 bg-white/[0.055] text-slate-200",
    price: "border-white/12 bg-white/[0.07] text-slate-100",
    glow: "bg-slate-100/18",
    aura: "bg-[radial-gradient(circle,rgba(226,232,240,0.18),transparent_62%)]",
    odds: "border-white/8 bg-white/[0.035]",
    button: "bg-slate-100 text-black hover:brightness-110",
    hunt: "border-white/12 bg-white/[0.045] text-slate-100 hover:border-white/20 hover:bg-white/[0.075]",
  },
  rare: {
    border: "border-sky-300/16 hover:border-sky-200/34",
    kicker: "text-sky-200",
    chip: "border-sky-300/18 bg-sky-300/[0.075] text-sky-100",
    price: "border-sky-300/18 bg-sky-300/[0.085] text-sky-100",
    glow: "bg-sky-400/24",
    aura: "bg-[radial-gradient(circle,rgba(56,189,248,0.22),transparent_62%)]",
    odds: "border-sky-300/10 bg-sky-300/[0.04]",
    button: "bg-sky-300 text-black hover:brightness-110",
    hunt: "border-sky-300/18 bg-sky-300/[0.06] text-sky-100 hover:border-sky-200/32 hover:bg-sky-300/[0.1]",
  },
  epic: {
    border: "border-violet-300/16 hover:border-violet-200/34",
    kicker: "text-violet-200",
    chip: "border-violet-300/18 bg-violet-300/[0.075] text-violet-100",
    price: "border-violet-300/18 bg-violet-300/[0.085] text-violet-100",
    glow: "bg-violet-400/24",
    aura: "bg-[radial-gradient(circle,rgba(168,85,247,0.24),transparent_62%)]",
    odds: "border-violet-300/10 bg-violet-300/[0.04]",
    button: "bg-violet-300 text-black hover:brightness-110",
    hunt: "border-violet-300/18 bg-violet-300/[0.06] text-violet-100 hover:border-violet-200/32 hover:bg-violet-300/[0.1]",
  },
  legendary: {
    border: "border-amber-300/18 hover:border-amber-200/38",
    kicker: "text-amber-200",
    chip: "border-amber-300/20 bg-amber-300/[0.08] text-amber-100",
    price: "border-amber-300/20 bg-amber-300/[0.09] text-amber-100",
    glow: "bg-amber-300/28",
    aura: "bg-[radial-gradient(circle,rgba(251,191,36,0.28),transparent_62%)]",
    odds: "border-amber-300/12 bg-amber-300/[0.045]",
    button: "bg-amber-300 text-black hover:brightness-110",
    hunt: "border-amber-300/20 bg-amber-300/[0.065] text-amber-100 hover:border-amber-200/34 hover:bg-amber-300/[0.11]",
  },
  mythic: {
    border: "border-rose-300/20 hover:border-rose-200/42",
    kicker: "text-rose-200",
    chip: "border-rose-300/22 bg-rose-300/[0.085] text-rose-100",
    price: "border-rose-300/22 bg-rose-300/[0.095] text-rose-100",
    glow: "bg-rose-400/28",
    aura: "bg-[radial-gradient(circle,rgba(244,63,94,0.3),transparent_62%)]",
    odds: "border-rose-300/12 bg-rose-300/[0.045]",
    button: "bg-rose-300 text-black hover:brightness-110",
    hunt: "border-rose-300/20 bg-rose-300/[0.065] text-rose-100 hover:border-rose-200/34 hover:bg-rose-300/[0.11]",
  },
};

export function LootboxCard({
  tier,
  busy,
  shardBalance,
  huntHref = "/quests",
  huntLabel = "Hunt featured quests",
  onOpen,
}: {
  tier: {
    id: string;
    label: string;
    priceShards: number;
    assetPath: string;
    odds: Record<string, number>;
    eligibility: { unlocked: boolean; reason: string | null };
  };
  busy: boolean;
  shardBalance: number;
  huntHref?: string;
  huntLabel?: string;
  onOpen: () => void;
}) {
  const topOdds = Object.entries(tier.odds)
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);
  const availability = getLootboxOpenAvailability({
    busy,
    priceShards: tier.priceShards,
    shardBalance,
    eligibility: tier.eligibility,
  });
  const backgroundSrc = LOOTBOX_BACKGROUND_BY_TIER[tier.id] ?? LOOTBOX_BACKGROUND_BY_TIER.common;
  const theme = LOOTBOX_THEME_BY_TIER[tier.id] ?? LOOTBOX_THEME_BY_TIER.common;
  const chamberLabel = `${tier.id} chamber`;
  const stateLabel = availability.canOpen
    ? "Open ready"
    : availability.shortfall > 0
      ? "Need shards"
      : "Locked";

  return (
    <article
      className={`motion-surface motion-3d-card motion-light-sweep group relative flex min-h-[31rem] flex-col overflow-hidden rounded-[26px] border ${theme.border} bg-[linear-gradient(180deg,rgba(15,18,24,0.98),rgba(6,8,12,0.99))] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.3)] transition duration-300`}
    >
      <Image
        src={backgroundSrc}
        alt=""
        fill
        unoptimized
        sizes="(min-width: 1280px) 20vw, (min-width: 768px) 40vw, 92vw"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.52] saturate-[1.12] transition duration-500 group-hover:scale-[1.04] group-hover:opacity-[0.62]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,12,0.76)_0%,rgba(5,7,12,0.38)_38%,rgba(5,7,12,0.76)_72%,rgba(5,7,12,0.97)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_29%),linear-gradient(90deg,rgba(5,7,12,0.56)_0%,transparent_44%,rgba(5,7,12,0.48)_100%)]" />
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[9px] font-black uppercase tracking-[0.22em] ${theme.kicker}`}>
            {chamberLabel}
          </p>
          <h3 className="mt-2 truncate text-[0.98rem] font-semibold text-white">{tier.label}</h3>
        </div>
        <LootboxShardCost value={tier.priceShards} className={theme.price} />
      </div>

      <div className="relative z-10 mt-3 flex items-center justify-between gap-2">
        <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${theme.chip}`}>
          {stateLabel}
        </span>
        <span className="rounded-full border border-white/8 bg-black/22 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-300">
          {topOdds[0]?.[0] ?? tier.id} peak
        </span>
      </div>

      <div className="relative z-10 mt-4 flex h-44 items-center justify-center">
        <div className={`absolute inset-x-5 bottom-4 h-12 rounded-full ${theme.glow} blur-2xl`} />
        <div className={`motion-rarity-aura ${theme.aura}`} />
        <Image
          src={tier.assetPath}
          alt={tier.label}
          width={240}
          height={240}
          className="motion-soft-float relative h-40 w-40 object-contain drop-shadow-[0_22px_42px_rgba(0,0,0,0.56)] transition duration-300 group-hover:scale-[1.05]"
          sizes="160px"
        />
      </div>

      <div className="relative z-10 mt-auto grid gap-1.5">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
          Drop window
        </p>
        {topOdds.map(([rarity, value]) => (
          <div
            key={rarity}
            className={`flex items-center justify-between rounded-full border px-2.5 py-1.5 ${theme.odds}`}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {rarity}
            </span>
            <span className="text-[10px] font-semibold text-slate-100">{value}%</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpen}
        disabled={!availability.canOpen}
        className={`motion-button-glow relative z-10 mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500 ${theme.button}`}
      >
        {availability.canOpen ? <Sparkles className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
        {availability.cta}
      </button>

      <p className="relative z-10 mt-2 min-h-8 text-center text-[10px] leading-4 text-slate-500">
        {availability.helperText}
      </p>

      {availability.shortfall > 0 ? (
        <Link
          href={huntHref}
          className={`relative z-10 mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2 text-[9px] font-black uppercase tracking-[0.13em] transition ${theme.hunt}`}
        >
          {huntLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </article>
  );
}

function LootboxShardCost({ value, className }: { value: number; className: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] shadow-[0_10px_24px_rgba(0,0,0,0.16)] ${className}`}>
      <Image
        src={LOOTBOX_SHARD_PILE_SRC}
        alt=""
        width={34}
        height={34}
        className="-my-1 h-8 w-8 object-contain drop-shadow-[0_0_14px_rgba(134,239,172,0.18)]"
        sizes="32px"
      />
      <span>{value}</span>
      <span className="text-emerald-100/60">shards</span>
    </span>
  );
}
