import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/marketing/legal-page-shell";

export const metadata: Metadata = {
  title: "Veltrix Terms",
  description: "Public launch terms for access, project usage, rewards, safety workflows and support.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Terms"
      title="Public launch terms for using Veltrix."
      intro="These terms describe the basic operating rules for accessing Veltrix, configuring projects, participating in member journeys and using the product during its public launch."
    >
      <LegalSection title="Using the product">
        <p>
          Veltrix is provided as a launch, community and operations platform. By using it, you agree to access the
          product only through authorized accounts and to use the platform in good faith.
        </p>
        <p>
          We may update, improve, limit or suspend parts of the service when needed for security, reliability, launch
          operations or product evolution.
        </p>
      </LegalSection>

      <LegalSection title="Accounts and linked identities">
        <p>
          You are responsible for the accuracy of your account details and for controlling access to any linked
          identities or wallets you connect through Veltrix.
        </p>
        <p>
          Do not impersonate others, manipulate identity signals or attempt to bypass readiness, verification or safety
          checks.
        </p>
      </LegalSection>

      <LegalSection title="Projects, rewards and participation">
        <p>
          Project teams are responsible for the configuration and operation of their launches, campaigns, quests, raids
          and rewards inside the permissions granted to them.
        </p>
        <p>
          Reward availability, delivery timing, eligibility and claim outcomes may depend on project configuration,
          safety review, inventory, moderation or other operational checks inside Veltrix.
        </p>
      </LegalSection>

      <LegalSection title="Safety, abuse and enforcement">
        <p>
          Veltrix may review, pause, reject, limit or remove access to actions, rewards, cases or project capabilities
          where abuse, fraud, policy violations, unsafe behavior or delivery risks are detected.
        </p>
        <p>
          Internal operator actions, bounded project permissions and audit trails are part of how the product protects
          launches, members and platform integrity.
        </p>
      </LegalSection>

      <LegalSection title="No investment or financial advice">
        <p>
          Veltrix is software infrastructure. Nothing on the site or inside the product should be treated as investment,
          legal, accounting or financial advice.
        </p>
        <p>
          Projects and participants are responsible for understanding the rules, assets and obligations relevant to
          their own launches, communities and jurisdictions.
        </p>
      </LegalSection>

      <LegalSection title="Support and changes">
        <p>
          If you need rollout, access or product help, use the Veltrix support route. We may revise these public-launch
          terms over time as the product and operating model mature.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
