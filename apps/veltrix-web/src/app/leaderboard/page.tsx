import { AppShell } from "@/components/layout/app-shell";
import { LeaderboardScreen } from "@/components/leaderboard/leaderboard-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function LeaderboardPage() {
  return (
    <AppShell
      eyebrow="Leaderboard"
      title="Top raiders"
      description="Live ranking surface powered by the same backend leaderboard as mobile."
    >
      <ProtectedState>
        <LeaderboardScreen />
      </ProtectedState>
    </AppShell>
  );
}
