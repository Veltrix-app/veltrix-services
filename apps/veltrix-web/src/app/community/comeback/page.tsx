import { AppShell } from "@/components/layout/app-shell";
import { CommunityComebackScreen } from "@/components/community/community-comeback-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function CommunityComebackPage() {
  return (
    <AppShell
      eyebrow="Community"
      title="Comeback flows for returning members"
      description="Keep signals, re-entry missions and reward pressure inside one dedicated comeback lane so returning members can move fast."
    >
      <ProtectedState>
        <CommunityComebackScreen />
      </ProtectedState>
    </AppShell>
  );
}
