import { AppShell } from "@/components/layout/app-shell";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function RewardsPage() {
  return (
    <AppShell
      eyebrow="Rewards"
      title="Reward payoff is part of the first shell"
      description="This route is now protected by live auth and ready for real reward states."
    >
      <ProtectedState>
        <PlaceholderScreen
          eyebrow="Rewards"
          title="Upcoming reward vault"
          description="We will expand this into a rarity-first rewards surface once live reward data and claim states are wired."
          bullets={[
            "Locked, claimable and claimed reward states with stronger payoff.",
            "Rarity and reward value surfaced much more clearly than a plain list.",
            "Direct handoff into claim and fulfillment-aware flows.",
          ]}
        />
      </ProtectedState>
    </AppShell>
  );
}
