import { AppShell } from "@/components/layout/app-shell";
import { ProjectsScreen } from "@/components/projects/projects-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProjectsPage() {
  return (
    <AppShell
      eyebrow="Projects"
      title="Scout the projects worth opening"
      description="Use the project board like a curated launch roster: one lead ecosystem, one next route and a clear read on where the action is."
    >
      <ProtectedState allowPreview previewLabel="Project preview">
        <ProjectsScreen />
      </ProtectedState>
    </AppShell>
  );
}
