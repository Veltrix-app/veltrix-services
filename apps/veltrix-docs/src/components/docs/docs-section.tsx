export function DocsSection({
  eyebrow,
  title,
  description,
  children,
  aside,
}: Readonly<{
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}>) {
  return (
    <section className="docs-card rounded-[30px] p-6 sm:p-7">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] xl:items-start">
        <div className="min-w-0">
          <p className="docs-kicker text-lime-300">{eyebrow}</p>
          <h2 className="mt-4 max-w-3xl text-2xl font-black text-white sm:text-[2rem]">{title}</h2>
          {description ? <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{description}</p> : null}
        </div>
        {aside ? <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">{aside}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}
