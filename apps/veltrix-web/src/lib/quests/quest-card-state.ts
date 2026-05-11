export function getQuestCardStatus(status: string) {
  if (status === "approved") {
    return {
      label: "Complete",
      tone: "positive" as const,
    };
  }

  if (status === "pending") {
    return {
      label: "pending",
      tone: "warning" as const,
    };
  }

  if (status === "rejected") {
    return {
      label: "rejected",
      tone: "danger" as const,
    };
  }

  return {
    label: "active",
    tone: "info" as const,
  };
}

export function getQuestCardToneClass(status: string) {
  return status === "approved"
    ? "border-emerald-300/24 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.18),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(186,255,59,0.12),transparent_26%),linear-gradient(180deg,rgba(11,20,17,0.99),rgba(6,11,10,0.99))] shadow-[0_0_0_1px_rgba(52,211,153,0.08),0_18px_54px_rgba(16,185,129,0.16)] hover:border-emerald-200/35"
    : "border-white/8 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.08),transparent_28%),linear-gradient(180deg,rgba(15,18,23,0.98),rgba(6,8,12,0.99))] hover:border-cyan-300/18";
}

export function getQuestCardCtaLabel(status: string) {
  return status === "approved" ? "Completed" : "Open mission";
}
