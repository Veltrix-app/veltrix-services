import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/marketing/legal-page-shell";
import { SubprocessorTable } from "@/components/marketing/subprocessor-table";
import { loadPublicSubprocessors } from "@/lib/trust/public-trust";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Veltrix Subprocessors",
  description: "Current subprocessors used by Veltrix to operate infrastructure, payments and product delivery.",
};

export default async function SubprocessorsPage() {
  const subprocessors = await loadPublicSubprocessors().catch(() => []);

  return (
    <LegalPageShell
      eyebrow="Subprocessors"
      title="Current vendors used to operate Veltrix."
      intro="This registry exists so customers, buyers and reviewers can see the main vendors Veltrix relies on for infrastructure, payments and product delivery without waiting for a manual follow-up."
    >
      <LegalSection title="Current registry">
        <SubprocessorTable items={subprocessors} />
      </LegalSection>

      <LegalSection title="How to use this page">
        <p>
          This page is a public vendor summary, not a substitute for contract review. If your team needs DPA follow-up,
          procurement context or a security questionnaire, use the support route and choose the privacy or security lane.
        </p>
        <p>
          Veltrix reviews this registry as part of its broader trust and compliance operating posture.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
