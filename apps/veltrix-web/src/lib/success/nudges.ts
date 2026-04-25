import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { SuccessAccountSummary } from "@/lib/success/account-activation";
import type { SuccessMemberState } from "@/lib/success/member-activation";

export async function upsertSuccessNudge(input: {
  dedupeKey: string;
  targetType: "account" | "project" | "member";
  customerAccountId?: string | null;
  projectId?: string | null;
  authUserId?: string | null;
  channel: "in_product" | "email";
  reasonKey: string;
  status: "pending" | "shown" | "sent" | "dismissed" | "completed";
  title: string;
  body: string;
  route?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from("activation_nudges").upsert(
    {
      dedupe_key: input.dedupeKey,
      target_type: input.targetType,
      customer_account_id: input.customerAccountId ?? null,
      project_id: input.projectId ?? null,
      auth_user_id: input.authUserId ?? null,
      channel: input.channel,
      reason_key: input.reasonKey,
      status: input.status,
      title: input.title,
      body: input.body,
      route: input.route ?? null,
      metadata: input.metadata ?? {},
      updated_at: now,
    },
    { onConflict: "dedupe_key" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function recordMemberReactivationEvent(input: {
  authUserId: string;
  reasonKey: string;
  eventType: "prompt_shown" | "email_sent" | "member_returned" | "dismissed" | "completed";
  eventPayload?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServiceClient();
  const recentThreshold = new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString();
  const { data: existing, error: existingError } = await supabase
    .from("member_reactivation_events")
    .select("id")
    .eq("auth_user_id", input.authUserId)
    .eq("reason_key", input.reasonKey)
    .eq("event_type", input.eventType)
    .gte("created_at", recentThreshold)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    return;
  }

  const { error } = await supabase.from("member_reactivation_events").insert({
    auth_user_id: input.authUserId,
    event_type: input.eventType,
    reason_key: input.reasonKey,
    event_payload: input.eventPayload ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function emitAccountActivationNudges(summary: SuccessAccountSummary | null) {
  if (!summary || !summary.blockers.length || !summary.nextBestActionKey) {
    return;
  }

  await upsertSuccessNudge({
    dedupeKey: `account:${summary.customerAccountId}:${summary.nextBestActionKey}:in_product`,
    targetType: "account",
    customerAccountId: summary.customerAccountId,
    channel: "in_product",
    reasonKey: summary.nextBestActionKey,
    status: "shown",
    title: summary.nextBestActionLabel ?? "Continue workspace activation",
    body: summary.blockers[0],
    route: summary.nextBestActionRoute ?? null,
    metadata: {
      workspaceHealthState: summary.workspaceHealthState,
      successHealthState: summary.successHealthState,
    },
  });
}

export async function emitMemberActivationNudges(state: SuccessMemberState) {
  if (state.activationLane === "onboarding" && state.blockers.length) {
    await upsertSuccessNudge({
      dedupeKey: `member:${state.authUserId}:${state.nextBestActionKey}:in_product`,
      targetType: "member",
      authUserId: state.authUserId,
      channel: "in_product",
      reasonKey: state.nextBestActionKey ?? "member_activation",
      status: "shown",
      title: state.nextBestActionLabel ?? "Finish setup",
      body: state.blockers[0],
      route: state.nextBestActionRoute ?? "/community/onboarding",
      metadata: {
        activationLane: state.activationLane,
        memberHealthState: state.memberHealthState,
      },
    });
  }

  if (state.activationLane === "comeback") {
    await upsertSuccessNudge({
      dedupeKey: `member:${state.authUserId}:comeback:in_product`,
      targetType: "member",
      authUserId: state.authUserId,
      channel: "in_product",
      reasonKey: "member_comeback",
      status: "shown",
      title: state.nextBestActionLabel ?? "Resume momentum",
      body: state.blockers[0] ?? "Open the comeback lane to get back into motion.",
      route: state.nextBestActionRoute ?? "/community/comeback",
      metadata: {
        activationLane: state.activationLane,
        memberHealthState: state.memberHealthState,
      },
    });

    await recordMemberReactivationEvent({
      authUserId: state.authUserId,
      reasonKey: "member_comeback",
      eventType: "prompt_shown",
      eventPayload: {
        route: state.nextBestActionRoute ?? "/community/comeback",
      },
    });
  }

  if (state.memberHealthState === "reactivation_needed") {
    await upsertSuccessNudge({
      dedupeKey: `member:${state.authUserId}:comeback:email`,
      targetType: "member",
      authUserId: state.authUserId,
      channel: "email",
      reasonKey: "member_comeback_email",
      status: "pending",
      title: "Come back to your live missions",
      body: "VYNTRO should nudge this member back into the comeback lane with a bounded email prompt.",
      route: state.nextBestActionRoute ?? "/community/comeback",
      metadata: {
        memberHealthState: state.memberHealthState,
      },
    });
  }
}
