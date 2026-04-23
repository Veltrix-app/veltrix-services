import { createSupabaseServiceClient } from "@/lib/supabase/server";

export type PublicServiceStatusLevel =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance";

export type PublicServiceComponentStatus = {
  componentKey: string;
  componentLabel: string;
  status: PublicServiceStatusLevel;
  summary: string;
  publicMessage: string;
  updatedAt: string;
  incidentRef?: string;
};

export type PublicIncidentUpdate = {
  id: string;
  title?: string;
  message: string;
  visibilityScope: "public" | "both";
  createdAt: string;
  incidentState?: "investigating" | "identified" | "monitoring" | "resolved";
};

export type PublicIncidentSummary = {
  id: string;
  incidentRef: string;
  title: string;
  componentKey: string;
  componentLabel: string;
  severity: "minor" | "major" | "critical";
  impactScope: "degraded" | "partial_outage" | "major_outage" | "maintenance";
  state: "investigating" | "identified" | "monitoring" | "resolved";
  publicSummary: string;
  openedAt: string;
  resolvedAt?: string;
  latestUpdate?: PublicIncidentUpdate;
  updates: PublicIncidentUpdate[];
};

export type PublicStatusOverview = {
  overallStatus: PublicServiceStatusLevel;
  generatedAt: string;
  components: PublicServiceComponentStatus[];
  activeIncidents: PublicIncidentSummary[];
  resolvedIncidents: PublicIncidentSummary[];
};

const defaultComponents = [
  { componentKey: "platform", componentLabel: "Platform" },
  { componentKey: "auth", componentLabel: "Authentication" },
  { componentKey: "portal", componentLabel: "Admin portal" },
  { componentKey: "member_app", componentLabel: "Member app" },
  { componentKey: "billing", componentLabel: "Billing" },
  { componentKey: "community", componentLabel: "Community delivery" },
  { componentKey: "verification", componentLabel: "Verification" },
  { componentKey: "trust", componentLabel: "Trust operations" },
  { componentKey: "payouts", componentLabel: "Payouts" },
  { componentKey: "onchain", componentLabel: "On-chain" },
] as const;

function asStatusLevel(value: string | null | undefined): PublicServiceStatusLevel {
  switch (value) {
    case "degraded":
    case "partial_outage":
    case "major_outage":
    case "maintenance":
      return value;
    default:
      return "operational";
  }
}

function statusRank(value: PublicServiceStatusLevel) {
  switch (value) {
    case "major_outage":
      return 5;
    case "partial_outage":
      return 4;
    case "degraded":
      return 3;
    case "maintenance":
      return 2;
    default:
      return 1;
  }
}

export async function loadPublicStatusOverview(): Promise<PublicStatusOverview> {
  const supabase = createSupabaseServiceClient();
  const [{ data: snapshots, error: snapshotError }, { data: incidents, error: incidentError }] =
    await Promise.all([
      supabase
        .from("service_status_snapshots")
        .select(
          "id, component_key, component_label, status, summary, public_message, service_incident_id, is_public, created_at, updated_at"
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("service_incidents")
        .select(
          "id, incident_ref, title, component_key, severity, impact_scope, state, public_summary, public_visible, opened_at, resolved_at, updated_at"
        )
        .eq("public_visible", true)
        .order("opened_at", { ascending: false })
        .limit(50),
    ]);

  if (snapshotError) {
    throw new Error(snapshotError.message);
  }

  if (incidentError) {
    throw new Error(incidentError.message);
  }

  const incidentRows = (incidents ?? []) as Array<{
    id: string;
    incident_ref: string;
    title: string;
    component_key: string;
    severity: "minor" | "major" | "critical";
    impact_scope: "degraded" | "partial_outage" | "major_outage" | "maintenance";
    state: "investigating" | "identified" | "monitoring" | "resolved";
    public_summary: string;
    opened_at: string;
    resolved_at: string | null;
  }>;

  const incidentIds = incidentRows.map((incident) => incident.id);

  const { data: incidentUpdates, error: incidentUpdatesError } =
    incidentIds.length > 0
      ? await supabase
          .from("service_incident_updates")
          .select(
            "id, service_incident_id, visibility_scope, title, message, incident_state, created_at"
          )
          .in("service_incident_id", incidentIds)
          .in("visibility_scope", ["public", "both"])
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  if (incidentUpdatesError) {
    throw new Error(incidentUpdatesError.message);
  }

  const updatesByIncidentId = new Map<string, PublicIncidentUpdate[]>();
  for (const row of (incidentUpdates ?? []) as Array<{
    id: string;
    service_incident_id: string;
    visibility_scope: "public" | "both";
    title: string | null;
    message: string;
    incident_state: "investigating" | "identified" | "monitoring" | "resolved" | null;
    created_at: string;
  }>) {
    const current = updatesByIncidentId.get(row.service_incident_id) ?? [];
    current.push({
      id: row.id,
      title: row.title ?? undefined,
      message: row.message,
      visibilityScope: row.visibility_scope,
      createdAt: row.created_at,
      incidentState: row.incident_state ?? undefined,
    });
    updatesByIncidentId.set(row.service_incident_id, current);
  }

  const componentSnapshotMap = new Map<string, PublicServiceComponentStatus>();
  for (const row of (snapshots ?? []) as Array<{
    component_key: string;
    component_label: string;
    status: string;
    summary: string;
    public_message: string;
    service_incident_id: string | null;
    created_at: string;
    updated_at: string;
  }>) {
    if (componentSnapshotMap.has(row.component_key)) {
      continue;
    }

    componentSnapshotMap.set(row.component_key, {
      componentKey: row.component_key,
      componentLabel: row.component_label,
      status: asStatusLevel(row.status),
      summary: row.summary,
      publicMessage: row.public_message,
      updatedAt: row.updated_at ?? row.created_at,
      incidentRef:
        incidentRows.find((incident) => incident.id === row.service_incident_id)?.incident_ref ?? undefined,
    });
  }

  const components = defaultComponents.map((component) => {
    const snapshot =
      componentSnapshotMap.get(component.componentKey) ??
      ({
        componentKey: component.componentKey,
        componentLabel: component.componentLabel,
        status: "operational",
        summary: `${component.componentLabel} is operating normally.`,
        publicMessage: `${component.componentLabel} is operating normally.`,
        updatedAt: new Date().toISOString(),
      } satisfies PublicServiceComponentStatus);

    return snapshot;
  });

  const allIncidents = incidentRows.map((incident) => {
    const updates = updatesByIncidentId.get(incident.id) ?? [];
    const latestUpdate = updates[0];
    const componentLabel =
      components.find((component) => component.componentKey === incident.component_key)?.componentLabel ??
      incident.component_key;

    return {
      id: incident.id,
      incidentRef: incident.incident_ref,
      title: incident.title,
      componentKey: incident.component_key,
      componentLabel,
      severity: incident.severity,
      impactScope: incident.impact_scope,
      state: incident.state,
      publicSummary: incident.public_summary,
      openedAt: incident.opened_at,
      resolvedAt: incident.resolved_at ?? undefined,
      latestUpdate,
      updates,
    } satisfies PublicIncidentSummary;
  });

  const activeIncidents = allIncidents.filter((incident) => incident.state !== "resolved");
  const resolvedIncidents = allIncidents.filter((incident) => incident.state === "resolved").slice(0, 8);

  const overallStatus = [...components.map((component) => component.status), ...activeIncidents.map((incident) => asStatusLevel(incident.impactScope))].reduce<PublicServiceStatusLevel>(
    (current, candidate) => (statusRank(candidate) > statusRank(current) ? candidate : current),
    "operational"
  );

  return {
    overallStatus,
    generatedAt: new Date().toISOString(),
    components,
    activeIncidents,
    resolvedIncidents,
  };
}
