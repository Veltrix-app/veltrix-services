import { AppShell } from "@/components/layout/app-shell";
import { ProjectDetailScreen } from "@/components/projects/project-detail-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProjectDetailPage() {
  return (
    <AppShell
      eyebrow="Project"
      title="Project ecosystem detail"
      description="Read the project story, your standing and the live campaign or reward pressure from one calmer member-facing surface."
    >
      <ProtectedState allowPreview previewLabel="Project preview">
        <ProjectDetailScreen />
      </ProtectedState>
    </AppShell>
  );
}
