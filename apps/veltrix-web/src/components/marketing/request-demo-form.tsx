"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  commercialTeamSizeOptions,
  commercialUrgencyOptions,
  resolveConversationMode,
  type CommercialConversationMode,
} from "@/lib/commercial/commercial-contract";

type RequestDemoFormProps = {
  defaultMode?: CommercialConversationMode;
  defaultPlan?: string | null;
  defaultIntent?: string | null;
  defaultFrom?: string | null;
  defaultAccountId?: string | null;
  defaultReturnTo?: string | null;
};

type CommercialTeamSize = (typeof commercialTeamSizeOptions)[number];
type CommercialUrgency = (typeof commercialUrgencyOptions)[number];

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function InputClasses() {
  return "w-full rounded-[22px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-300/40";
}

export function RequestDemoForm({
  defaultMode,
  defaultPlan,
  defaultIntent,
  defaultFrom,
  defaultAccountId,
  defaultReturnTo,
}: RequestDemoFormProps) {
  const [mode, setMode] = useState<CommercialConversationMode>(
    defaultMode ?? resolveConversationMode({ plan: defaultPlan, intent: defaultIntent })
  );
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [teamSize, setTeamSize] = useState<CommercialTeamSize>(commercialTeamSizeOptions[1]);
  const [useCase, setUseCase] = useState("");
  const [urgency, setUrgency] = useState<CommercialUrgency>(commercialUrgencyOptions[1]);
  const [requirementSummary, setRequirementSummary] = useState("");
  const [securityRequirements, setSecurityRequirements] = useState("");
  const [billingRequirements, setBillingRequirements] = useState("");
  const [onboardingRequirements, setOnboardingRequirements] = useState("");
  const [state, setState] = useState<"idle" | "working" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const endpoint = mode === "enterprise" ? "/api/commercial/enterprise-intake" : "/api/commercial/demo-request";
  const buttonLabel = mode === "enterprise" ? "Send enterprise request" : "Request demo";

  const context = useMemo(
    () => ({
      plan: defaultPlan ?? null,
      intent: defaultIntent ?? null,
      from: defaultFrom ?? null,
      accountId: defaultAccountId ?? null,
      returnTo: defaultReturnTo ?? null,
      sourcePath: "/talk-to-sales",
    }),
    [defaultAccountId, defaultFrom, defaultIntent, defaultPlan, defaultReturnTo]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setState("working");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requesterName,
          requesterEmail,
          companyName,
          teamSize,
          useCase,
          urgency,
          requirementSummary,
          securityRequirements,
          billingRequirements,
          onboardingRequirements,
          context,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "The request could not be sent.");
      }

      setState("success");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The request could not be sent.");
      setState("idle");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-[30px] border border-emerald-400/20 bg-emerald-500/10 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-300" />
          <div>
            <p className="text-sm font-black text-white">
              {mode === "enterprise" ? "Enterprise request received" : "Demo request received"}
            </p>
            <p className="mt-3 text-sm leading-7 text-emerald-50/90">
              Veltrix logged the request into the internal commercial queue. The next step is a
              short follow-up, not a long procurement maze.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-8">
      <div className="flex flex-wrap gap-3">
        {([
          { id: "demo", label: "Request demo" },
          { id: "enterprise", label: "Enterprise review" },
        ] as const).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setMode(option.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === option.id
                ? "bg-lime-300 text-slate-950"
                : "border border-white/12 text-white hover:bg-white/[0.06]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-cyan-200">
          {mode === "enterprise" ? "Buyer review" : "Guided help"}
        </p>
        <h2 className="mt-3 text-3xl font-black text-white">
          {mode === "enterprise"
            ? "Tell us what enterprise posture you need."
            : "Request a walkthrough without slowing the launch down."}
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          {mode === "enterprise"
            ? "Use this when you need security review, SSO, custom limits, rollout help or a clearer commercial path than pure self-serve."
            : "Use this when you want a short, high-signal conversation about launch shape, rollout order or the right commercial starting point."}
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FieldLabel label="Your name">
            <input
              value={requesterName}
              onChange={(event) => setRequesterName(event.target.value)}
              className={InputClasses()}
              placeholder="Name"
              required
            />
          </FieldLabel>
          <FieldLabel label="Work email">
            <input
              type="email"
              value={requesterEmail}
              onChange={(event) => setRequesterEmail(event.target.value)}
              className={InputClasses()}
              placeholder="name@company.com"
              required
            />
          </FieldLabel>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldLabel label="Company">
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className={InputClasses()}
              placeholder="Company"
              required
            />
          </FieldLabel>
          <FieldLabel label="Team size">
            <select
              value={teamSize}
              onChange={(event) => setTeamSize(event.target.value as CommercialTeamSize)}
              className={InputClasses()}
            >
              {commercialTeamSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FieldLabel>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <FieldLabel label="Use case">
            <textarea
              value={useCase}
              onChange={(event) => setUseCase(event.target.value)}
              className={InputClasses()}
              rows={4}
              placeholder="What are you trying to launch or operate?"
              required
            />
          </FieldLabel>
          <FieldLabel label="Urgency">
            <select
              value={urgency}
              onChange={(event) => setUrgency(event.target.value as CommercialUrgency)}
              className={InputClasses()}
            >
              {commercialUrgencyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FieldLabel>
        </div>

        {mode === "enterprise" ? (
          <>
            <FieldLabel label="Requirement summary">
              <textarea
                value={requirementSummary}
                onChange={(event) => setRequirementSummary(event.target.value)}
                className={InputClasses()}
                rows={3}
                placeholder="What makes this enterprise instead of self-serve?"
                required={mode === "enterprise"}
              />
            </FieldLabel>
            <div className="grid gap-4 md:grid-cols-3">
              <FieldLabel label="Security requirements">
                <textarea
                  value={securityRequirements}
                  onChange={(event) => setSecurityRequirements(event.target.value)}
                  className={InputClasses()}
                  rows={4}
                  placeholder="SSO, review, DPA, procurement"
                />
              </FieldLabel>
              <FieldLabel label="Billing requirements">
                <textarea
                  value={billingRequirements}
                  onChange={(event) => setBillingRequirements(event.target.value)}
                  className={InputClasses()}
                  rows={4}
                  placeholder="Contract, invoicing, custom limits"
                />
              </FieldLabel>
              <FieldLabel label="Onboarding requirements">
                <textarea
                  value={onboardingRequirements}
                  onChange={(event) => setOnboardingRequirements(event.target.value)}
                  className={InputClasses()}
                  rows={4}
                  placeholder="Launch support, rollout help, enablement"
                />
              </FieldLabel>
            </div>
          </>
        ) : null}

        {error ? (
          <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-sm leading-6 text-slate-400">
            Veltrix only asks for the minimum needed to route the request well.
          </p>
          <button
            type="submit"
            disabled={state === "working"}
            className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-lime-300/40"
          >
            {state === "working" ? "Sending..." : buttonLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
