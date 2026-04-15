import { AppShell } from "@/components/layout/app-shell";
import { QuestDetailScreen } from "@/components/quests/quest-detail-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function QuestDetailPage() {
  return (
    <AppShell
      eyebrow="Quest"
      title="Quest detail"
      description="Action flow, proof state and provider-aware verification for a single live quest."
    >
      <ProtectedState allowPreview previewLabel="Mission preview">
        <QuestDetailScreen />
      </ProtectedState>
    </AppShell>
  );
}
