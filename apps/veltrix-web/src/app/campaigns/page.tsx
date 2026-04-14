import { AppShell } from "@/components/layout/app-shell";
import { CampaignsScreen } from "@/components/campaigns/campaigns-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function CampaignsPage() {
  return (
    <AppShell
      eyebrow="Campaigns"
      title="Campaign missions"
      description="Browse the live campaign catalog with real XP budgets, progress and quest counts."
    >
      <ProtectedState>
        <CampaignsScreen />
      </ProtectedState>
    </AppShell>
  );
}
