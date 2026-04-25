import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/marketing/legal-page-shell";

export const metadata: Metadata = {
  title: "VYNTRO Reward Disclaimer",
  description:
    "Important public-launch information about reward availability, eligibility, claim handling and delivery timing in VYNTRO.",
};

export default function RewardDisclaimerPage() {
  return (
    <LegalPageShell
      eyebrow="Reward Disclaimer"
      title="Reward availability, eligibility and delivery may vary."
      intro="VYNTRO can surface rewards, claimable payouts and campaign-linked unlocks, but reward outcomes still depend on project configuration, operational review and delivery state. This page explains that posture in plain language."
    >
      <LegalSection title="Rewards are project-dependent">
        <p>
          Projects configure their own campaigns, quests, raids, rewards and payout logic inside
          VYNTRO. A reward appearing in the product does not guarantee immediate availability,
          approval or delivery.
        </p>
        <p>
          Reward state can change as projects update inventory, eligibility rules, campaign logic
          or operator settings.
        </p>
      </LegalSection>

      <LegalSection title="Eligibility and safety review">
        <p>
          Claimability can depend on progression, linked identities, wallet verification, trust
          posture, moderation outcomes, inventory checks or project-specific participation rules.
        </p>
        <p>
          VYNTRO may pause, queue, review or reject reward claims when additional checks are
          required for safety, abuse prevention or delivery reliability.
        </p>
      </LegalSection>

      <LegalSection title="Payout timing and fulfillment">
        <p>
          Some rewards are delivered directly, while others move through payout queues, project
          approval or campaign finalization before they become fulfilled.
        </p>
        <p>
          Delivery timing, claim handling and final outcomes can therefore vary between projects,
          reward types and operational conditions.
        </p>
      </LegalSection>

      <LegalSection title="No guarantee of market value">
        <p>
          VYNTRO is software infrastructure, not a guarantee of asset value, liquidity, utility or
          financial outcome. Rewards shown in the product should not be treated as financial advice
          or as a promise of economic performance.
        </p>
      </LegalSection>

      <LegalSection title="Questions or disputes">
        <p>
          If you need help understanding a reward state, queued claim or delivery outcome, use the
          public support route or the relevant in-product support surface where available.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
