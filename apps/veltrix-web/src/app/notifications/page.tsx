import { AppShell } from "@/components/layout/app-shell";
import { NotificationsScreen } from "@/components/notifications/notifications-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function NotificationsPage() {
  return (
    <AppShell
      eyebrow="Notifications"
      title="Activity feed"
      description="Quest approvals, reward updates and live system messages for the signed-in user."
    >
      <ProtectedState>
        <NotificationsScreen />
      </ProtectedState>
    </AppShell>
  );
}
