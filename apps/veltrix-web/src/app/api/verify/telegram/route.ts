import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityBotWebhookSecret = process.env.COMMUNITY_BOT_WEBHOOK_SECRET;

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isPlaceholderUrl(value: string) {
  return value.includes("...");
}

function getSupabaseClient(accessToken: string) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getServiceSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for Telegram verification.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getCommunityBotVerifyUrl() {
  if (!communityBotUrl) {
    throw new Error("COMMUNITY_BOT_URL is missing for Telegram verification.");
  }

  return `${communityBotUrl.replace(/\/+$/, "")}/webhooks/telegram/verify`;
}

async function runTelegramMembershipCheck(params: {
  authUserId: string;
  questId: string;
}) {
  const response = await fetch(getCommunityBotVerifyUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(communityBotWebhookSecret
        ? { "x-community-bot-secret": communityBotWebhookSecret }
        : {}),
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Telegram community bot verification failed.";

    throw new Error(errorMessage);
  }

  return payload as
    | {
        ok: true;
        status: "approved" | "pending";
        message?: string;
        chatId?: string;
        telegramUserId?: string;
      }
    | null;
}

type QuestRow = {
  id: string;
  title: string;
  project_id: string | null;
  action_url: string | null;
  quest_type: string | null;
  verification_type: string | null;
  verification_provider: string | null;
  completion_mode: string | null;
  verification_config: Record<string, unknown> | null;
};

type ProjectRow = {
  id: string;
  name: string | null;
  slug: string | null;
};

function resolveTelegramQuestConfig(quest: QuestRow) {
  const verificationConfig =
    quest.verification_config && typeof quest.verification_config === "object"
      ? quest.verification_config
      : {};

  const inferredProvider =
    quest.verification_provider && quest.verification_provider !== "custom"
      ? quest.verification_provider
      : quest.quest_type === "telegram_join" ||
          (quest.verification_type === "bot_check" &&
            typeof verificationConfig.groupUrl === "string")
        ? "telegram"
        : null;

  const configuredGroupUrl =
    typeof verificationConfig.groupUrl === "string" && verificationConfig.groupUrl.trim()
      ? verificationConfig.groupUrl.trim()
      : "";
  const actionUrl = typeof quest.action_url === "string" ? quest.action_url.trim() : "";
  const groupUrl =
    configuredGroupUrl && !isPlaceholderUrl(configuredGroupUrl)
      ? configuredGroupUrl
      : actionUrl;

  const completionMode =
    quest.quest_type === "telegram_join" && quest.verification_type === "bot_check"
      ? "integration_auto"
      : quest.completion_mode ?? "manual";

  return {
    verificationConfig,
    verificationProvider: inferredProvider,
    completionMode,
    groupUrl,
  };
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const questId = typeof body?.questId === "string" ? body.questId : "";

  if (!questId) {
    return NextResponse.json({ ok: false, error: "Missing questId." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient(accessToken);
    const serviceSupabase = getServiceSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const { data: quest, error: questError } = await supabase
      .from("quests")
      .select(
        "id, title, project_id, action_url, quest_type, verification_type, verification_provider, completion_mode, verification_config"
      )
      .eq("id", questId)
      .single();

    if (questError || !quest) {
      return NextResponse.json({ ok: false, error: "Quest not found." }, { status: 404 });
    }

    const resolvedQuest = resolveTelegramQuestConfig(quest as QuestRow);

    if (
      (quest.quest_type ?? "custom") !== "telegram_join" ||
      resolvedQuest.verificationProvider !== "telegram" ||
      resolvedQuest.completionMode !== "integration_auto"
    ) {
      return NextResponse.json(
        { ok: false, error: "Quest is not configured for Telegram auto verification." },
        { status: 400 }
      );
    }

    if (!resolvedQuest.groupUrl || !isValidUrl(resolvedQuest.groupUrl)) {
      return NextResponse.json(
        { ok: false, error: "Telegram group URL is missing or invalid." },
        { status: 400 }
      );
    }

    const [{ data: connectedAccount }, { data: projectIntegration }, { data: project }] = await Promise.all([
      serviceSupabase
        .from("user_connected_accounts")
        .select("id, provider, status, username")
        .eq("auth_user_id", user.id)
        .eq("provider", "telegram")
        .eq("status", "connected")
        .maybeSingle(),
      serviceSupabase
        .from("project_integrations")
        .select("id, provider, status, config")
        .eq("project_id", quest.project_id)
        .eq("provider", "telegram")
        .maybeSingle(),
      quest.project_id
        ? serviceSupabase
            .from("projects")
            .select("id, name, slug")
            .eq("id", quest.project_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (!connectedAccount) {
      return NextResponse.json(
        {
          ok: false,
          status: "needs_account_link",
          error: "Link a Telegram account before Veltrix can verify this quest automatically.",
        },
        { status: 400 }
      );
    }

    if (!projectIntegration || projectIntegration.status !== "connected") {
      const projectLabel =
        (project as ProjectRow | null)?.name ||
        (project as ProjectRow | null)?.slug ||
        "this quest's project";

      return NextResponse.json(
        {
          ok: false,
          status: "needs_project_integration",
          error:
            `Telegram membership checks are not connected for ${projectLabel}. Open that exact project in the portal and save the Telegram chat ID there.`,
        },
        { status: 400 }
      );
    }

    const botVerification = await runTelegramMembershipCheck({
      authUserId: user.id,
      questId: quest.id,
    });

    if (botVerification?.status === "approved") {
      return NextResponse.json({
        ok: true,
        status: "approved",
        questId: quest.id,
        targetUrl: resolvedQuest.groupUrl,
        message:
          "Telegram membership confirmed immediately. This mission has been auto-approved.",
      });
    }

    const eventType =
      typeof resolvedQuest.verificationConfig.eventType === "string" &&
      resolvedQuest.verificationConfig.eventType.trim()
        ? resolvedQuest.verificationConfig.eventType.trim()
        : "telegram_membership_confirmed";

    const now = new Date().toISOString();

    const { error: eventError } = await serviceSupabase.from("verification_events").insert({
      auth_user_id: user.id,
      project_id: quest.project_id ?? null,
      quest_id: quest.id,
      provider: "telegram",
      event_type: "telegram_membership_requested",
      external_ref: resolvedQuest.groupUrl,
      metadata: {
        groupUrl: resolvedQuest.groupUrl,
        accountUsername: connectedAccount.username ?? null,
        expectedEventType: eventType,
        source: "web_app",
      },
    });

    if (eventError) {
      return NextResponse.json(
        { ok: false, error: eventError.message || "Failed to create Telegram verification event." },
        { status: 500 }
      );
    }

    const { error: verificationRunError } = await serviceSupabase
      .from("quest_verification_runs")
      .insert({
        auth_user_id: user.id,
        project_id: quest.project_id ?? null,
        quest_id: quest.id,
        provider: "telegram",
        result: "pending",
        reason: "Telegram membership verification requested and waiting for integration confirmation.",
        metadata: {
          groupUrl: resolvedQuest.groupUrl,
          projectIntegrationId: projectIntegration.id,
          accountUsername: connectedAccount.username ?? null,
        },
      });

    if (verificationRunError) {
      return NextResponse.json(
        { ok: false, error: verificationRunError.message || "Failed to create verification run." },
        { status: 500 }
      );
    }

    const { data: existingSubmission } = await serviceSupabase
      .from("quest_submissions")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("quest_id", quest.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingSubmission?.id) {
      await serviceSupabase.from("quest_submissions").insert({
        auth_user_id: user.id,
        quest_id: quest.id,
        status: "pending",
        proof_text: "telegram_membership_requested",
      });
    }

    const { data: userProgress } = await serviceSupabase
      .from("user_progress")
      .select("id, quest_statuses")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (userProgress?.id) {
      const nextQuestStatuses =
        userProgress.quest_statuses && typeof userProgress.quest_statuses === "object"
          ? { ...(userProgress.quest_statuses as Record<string, string>), [quest.id]: "pending" }
          : { [quest.id]: "pending" };

      await serviceSupabase
        .from("user_progress")
        .update({
          quest_statuses: nextQuestStatuses,
          updated_at: now,
        })
        .eq("id", userProgress.id);
    }

    await serviceSupabase.from("app_notifications").insert({
      auth_user_id: user.id,
      title: "Telegram verification started",
      body: `${quest.title} is now waiting for Telegram membership confirmation.`,
      type: "quest",
      read: false,
      metadata: {
        questId: quest.id,
        provider: "telegram",
        groupUrl: resolvedQuest.groupUrl,
      },
    });

    return NextResponse.json({
      ok: true,
      status: "pending",
      questId: quest.id,
      targetUrl: resolvedQuest.groupUrl,
      message:
        botVerification?.message ||
        "Telegram verification request created. Membership confirmation is still pending.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telegram verification failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
