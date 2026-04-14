import { AppShell } from "@/components/layout/app-shell";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

export default function CampaignsPage() {
  return (
    <AppShell
      eyebrow="Campaigns"
      title="Campaign missions come next"
      description="This route is already reserved for mission-centric campaign browsing and quest flow execution."
    >
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
    </AppShell>
  );
}
