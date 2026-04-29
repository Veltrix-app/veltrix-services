import { AppShell } from "@/components/layout/app-shell";
import { ProtectedState } from "@/components/shared/protected-state";
import { TradingCompetitionDetailScreen } from "@/components/trading/trading-competition-detail-screen";

export default async function TradingCompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell
      eyebrow="DeFi / Trading Arena"
      title="Competition board"
      description="Join the arena, review scoring posture and follow the verified trading leaderboard."
    >
      <ProtectedState allowPreview previewLabel="Trading Arena preview">
        <TradingCompetitionDetailScreen competitionId={id} />
      </ProtectedState>
    </AppShell>
  );
}
