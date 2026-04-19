import { AppShell } from "@/components/layout/app-shell";
import { CommunityOnboardingScreen } from "@/components/community/community-onboarding-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function CommunityOnboardingPage() {
  return (
    <AppShell
      eyebrow="Community"
      title="Onboarding that actually guides the member"
      description="Identity, wallet, first mission and world entry all live inside one focused onboarding rail."
    >
      <ProtectedState>
        <CommunityOnboardingScreen />
      </ProtectedState>
    </AppShell>
  );
}
