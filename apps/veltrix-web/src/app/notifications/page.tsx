import { AppShell } from "@/components/layout/app-shell";
import { NotificationsScreen } from "@/components/notifications/notifications-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function NotificationsPage() {
  return (
    <AppShell
      eyebrow="Notifications"
      title="Signal Center"
      description="Quest, reward and community signals that should always route back into the right member lane."
    >
      <ProtectedState>
        <NotificationsScreen />
      </ProtectedState>
    </AppShell>
  );
}
