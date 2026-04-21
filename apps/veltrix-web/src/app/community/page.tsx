import { AppShell } from "@/components/layout/app-shell";
import { CommunityHomeScreen } from "@/components/community/community-home-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function CommunityPage() {
  return (
    <AppShell
      eyebrow="Community"
      title="Your next community move"
      description="Your member hub for mission pressure, recognition, next unlocks and the best current path through the community system."
    >
      <ProtectedState>
        <CommunityHomeScreen />
      </ProtectedState>
    </AppShell>
  );
}
