import { DefiRiskEducationScreen } from "@/components/defi/risk-education-screen";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedState } from "@/components/shared/protected-state";

export default function DefiRiskGuidePage() {
  return (
    <AppShell
      eyebrow="DeFi / Risk guide"
      title="Borrow/lending risk guide"
      description="A compact education layer for collateral, liquidation, repay discipline and non-custodial wallet flow before users touch advanced DeFi actions."
    >
      <ProtectedState allowPreview previewLabel="Risk guide preview">
        <DefiRiskEducationScreen />
      </ProtectedState>
    </AppShell>
  );
}
