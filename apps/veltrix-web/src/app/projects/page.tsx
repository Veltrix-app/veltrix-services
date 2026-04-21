import { AppShell } from "@/components/layout/app-shell";
import { ProjectsScreen } from "@/components/projects/projects-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProjectsPage() {
  return (
    <AppShell
      eyebrow="Projects"
      title="Project Browser"
      description="Scan the live projects behind campaigns, rewards and progression."
    >
      <ProtectedState allowPreview previewLabel="Project preview">
        <ProjectsScreen />
      </ProtectedState>
    </AppShell>
  );
}
