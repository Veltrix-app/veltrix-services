import { AppShell } from "@/components/layout/app-shell";
import { QuestsScreen } from "@/components/quests/quests-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function QuestsPage() {
  return (
    <AppShell
      eyebrow="Quests"
      title="Mission command"
      description="Find active quest lanes, boosted shard routes and reward-linked missions from one premium board."
      hidePageHeader
    >
      <ProtectedState allowPreview previewLabel="Quest preview" showPreviewBanner={false}>
        <QuestsScreen />
      </ProtectedState>
    </AppShell>
  );
}
