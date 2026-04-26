import { AppShell } from "@/components/layout/app-shell";
import { ProtectedState } from "@/components/shared/protected-state";
import { XpCockpitScreen } from "@/components/xp/xp-cockpit-screen";

export default function XpPage() {
  return (
    <AppShell
      eyebrow="XP / Economy"
      title="XP cockpit"
      description="One central read for level progress, quests, raids, DeFi claims, streaks, anti-abuse guardrails and the next safe action."
    >
      <ProtectedState allowPreview previewLabel="XP economy preview">
        <XpCockpitScreen />
      </ProtectedState>
    </AppShell>
  );
}
