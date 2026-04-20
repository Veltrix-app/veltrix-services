import { AppShell } from "@/components/layout/app-shell";
import { ProfileEditScreen } from "@/components/profile/profile-edit-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProfileEditPage() {
  return (
    <AppShell
      eyebrow="Profile"
      title="Edit profile"
      description="Tune the live identity loadout that onboarding, missions and reward readiness all depend on."
    >
      <ProtectedState>
        <ProfileEditScreen />
      </ProtectedState>
    </AppShell>
  );
}
