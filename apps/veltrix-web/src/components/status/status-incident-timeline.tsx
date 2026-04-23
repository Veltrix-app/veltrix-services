import type { PublicIncidentSummary } from "@/lib/status/public-status";

function formatDate(value?: string) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function tone(status: PublicIncidentSummary["state"]) {
  switch (status) {
    case "resolved":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    case "identified":
      return "border-amber-400/20 bg-amber-500/10 text-amber-300";
    case "monitoring":
      return "border-cyan-400/20 bg-cyan-500/10 text-cyan-200";
    default:
      return "border-white/12 bg-white/[0.06] text-white";
  }
}

export function StatusIncidentTimeline({
  title,
  description,
  incidents,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  incidents: PublicIncidentSummary[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(11,15,22,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
      <div className="max-w-3xl">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">{title}</p>
        <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      </div>

      {incidents.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-5">
          <p className="text-lg font-black text-white">{emptyTitle}</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{emptyDescription}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {incidents.map((incident) => (
            <article key={incident.id} className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {incident.incidentRef} • {incident.componentLabel}
                  </p>
                  <h3 className="mt-2 text-xl font-black text-white">{incident.title}</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{incident.publicSummary}</p>
                </div>

                <div className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${tone(incident.state)}`}>
                  {incident.state.replaceAll("_", " ")}
                </div>
              </div>

              {incident.latestUpdate ? (
                <div className="mt-5 rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white">
                      {incident.latestUpdate.title ?? "Latest public update"}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(incident.latestUpdate.createdAt)}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{incident.latestUpdate.message}</p>
                </div>
              ) : null}

              {incident.updates.length > 1 ? (
                <div className="mt-5 space-y-3">
                  {incident.updates.slice(1, 4).map((update) => (
                    <div key={update.id} className="rounded-[20px] border border-white/8 bg-black/10 px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-bold text-white">
                          {update.title ?? "Status update"}
                        </p>
                        <p className="text-xs text-slate-400">{formatDate(update.createdAt)}</p>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-300">{update.message}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
