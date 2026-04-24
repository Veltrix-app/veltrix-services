import { AppShell } from "@/components/layout/app-shell";
import { QuestDetailScreen } from "@/components/quests/quest-detail-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function QuestDetailPage() {
  return (
    <AppShell
      eyebrow="Quest"
      title="Live mission detail"
      description="Read the action lane, verification pressure and proof state before you open the mission."
    >
      <ProtectedState allowPreview previewLabel="Mission preview">
        <QuestDetailScreen />
      </ProtectedState>
    </AppShell>
  );
}
