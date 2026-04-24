import { AppShell } from "@/components/layout/app-shell";
import { RewardsScreen } from "@/components/rewards/rewards-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function RewardsPage() {
  return (
    <AppShell
      eyebrow="Rewards"
      title="Reward vault"
      description="Track live rewards, claimable payouts and rarity pressure as the payoff layer of the same member journey."
    >
      <ProtectedState allowPreview previewLabel="Rewards preview">
        <RewardsScreen />
      </ProtectedState>
    </AppShell>
  );
}
