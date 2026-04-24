"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, ExternalLink } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Surface } from "@/components/ui/surface";
import {
  bootstrapCustomerAccount,
  buildPortalAccountHref,
  fetchCurrentCustomerAccountOverview,
  type CurrentCustomerAccountResponse,
  type CustomerAccountSummary,
} from "@/lib/account/customer-account";
import { publicEnv } from "@/lib/env";

function deriveWorkspaceDraft(input?: string | null) {
  const value = input?.trim();
  if (!value) {
    return "New workspace";
  }

  return value.toLowerCase().endsWith("workspace") ? value : `${value} workspace`;
}

function formatStepLabel(step: CustomerAccountSummary["currentStep"]) {
  switch (step) {
    case "create_project":
      return "Create your first project";
    case "invite_team":
      return "Invite your first teammates";
    case "open_launch_workspace":
      return "Open launch workspace";
    case "completed":
      return "Workspace ready";
    default:
      return "Create workspace";
  }
}

function formatStatusLabel(account: CustomerAccountSummary) {
  if (account.status === "trial") {
    return "Trial workspace";
  }

  if (account.status === "pending_verification") {
    return "Pending verification";
  }

  if (account.status === "active") {
    return "Active workspace";
  }

  return account.status;
}

function resolvePrimaryAction(account: CustomerAccountSummary | null) {
  if (!account) {
    return {
      href: `${publicEnv.portalUrl}/projects`,
      label: "Open admin portal",
      description: "Use the portal to continue once the workspace exists.",
    };
  }

  if (account.currentStep === "create_project") {
    return {
      href: `${publicEnv.portalUrl}/projects/new`,
      label: "Create first project",
      description: "The next clean move is creating the first project workspace in the portal.",
    };
  }

  if (account.currentStep === "open_launch_workspace" && account.firstProjectId) {
    return {
      href: `${publicEnv.portalUrl}/projects/${account.firstProjectId}/launch`,
      label: "Open launch workspace",
      description: "Jump straight into the project launch surface instead of browsing from scratch.",
    };
  }

  return {
    href: buildPortalAccountHref(account),
    label: "Open workspace",
    description: "Continue from the account and project context that is already active.",
  };
}

export function AccountEntryRouter() {
  const { session, profile } = useAuth();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<CurrentCustomerAccountResponse | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const accessToken = session?.access_token ?? null;

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;
    const currentAccessToken = accessToken;

    async function load() {
      try {
        setState("loading");
        setError(null);
        const result = await fetchCurrentCustomerAccountOverview(currentAccessToken);
        if (!active) {
          return;
        }

        setPayload(result);
        setWorkspaceName(
          deriveWorkspaceDraft(
            result.user.displayName || profile?.username || session?.user?.email?.split("@")[0]
          )
        );
        setState("ready");
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Could not load workspace account.");
        setState("error");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [accessToken, profile?.username, session?.user?.email, reloadKey]);

  const primaryAccount = payload?.overview.accounts[0] ?? null;
  const primaryAction = useMemo(() => resolvePrimaryAction(primaryAccount), [primaryAccount]);

  async function handleCreateWorkspace() {
    if (!accessToken) {
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const result = await bootstrapCustomerAccount({
        accessToken,
        accountName: workspaceName,
      });

      setPayload((current) =>
        current
          ? {
              ...current,
              overview: result.overview,
            }
          : null
      );
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "Workspace creation did not complete."
      );
    } finally {
      setCreating(false);
    }
  }

  if (!accessToken) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Surface
        eyebrow="Account routing"
        title="Create the workspace layer first"
        description="This route checks whether your verified account already owns a workspace, has pending invites, or still needs the first bootstrap step."
      >
        {state === "loading" ? (
          <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-5 text-sm text-slate-300">
            Loading workspace account...
          </div>
        ) : null}

        {state === "error" ? (
              <div className="space-y-4">
            <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-4 py-5 text-sm text-rose-200">
              {error}
            </div>
            <button
              type="button"
              onClick={() => {
                setState("loading");
                setPayload(null);
                setReloadKey((value) => value + 1);
              }}
              className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Retry
            </button>
          </div>
        ) : null}

        {state === "ready" && payload?.overview.needsWorkspaceBootstrap ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="rounded-[22px] border border-lime-300/16 bg-[linear-gradient(135deg,rgba(192,255,0,0.14),rgba(0,204,255,0.08),rgba(255,255,255,0.02))] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">
                No workspace yet
              </p>
                <h3 className="mt-2 text-[1.15rem] font-black tracking-tight text-white">
                Bootstrap the first account workspace
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                We have a verified login, but not a customer account layer yet. Create the workspace once, then the next step becomes first-project setup.
              </p>

              <div className="mt-5 space-y-3">
                <label className="block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Workspace name
                </label>
                <input
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  placeholder="Founders workspace"
                  className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-lime-300/40"
                />
              </div>

              {error ? (
                <div className="mt-4 rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleCreateWorkspace()}
                  disabled={creating || !workspaceName.trim()}
                  className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-lime-300/40"
                >
                  {creating ? "Creating workspace..." : "Create workspace"}
                </button>
                <Link
                  href="/home"
                  className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                >
                  Continue in member app
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <InfoCard
                icon={Building2}
                title="What this step creates"
                body="A customer account layer above projects, with onboarding state and the first owner membership already attached."
              />
              <InfoCard
                icon={CheckCircle2}
                title="What happens next"
                body="Right after bootstrap, the next clean move becomes creating the first project in the admin portal."
              />
            </div>
          </div>
        ) : null}

        {state === "ready" && !payload?.overview.needsWorkspaceBootstrap ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200">
                    Active workspace
                  </p>
                <h3 className="mt-2 text-[1.15rem] font-black tracking-tight text-white">
                    {primaryAccount?.name ?? "Workspace ready"}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    {primaryAction.description}
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-200">
                  {primaryAccount ? formatStatusLabel(primaryAccount) : "Workspace ready"}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <StatPill label="Role" value={primaryAccount?.role ?? "owner"} />
                <StatPill label="Projects" value={String(primaryAccount?.projectCount ?? 0)} />
                <StatPill label="Next step" value={formatStepLabel(primaryAccount?.currentStep ?? "completed")} />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={primaryAction.href}
                  className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
                >
                  {primaryAction.label}
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link
                  href="/home"
                  className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                >
                  Continue in member app
                </Link>
              </div>

              <div className="mt-5 rounded-[22px] border border-amber-300/16 bg-amber-300/8 px-4 py-4 text-sm leading-6 text-amber-100">
                The admin portal still uses its own session on a separate domain today. If the portal asks you to sign in once, that is expected in this first rollout slice.
              </div>
            </div>

            <div className="space-y-4">
              {payload?.overview.invites.length ? (
                <Surface
                  eyebrow="Pending invites"
                  title="Teammate access waiting"
                  description="We already see invite rows for this email, so the next portal session can convert them into active memberships."
                >
                  <div className="space-y-3">
                    {payload.overview.invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4"
                      >
                        <p className="text-sm font-semibold text-white">{invite.accountName}</p>
                        <p className="mt-1 text-sm text-slate-300">
                          {invite.role} access is waiting on this email.
                        </p>
                      </div>
                    ))}
                  </div>
                </Surface>
              ) : null}

              <Surface
                eyebrow="Workspace list"
                title="Available accounts"
                description="This is the first pass of the account layer, so returning operators can already see every linked workspace from one route."
              >
                <div className="space-y-3">
                  {payload?.overview.accounts.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{account.name}</p>
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          {account.role}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">
                        {account.projectCount} project{account.projectCount === 1 ? "" : "s"} linked. Next move:{" "}
                        {formatStepLabel(account.currentStep).toLowerCase()}.
                      </p>
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          </div>
        ) : null}
      </Surface>
    </div>
  );
}

function InfoCard(props: { icon: typeof Building2; title: string; body: string }) {
  const Icon = props.icon;

  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-200">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold text-white">{props.title}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{props.body}</p>
    </div>
  );
}

function StatPill(props: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{props.label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{props.value}</p>
    </div>
  );
}
