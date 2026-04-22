"use client";

import { useState } from "react";

type DocsStateExplorerState = {
  label: string;
  summary: string;
  bullets: string[];
  note?: string;
};

export function DocsStateExplorer({
  eyebrow,
  title,
  description,
  states,
}: Readonly<{
  eyebrow: string;
  title: string;
  description?: string;
  states: DocsStateExplorerState[];
}>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeState = states[activeIndex];

  return (
    <section className="docs-card rounded-[28px] p-5">
      <p className="docs-kicker text-lime-300">{eyebrow}</p>
      <h3 className="mt-4 text-2xl font-black text-white">{title}</h3>
      {description ? <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {states.map((state, index) => (
          <button
            key={state.label}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              index === activeIndex
                ? "border-cyan-200/20 bg-cyan-200/10 text-white"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
            }`}
          >
            {state.label}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-[24px] border border-white/8 bg-black/20 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-lg font-black text-white">{activeState.label}</p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">{activeState.summary}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">
            Interactive state
          </span>
        </div>

        <ul className="mt-5 space-y-3">
          {activeState.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3 text-sm leading-7 text-slate-300">
              <span className="mt-2 h-2 w-2 rounded-full bg-lime-300" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        {activeState.note ? <p className="mt-5 text-sm leading-7 text-slate-400">{activeState.note}</p> : null}
      </div>
    </section>
  );
}
