import { DefiLandingScreen } from "@/components/defi/defi-landing-screen";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedState } from "@/components/shared/protected-state";

export default function DefiPage() {
  return (
    <AppShell
      eyebrow="DeFi"
      title="DeFi command center"
      description="A clear entry point for VYNTRO's non-custodial DeFi routes: choose vaults for simple yield missions or borrow/lending for advanced collateral flows."
    >
      <ProtectedState allowPreview previewLabel="DeFi preview">
        <DefiLandingScreen />
      </ProtectedState>
    </AppShell>
  );
}
