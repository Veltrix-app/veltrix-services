import { AppShell } from "@/components/layout/app-shell";
import { VerificationStatusCard } from "@/components/auth/verification-status-card";

export default function VerifyPage() {
  return (
    <AppShell
      eyebrow="Account"
      title="Verify your Veltrix account"
      description="Use this step to confirm whether your account is still waiting on email verification, already active, or blocked by a stale verification link."
    >
      <VerificationStatusCard />
    </AppShell>
  );
}
