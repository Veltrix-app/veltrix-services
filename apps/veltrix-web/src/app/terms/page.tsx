import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/marketing/legal-page-shell";

export const metadata: Metadata = {
  title: "VYNTRO Terms",
  description:
    "Public terms for access, project usage, security controls, rewards, safety workflows, support and buyer trust review.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Terms"
      title="Public launch terms for using VYNTRO."
      intro="These terms describe the operating rules for accessing VYNTRO, configuring projects, participating in member journeys, using enterprise security controls and operating the product during its public launch."
    >
      <LegalSection title="Using the product">
        <p>
          VYNTRO is provided as a launch, community and operations platform. By using it, you agree to access the
          product only through authorized accounts and to use the platform in good faith.
        </p>
        <p>
          We may update, improve, limit or suspend parts of the service when needed for security, reliability, launch
          operations or product evolution.
        </p>
      </LegalSection>

      <LegalSection title="Accounts, linked identities and workspace access">
        <p>
          You are responsible for the accuracy of your account details and for controlling access to any linked
          identities or wallets you connect through VYNTRO.
        </p>
        <p>
          Do not impersonate others, manipulate identity signals or attempt to bypass readiness, verification or safety
          checks.
        </p>
        <p>
          Enterprise accounts may require SSO, SAML or two-factor authentication for certain roles. If your workspace policy requires those controls, continued portal access may depend on using them.
        </p>
      </LegalSection>

      <LegalSection title="Projects, rewards and participation">
        <p>
          Project teams are responsible for the configuration and operation of their launches, campaigns, quests, raids
          and rewards inside the permissions granted to them.
        </p>
        <p>
          Reward availability, delivery timing, eligibility and claim outcomes may depend on project configuration,
          safety review, inventory, moderation or other operational checks inside VYNTRO.
        </p>
      </LegalSection>

      <LegalSection title="Safety, abuse, security and enforcement">
        <p>
          VYNTRO may review, pause, reject, limit or remove access to actions, rewards, cases or project capabilities
          where abuse, fraud, policy violations, unsafe behavior or delivery risks are detected.
        </p>
        <p>
          Internal operator actions, bounded project permissions and audit trails are part of how the product protects
          launches, members and platform integrity.
        </p>
        <p>
          VYNTRO may also require reauthentication, revoke sessions, investigate suspicious access or limit enterprise access where the security posture of an account or user no longer meets policy.
        </p>
      </LegalSection>

      <LegalSection title="No investment or financial advice">
        <p>
          VYNTRO is software infrastructure. Nothing on the site or inside the product should be treated as investment,
          legal, accounting or financial advice.
        </p>
        <p>
          Projects and participants are responsible for understanding the rules, assets and obligations relevant to
          their own launches, communities and jurisdictions.
        </p>
      </LegalSection>

      <LegalSection title="Privacy, data requests and subprocessors">
        <p>
          Use of VYNTRO is also subject to the public privacy posture and subprocessor disclosures published on the site. Export, deletion, DPA and trust-review requests should be routed through support instead of informal side channels.
        </p>
        <p>
          VYNTRO may use third-party infrastructure or payment providers to operate the platform, and those dependencies are documented through the trust and subprocessor surfaces.
        </p>
      </LegalSection>

      <LegalSection title="Support, incidents and changes">
        <p>
          If you need rollout, access, product help or security review follow-up, use the VYNTRO support route. Public status updates remain the source of truth for platform-wide incidents.
        </p>
        <p>
          We may revise these terms over time as the product, commercial model and compliance posture mature.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
