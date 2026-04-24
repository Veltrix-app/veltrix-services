import { AppShell } from "@/components/layout/app-shell";
import { LeaderboardScreen } from "@/components/leaderboard/leaderboard-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function LeaderboardPage() {
  return (
    <AppShell
      eyebrow="Leaderboard"
      title="Live board"
      description="See who is setting the pace, what the board is asking for, and where to jump back into the climb."
    >
      <ProtectedState allowPreview previewLabel="Leaderboard preview">
        <LeaderboardScreen />
      </ProtectedState>
    </AppShell>
  );
}
