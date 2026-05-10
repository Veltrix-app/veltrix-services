import { AppShell } from "@/components/layout/app-shell";
import { ProtectedState } from "@/components/shared/protected-state";
import { TradingArenaScreen } from "@/components/trading/trading-arena-screen";

export default function TradingArenaPage() {
  return (
    <AppShell
      eyebrow="DeFi / Trading Arena"
      title="Trading Arena"
      description="Snapshot and live-tracked trading competitions with verified wallets, cost caps and reward settlement."
      hidePageHeader
    >
      <ProtectedState allowPreview previewLabel="Trading Arena preview" showPreviewBanner={false}>
        <TradingArenaScreen />
      </ProtectedState>
    </AppShell>
  );
}
