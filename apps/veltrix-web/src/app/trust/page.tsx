import type { Metadata } from "next";
import { TrustCenterShell } from "@/components/marketing/trust-center-shell";
import {
  loadPublicSubprocessors,
  trustControls,
  trustDocuments,
  trustFaqs,
} from "@/lib/trust/public-trust";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Veltrix Trust Center",
  description:
    "Public security, privacy, subprocessors and operational trust posture for Veltrix buyers, operators and reviewers.",
};

export default async function TrustPage() {
  const subprocessors = await loadPublicSubprocessors().catch(() => []);

  return (
    <TrustCenterShell
      controls={trustControls}
      documents={trustDocuments}
      subprocessors={subprocessors}
      faqs={trustFaqs}
    />
  );
}
