import { AppShell } from "@/components/layout/app-shell";
import { RewardsScreen } from "@/components/rewards/rewards-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function RewardsPage() {
  return (
    <AppShell
      eyebrow="Rewards"
      title="Loot Vault"
      description="Track the live loot vault with real claimable state, rarity pressure and campaign linkage."
    >
      <ProtectedState>
        <RewardsScreen />
      </ProtectedState>
    </AppShell>
  );
}
