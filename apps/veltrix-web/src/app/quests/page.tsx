import { AppShell } from "@/components/layout/app-shell";
import { QuestsScreen } from "@/components/quests/quests-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function QuestsPage() {
  return (
    <AppShell
      eyebrow="Quests"
      title="Mission board"
      description="Scan quest lanes quickly from a compact grid with featured spotlights at the top."
    >
      <ProtectedState allowPreview previewLabel="Quest preview">
        <QuestsScreen />
      </ProtectedState>
    </AppShell>
  );
}
