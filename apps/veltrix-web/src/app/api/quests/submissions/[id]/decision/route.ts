import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";
import { applyUserXpAward } from "@/lib/xp/xp-award-server";
import {
  buildQuestSubmissionDecisionPlan,
  normalizeQuestSubmissionDecision,
} from "@/lib/xp/quest-submission-decision";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ServiceSupabase = ReturnType<typeof createSupabaseServiceClient>;

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value: unknown, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function normalizeQuestStatuses(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, status]) => key && typeof status === "string")
      .map(([key, status]) => [key, status as string])
  );
}

function collectSideEffectWarnings(
  results: PromiseSettledResult<{ error?: { message?: string } | null }>[]
) {
  return results.flatMap((result) => {
    if (result.status === "rejected") {
      return result.reason instanceof Error ? result.reason.message : String(result.reason);
    }

    if (result.value.error) {
      return result.value.error.message ?? "A background write failed.";
    }

    return [];
  });
}

async function canReviewQuest(params: {
  serviceSupabase: ServiceSupabase;
  reviewerAuthUserId: string;
  projectId: string | null;
}) {
  const { data: adminUser, error: adminError } = await params.serviceSupabase
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", params.reviewerAuthUserId)
    .eq("status", "active")
    .eq("role", "super_admin")
    .maybeSingle();

  if (adminError) {
    throw new Error(adminError.message);
  }

  if (adminUser?.id) {
    return true;
  }

  if (!params.projectId) {
    return false;
  }

  const { data: project, error: projectError } = await params.serviceSupabase
    .from("projects")
    .select("id, owner_user_id")
    .eq("id", params.projectId)
    .maybeSingle();

  if (projectError) {
    throw new Error(projectError.message);
  }

  if (project?.owner_user_id === params.reviewerAuthUserId) {
    return true;
  }

  const { data: teamMember, error: teamMemberError } = await params.serviceSupabase
    .from("team_members")
    .select("id")
    .eq("project_id", params.projectId)
    .eq("auth_user_id", params.reviewerAuthUserId)
    .eq("status", "active")
    .in("role", ["owner", "admin", "reviewer"])
    .limit(1)
    .maybeSingle();

  if (teamMemberError) {
    throw new Error(teamMemberError.message);
  }

  return Boolean(teamMember?.id);
}

async function upsertUserQuestProgress(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  questStatuses: Record<string, string>;
  timestamp: string;
}) {
  const { data: userProgress, error: progressReadError } = await params.serviceSupabase
    .from("user_progress")
    .select(
      "id, joined_communities, confirmed_raids, claimed_rewards, opened_lootbox_ids, unlocked_reward_ids"
    )
    .eq("auth_user_id", params.authUserId)
    .maybeSingle();

  if (progressReadError) {
    throw new Error(progressReadError.message);
  }

  const payload = {
    auth_user_id: params.authUserId,
    joined_communities: userProgress?.joined_communities ?? [],
    confirmed_raids: userProgress?.confirmed_raids ?? [],
    claimed_rewards: userProgress?.claimed_rewards ?? [],
    opened_lootbox_ids: userProgress?.opened_lootbox_ids ?? [],
    unlocked_reward_ids: userProgress?.unlocked_reward_ids ?? [],
    quest_statuses: params.questStatuses,
    updated_at: params.timestamp,
  };

  const { error: progressWriteError } = userProgress?.id
    ? await params.serviceSupabase.from("user_progress").update(payload).eq("id", userProgress.id)
    : await params.serviceSupabase.from("user_progress").upsert(payload, {
        onConflict: "auth_user_id",
      });

  if (progressWriteError) {
    throw new Error(progressWriteError.message);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  const { id: submissionId } = await context.params;
  if (!submissionId) {
    return NextResponse.json({ ok: false, error: "Missing submission id." }, { status: 400 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | {
          decision?: unknown;
          reviewNotes?: unknown;
        }
      | null;
    const decision = normalizeQuestSubmissionDecision(body?.decision);
    if (!decision) {
      return NextResponse.json(
        { ok: false, error: "Decision must be approved or rejected." },
        { status: 400 }
      );
    }

    const userSupabase = createSupabaseUserServerClient(accessToken);
    const serviceSupabase = createSupabaseServiceClient();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const { data: submission, error: submissionError } = await serviceSupabase
      .from("quest_submissions")
      .select("id, auth_user_id, quest_id, status, proof_text")
      .eq("id", submissionId)
      .maybeSingle();

    if (submissionError) {
      return NextResponse.json({ ok: false, error: submissionError.message }, { status: 500 });
    }

    if (!submission?.id || !submission.auth_user_id || !submission.quest_id) {
      return NextResponse.json({ ok: false, error: "Submission not found." }, { status: 404 });
    }

    const { data: quest, error: questError } = await serviceSupabase
      .from("quests")
      .select("id, title, project_id, campaign_id, xp, quest_type")
      .eq("id", String(submission.quest_id))
      .maybeSingle();

    if (questError) {
      return NextResponse.json({ ok: false, error: questError.message }, { status: 500 });
    }

    if (!quest?.id) {
      return NextResponse.json({ ok: false, error: "Quest not found." }, { status: 404 });
    }

    const allowed = await canReviewQuest({
      serviceSupabase,
      reviewerAuthUserId: user.id,
      projectId: safeString(quest.project_id) || null,
    });

    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "You do not have reviewer access for this quest." },
        { status: 403 }
      );
    }

    const { data: userProgress, error: userProgressError } = await serviceSupabase
      .from("user_progress")
      .select("quest_statuses")
      .eq("auth_user_id", submission.auth_user_id)
      .maybeSingle();

    if (userProgressError) {
      return NextResponse.json({ ok: false, error: userProgressError.message }, { status: 500 });
    }

    const decisionPlan = buildQuestSubmissionDecisionPlan({
      decision,
      submissionId: submission.id,
      reviewerAuthUserId: user.id,
      quest: {
        id: String(quest.id),
        title: safeString(quest.title) || "Quest",
        xp: safeNumber(quest.xp),
        projectId: safeString(quest.project_id) || null,
        campaignId: safeString(quest.campaign_id) || null,
        questType: safeString(quest.quest_type) || null,
      },
      existingQuestStatuses: normalizeQuestStatuses(userProgress?.quest_statuses),
      reviewNotes: safeString(body?.reviewNotes),
    });
    const timestamp = new Date().toISOString();
    const { error: updateSubmissionError } = await serviceSupabase
      .from("quest_submissions")
      .update({
        status: decisionPlan.decision,
        review_notes: safeString(body?.reviewNotes),
        reviewed_by_auth_user_id: user.id,
        reviewed_at: timestamp,
        updated_at: timestamp,
      })
      .eq("id", submission.id);

    if (updateSubmissionError) {
      return NextResponse.json({ ok: false, error: updateSubmissionError.message }, { status: 500 });
    }

    await upsertUserQuestProgress({
      serviceSupabase,
      authUserId: submission.auth_user_id,
      questStatuses: decisionPlan.nextQuestStatuses,
      timestamp,
    });

    const xpAward = decisionPlan.xpAward
      ? await applyUserXpAward({
          serviceSupabase,
          authUserId: submission.auth_user_id,
          sourceType: decisionPlan.xpAward.sourceType,
          sourceId: decisionPlan.xpAward.sourceId,
          baseXp: decisionPlan.xpAward.baseXp,
          projectId: decisionPlan.xpAward.projectId,
          campaignId: decisionPlan.xpAward.campaignId,
          metadata: decisionPlan.xpAward.metadata,
        })
      : null;

    const sideEffectResults = await Promise.allSettled([
      serviceSupabase.from("admin_audit_logs").insert({
        auth_user_id: user.id,
        project_id: decisionPlan.xpAward?.projectId ?? (safeString(quest.project_id) || null),
        source_table: "quest_submissions",
        source_id: submission.id,
        action: decisionPlan.audit.action,
        summary: decisionPlan.audit.summary,
        metadata: {
          ...decisionPlan.audit.metadata,
          previousStatus: submission.status ?? null,
          nextStatus: decisionPlan.decision,
          xpAwarded: xpAward?.ok ? xpAward.xpAwarded : 0,
        },
      }),
      serviceSupabase.from("app_notifications").insert({
        auth_user_id: submission.auth_user_id,
        title: decisionPlan.notification.title,
        body: decisionPlan.notification.body,
        type: "quest",
        read: false,
        source_table: "quest_submissions",
        source_id: submission.id,
        metadata: {
          ...decisionPlan.notification.metadata,
          status: decisionPlan.decision,
          xpAwarded: xpAward?.ok ? xpAward.xpAwarded : 0,
        },
      }),
    ]);
    const warnings = collectSideEffectWarnings(sideEffectResults);

    return NextResponse.json({
      ok: true,
      submissionId: submission.id,
      questId: quest.id,
      status: decisionPlan.decision,
      shouldAwardXp: decisionPlan.shouldAwardXp,
      xpAward,
      warnings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Quest submission decision failed.",
      },
      { status: 500 }
    );
  }
}
