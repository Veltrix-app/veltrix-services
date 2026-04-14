import { AppShell } from "@/components/layout/app-shell";
import { RaidsScreen } from "@/components/raids/raids-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function RaidsPage() {
  return (
    <AppShell
      eyebrow="Raids"
      title="Raid Board"
      description="Track live coordinated pushes, timers and XP payouts for the signed-in user."
    >
      <ProtectedState>
        <RaidsScreen />
      </ProtectedState>
    </AppShell>
  );
}
