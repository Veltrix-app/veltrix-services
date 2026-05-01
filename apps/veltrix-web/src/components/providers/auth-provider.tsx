"use client";

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";
import { mapProfile } from "@/lib/auth";
import type {
  ConnectedAccount,
  ProfileAssetKind,
  ProfileUpdateInput,
  UserProfile,
} from "@/types/auth";

type LinkableProvider = "discord" | "x";

type AuthContextValue = {
  initialized: boolean;
  loading: boolean;
  session: Session | null;
  authUserId: string | null;
  profile: UserProfile | null;
  connectedAccounts: ConnectedAccount[];
  connectedAccountsState: "unknown" | "syncing" | "ready";
  error: string | null;
  authConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    username: string,
    redirectTo?: string
  ) => Promise<{ ok: boolean; error?: string; authUserId?: string }>;
  requestPasswordReset: (
    email: string,
    redirectTo?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  updatePassword: (
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (
    input: ProfileUpdateInput
  ) => Promise<{ ok: boolean; error?: string }>;
  verifyWallet: (input: {
    walletAddress: string;
    chain?: string;
    signature: string;
  }) => Promise<{ ok: boolean; error?: string; walletAddress?: string }>;
  unlinkWallet: () => Promise<{ ok: boolean; error?: string }>;
  uploadProfileAsset: (
    kind: ProfileAssetKind,
    file: File
  ) => Promise<{ ok: boolean; error?: string; url?: string }>;
  linkProvider: (
    provider: LinkableProvider
  ) => Promise<{ ok: boolean; error?: string }>;
  saveTelegramIdentity: (input: {
    telegramUserId: string;
    username?: string;
  }) => Promise<{ ok: boolean; error?: string; accounts?: ConnectedAccount[] }>;
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
    return "member";
  }

  return email.split("@")[0] || "member";
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
    params.supabase.from("user_global_reputation").upsert(
      {
        auth_user_id: params.authUserId,
        total_xp: 0,
        active_xp: 0,
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
      },
      { onConflict: "auth_user_id", ignoreDuplicates: true }
    ),
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
  const [
    { data: profile, error: profileError },
    { data: reputation, error: reputationError },
    { data: walletLink, error: walletLinkError },
  ] =
    await Promise.all([
      supabase.from("user_profiles").select("*").eq("auth_user_id", authUserId).maybeSingle(),
      supabase
        .from("user_global_reputation")
        .select("*")
        .eq("auth_user_id", authUserId)
        .maybeSingle(),
      supabase
        .from("wallet_links")
        .select("wallet_address, chain, verified, metadata, verified_at, updated_at")
        .eq("auth_user_id", authUserId)
        .eq("verified", true)
        .contains("metadata", { primary: true })
        .order("verified_at", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (profileError) {
    throw profileError;
  }

  if (reputationError) {
    throw reputationError;
  }

  if (walletLinkError) {
    throw walletLinkError;
  }

  if (!profile) {
    throw new Error("PROFILE_MISSING");
  }

  return {
    ...profile,
    user_global_reputation: reputation,
    primary_wallet_link: walletLink,
  };
}

async function syncManagedConnectedAccountsViaApi(params: {
  accessToken: string;
}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("/api/identity/sync", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || "Identity sync route failed.");
    }

    return {
      identities: typeof payload.identities === "number" ? payload.identities : 0,
      accounts: Array.isArray(payload.accounts) ? (payload.accounts as ConnectedAccount[]) : [],
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchConnectedAccountsSnapshotViaApi(params: {
  accessToken: string;
}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch("/api/identity/sync", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
      signal: controller.signal,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || "Identity snapshot route failed.");
    }

    return Array.isArray(payload.accounts) ? (payload.accounts as ConnectedAccount[]) : [];
  } finally {
    window.clearTimeout(timeout);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [connectedAccountsState, setConnectedAccountsState] = useState<
    "unknown" | "syncing" | "ready"
  >("unknown");
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(
    () => (publicEnv.authConfigured ? createSupabaseBrowserClient() : null),
    []
  );

  const authUserId = session?.user?.id ?? null;

  function applyConnectedAccountSnapshot(accounts: ConnectedAccount[]) {
    setError(null);
    setConnectedAccounts(accounts);
    setConnectedAccountsState("ready");
  }

  async function reloadConnectedAccounts(params?: { preserveExisting?: boolean }) {
    if (!publicEnv.authConfigured || !supabase || !authUserId) {
      setConnectedAccounts([]);
      setConnectedAccountsState("unknown");
      return;
    }

    const preserveExisting = params?.preserveExisting ?? true;

    if (!preserveExisting) {
      setConnectedAccounts([]);
    }

    setConnectedAccountsState("syncing");
    const accessToken = session?.access_token ?? null;

    if (accessToken) {
      try {
        const result = await syncManagedConnectedAccountsViaApi({
          accessToken,
        });
        applyConnectedAccountSnapshot(result.accounts);
        return;
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Could not hydrate linked accounts from the live grid."
        );
      }
    }

    if (!accessToken) {
      setConnectedAccountsState("ready");
      return;
    }

    try {
      const accounts = await fetchConnectedAccountsSnapshotViaApi({
        accessToken,
      });
      applyConnectedAccountSnapshot(accounts);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not load linked systems.");
      setConnectedAccountsState("ready");
    }
  }

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
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load profile.");
      setProfile(null);
    }
  }
  const hydrateSessionData = useEffectEvent(() => {
    void reloadProfile();
    void reloadConnectedAccounts();
  });

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
      async function clearSessionState() {
        await Promise.resolve();
        setProfile(null);
        setConnectedAccounts([]);
        setConnectedAccountsState("unknown");
      }

      void clearSessionState();
      return;
    }

    if (!session?.access_token) {
      async function settleConnectedAccountState() {
        await Promise.resolve();
        setConnectedAccountsState(connectedAccounts.length > 0 ? "ready" : "unknown");
      }

      void settleConnectedAccountState();
      return;
    }

    async function hydrateSessionState() {
      await Promise.resolve();
      hydrateSessionData();
    }

    void hydrateSessionState();
  }, [initialized, authUserId, connectedAccounts.length, session?.access_token]);

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

  async function signUp(
    email: string,
    password: string,
    username: string,
    redirectTo?: string
  ) {
    if (!publicEnv.authConfigured || !supabase) {
      return { ok: false, error: "Supabase envs are not configured yet." };
    }

    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          username,
        },
      },
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

    const nextSession =
      data.session ??
      (await supabase.auth.getSession()).data.session ??
      null;

    setSession(nextSession);
    if (nextSession) {
      try {
        await ensureUserScaffold({
          authUserId: nextAuthUserId,
          email,
          supabase,
        });
      } catch (nextError) {
        setLoading(false);
        const message =
          nextError instanceof Error ? nextError.message : "Could not initialize your account.";
        setError(message);
        return { ok: false, error: message };
      }
    }

    setLoading(false);

    return { ok: true, authUserId: nextAuthUserId };
  }

  async function requestPasswordReset(email: string, redirectTo?: string) {
    if (!publicEnv.authConfigured || !supabase) {
      return { ok: false, error: "Supabase envs are not configured yet." };
    }

    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return { ok: false, error: resetError.message };
    }

    return { ok: true };
  }

  async function updatePassword(password: string) {
    if (!publicEnv.authConfigured || !supabase) {
      return { ok: false, error: "Supabase envs are not configured yet." };
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return { ok: false, error: updateError.message };
    }

    return { ok: true };
  }

  async function signOut() {
    if (!publicEnv.authConfigured || !supabase) {
      return;
    }

    setLoading(true);
    await supabase.auth.signOut();
    setProfile(null);
    setConnectedAccounts([]);
    setConnectedAccountsState("unknown");
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

  async function verifyWallet(input: {
    walletAddress: string;
    chain?: string;
    signature: string;
  }) {
    if (!publicEnv.authConfigured || !supabase || !session?.access_token) {
      return { ok: false, error: "You need an active session before verifying a wallet." };
    }

    setLoading(true);
    setError(null);

    const response = await fetch("/api/identity/wallet/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(input),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      const message = payload?.error || "Wallet verification failed.";
      setLoading(false);
      setError(message);
      return { ok: false, error: message };
    }

    await reloadProfile();
    setLoading(false);
    return {
      ok: true,
      walletAddress:
        typeof payload.walletAddress === "string" ? payload.walletAddress : input.walletAddress,
    };
  }

  async function unlinkWallet() {
    if (!publicEnv.authConfigured || !supabase || !session?.access_token) {
      return { ok: false, error: "You need an active session before unlinking a wallet." };
    }

    setLoading(true);
    setError(null);

    const response = await fetch("/api/identity/wallet/unlink", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      const message = payload?.error || "Wallet unlink failed.";
      setLoading(false);
      setError(message);
      return { ok: false, error: message };
    }

    await reloadProfile();
    setLoading(false);
    return { ok: true };
  }

  async function uploadProfileAsset(kind: ProfileAssetKind, file: File) {
    if (!publicEnv.authConfigured || !supabase || !authUserId || !session?.access_token) {
      return { ok: false, error: "You need an active pilot session before uploading profile assets." };
    }

    if (!file) {
      return { ok: false, error: "No file selected." };
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);

    const response = await fetch("/api/profile/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      const message = payload?.error || "Profile asset upload failed.";
      setLoading(false);
      setError(message);
      return { ok: false, error: message };
    }

    setLoading(false);
    return {
      ok: true,
      url: typeof payload.url === "string" ? payload.url : "",
    };
  }

  async function linkProvider(provider: LinkableProvider) {
    if (!publicEnv.authConfigured || !supabase || !authUserId) {
      return { ok: false, error: "You need an active pilot session before linking providers." };
    }

    setLoading(true);
    setError(null);

    const nextProvider = provider === "x" ? "x" : "discord";
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
    if (!publicEnv.authConfigured || !supabase || !authUserId || !session?.access_token) {
      return { ok: false, error: "You need an active pilot session before linking Telegram." };
    }

    const sanitizedUserId = input.telegramUserId.replace(/[^\d]/g, "");
    const sanitizedUsername = input.username?.trim().replace(/^@+/, "") ?? "";

    if (!sanitizedUserId) {
      return { ok: false, error: "Enter your Telegram numeric user id first." };
    }

    setLoading(true);
    setError(null);

    const response = await fetch("/api/identity/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        telegramUserId: sanitizedUserId,
        username: sanitizedUsername || undefined,
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      const message = payload?.error || "Could not arm your Telegram identity.";
      setLoading(false);
      setError(message);
      return { ok: false, error: message };
    }

    applyConnectedAccountSnapshot(
      Array.isArray(payload.accounts) ? (payload.accounts as ConnectedAccount[]) : []
    );
    setLoading(false);
    return {
      ok: true,
      accounts: Array.isArray(payload.accounts) ? (payload.accounts as ConnectedAccount[]) : [],
    };
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
      applyConnectedAccountSnapshot(result.accounts);
      setLoading(false);
      return { ok: true, identities: result.identities, accounts: result.accounts };
    } catch (nextError) {
      try {
        const fallbackAccounts = await fetchConnectedAccountsSnapshotViaApi({
          accessToken: session.access_token,
        });
        applyConnectedAccountSnapshot(fallbackAccounts);
        setLoading(false);
        return {
          ok: true,
          identities: fallbackAccounts.length,
          accounts: fallbackAccounts,
        };
      } catch (fallbackError) {
        const message =
          fallbackError instanceof Error
            ? fallbackError.message
            : nextError instanceof Error
              ? nextError.message
              : "Failed to refresh linked systems.";
        setLoading(false);
        setError(message);
        return { ok: false, error: message };
      }
    }
  }

  const value: AuthContextValue = {
    initialized,
    loading,
    session,
    authUserId,
    profile,
    connectedAccounts,
    connectedAccountsState,
    error,
    authConfigured: publicEnv.authConfigured,
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    updateProfile,
    verifyWallet,
    unlinkWallet,
    uploadProfileAsset,
    linkProvider,
    saveTelegramIdentity,
    syncConnectedAccounts,
    signOut,
    reloadProfile,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
