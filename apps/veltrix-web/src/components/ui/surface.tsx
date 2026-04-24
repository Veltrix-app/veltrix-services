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
      className={`group relative overflow-hidden rounded-[30px] border border-white/6 bg-[linear-gradient(180deg,rgba(11,14,20,0.98),rgba(7,9,14,0.98))] p-5 shadow-[0_24px_72px_rgba(0,0,0,0.28)] transition duration-200 hover:border-white/10 hover:shadow-[0_28px_84px_rgba(0,0,0,0.32)] sm:p-6 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.045),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.025),transparent_34%)]" />
      {eyebrow ? (
        <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.28em] text-lime-300/90">
          {eyebrow}
        </p>
      ) : null}
      <div className={`relative z-10 ${eyebrow ? "mt-3" : ""}`}>
        <h3 className="text-[1.08rem] font-black tracking-[-0.03em] text-white sm:text-[1.32rem]">{title}</h3>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
        ) : null}
      </div>
      <div className="relative z-10 mt-5">{children}</div>
    </section>
  );
}
