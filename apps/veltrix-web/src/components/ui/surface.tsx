export function Surface({
  title,
  eyebrow,
  description,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,22,34,0.94),rgba(9,13,22,0.96))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.22)] transition duration-200 hover:border-white/12 hover:shadow-[0_32px_90px_rgba(0,0,0,0.26)] sm:p-6 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent_32%)]" />
      {eyebrow ? (
        <p className="relative z-10 text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">
          {eyebrow}
        </p>
      ) : null}
      <div className={`relative z-10 ${eyebrow ? "mt-3" : ""}`}>
        <h3 className="text-xl font-black tracking-[-0.03em] text-white sm:text-[1.38rem]">{title}</h3>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">{description}</p>
        ) : null}
      </div>
      <div className="relative z-10 mt-5">{children}</div>
    </section>
  );
}
