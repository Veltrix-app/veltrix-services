import { AppShell } from "@/components/layout/app-shell";
import { AccountEntryRouter } from "@/components/getting-started/account-entry-router";
import { ProtectedState } from "@/components/shared/protected-state";

export default function GettingStartedPage() {
  return (
    <AppShell
      eyebrow="Getting started"
      title="Create the workspace account layer"
      description="This first-run route decides whether you need a new workspace, already have one, or should continue into project setup and launch operations."
    >
      <ProtectedState>
        <AccountEntryRouter />
      </ProtectedState>
    </AppShell>
  );
}
