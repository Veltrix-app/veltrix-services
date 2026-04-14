import { Surface } from "@/components/ui/surface";

export function PlaceholderScreen({
  eyebrow,
  title,
  description,
  bullets,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <Surface eyebrow={eyebrow} title={title} description={description}>
      <div className="grid gap-3">
        {bullets.map((bullet) => (
          <div
            key={bullet}
            className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-6 text-slate-300"
          >
            {bullet}
          </div>
        ))}
      </div>
    </Surface>
  );
}
