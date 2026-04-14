import { AppShell } from "@/components/layout/app-shell";
import { ProfileEditScreen } from "@/components/profile/profile-edit-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProfileEditPage() {
  return (
    <AppShell
      eyebrow="Profile"
      title="Edit profile"
      description="Update the live identity surface shared between mobile and web."
    >
      <ProtectedState>
        <ProfileEditScreen />
      </ProtectedState>
    </AppShell>
  );
}
