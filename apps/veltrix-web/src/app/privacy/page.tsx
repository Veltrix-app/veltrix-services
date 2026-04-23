import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/marketing/legal-page-shell";

export const metadata: Metadata = {
  title: "Veltrix Privacy",
  description:
    "How Veltrix handles account data, linked identities, project activity, security review, subprocessors and privacy requests.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy"
      title="How Veltrix handles account, project and activity data."
      intro="This page explains the main categories of information Veltrix uses to operate launches, community workflows, member journeys, support and security review. It is the public privacy posture for Veltrix, not a hidden internal note."
    >
      <LegalSection title="What we collect">
        <p>
          Veltrix may collect account details such as email, username, linked identity data, wallet connections,
          project participation, quest and reward progress, community actions, support messages and operational audit
          records.
        </p>
        <p>
          We also process product usage and workflow data so launches, automations, safety consoles and member-facing
          experiences can operate as intended.
        </p>
      </LegalSection>

      <LegalSection title="Why we use it">
        <p>
          We use this information to provide account access, project configuration, community operations, member
          journeys, trust and payout reviews, on-chain handling, support and product reliability.
        </p>
        <p>
          Some data is also used for security, abuse prevention, incident investigation and auditability across operator
          actions.
        </p>
      </LegalSection>

      <LegalSection title="Legal and operational basis">
        <p>
          Veltrix processes data to provide the product, secure operator access, respond to support requests, investigate abuse or incidents and meet legitimate operational or legal obligations.
        </p>
        <p>
          Where customer teams configure launches, campaigns or member experiences, Veltrix may process the resulting operational data as part of running the service on their behalf.
        </p>
      </LegalSection>

      <LegalSection title="Linked accounts, wallets and third-party services">
        <p>
          If you connect external identities such as Discord, Telegram, X or a wallet, Veltrix may store the minimum
          data needed to verify the link, show readiness, route actions and keep project-specific experiences working.
        </p>
        <p>
          Third-party services have their own terms and privacy practices. Using those connected services inside Veltrix
          does not replace the policies of the underlying providers.
        </p>
      </LegalSection>

      <LegalSection title="Project and community visibility">
        <p>
          Projects and internal operators may see different levels of information depending on permissions, grants and
          the safety posture of the relevant surface. Some consoles intentionally expose only bounded or summary-level
          detail.
        </p>
        <p>
          We design visibility and action permissions to reduce overexposure of member-level data while preserving the
          operational context required to run launches safely.
        </p>
      </LegalSection>

      <LegalSection title="Security, sessions and access review">
        <p>
          Veltrix uses authentication, session review, audit trails and bounded permissions to protect workspace and operator access. Enterprise accounts may also use SSO or enforce two-factor authentication for higher-risk roles.
        </p>
        <p>
          Security logs, recovery reviews and access metadata may be retained where needed to investigate incidents, enforce policy or confirm the safety of administrative actions.
        </p>
      </LegalSection>

      <LegalSection title="Subprocessors and infrastructure">
        <p>
          Veltrix relies on third-party infrastructure and service providers to operate hosting, authentication, payments and product delivery. Our current public vendor list is available on the subprocessor registry and may evolve as the platform matures.
        </p>
        <p>
          Where subprocessors handle data for Veltrix operations, that use remains subject to contractual and operational review rather than casual vendor sprawl.
        </p>
      </LegalSection>

      <LegalSection title="Your privacy requests">
        <p>
          Veltrix provides structured export and deletion request flows instead of treating privacy requests as informal support messages. Those requests may move through review and verification states before completion so they can be handled safely.
        </p>
        <p>
          Use support if you need privacy follow-up, a DPA discussion or help understanding what data is tied to your account or workspace.
        </p>
      </LegalSection>

      <LegalSection title="Retention and support">
        <p>
          We may retain operational records, audit logs and support context for as long as needed to run the product,
          investigate incidents, resolve disputes, comply with obligations or improve system reliability.
        </p>
        <p>
          For launch questions, privacy-related support or security review follow-up, use the public support route in Veltrix.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
