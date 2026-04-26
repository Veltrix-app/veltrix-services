import { BorrowLendingScreen } from "@/components/defi/borrow-lending-screen";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedState } from "@/components/shared/protected-state";

export default function DefiBorrowLendingPage() {
  return (
    <AppShell
      eyebrow="DeFi / Borrow lending"
      title="Borrow / lending"
      description="Supply, withdraw, enable collateral, borrow and repay through a separated advanced DeFi route with live Base reads and clear risk gates."
    >
      <ProtectedState allowPreview previewLabel="Borrow/lending preview">
        <BorrowLendingScreen />
      </ProtectedState>
    </AppShell>
  );
}
