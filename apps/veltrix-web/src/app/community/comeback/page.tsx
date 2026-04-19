import { AppShell } from "@/components/layout/app-shell";
import { CommunityComebackScreen } from "@/components/community/community-comeback-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function CommunityComebackPage() {
  return (
    <AppShell
      eyebrow="Community"
      title="Comeback flows for returning members"
      description="Signals, nudges, re-entry missions and reward pressure stay isolated in a dedicated comeback rail."
    >
      <ProtectedState>
        <CommunityComebackScreen />
      </ProtectedState>
    </AppShell>
  );
}
