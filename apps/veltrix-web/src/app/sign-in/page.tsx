import { AppShell } from "@/components/layout/app-shell";
import { SignInScreen } from "@/components/auth/sign-in-screen";

export default function SignInPage() {
  return (
    <AppShell
      eyebrow="Access"
      title="Sign in to Veltrix Web"
      description="The web consumer app shares the same auth, profile and verification layer as mobile."
    >
      <SignInScreen />
    </AppShell>
  );
}
