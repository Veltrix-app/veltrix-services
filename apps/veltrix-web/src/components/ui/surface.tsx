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
      className={`group relative overflow-hidden rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(12,14,18,0.985),rgba(7,9,12,0.985))] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.24)] transition duration-200 hover:border-white/10 sm:p-3.5 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.018),transparent_34%)]" />
      {eyebrow ? (
        <p className="relative z-10 text-[8px] font-bold uppercase tracking-[0.22em] text-lime-300/85">
          {eyebrow}
        </p>
      ) : null}
      <div className={`relative z-10 ${eyebrow ? "mt-3" : ""}`}>
        <h3 className="text-[0.88rem] font-semibold tracking-[-0.02em] text-white sm:text-[0.96rem]">
          {title}
        </h3>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-slate-400 sm:text-[12px]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="relative z-10 mt-3">{children}</div>
    </section>
  );
}
