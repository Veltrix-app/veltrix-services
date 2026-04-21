import { AppShell } from "@/components/layout/app-shell";
import { SignInScreen } from "@/components/auth/sign-in-screen";

export default function SignInPage() {
  return (
    <AppShell
      eyebrow="Account"
      title="Sign in to Veltrix"
      description="Access your account to track progress, claim rewards and keep your linked identities ready."
    >
      <SignInScreen />
    </AppShell>
  );
}
