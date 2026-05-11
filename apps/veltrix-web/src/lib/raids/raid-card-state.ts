export function getRaidCardStatus(params: { completed?: boolean; progress: number }) {
  if (params.completed) {
    return {
      label: "Done",
      tone: "positive" as const,
    };
  }

  return {
    label: params.progress >= 50 ? "Hot" : "Live",
    tone: params.progress >= 50 ? ("warning" as const) : ("default" as const),
  };
}

export function getRaidCardToneClass(completed?: boolean) {
  return completed
    ? "border-emerald-300/24 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.18),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(186,255,59,0.12),transparent_26%),linear-gradient(180deg,rgba(11,20,17,0.99),rgba(6,11,10,0.99))] shadow-[0_0_0_1px_rgba(52,211,153,0.08),0_18px_54px_rgba(16,185,129,0.16)] hover:border-emerald-200/35"
    : "border-white/6 bg-[linear-gradient(180deg,rgba(15,17,20,0.98),rgba(7,9,12,0.98))] hover:border-rose-300/16 hover:bg-[linear-gradient(180deg,rgba(21,17,19,0.98),rgba(8,10,13,0.98))]";
}

export function getRaidCardCtaLabel(completed?: boolean) {
  return completed ? "Completed" : "Open raid";
}
