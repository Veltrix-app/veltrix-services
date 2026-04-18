import { supabaseAdmin } from "../../lib/supabase.js";
import { sendVerificationConfirm } from "../../core/callbacks/confirm-client.js";

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

type VerificationEventRow = {
  id: string;
  quest_id: string | null;
  project_id: string | null;
  event_type: string | null;
  external_ref: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function extractHandleFromUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    if (hostname !== "x.com" && hostname !== "twitter.com") {
      return "";
    }

    const [segment] = url.pathname.split("/").filter(Boolean);
    return segment ? segment.toLowerCase() : "";
  } catch {
    return "";
  }
}

function normalizeHandle(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const handleFromUrl = extractHandleFromUrl(trimmed);
  if (handleFromUrl) {
    return handleFromUrl;
  }

  return trimmed.replace(/^@+/, "").toLowerCase();
}

function normalizeProfileUrl(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const handle = extractHandleFromUrl(trimmed);
  if (!handle) {
    return "";
  }

  return `https://x.com/${handle}`;
}

function getMetadataValue(metadata: Record<string, unknown> | null | undefined, key: string) {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  return metadata[key];
}

function addCandidate(candidates: Set<string>, value: unknown) {
  const normalizedUrl = normalizeProfileUrl(value);
  if (normalizedUrl) {
    candidates.add(normalizedUrl);
  }

  const normalizedHandle = normalizeHandle(value);
  if (normalizedHandle) {
    candidates.add(normalizedHandle);
    candidates.add(`@${normalizedHandle}`);
  }

  if (typeof value === "string" && value.trim()) {
    candidates.add(value.trim().toLowerCase());
  }
}

function buildTargetCandidates(params: {
  profileUrl: string;
  handle: string;
  accountUsername: string;
  providerUserId: string;
}) {
  const candidates = new Set<string>();

  addCandidate(candidates, params.profileUrl);
  addCandidate(candidates, params.handle);
  addCandidate(candidates, params.accountUsername);
  addCandidate(candidates, params.providerUserId);

  return candidates;
}

function matchesCandidate(candidates: Set<string>, value: unknown) {
  if (!candidates.size) {
    return true;
  }

  const normalizedUrl = normalizeProfileUrl(value);
  if (normalizedUrl && candidates.has(normalizedUrl)) {
    return true;
  }

  const normalizedHandle = normalizeHandle(value);
  if (normalizedHandle && (candidates.has(normalizedHandle) || candidates.has(`@${normalizedHandle}`))) {
    return true;
  }

  return typeof value === "string" && value.trim().length > 0
    ? candidates.has(value.trim().toLowerCase())
    : false;
}

function resolveExpectedEventType(quest: QuestRow) {
  const verificationConfig =
    quest.verification_config && typeof quest.verification_config === "object"
      ? quest.verification_config
      : {};

  return typeof verificationConfig.eventType === "string" && verificationConfig.eventType.trim()
    ? verificationConfig.eventType.trim()
    : "x_follow_confirmed";
}

function resolveXQuestConfig(quest: QuestRow) {
  const verificationConfig =
    quest.verification_config && typeof quest.verification_config === "object"
      ? quest.verification_config
      : {};

  const verificationProvider =
    quest.verification_provider && quest.verification_provider !== "custom"
      ? quest.verification_provider
      : quest.quest_type === "social_follow" ||
          (quest.verification_type === "api_check" &&
            (typeof verificationConfig.profileUrl === "string" ||
              typeof verificationConfig.handle === "string"))
        ? "x"
        : null;

  const completionMode =
    quest.quest_type === "social_follow" && quest.verification_type === "api_check"
      ? "integration_auto"
      : quest.completion_mode ?? "manual";

  const configuredProfileUrl =
    typeof verificationConfig.profileUrl === "string" && verificationConfig.profileUrl.trim()
      ? verificationConfig.profileUrl.trim()
      : "";
  const actionUrl = typeof quest.action_url === "string" ? quest.action_url.trim() : "";
  const profileUrl = configuredProfileUrl || actionUrl;
  const handle =
    typeof verificationConfig.handle === "string" && verificationConfig.handle.trim()
      ? verificationConfig.handle.trim()
      : extractHandleFromUrl(profileUrl);

  return {
    verificationProvider,
    completionMode,
    profileUrl,
    handle,
    eventType: resolveExpectedEventType(quest),
  };
}

function isMatchingFollowEvent(params: {
  event: VerificationEventRow;
  questId: string;
  projectId: string | null;
  expectedEventType: string;
  candidates: Set<string>;
}) {
  const { event, questId, projectId, expectedEventType, candidates } = params;

  if (!event.event_type || (event.event_type !== expectedEventType && event.event_type !== "x_follow_confirmed")) {
    return false;
  }

  if (event.quest_id && event.quest_id !== questId) {
    return false;
  }

  if (projectId && event.project_id && event.project_id !== projectId) {
    return false;
  }

  if (matchesCandidate(candidates, event.external_ref)) {
    return true;
  }

  return [
    getMetadataValue(event.metadata, "profileUrl"),
    getMetadataValue(event.metadata, "handle"),
    getMetadataValue(event.metadata, "accountUsername"),
    getMetadataValue(event.metadata, "username"),
    getMetadataValue(event.metadata, "providerUserId"),
    getMetadataValue(event.metadata, "provider_user_id"),
    getMetadataValue(event.metadata, "xUserId"),
    getMetadataValue(event.metadata, "x_user_id"),
  ].some((value) => matchesCandidate(candidates, value));
}

export async function verifyXQuestFollow(params: {
  authUserId: string;
  questId: string;
}) {
  const { data: quest, error: questError } = await supabaseAdmin
    .from("quests")
    .select(
      "id, title, project_id, action_url, quest_type, verification_type, verification_provider, completion_mode, verification_config"
    )
    .eq("id", params.questId)
    .single();

  if (questError || !quest) {
    throw new Error("Quest not found.");
  }

  const resolvedQuest = resolveXQuestConfig(quest as QuestRow);

  if (resolvedQuest.verificationProvider !== "x" || resolvedQuest.completionMode !== "integration_auto") {
    throw new Error("Quest is not configured for X integration verification.");
  }

  const { data: approvedSubmission } = await supabaseAdmin
    .from("quest_submissions")
    .select("id")
    .eq("auth_user_id", params.authUserId)
    .eq("quest_id", quest.id)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (approvedSubmission?.id) {
    return {
      ok: true,
      status: "approved" as const,
      questId: quest.id,
      message: "Quest was already approved earlier.",
    };
  }

  const [{ data: connectedAccount, error: connectedAccountError }, { data: projectIntegration, error: integrationError }] =
    await Promise.all([
      supabaseAdmin
        .from("user_connected_accounts")
        .select("provider_user_id, username, status")
        .eq("auth_user_id", params.authUserId)
        .eq("provider", "x")
        .eq("status", "connected")
        .maybeSingle(),
      supabaseAdmin
        .from("project_integrations")
        .select("status, config")
        .eq("project_id", quest.project_id)
        .eq("provider", "x")
        .maybeSingle(),
    ]);

  if (connectedAccountError) {
    throw new Error(connectedAccountError.message || "Failed to load connected X account.");
  }

  if (integrationError) {
    throw new Error(integrationError.message || "Failed to load X integration.");
  }

  if (!connectedAccount) {
    throw new Error("User has no linked X account.");
  }

  if (!projectIntegration || projectIntegration.status !== "connected") {
    throw new Error("Project has no active X integration.");
  }

  const candidates = buildTargetCandidates({
    profileUrl: resolvedQuest.profileUrl,
    handle: resolvedQuest.handle,
    accountUsername: connectedAccount.username ?? "",
    providerUserId: connectedAccount.provider_user_id ?? "",
  });

  const { data: recentEvents, error: eventsError } = await supabaseAdmin
    .from("verification_events")
    .select("id, quest_id, project_id, event_type, external_ref, metadata, created_at")
    .eq("auth_user_id", params.authUserId)
    .eq("provider", "x")
    .order("created_at", { ascending: false })
    .limit(50);

  if (eventsError) {
    throw new Error(eventsError.message || "Failed to load X verification events.");
  }

  const matchingEvent = (recentEvents as VerificationEventRow[] | null)?.find((event) =>
    isMatchingFollowEvent({
      event,
      questId: quest.id,
      projectId: quest.project_id ?? null,
      expectedEventType: resolvedQuest.eventType,
      candidates,
    })
  );

  if (!matchingEvent) {
    return {
      ok: true,
      status: "pending" as const,
      questId: quest.id,
      profileUrl: resolvedQuest.profileUrl,
      handle: resolvedQuest.handle,
      message: "X follow confirmation has not landed yet.",
    };
  }

  const confirmedEventType = matchingEvent.event_type ?? resolvedQuest.eventType;
  const confirmationRef =
    normalizeProfileUrl(resolvedQuest.profileUrl) ||
    normalizeProfileUrl(matchingEvent.external_ref) ||
    matchingEvent.external_ref ||
    resolvedQuest.profileUrl ||
    resolvedQuest.handle;

  const { error: insertEventError } = await supabaseAdmin.from("verification_events").insert({
    auth_user_id: params.authUserId,
    project_id: quest.project_id ?? null,
    quest_id: quest.id,
    provider: "x",
    event_type: confirmedEventType,
    external_ref: confirmationRef || null,
    metadata: {
      profileUrl: resolvedQuest.profileUrl || null,
      handle: resolvedQuest.handle || null,
      accountUsername: connectedAccount.username ?? null,
      xUserId: connectedAccount.provider_user_id ?? null,
      matchedEventId: matchingEvent.id,
      source: "runtime_x_recheck",
    },
  });

  if (insertEventError) {
    throw new Error(insertEventError.message || "Failed to store X confirmation event.");
  }

  const confirmResult = await sendVerificationConfirm({
    authUserId: params.authUserId,
    questId: quest.id,
    provider: "x",
    eventType: confirmedEventType,
    projectId: quest.project_id ?? null,
    externalRef: confirmationRef || null,
    metadata: {
      profileUrl: resolvedQuest.profileUrl || null,
      handle: resolvedQuest.handle || null,
      accountUsername: connectedAccount.username ?? null,
      xUserId: connectedAccount.provider_user_id ?? null,
      matchedEventId: matchingEvent.id,
      source: "runtime_x_recheck",
    },
  });

  return {
    ok: true,
    status: "approved" as const,
    questId: quest.id,
    profileUrl: resolvedQuest.profileUrl,
    handle: resolvedQuest.handle,
    confirmation: confirmResult,
  };
}
