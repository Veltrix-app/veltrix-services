import { AppShell } from "@/components/layout/app-shell";
import { AccountEntryRouter } from "@/components/getting-started/account-entry-router";
import { ProtectedState } from "@/components/shared/protected-state";
import { AccountActivationCard } from "@/components/success/account-activation-card";

export default function GettingStartedPage() {
  return (
    <AppShell
      eyebrow="Getting started"
      title="Create the workspace account layer"
      description="This first-run route decides whether you need a new workspace, already have one, or should continue into project setup and launch operations."
    >
      <ProtectedState>
        <div className="space-y-6">
          <AccountEntryRouter />
          <AccountActivationCard />
        </div>
      </ProtectedState>
    </AppShell>
  );
}
