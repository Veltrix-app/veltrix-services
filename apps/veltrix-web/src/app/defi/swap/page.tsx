import { SwapScreen } from "@/components/defi/swap-screen";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedState } from "@/components/shared/protected-state";

export default function DefiSwapPage() {
  return (
    <AppShell
      eyebrow="DeFi / Swap"
      title="Swap route"
      description="Move into the right asset before vaults, lending or trading missions with a VYNTRO-native route finder."
      hidePageHeader
    >
      <ProtectedState allowPreview previewLabel="Swap preview" showPreviewBanner={false}>
        <SwapScreen />
      </ProtectedState>
    </AppShell>
  );
}
