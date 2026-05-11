import type { UserIdentity } from "@supabase/supabase-js";

export type ReplaceableIdentityProvider = "discord" | "x";

export function normalizeLinkableIdentityProvider(provider: string | null | undefined) {
  if (provider === "discord") {
    return "discord" as const;
  }

  if (provider === "x" || provider === "twitter") {
    return "x" as const;
  }

  return null;
}

export function findProviderIdentities(
  identities: UserIdentity[] | null | undefined,
  provider: ReplaceableIdentityProvider
) {
  return (identities ?? []).filter(
    (identity) => normalizeLinkableIdentityProvider(identity.provider) === provider
  );
}

export function getProviderReplaceButtonLabel(params: {
  provider: ReplaceableIdentityProvider;
  connected: boolean;
}) {
  const label = params.provider === "x" ? "X" : "Discord";
  return params.connected ? `Replace ${label} link` : `Link ${label}`;
}
