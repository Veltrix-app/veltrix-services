import { AppShell } from "@/components/layout/app-shell";
import { RewardDetailScreen } from "@/components/rewards/reward-detail-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function RewardDetailPage() {
  return (
    <AppShell
      eyebrow="Reward"
      title="Reward detail"
      description="Payoff, claimability and linked mission context for a single reward."
    >
      <ProtectedState>
        <RewardDetailScreen />
      </ProtectedState>
    </AppShell>
  );
}
