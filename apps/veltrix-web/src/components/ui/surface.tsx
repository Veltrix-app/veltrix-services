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
      className={`panel-card rounded-[30px] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/12 hover:shadow-[0_26px_60px_rgba(0,0,0,0.24)] sm:p-6 ${className}`}
    >
      {eyebrow ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">
          {eyebrow}
        </p>
      ) : null}
      <div className={eyebrow ? "mt-3" : ""}>
        <h3 className="text-xl font-black tracking-tight text-white sm:text-[1.35rem]">{title}</h3>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
