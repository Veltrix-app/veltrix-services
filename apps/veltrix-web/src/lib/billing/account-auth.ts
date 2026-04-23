import { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import {
  createSupabaseServiceClient,
  createSupabaseUserServerClient,
} from "@/lib/supabase/server";

export type AuthenticatedBillingUser = {
  accessToken: string;
  user: User;
  email: string | null;
};

export function getBillingBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

export async function resolveAuthenticatedBillingUser(
  request: NextRequest
): Promise<AuthenticatedBillingUser> {
  const accessToken = getBillingBearerToken(request);
  if (!accessToken) {
    throw new Error("Missing bearer token.");
  }

  const supabase = createSupabaseUserServerClient(accessToken);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    throw new Error("Invalid session.");
  }

  return {
    accessToken,
    user,
    email: typeof user.email === "string" ? user.email : null,
  };
}

export async function assertCustomerAccountMembership(params: {
  authUserId: string;
  customerAccountId: string;
}) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("customer_account_memberships")
    .select("customer_account_id, status")
    .eq("customer_account_id", params.customerAccountId)
    .eq("auth_user_id", params.authUserId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to verify customer account membership.");
  }

  if (!data?.customer_account_id) {
    throw new Error("Account access denied.");
  }

  return data;
}
