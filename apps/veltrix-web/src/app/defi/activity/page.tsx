import { DefiActivityScreen } from "@/components/defi/defi-activity-screen";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedState } from "@/components/shared/protected-state";

export default function DefiActivityPage() {
  return (
    <AppShell
      eyebrow="DeFi / Activity"
      title="DeFi proof history"
      description="A wallet-scoped proof center for vault transactions, borrow/lending actions, XP claims and the on-chain references behind them."
    >
      <ProtectedState allowPreview previewLabel="DeFi activity preview">
        <DefiActivityScreen />
      </ProtectedState>
    </AppShell>
  );
}
