import { AppShell } from "@/components/layout/app-shell";
import { AccountRecoveryScreen } from "@/components/auth/account-recovery-screen";

export default function RecoverPage() {
  return (
    <AppShell
      eyebrow="Account"
      title="Recover VYNTRO account access"
      description="Request a reset link or set a new password after opening the recovery email, without losing your current workspace and product context."
    >
      <AccountRecoveryScreen />
    </AppShell>
  );
}
