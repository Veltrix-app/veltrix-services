import { AppShell } from "@/components/layout/app-shell";
import { CampaignsScreen } from "@/components/campaigns/campaigns-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function CampaignsPage() {
  return (
    <AppShell
      eyebrow="Campaigns"
      title="Mission Select"
      description="Launch into live campaign lanes with real XP budgets, steps and clear-rate pressure."
    >
      <ProtectedState allowPreview previewLabel="Mission preview">
        <CampaignsScreen />
      </ProtectedState>
    </AppShell>
  );
}
