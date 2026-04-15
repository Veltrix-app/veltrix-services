import { AppShell } from "@/components/layout/app-shell";
import { SignInScreen } from "@/components/auth/sign-in-screen";

export default function SignInPage() {
  return (
    <AppShell
      eyebrow="Access"
      title="Sign in to Veltrix Web"
      description="Authenticate your pilot to unlock mission state, linked systems and live vault routing."
    >
      <SignInScreen />
    </AppShell>
  );
}
