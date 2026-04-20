import { AppShell } from "@/components/layout/app-shell";
import { RewardDetailScreen } from "@/components/rewards/reward-detail-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function RewardDetailPage() {
  return (
    <AppShell
      eyebrow="Reward"
      title="Reward detail"
      description="Payoff, claimability and linked member-lane context for a single reward."
    >
      <ProtectedState allowPreview previewLabel="Vault preview">
        <RewardDetailScreen />
      </ProtectedState>
    </AppShell>
  );
}
