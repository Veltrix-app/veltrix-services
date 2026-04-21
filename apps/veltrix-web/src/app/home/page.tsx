import { AppShell } from "@/components/layout/app-shell";
import { HomeScreen } from "@/components/home/home-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProductHomePage() {
  return (
    <AppShell
      eyebrow="Home"
      title="Your launches, quests and rewards"
      description="Track what is live, what is claimable and what your next move should be across the Veltrix product."
    >
      <ProtectedState allowPreview previewLabel="Product preview">
        <HomeScreen />
      </ProtectedState>
    </AppShell>
  );
}
