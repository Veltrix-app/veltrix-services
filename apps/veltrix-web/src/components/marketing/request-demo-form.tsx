"use client";

import type { ReactNode } from "react";
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
  children: ReactNode;
}) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-black/15 p-5 sm:p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200">{eyebrow}</p>
      <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-white">{title}</h3>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{description}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function inputClasses() {
  return "w-full rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-300/40 focus:bg-white/[0.05]";
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
      <div className="rounded-[34px] border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,80,49,0.26),rgba(6,35,24,0.74))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
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
    <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,36,0.94),rgba(10,14,22,0.96))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.28)] sm:p-8">
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
                : "border border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08]"
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
        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
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

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-lime-300/18 bg-lime-300/[0.08] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lime-200">Mode</p>
          <p className="mt-3 text-sm font-black text-white">
            {mode === "enterprise" ? "Enterprise review" : "Guided walkthrough"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {mode === "enterprise"
              ? "Use this for SSO, procurement, buyer review and custom rollout posture."
              : "Use this for a fast commercial conversation without slowing self-serve down."}
          </p>
        </div>
        <div className="rounded-[24px] border border-cyan-300/16 bg-cyan-300/[0.08] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">Entry signal</p>
          <p className="mt-3 text-sm font-black text-white">{defaultFrom ? `From ${defaultFrom}` : "Direct buyer path"}</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {defaultPlan ? `Plan context: ${defaultPlan}.` : "No plan bias is attached yet."}{" "}
            {defaultIntent ? `Intent: ${defaultIntent}.` : "The request can still shape the right path."}
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Routing promise</p>
          <p className="mt-3 text-sm font-black text-white">Short intake, real follow-up.</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Veltrix uses this form to route well, not to force a long procurement questionnaire on day one.
          </p>
        </div>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <FormSection
          eyebrow="Contact"
          title="Who should Veltrix follow up with?"
          description="Enough to route the request well and start the next conversation without asking you for unnecessary procurement detail."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FieldLabel label="Your name">
              <input
                value={requesterName}
                onChange={(event) => setRequesterName(event.target.value)}
                className={inputClasses()}
                placeholder="Name"
                required
              />
            </FieldLabel>
            <FieldLabel label="Work email">
              <input
                type="email"
                value={requesterEmail}
                onChange={(event) => setRequesterEmail(event.target.value)}
                className={inputClasses()}
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
                className={inputClasses()}
                placeholder="Company"
                required
              />
            </FieldLabel>
            <FieldLabel label="Team size">
              <select
                value={teamSize}
                onChange={(event) => setTeamSize(event.target.value as CommercialTeamSize)}
                className={inputClasses()}
              >
                {commercialTeamSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>
        </FormSection>

        <FormSection
          eyebrow="Launch context"
          title="What are you trying to launch or decide?"
          description="This is the core routing signal for the commercial queue: what the team is trying to do, how urgent it is and where the help is needed."
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <FieldLabel label="Use case">
              <textarea
                value={useCase}
                onChange={(event) => setUseCase(event.target.value)}
                className={inputClasses()}
                rows={4}
                placeholder="What are you trying to launch or operate?"
                required
              />
            </FieldLabel>
            <FieldLabel label="Urgency">
              <select
                value={urgency}
                onChange={(event) => setUrgency(event.target.value as CommercialUrgency)}
                className={inputClasses()}
              >
                {commercialUrgencyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>
        </FormSection>

        {mode === "enterprise" ? (
          <FormSection
            eyebrow="Enterprise posture"
            title="What pushes this beyond pure self-serve?"
            description="Use this section for the parts that usually matter in buyer review: security, billing structure and rollout support."
          >
            <FieldLabel label="Requirement summary">
              <textarea
                value={requirementSummary}
                onChange={(event) => setRequirementSummary(event.target.value)}
                className={inputClasses()}
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
                  className={inputClasses()}
                  rows={4}
                  placeholder="SSO, review, DPA, procurement"
                />
              </FieldLabel>
              <FieldLabel label="Billing requirements">
                <textarea
                  value={billingRequirements}
                  onChange={(event) => setBillingRequirements(event.target.value)}
                  className={inputClasses()}
                  rows={4}
                  placeholder="Contract, invoicing, custom limits"
                />
              </FieldLabel>
              <FieldLabel label="Onboarding requirements">
                <textarea
                  value={onboardingRequirements}
                  onChange={(event) => setOnboardingRequirements(event.target.value)}
                  className={inputClasses()}
                  rows={4}
                  placeholder="Launch support, rollout help, enablement"
                />
              </FieldLabel>
            </div>
          </FormSection>
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
