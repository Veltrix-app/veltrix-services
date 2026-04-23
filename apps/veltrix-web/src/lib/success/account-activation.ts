import { createSupabaseServiceClient } from "@/lib/supabase/server";

export type SuccessAccountSummary = {
  customerAccountId: string;
  accountName: string;
  activationStage:
    | "workspace_created"
    | "first_project_created"
    | "provider_connected"
    | "campaign_live"
    | "live";
  workspaceHealthState: "not_started" | "activating" | "live" | "stalled";
  successHealthState: "healthy" | "watching" | "expansion_ready" | "churn_risk";
  blockers: string[];
  completedMilestones: string[];
  nextBestActionKey?: string;
  nextBestActionLabel?: string;
  nextBestActionRoute?: string;
  projectCount: number;
  activeCampaignCount: number;
  providerCount: number;
  billableSeatCount: number;
  billingPlanId?: string;
  billingStatus?: string;
  lastMemberActivityAt?: string;
};

function diffDays(input?: string | null) {
  if (!input) {
    return null;
  }

  const value = new Date(input);
  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return Math.floor((Date.now() - value.getTime()) / (1000 * 60 * 60 * 24));
}

function pushIfMissing(target: string[], value: string, enabled: boolean) {
  if (enabled && !target.includes(value)) {
    target.push(value);
  }
}

function deriveWorkspaceHealth(input: {
  activationStage: SuccessAccountSummary["activationStage"];
  createdAt?: string | null;
  lastMemberActivityAt?: string | null;
}) {
  const accountAge = diffDays(input.createdAt);
  const lastMemberActivityAge = diffDays(input.lastMemberActivityAt);

  if (input.activationStage === "live" && lastMemberActivityAge !== null && lastMemberActivityAge <= 14) {
    return "live" as const;
  }

  if (input.activationStage === "workspace_created" && (accountAge === null || accountAge <= 3)) {
    return "not_started" as const;
  }

  if (
    accountAge !== null &&
    ((input.activationStage === "workspace_created" && accountAge >= 7) ||
      (input.activationStage === "first_project_created" && accountAge >= 10) ||
      (input.activationStage === "provider_connected" && accountAge >= 14) ||
      (input.activationStage === "campaign_live" && accountAge >= 21))
  ) {
    return "stalled" as const;
  }

  return "activating" as const;
}

export async function loadSuccessAccountSummaryForUser(authUserId: string): Promise<SuccessAccountSummary | null> {
  const supabase = createSupabaseServiceClient();
  const { data: membership, error: membershipError } = await supabase
    .from("customer_account_memberships")
    .select("customer_account_id")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const customerAccountId = membership?.customer_account_id ?? null;
  if (!customerAccountId) {
    return null;
  }

  const [
    { data: account, error: accountError },
    { data: subscription, error: subscriptionError },
    { data: entitlements, error: entitlementError },
    { data: onboarding, error: onboardingError },
    { data: firstProject, error: projectError },
  ] = await Promise.all([
    supabase
      .from("customer_accounts")
      .select("id, name, created_at")
      .eq("id", customerAccountId)
      .single(),
    supabase
      .from("customer_account_subscriptions")
      .select("billing_plan_id, status")
      .eq("customer_account_id", customerAccountId)
      .eq("is_current", true)
      .maybeSingle(),
    supabase
      .from("customer_account_entitlements")
      .select("current_projects, current_active_campaigns, current_providers, current_billable_seats")
      .eq("customer_account_id", customerAccountId)
      .maybeSingle(),
    supabase
      .from("customer_account_onboarding")
      .select("first_project_id")
      .eq("customer_account_id", customerAccountId)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("id, created_at")
      .eq("customer_account_id", customerAccountId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (accountError) {
    throw new Error(accountError.message);
  }
  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }
  if (entitlementError) {
    throw new Error(entitlementError.message);
  }
  if (onboardingError) {
    throw new Error(onboardingError.message);
  }
  if (projectError) {
    throw new Error(projectError.message);
  }

  const firstProjectId = onboarding?.first_project_id ?? firstProject?.id ?? null;
  let lastMemberActivityAt: string | null = null;

  if (firstProjectId || (entitlements?.current_projects ?? 0) > 0) {
    const { data: projectIds } = await supabase
      .from("projects")
      .select("id")
      .eq("customer_account_id", customerAccountId);
    const ids = (projectIds ?? []).map((row) => row.id);

    if (ids.length) {
      const [{ data: xpEvent, error: xpError }, { data: firstActiveCampaign, error: campaignError }] =
        await Promise.all([
          supabase
            .from("xp_events")
            .select("created_at")
            .in("project_id", ids)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("campaigns")
            .select("id")
            .in("project_id", ids)
            .eq("status", "active")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle(),
        ]);

      if (xpError) {
        throw new Error(xpError.message);
      }
      if (campaignError) {
        throw new Error(campaignError.message);
      }

      lastMemberActivityAt = xpEvent?.created_at ?? null;
      const projectCount = entitlements?.current_projects ?? 0;
      const activeCampaignCount = entitlements?.current_active_campaigns ?? 0;
      const providerCount = entitlements?.current_providers ?? 0;
      const billableSeatCount = entitlements?.current_billable_seats ?? 0;

      const activationStage: SuccessAccountSummary["activationStage"] =
        projectCount === 0
          ? "workspace_created"
          : providerCount === 0
            ? "first_project_created"
            : activeCampaignCount === 0
              ? "provider_connected"
              : !lastMemberActivityAt
                ? "campaign_live"
                : "live";
      const workspaceHealthState = deriveWorkspaceHealth({
        activationStage,
        createdAt: account.created_at,
        lastMemberActivityAt,
      });
      const isPaid = Boolean(subscription?.billing_plan_id && subscription.billing_plan_id !== "free");
      const successHealthState: SuccessAccountSummary["successHealthState"] =
        isPaid && workspaceHealthState === "stalled"
          ? "churn_risk"
          : projectCount >= 2 || activeCampaignCount >= 2 || billableSeatCount >= 4
            ? "expansion_ready"
            : workspaceHealthState === "stalled"
              ? "watching"
              : "healthy";
      const blockers: string[] = [];
      const completedMilestones: string[] = ["Workspace created"];
      pushIfMissing(completedMilestones, "First project created", projectCount > 0);
      pushIfMissing(completedMilestones, "First provider connected", providerCount > 0);
      pushIfMissing(completedMilestones, "First campaign live", activeCampaignCount > 0);
      pushIfMissing(completedMilestones, "First member activity", Boolean(lastMemberActivityAt));
      pushIfMissing(blockers, "Create the first project workspace.", projectCount === 0);
      pushIfMissing(blockers, "Connect the first provider to unlock delivery rails.", projectCount > 0 && providerCount === 0);
      pushIfMissing(blockers, "Publish the first live campaign so the workspace actually starts moving.", providerCount > 0 && activeCampaignCount === 0);
      pushIfMissing(blockers, "Drive the first member activity so the workspace closes the loop.", activeCampaignCount > 0 && !lastMemberActivityAt);

      const nextBestAction =
        projectCount === 0
          ? { key: "create_first_project", label: "Create first project", route: `${process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://crypto-raid-admin-portal.vercel.app"}/projects/new` }
          : providerCount === 0
            ? { key: "connect_first_provider", label: "Connect first provider", route: `${process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://crypto-raid-admin-portal.vercel.app"}/projects/${firstProjectId ?? ""}/settings` }
            : activeCampaignCount === 0
              ? { key: "publish_first_campaign", label: "Publish first campaign", route: `${process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://crypto-raid-admin-portal.vercel.app"}/projects/${firstProjectId ?? ""}/launch` }
              : !lastMemberActivityAt
                ? { key: "drive_first_member_activity", label: "Drive first member activity", route: `${process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://crypto-raid-admin-portal.vercel.app"}/projects/${firstProjectId ?? ""}/community` }
                : { key: "keep_workspace_moving", label: "Keep the workspace moving", route: `${process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://crypto-raid-admin-portal.vercel.app"}/account` };

      return {
        customerAccountId,
        accountName: account.name,
        activationStage,
        workspaceHealthState,
        successHealthState,
        blockers,
        completedMilestones,
        nextBestActionKey: nextBestAction.key,
        nextBestActionLabel: nextBestAction.label,
        nextBestActionRoute: nextBestAction.route,
        projectCount,
        activeCampaignCount,
        providerCount,
        billableSeatCount,
        billingPlanId: subscription?.billing_plan_id ?? undefined,
        billingStatus: subscription?.status ?? undefined,
        lastMemberActivityAt: lastMemberActivityAt ?? undefined,
      };
    }
  }

  return {
    customerAccountId,
    accountName: account.name,
    activationStage: "workspace_created",
    workspaceHealthState: "not_started",
    successHealthState: "watching",
    blockers: ["Create the first project workspace."],
    completedMilestones: ["Workspace created"],
    nextBestActionKey: "create_first_project",
    nextBestActionLabel: "Create first project",
    nextBestActionRoute: `${process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://crypto-raid-admin-portal.vercel.app"}/projects/new`,
    projectCount: 0,
    activeCampaignCount: 0,
    providerCount: 0,
    billableSeatCount: 0,
    billingPlanId: subscription?.billing_plan_id ?? undefined,
    billingStatus: subscription?.status ?? undefined,
  };
}
