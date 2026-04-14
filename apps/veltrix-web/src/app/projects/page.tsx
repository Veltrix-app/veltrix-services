import { AppShell } from "@/components/layout/app-shell";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProjectsPage() {
  return (
    <AppShell
      eyebrow="Projects"
      title="Project worlds are next"
      description="This route is now behind live auth and ready for the project parity sprint."
    >
      <ProtectedState>
        <PlaceholderScreen
          eyebrow="Projects"
          title="Upcoming project grid"
          description="This route is intentionally scaffolded now so navigation is stable while we build the richer project discovery surfaces next."
          bullets={[
            "Branded project cards with socials and campaign entry points.",
            "Filters for chain, category and verification readiness.",
            "Project detail pages that feel like mission worlds, not flat list rows.",
          ]}
        />
      </ProtectedState>
    </AppShell>
  );
}
