import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function VerificationAndRewardModelPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Verification and Reward Model explains how member action, proof logic and incentive design stay connected."
      description="This page documents the exact bridge between Quest and Raid builders, reward framing and the downstream claim and payout consequences those choices create."
      referenceSlug="verification-and-reward-model"
      stateExplorerSlug="verification-reward"
      relatedHrefs={[
        "/reference",
        "/project-docs/quest-studio",
        "/project-docs/rewards",
        "/operator-docs/payout-console",
        "/reference/payout-risk-and-resolution-model",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Mission model</p>
          <p className="text-sm leading-7 text-slate-300">
            This is the page to read when you want to understand why verification and rewards are not separate concerns in a serious mission system.
          </p>
        </div>
      }
    />
  );
}
