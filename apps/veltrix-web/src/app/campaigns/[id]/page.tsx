import { AppShell } from "@/components/layout/app-shell";
import { CampaignDetailScreen } from "@/components/campaigns/campaign-detail-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function CampaignDetailPage() {
  return (
    <AppShell
      eyebrow="Campaign"
      title="Live campaign detail"
      description="See the mission lane, stake pressure and reward outcome for one live campaign without losing the broader project context."
    >
      <ProtectedState allowPreview previewLabel="Mission preview">
        <CampaignDetailScreen />
      </ProtectedState>
    </AppShell>
  );
}
