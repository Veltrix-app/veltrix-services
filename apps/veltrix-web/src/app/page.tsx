import { AppShell } from "@/components/layout/app-shell";
import { HomeScreen } from "@/components/home/home-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function Home() {
  return (
    <AppShell
      eyebrow="Home"
      title="Momentum, missions and reward pressure"
      description="The web app now starts on real auth and live backend reads instead of demo data."
    >
      <ProtectedState>
        <HomeScreen />
      </ProtectedState>
    </AppShell>
  );
}
