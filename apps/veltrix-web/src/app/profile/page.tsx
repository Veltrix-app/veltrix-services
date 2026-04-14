import { AppShell } from "@/components/layout/app-shell";
import { ProfileScreen } from "@/components/profile/profile-screen";

export default function ProfilePage() {
  return (
    <AppShell
      eyebrow="Profile"
      title="Identity, status and connected accounts"
      description="The profile becomes the control surface for provider linking, verification readiness and user progression."
    >
      <ProfileScreen />
    </AppShell>
  );
}
