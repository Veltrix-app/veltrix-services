import { AppShell } from "@/components/layout/app-shell";
import { CommunityOnboardingScreen } from "@/components/community/community-onboarding-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function CommunityOnboardingPage() {
  return (
    <AppShell
      eyebrow="Community"
      title="Onboarding that actually guides the member"
      description="Keep identity, wallet, project entry and first mission inside one clear readiness path with no hidden setup debt."
    >
      <ProtectedState>
        <CommunityOnboardingScreen />
      </ProtectedState>
    </AppShell>
  );
}
