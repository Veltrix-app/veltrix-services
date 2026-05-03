import { AppShell } from "@/components/layout/app-shell";
import { CommunityHomeScreen } from "@/components/community/community-home-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function CommunityPage() {
  return (
    <AppShell
      eyebrow="Community"
      title="Your next community move"
      description="Use Community as the member command surface for momentum, recognition, next unlocks and the cleanest route through the journey."
      hidePageHeader
    >
      <ProtectedState allowPreview showPreviewBanner={false}>
        <CommunityHomeScreen />
      </ProtectedState>
    </AppShell>
  );
}
