import { AppShell } from "@/components/layout/app-shell";
import { DefiMissionsScreen } from "@/components/defi/defi-missions-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function DefiMissionsPage() {
  return (
    <AppShell
      eyebrow="DeFi"
      title="Vault missions"
      description="A separate VYNTRO product surface for verified DeFi actions, starting with calm vault discovery before the quest and XP economy lands around it."
    >
      <ProtectedState allowPreview previewLabel="DeFi preview">
        <DefiMissionsScreen />
      </ProtectedState>
    </AppShell>
  );
}
