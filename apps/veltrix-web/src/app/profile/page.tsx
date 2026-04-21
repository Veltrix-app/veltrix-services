import { AppShell } from "@/components/layout/app-shell";
import { ProfileScreen } from "@/components/profile/profile-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProfilePage() {
  return (
    <AppShell
      eyebrow="Profile"
      title="Member Profile"
      description="Track your live identity, standing, connected accounts and readiness from one hub."
    >
      <ProtectedState>
        <ProfileScreen />
      </ProtectedState>
    </AppShell>
  );
}
