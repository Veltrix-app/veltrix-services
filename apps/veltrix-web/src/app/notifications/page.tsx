import { AppShell } from "@/components/layout/app-shell";
import { NotificationsScreen } from "@/components/notifications/notifications-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function NotificationsPage() {
  return (
    <AppShell
      eyebrow="Notifications"
      title="Signal Center"
      description="Quest approvals, reward drops and live system pressure for the signed-in pilot."
    >
      <ProtectedState>
        <NotificationsScreen />
      </ProtectedState>
    </AppShell>
  );
}
