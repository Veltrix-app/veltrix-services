import { AppShell } from "@/components/layout/app-shell";
import { ProfileScreen } from "@/components/profile/profile-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProfilePage() {
  return (
    <AppShell
      eyebrow="Profile"
      title="Identity, status and connected accounts"
      description="The profile is now driven by live auth, linked accounts and real user state."
    >
      <ProtectedState>
        <ProfileScreen />
      </ProtectedState>
    </AppShell>
  );
}
