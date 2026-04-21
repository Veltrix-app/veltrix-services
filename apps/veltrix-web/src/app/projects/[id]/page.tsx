import { AppShell } from "@/components/layout/app-shell";
import { ProjectDetailScreen } from "@/components/projects/project-detail-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProjectDetailPage() {
  return (
    <AppShell
      eyebrow="Project"
      title="Project detail"
      description="Branded project surfaces, linked campaigns and reward context for the web app."
    >
      <ProtectedState allowPreview previewLabel="Project preview">
        <ProjectDetailScreen />
      </ProtectedState>
    </AppShell>
  );
}
