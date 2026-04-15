import { AppShell } from "@/components/layout/app-shell";
import { ProjectsScreen } from "@/components/projects/projects-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProjectsPage() {
  return (
    <AppShell
      eyebrow="Projects"
      title="World Browser"
      description="Scan the live worlds behind campaigns, reward lanes and faction progression."
    >
      <ProtectedState allowPreview previewLabel="World preview">
        <ProjectsScreen />
      </ProtectedState>
    </AppShell>
  );
}
