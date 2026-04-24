export function StatusChip({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "positive" | "warning" | "danger" | "info";
}) {
  const toneClass =
    tone === "positive"
      ? "bg-lime-300/14 text-lime-200"
      : tone === "warning"
      ? "bg-amber-400/14 text-amber-200"
      : tone === "danger"
      ? "bg-rose-400/14 text-rose-200"
      : tone === "info"
      ? "bg-cyan-300/14 text-cyan-200"
      : "bg-white/8 text-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${toneClass}`}
    >
      {label}
    </span>
  );
}
