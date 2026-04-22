import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function LaunchAndReadinessModelPage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="Launch and Readiness Model explains how Veltrix decides whether a project is blocked, warming up, launchable or live ready."
      description="This page documents the exact readiness groups, blocker logic and operating posture behind Launch Workspace and project launch scoring."
      referenceSlug="launch-and-readiness-model"
      stateExplorerSlug="launch-readiness"
      relatedHrefs={[
        "/reference",
        "/project-docs/launch-workspace",
        "/project-docs/campaign-studio",
        "/project-docs/community-os",
        "/reference/lifecycle-states",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Launch model</p>
          <p className="text-sm leading-7 text-slate-300">
            Launch posture in Veltrix is a real operating model with hard blockers, warning posture and readiness groups, not just a checklist with nicer styling.
          </p>
        </div>
      }
    />
  );
}
