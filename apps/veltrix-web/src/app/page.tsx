import { AppShell } from "@/components/layout/app-shell";
import { HomeScreen } from "@/components/home/home-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function Home() {
  return (
    <AppShell
      eyebrow="Home"
      title="Momentum, missions and reward pressure"
      description="Read the live grid, scout open mission lanes and step into the command layer when you are ready."
    >
      <ProtectedState allowPreview previewLabel="Grid preview">
        <HomeScreen />
      </ProtectedState>
    </AppShell>
  );
}
