import { AppShell } from "@/components/layout/app-shell";
import { RewardsScreen } from "@/components/rewards/rewards-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function RewardsPage() {
  return (
    <AppShell
      eyebrow="Rewards"
      title="Reward vault"
      description="Track the live reward catalog with real claimable state, rarity and campaign linkage."
    >
      <ProtectedState>
        <RewardsScreen />
      </ProtectedState>
    </AppShell>
  );
}
