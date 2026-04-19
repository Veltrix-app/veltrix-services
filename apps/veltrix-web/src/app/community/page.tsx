import { AppShell } from "@/components/layout/app-shell";
import { CommunityHomeScreen } from "@/components/community/community-home-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function CommunityPage() {
  return (
    <AppShell
      eyebrow="Community"
      title="Your next community move"
      description="Personal onboarding, comeback pressure, status and recognition now live in one member-facing community rail."
    >
      <ProtectedState>
        <CommunityHomeScreen />
      </ProtectedState>
    </AppShell>
  );
}
