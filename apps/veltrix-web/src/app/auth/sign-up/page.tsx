import { AppShell } from "@/components/layout/app-shell";
import { SignUpScreen } from "@/components/auth/sign-up-screen";

export default function SignUpPage() {
  return (
    <AppShell
      eyebrow="Account"
      title="Create your VYNTRO account"
      description="Start with verified access, then move into workspace creation, team invites and the first launch-ready product path."
    >
      <SignUpScreen />
    </AppShell>
  );
}
