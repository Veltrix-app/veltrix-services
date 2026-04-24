import { AppShell } from "@/components/layout/app-shell";
import { RaidsScreen } from "@/components/raids/raids-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function RaidsPage() {
  return (
    <AppShell
      eyebrow="Raids"
      title="Live raid board"
      description="Read coordinated pushes, timers and squad pressure from one calmer live-operations surface."
    >
      <ProtectedState allowPreview previewLabel="Raid preview">
        <RaidsScreen />
      </ProtectedState>
    </AppShell>
  );
}
