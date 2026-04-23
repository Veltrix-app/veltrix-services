"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  fetchCurrentCustomerAccountOverview,
  type CurrentCustomerAccountResponse,
} from "@/lib/account/customer-account";
import {
  submitSupportTicket,
  supportTicketTypeOptions,
  type SupportTicketReceipt,
  type SupportTicketType,
} from "@/lib/support/support-intake";

type SupportFormState = {
  ticketType: SupportTicketType;
  subject: string;
  message: string;
  requesterName: string;
  requesterEmail: string;
  contextDetails: string;
};

const initialFormState: SupportFormState = {
  ticketType: "product_question",
  subject: "",
  message: "",
  requesterName: "",
  requesterEmail: "",
  contextDetails: "",
};

function deriveDisplayName(email?: string | null, username?: string | null) {
  if (username?.trim()) {
    return username.trim();
  }

  if (email?.trim()) {
    return email.split("@")[0] || "Workspace operator";
  }

  return "";
}

export function SupportIntakeForm() {
  const { session, profile } = useAuth();
  const [form, setForm] = useState<SupportFormState>(initialFormState);
  const [loadingContext, setLoadingContext] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SupportTicketReceipt | null>(null);
  const [accountPayload, setAccountPayload] = useState<CurrentCustomerAccountResponse | null>(null);

  const accessToken = session?.access_token ?? null;

  useEffect(() => {
    setForm((current) => ({
      ...current,
      requesterName:
        current.requesterName || deriveDisplayName(session?.user?.email, profile?.username),
      requesterEmail: current.requesterEmail || session?.user?.email || "",
    }));
  }, [profile?.username, session?.user?.email]);

  useEffect(() => {
    if (!accessToken) {
      setAccountPayload(null);
      return;
    }

    const token = accessToken;
    let active = true;

    async function loadAccountContext() {
      try {
        setLoadingContext(true);
        const result = await fetchCurrentCustomerAccountOverview(token);
        if (!active) {
          return;
        }
        setAccountPayload(result);
      } catch {
        if (!active) {
          return;
        }
        setAccountPayload(null);
      } finally {
        if (active) {
          setLoadingContext(false);
        }
      }
    }

    void loadAccountContext();

    return () => {
      active = false;
    };
  }, [accessToken]);

  const primaryAccount = accountPayload?.overview.accounts[0] ?? null;

  const selectedLane = useMemo(
    () => supportTicketTypeOptions.find((option) => option.value === form.ticketType) ?? supportTicketTypeOptions[0],
    [form.ticketType]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      const nextReceipt = await submitSupportTicket({
        ticketType: form.ticketType,
        subject: form.subject,
        message: form.message,
        requesterName: accessToken ? undefined : form.requesterName,
        requesterEmail: accessToken ? undefined : form.requesterEmail,
        customerAccountId: primaryAccount?.id,
        projectId: primaryAccount?.firstProjectId ?? undefined,
        contextDetails: form.contextDetails,
        accessToken,
      });

      setReceipt(nextReceipt);
      setForm((current) => ({
        ...initialFormState,
        ticketType: current.ticketType,
        requesterName: current.requesterName,
        requesterEmail: current.requesterEmail,
      }));
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Support request did not complete."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(11,14,20,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-lime-300">
              Support intake
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">Send one clear request into the queue</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Pick the lane that best matches the issue, describe what is blocked, and we will route it into the right
              workspace.
            </p>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Selected lane</p>
            <p className="mt-2 text-sm font-bold text-white">{selectedLane.label}</p>
            <p className="mt-2 max-w-[220px] text-xs leading-6 text-slate-300">{selectedLane.description}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Support lane</span>
            <select
              value={form.ticketType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  ticketType: event.target.value as SupportTicketType,
                }))
              }
              className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-lime-300/40"
            >
              {supportTicketTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {!accessToken ? (
            <>
              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Name</span>
                <input
                  value={form.requesterName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      requesterName: event.target.value,
                    }))
                  }
                  className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-lime-300/40"
                  placeholder="Your name"
                />
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Email</span>
                <input
                  type="email"
                  value={form.requesterEmail}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      requesterEmail: event.target.value,
                    }))
                  }
                  className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-lime-300/40"
                  placeholder="you@project.com"
                />
              </label>
            </>
          ) : null}

          <label className="space-y-2 md:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Subject</span>
            <input
              value={form.subject}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
              className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-lime-300/40"
              placeholder="What is blocked or confusing right now?"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">What happened</span>
            <textarea
              value={form.message}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
              rows={6}
              className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-lime-300/40"
              placeholder="Describe the exact issue, what you expected, and what is happening instead."
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Extra context
            </span>
            <textarea
              value={form.contextDetails}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  contextDetails: event.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-lime-300/40"
              placeholder="Optional: rollout timing, affected provider, claim id, or anything else that helps us route this faster."
            />
          </label>
        </div>

        {error ? (
          <div className="mt-5 rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {receipt ? (
          <div className="mt-5 rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
              <div>
                <p className="font-bold text-white">Support request received</p>
                <p className="mt-2 leading-7 text-emerald-100">
                  Reference <span className="font-black text-white">{receipt.ticketRef}</span>. We routed this into the
                  support queue and kept any signed-in workspace context attached.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3.5 text-sm font-black text-slate-950 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-lime-300/40"
          >
            {submitting ? "Sending request..." : "Send support request"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <Link
            href="/status"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
          >
            Open service status
          </Link>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">Routing posture</p>
          {accessToken ? (
            <>
              <p className="mt-3 text-lg font-black text-white">
                {primaryAccount?.name ?? "Signed-in workspace"}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Signed-in requests can link back to the workspace account and first project context automatically.
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Account: {loadingContext ? "Loading..." : primaryAccount?.id ?? "Not attached"}</p>
                <p>Project: {loadingContext ? "Loading..." : primaryAccount?.firstProjectId ?? "No linked project yet"}</p>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-lg font-black text-white">Public support path</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                You can still send a support request without signing in. We will use your email and the ticket lane to
                route it cleanly.
              </p>
            </>
          )}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lime-300">What helps fastest</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            <li>Use the most specific lane you can.</li>
            <li>Describe the exact step that failed.</li>
            <li>Mention the provider, project, or claim if one is involved.</li>
            <li>Use the status page first when the issue looks platform-wide.</li>
          </ul>
        </div>
      </aside>
    </section>
  );
}
