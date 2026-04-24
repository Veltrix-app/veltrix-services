import { AppShell } from "@/components/layout/app-shell";
import { RaidDetailScreen } from "@/components/raids/raid-detail-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function RaidDetailPage() {
  return (
    <AppShell
      eyebrow="Raid"
      title="Raid detail"
      description="See the push, the pressure and the write-back path before you confirm a live raid."
    >
      <ProtectedState allowPreview previewLabel="Raid preview">
        <RaidDetailScreen />
      </ProtectedState>
    </AppShell>
  );
}
