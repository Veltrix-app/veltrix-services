"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User, UserIdentity } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";
import { mapProfile } from "@/lib/auth";
import type { ConnectedAccount, ProfileUpdateInput, UserProfile } from "@/types/auth";

type LinkableProvider = "discord" | "x";

type AuthContextValue = {
  initialized: boolean;
  loading: boolean;
  session: Session | null;
  authUserId: string | null;
  profile: UserProfile | null;
  error: string | null;
  authConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (
    input: ProfileUpdateInput
  ) => Promise<{ ok: boolean; error?: string }>;
  linkProvider: (
    provider: LinkableProvider
  ) => Promise<{ ok: boolean; error?: string }>;
  saveTelegramIdentity: (input: {
    telegramUserId: string;
    username?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  syncConnectedAccounts: () => Promise<{
    ok: boolean;
    error?: string;
    identities?: number;
    accounts?: ConnectedAccount[];
  }>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function deriveUsername(email?: string | null) {
  if (!email) {
    return "pilot";
  }

  return email.split("@")[0] || "pilot";
}

async function ensureUserScaffold(params: {
  authUserId: string;
  email?: string | null;
  supabase: ReturnType<typeof createSupabaseBrowserClient>;
}) {
  const username = deriveUsername(params.email);

  await Promise.all([
    params.supabase.from("user_profiles").upsert({
      auth_user_id: params.authUserId,
      username,
      avatar_url: "",
      banner_url: "",
      title: "Explorer",
      faction: "Unassigned",
      bio: "No bio set yet.",
      wallet: "",
      xp: 0,
      level: 1,
      streak: 0,
      status: "active",
    }),
    params.supabase.from("user_global_reputation").upsert({
      auth_user_id: params.authUserId,
      total_xp: 0,
      level: 1,
      streak: 0,
      trust_score: 50,
      sybil_score: 0,
      contribution_tier: "explorer",
      reputation_rank: 0,
      quests_completed: 0,
      raids_completed: 0,
      rewards_claimed: 0,
      status: "active",
    }),
    params.supabase.from("user_progress").upsert({
      auth_user_id: params.authUserId,
      joined_communities: [],
      confirmed_raids: [],
      claimed_rewards: [],
      opened_lootbox_ids: [],
      unlocked_reward_ids: [],
      quest_statuses: {},
    }),
  ]);
}

async function fetchProfileWithReputation(
  authUserId: string,
  supabase: ReturnType<typeof createSupabaseBrowserClient>
) {
  const [{ data: profile, error: profileError }, { data: reputation, error: reputationError }] =
    await Promise.all([
      supabase.from("user_profiles").select("*").eq("auth_user_id", authUserId).maybeSingle(),
      supabase
        .from("user_global_reputation")
        .select("*")
        .eq("auth_user_id", authUserId)
        .maybeSingle(),
    ]);

  if (profileError) {
    throw profileError;
  }

  if (reputationError) {
    throw reputationError;
  }

  if (!profile) {
    throw new Error("PROFILE_MISSING");
  }

  return {
    ...profile,
    user_global_reputation: reputation,
  };
}

function mapIdentityProvider(provider: string): ConnectedAccount["provider"] | null {
  if (provider === "discord") {
    return "discord";
  }

  if (provider === "twitter") {
    return "x";
  }

  return null;
}

function deriveIdentityUserId(identity: UserIdentity) {
  const identityData = identity.identity_data ?? {};
  const rawValue =
    identityData.sub ??
    identityData.user_id ??
    identityData.id ??
    identityData.provider_id ??
    identity.identity_id;

  return rawValue ? String(rawValue) : "";
}

function deriveIdentityUsername(identity: UserIdentity) {
  const identityData = identity.identity_data ?? {};
  const username =
    identityData.user_name ??
    identityData.preferred_username ??
    identityData.username ??
    identityData.nick ??
    identityData.name ??
    null;

  return typeof username === "string" && username.length > 0 ? username : null;
}

async function syncManagedConnectedAccounts(params: {
  authUserId: string;
  supabase: ReturnType<typeof createSupabaseBrowserClient>;
  user?: User | null;
}) {
  const fallbackUser =
    params.user ??
    (
      await Promise.race([
        params.supabase.auth.getUser(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Identity lookup timed out.")), 8000)
        ),
      ])
    ).data.user;

  const identityList = Array.isArray(fallbackUser?.identities)
    ? fallbackUser.identities
    : [];

  const linkedIdentities = identityList
    .map((identity) => {
      const provider = mapIdentityProvider(identity.provider);
      const providerUserId = deriveIdentityUserId(identity);

      if (!provider || !providerUserId) {
        return null;
      }

      return {
        auth_user_id: params.authUserId,
        provider,
        provider_user_id: providerUserId,
        username: deriveIdentityUsername(identity),
        status: "connected",
        connected_at: identity.created_at ?? new Date().toISOString(),
        updated_at: identity.updated_at ?? new Date().toISOString(),
      };
    })
    .filter((identity): identity is NonNullable<typeof identity> => Boolean(identity));

  const { error: deleteError } = await params.supabase
    .from("user_connected_accounts")
    .delete()
    .eq("auth_user_id", params.authUserId)
    .in("provider", ["discord", "x"]);

  if (deleteError) {
    throw deleteError;
  }

  if (linkedIdentities.length === 0) {
    return;
  }

  const { error: insertError } = await params.supabase
    .from("user_connected_accounts")
    .insert(linkedIdentities);

  if (insertError) {
    throw insertError;
  }
}

async function syncManagedConnectedAccountsViaApi(params: {
  accessToken: string;
}) {
  const response = await fetch("/api/identity/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "Identity sync route failed.");
  }

  return {
    identities: typeof payload.identities === "number" ? payload.identities : 0,
    accounts: Array.isArray(payload.accounts) ? (payload.accounts as ConnectedAccount[]) : [],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(
    () => (publicEnv.authConfigured ? createSupabaseBrowserClient() : null),
    []
  );

  const authUserId = session?.user?.id ?? null;

  async function reloadProfile() {
    if (!authUserId || !publicEnv.authConfigured) {
      setProfile(null);
      return;
    }

    try {
      if (!supabase) {
        setProfile(null);
        return;
      }

      let data;

      try {
        data = await fetchProfileWithReputation(authUserId, supabase);
      } catch (nextError) {
        if (nextError instanceof Error && nextError.message === "PROFILE_MISSING") {
          await ensureUserScaffold({
            authUserId,
            email: session?.user?.email,
            supabase,
          });
          data = await fetchProfileWithReputation(authUserId, supabase);
        } else {
          throw nextError;
        }
      }

      setProfile(mapProfile(data));

      try {
        await syncManagedConnectedAccounts({
          authUserId,
          supabase,
          user: session?.user ?? null,
        });
      } catch (syncError) {
        setError(
          syncError instanceof Error
            ? syncError.message
            : "Linked system sync failed."
        );
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load profile.");
      setProfile(null);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (!publicEnv.authConfigured || !supabase) {
        setInitialized(true);
        return;
      }

      setLoading(true);

      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(initialSession);
      setInitialized(true);
      setLoading(false);
    }

    initialize();

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return;
      }

      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!authUserId) {
      setProfile(null);
      return;
    }

    void reloadProfile();
  }, [initialized, authUserId]);

  async function signIn(email: string, password: string) {
    if (!publicEnv.authConfigured || !supabase) {
      return { ok: false, error: "Supabase envs are not configured yet." };
    }

    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return { ok: false, error: signInError.message };
    }

    const nextSession =
      data.session ??
      (await supabase.auth.getSession()).data.session ??
      null;

    setSession(nextSession);
    setLoading(false);

    return { ok: true };
  }

  async function signUp(email: string, password: string, username: string) {
    if (!publicEnv.authConfigured || !supabase) {
      return { ok: false, error: "Supabase envs are not configured yet." };
    }

    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return { ok: false, error: signUpError.message };
    }

    const nextAuthUserId = data.user?.id;

    if (!nextAuthUserId) {
      setLoading(false);
      setError("No auth user returned.");
      return { ok: false, error: "No auth user returned." };
    }

    const [{ error: profileError }, { error: reputationError }, { error: progressError }] =
      await Promise.all([
        supabase.from("user_profiles").insert({
          auth_user_id: nextAuthUserId,
          username,
          avatar_url: "",
          banner_url: "",
          title: "Elite Raider",
          faction: "Unassigned",
          bio: "No bio set yet.",
          wallet: "",
          xp: 0,
          level: 1,
          streak: 0,
          status: "active",
        }),
        supabase.from("user_global_reputation").upsert({
          auth_user_id: nextAuthUserId,
          total_xp: 0,
          level: 1,
          streak: 0,
          trust_score: 50,
          sybil_score: 0,
          contribution_tier: "explorer",
          reputation_rank: 0,
          quests_completed: 0,
          raids_completed: 0,
          rewards_claimed: 0,
          status: "active",
        }),
        supabase.from("user_progress").insert({
          auth_user_id: nextAuthUserId,
          joined_communities: [],
          confirmed_raids: [],
          claimed_rewards: [],
          opened_lootbox_ids: [],
          unlocked_reward_ids: [],
          quest_statuses: {},
        }),
      ]);

    setLoading(false);

    const persistenceError = profileError ?? reputationError ?? progressError;
    if (persistenceError) {
      setError(persistenceError.message);
      return { ok: false, error: persistenceError.message };
    }

    const nextSession =
      data.session ??
      (await supabase.auth.getSession()).data.session ??
      null;

    setSession(nextSession);

    return { ok: true };
  }

  async function signOut() {
    if (!publicEnv.authConfigured || !supabase) {
      return;
    }

    setLoading(true);
    await supabase.auth.signOut();
    setProfile(null);
    setLoading(false);
  }

  async function updateProfile(input: ProfileUpdateInput) {
    if (!publicEnv.authConfigured || !supabase || !authUserId) {
      return { ok: false, error: "You need an active session before updating your profile." };
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        username: input.username,
        avatar_url: input.avatarUrl,
        banner_url: input.bannerUrl,
        title: input.title,
        faction: input.faction,
        bio: input.bio,
        wallet: input.wallet,
      })
      .eq("auth_user_id", authUserId);

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return { ok: false, error: updateError.message };
    }

    await reloadProfile();
    setLoading(false);
    return { ok: true };
  }

  async function linkProvider(provider: LinkableProvider) {
    if (!publicEnv.authConfigured || !supabase || !authUserId) {
      return { ok: false, error: "You need an active pilot session before linking providers." };
    }

    setLoading(true);
    setError(null);

    const nextProvider = provider === "x" ? "twitter" : "discord";
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/profile?linked=${provider}`
        : undefined;

    const { data, error: linkError } = await supabase.auth.linkIdentity({
      provider: nextProvider,
      options: {
        redirectTo,
      },
    });

    if (linkError) {
      setLoading(false);
      setError(linkError.message);
      return { ok: false, error: linkError.message };
    }

    if (data?.url && typeof window !== "undefined") {
      window.location.assign(data.url);
    }

    setLoading(false);
    return { ok: true };
  }

  async function saveTelegramIdentity(input: {
    telegramUserId: string;
    username?: string;
  }) {
    if (!publicEnv.authConfigured || !supabase || !authUserId) {
      return { ok: false, error: "You need an active pilot session before linking Telegram." };
    }

    const sanitizedUserId = input.telegramUserId.replace(/[^\d]/g, "");
    const sanitizedUsername = input.username?.trim().replace(/^@+/, "") ?? "";

    if (!sanitizedUserId) {
      return { ok: false, error: "Enter your Telegram numeric user id first." };
    }

    setLoading(true);
    setError(null);

    const { error: deleteError } = await supabase
      .from("user_connected_accounts")
      .delete()
      .eq("auth_user_id", authUserId)
      .eq("provider", "telegram");

    if (deleteError) {
      setLoading(false);
      setError(deleteError.message);
      return { ok: false, error: deleteError.message };
    }

    const timestamp = new Date().toISOString();
    const { error: insertError } = await supabase.from("user_connected_accounts").insert({
      auth_user_id: authUserId,
      provider: "telegram",
      provider_user_id: sanitizedUserId,
      username: sanitizedUsername || null,
      status: "connected",
      connected_at: timestamp,
      updated_at: timestamp,
    });

    if (insertError) {
      setLoading(false);
      setError(insertError.message);
      return { ok: false, error: insertError.message };
    }

    setLoading(false);
    return { ok: true };
  }

  async function syncConnectedAccounts() {
    if (!publicEnv.authConfigured || !supabase || !authUserId || !session?.access_token) {
      return { ok: false, error: "You need an active session before refreshing linked systems." };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await syncManagedConnectedAccountsViaApi({
        accessToken: session.access_token,
      });
      setLoading(false);
      return { ok: true, identities: result.identities, accounts: result.accounts };
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Failed to refresh linked systems.";
      setLoading(false);
      setError(message);
      return { ok: false, error: message };
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      loading,
      session,
      authUserId,
      profile,
      error,
      authConfigured: publicEnv.authConfigured,
      signIn,
      signUp,
      updateProfile,
      linkProvider,
      saveTelegramIdentity,
      syncConnectedAccounts,
      signOut,
      reloadProfile,
      clearError: () => setError(null),
    }),
    [initialized, loading, session, authUserId, profile, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
