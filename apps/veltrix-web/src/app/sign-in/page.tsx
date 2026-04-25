import { AppShell } from "@/components/layout/app-shell";
import { SignInScreen } from "@/components/auth/sign-in-screen";

export default function SignInPage() {
  return (
    <AppShell
      eyebrow="Account"
      title="Sign in to VYNTRO"
      description="Access your workspace, continue live projects and recover your operator context without reopening setup from scratch."
    >
      <SignInScreen />
    </AppShell>
  );
}
