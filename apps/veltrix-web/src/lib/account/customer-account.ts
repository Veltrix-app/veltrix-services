import { publicEnv } from "@/lib/env";

export type CustomerAccountOverviewNextStep =
  | "create_workspace"
  | "create_project"
  | "invite_team"
  | "open_launch_workspace"
  | "continue";

export type CustomerAccountSummary = {
  id: string;
  name: string;
  status: "pending_verification" | "active" | "trial" | "suspended" | "closed";
  sourceType: "self_serve" | "invite" | "internal" | "legacy_backfill";
  role: "owner" | "admin" | "member" | "viewer";
  membershipStatus: string;
  isLegacyBackfill: boolean;
  projectCount: number;
  firstProjectId: string | null;
  firstProjectName: string | null;
  onboardingStatus: "in_progress" | "completed" | "skipped";
  currentStep:
    | "create_workspace"
    | "create_project"
    | "invite_team"
    | "open_launch_workspace"
    | "completed";
  completedSteps: string[];
  completedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CustomerAccountInviteSummary = {
  id: string;
  customerAccountId: string;
  accountName: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: string;
  expiresAt: string;
  createdAt: string | null;
};

export type CustomerAccountOverview = {
  accounts: CustomerAccountSummary[];
  invites: CustomerAccountInviteSummary[];
  activeAccountId: string | null;
  needsWorkspaceBootstrap: boolean;
  suggestedNextStep: CustomerAccountOverviewNextStep;
};

export type CurrentCustomerAccountResponse = {
  ok: true;
  user: {
    authUserId: string;
    email: string | null;
    displayName: string;
  };
  overview: CustomerAccountOverview;
};

export type BootstrapCustomerAccountResponse = {
  ok: true;
  created: boolean;
  account: CustomerAccountSummary | null;
  overview: CustomerAccountOverview;
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Workspace account request failed."
    );
  }

  return payload as T;
}

export async function fetchCurrentCustomerAccountOverview(accessToken: string) {
  const response = await fetch("/api/account/current", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  return readJsonResponse<CurrentCustomerAccountResponse>(response);
}

export async function bootstrapCustomerAccount(params: {
  accessToken: string;
  accountName: string;
}) {
  const response = await fetch("/api/account/bootstrap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      accountName: params.accountName,
    }),
    cache: "no-store",
  });

  return readJsonResponse<BootstrapCustomerAccountResponse>(response);
}

export function buildPortalAccountHref(account: CustomerAccountSummary | null) {
  if (!account) {
    return `${publicEnv.portalUrl}/projects`;
  }

  if (account.currentStep === "create_project") {
    return `${publicEnv.portalUrl}/projects/new`;
  }

  if (account.currentStep === "open_launch_workspace" && account.firstProjectId) {
    return `${publicEnv.portalUrl}/projects/${account.firstProjectId}/launch`;
  }

  if (account.firstProjectId) {
    return `${publicEnv.portalUrl}/projects/${account.firstProjectId}`;
  }

  return `${publicEnv.portalUrl}/projects`;
}
