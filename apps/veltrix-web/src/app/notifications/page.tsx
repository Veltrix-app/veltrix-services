import { AppShell } from "@/components/layout/app-shell";
import { NotificationsScreen } from "@/components/notifications/notifications-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function NotificationsPage() {
  return (
    <AppShell
      eyebrow="Notifications"
      title="Signal Center"
      description="Read what just changed, where it routes next, and which live lane needs your attention first."
    >
      <ProtectedState>
        <NotificationsScreen />
      </ProtectedState>
    </AppShell>
  );
}
