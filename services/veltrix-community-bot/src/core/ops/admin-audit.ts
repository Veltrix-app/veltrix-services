import { supabaseAdmin } from "../../lib/supabase.js";

type AdminAuditInput = {
  authUserId?: string | null;
  projectId?: string | null;
  sourceTable: string;
  sourceId: string;
  action: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function writeAdminAuditLog(input: AdminAuditInput) {
  const { error } = await supabaseAdmin.from("admin_audit_logs").insert({
    auth_user_id: input.authUserId ?? null,
    project_id: input.projectId ?? null,
    source_table: input.sourceTable,
    source_id: input.sourceId,
    action: input.action,
    summary: input.summary,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("[admin-audit] insert failed", error.message, {
      action: input.action,
      sourceTable: input.sourceTable,
      sourceId: input.sourceId,
    });
  }
}
