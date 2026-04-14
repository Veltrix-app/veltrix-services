import { AppShell } from "@/components/layout/app-shell";
import { ProjectsScreen } from "@/components/projects/projects-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProjectsPage() {
  return (
    <AppShell
      eyebrow="Projects"
      title="Project worlds"
      description="Browse the live project ecosystem behind campaigns, quests and reward lanes."
    >
      <ProtectedState>
        <ProjectsScreen />
      </ProtectedState>
    </AppShell>
  );
}
