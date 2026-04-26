import { DefiMissionsScreen } from "@/components/defi/defi-missions-screen";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedState } from "@/components/shared/protected-state";

export default function DefiVaultsPage() {
  return (
    <AppShell
      eyebrow="DeFi / Vaults"
      title="Vault missions"
      description="A separate VYNTRO product surface for verified DeFi actions, starting with calm vault discovery before the quest and XP economy lands around it."
    >
      <ProtectedState allowPreview previewLabel="DeFi preview">
        <DefiMissionsScreen />
      </ProtectedState>
    </AppShell>
  );
}
