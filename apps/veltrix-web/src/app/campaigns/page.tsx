import { AppShell } from "@/components/layout/app-shell";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function CampaignsPage() {
  return (
    <AppShell
      eyebrow="Campaigns"
      title="Campaign missions come next"
      description="This route is now auth-aware and ready for live mission parity work."
    >
      <ProtectedState>
        <PlaceholderScreen
          eyebrow="Campaigns"
          title="Upcoming mission board"
          description="We are scaffolding the route now so the consumer shell is coherent before we wire live campaign data."
          bullets={[
            "Mission-style campaign cards with progress and reward outcome.",
            "Verification-aware quest lists with pending and blocked states.",
            "Cleaner handoff into quest detail and action flows on desktop.",
          ]}
        />
      </ProtectedState>
    </AppShell>
  );
}
