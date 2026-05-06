import Image from "next/image";
import { LockKeyhole, Sparkles } from "lucide-react";

const LOOTBOX_SHARD_PILE_SRC = "/assets/lootboxes/shards-pile.webp";

export function LootboxCard({
  tier,
  busy,
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
  onOpen: () => void;
}) {
  const topOdds = Object.entries(tier.odds)
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);

  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,18,24,0.98),rgba(6,8,12,0.99))] p-4 shadow-[0_18px_54px_rgba(0,0,0,0.24)] transition duration-300 hover:border-emerald-300/18">
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/20 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-200/85">
            Lootbox
          </p>
          <h3 className="mt-2 truncate text-[0.98rem] font-semibold text-white">{tier.label}</h3>
        </div>
        <LootboxShardCost value={tier.priceShards} />
      </div>

      <div className="relative mt-4 flex h-40 items-center justify-center">
        <div className="absolute inset-x-6 bottom-3 h-10 rounded-full bg-black/45 blur-xl" />
        <Image
          src={tier.assetPath}
          alt={tier.label}
          width={240}
          height={240}
          className="relative h-36 w-36 object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.5)] transition duration-300 group-hover:scale-[1.04]"
          sizes="144px"
        />
      </div>

      <div className="grid gap-1.5">
        {topOdds.map(([rarity, value]) => (
          <div
            key={rarity}
            className="flex items-center justify-between rounded-full border border-white/6 bg-white/[0.025] px-2.5 py-1.5"
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
        disabled={busy || !tier.eligibility.unlocked}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-300 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
      >
        {tier.eligibility.unlocked ? <Sparkles className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
        {busy ? "Opening..." : tier.eligibility.unlocked ? "Open box" : "Locked"}
      </button>

      {!tier.eligibility.unlocked ? (
        <p className="mt-2 min-h-8 text-center text-[10px] leading-4 text-slate-500">
          {tier.eligibility.reason}
        </p>
      ) : (
        <p className="mt-2 min-h-8 text-center text-[10px] leading-4 text-slate-500">
          Ready to open.
        </p>
      )}
    </article>
  );
}

function LootboxShardCost({ value }: { value: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/[0.075] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
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
