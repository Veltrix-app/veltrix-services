import { AppShell } from "@/components/layout/app-shell";
import { LeaderboardScreen } from "@/components/leaderboard/leaderboard-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function LeaderboardPage() {
  return (
    <AppShell
      eyebrow="Leaderboard"
      title="Top contributors"
      description="Live ranking surface for contribution, streaks and XP momentum."
    >
      <ProtectedState allowPreview previewLabel="Leaderboard preview">
        <LeaderboardScreen />
      </ProtectedState>
    </AppShell>
  );
}
