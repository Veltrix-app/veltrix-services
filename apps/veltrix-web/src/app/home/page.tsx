import { AppShell } from "@/components/layout/app-shell";
import { HomeScreen } from "@/components/home/home-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function ProductHomePage() {
  return (
    <AppShell
      eyebrow="Home"
      title="Your live launch world"
      description="See what is live now, where your next momentum comes from and which projects, quests or rewards deserve attention first."
    >
      <ProtectedState allowPreview previewLabel="Product preview">
        <HomeScreen />
      </ProtectedState>
    </AppShell>
  );
}
