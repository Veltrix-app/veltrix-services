import { AppShell } from "@/components/layout/app-shell";
import { ProfileScreen } from "@/components/profile/profile-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProfilePage() {
  return (
    <AppShell
      eyebrow="Profile"
      title="Member Profile"
      description="Keep identity, linked systems, standing and payout pressure in one live member command surface."
    >
      <ProtectedState>
        <ProfileScreen />
      </ProtectedState>
    </AppShell>
  );
}
