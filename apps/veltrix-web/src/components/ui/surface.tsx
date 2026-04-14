export function Surface({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
      {eyebrow ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">
          {eyebrow}
        </p>
      ) : null}
      <div className={eyebrow ? "mt-3" : ""}>
        <h3 className="text-xl font-black tracking-tight text-white">{title}</h3>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
