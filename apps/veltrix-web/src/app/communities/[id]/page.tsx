import { AppShell } from "@/components/layout/app-shell";
import { CommunityDetailScreen } from "@/components/communities/community-detail-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function CommunityDetailPage() {
  return (
    <AppShell
      eyebrow="Community"
      title="Community world"
      description="Project story, standing, active campaigns and contributor ladder for a single ecosystem."
    >
      <ProtectedState>
        <CommunityDetailScreen />
      </ProtectedState>
    </AppShell>
  );
}
