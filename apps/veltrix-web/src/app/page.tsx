import { AppShell } from "@/components/layout/app-shell";
import { HomeScreen } from "@/components/home/home-screen";

export default function Home() {
  return (
    <AppShell
      eyebrow="Home"
      title="Momentum, missions and reward pressure"
      description="Sprint one starts with a consumer mission-control surface: active quests, progression, connected account readiness and visible reward payoff."
    >
      <HomeScreen />
    </AppShell>
  );
}
