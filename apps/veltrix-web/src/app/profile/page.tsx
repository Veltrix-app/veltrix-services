import { AppShell } from "@/components/layout/app-shell";
import { ProfileScreen } from "@/components/profile/profile-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProfilePage() {
  return (
    <AppShell
      eyebrow="Profile"
      title="Pilot Profile"
      description="Track live identity, standing, connected systems and signal pressure from one hub."
    >
      <ProtectedState>
        <ProfileScreen />
      </ProtectedState>
    </AppShell>
  );
}
