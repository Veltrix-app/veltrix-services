import { DefiPortfolioScreen } from "@/components/defi/defi-portfolio-screen";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedState } from "@/components/shared/protected-state";

export default function DefiPortfolioPage() {
  return (
    <AppShell
      eyebrow="DeFi / Portfolio"
      title="Portfolio dashboard"
      description="One wallet-scoped DeFi overview for vaults, supplied markets, borrowed markets, claimable XP and the next safe action."
    >
      <ProtectedState allowPreview previewLabel="Portfolio preview">
        <DefiPortfolioScreen />
      </ProtectedState>
    </AppShell>
  );
}
