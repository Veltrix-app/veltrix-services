import { AppShell } from "@/components/layout/app-shell";
import { CampaignDetailScreen } from "@/components/campaigns/campaign-detail-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function CampaignDetailPage() {
  return (
    <AppShell
      eyebrow="Campaign"
      title="Campaign detail"
      description="Quest flow, reward outcome and mission context for a single live campaign."
    >
      <ProtectedState>
        <CampaignDetailScreen />
      </ProtectedState>
    </AppShell>
  );
}
