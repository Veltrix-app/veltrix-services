import { AppShell } from "@/components/layout/app-shell";
import { RewardsScreen } from "@/components/rewards/rewards-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function RewardsPage() {
  return (
    <AppShell
      eyebrow="Rewards"
      title="Reward Hub"
      description="Track live rewards, claimable payouts, rarity pressure and campaign linkage as part of the same member journey."
    >
      <ProtectedState allowPreview previewLabel="Rewards preview">
        <RewardsScreen />
      </ProtectedState>
    </AppShell>
  );
}
