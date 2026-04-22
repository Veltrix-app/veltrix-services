import { DocsFlagshipPage } from "@/components/docs/docs-flagship-page";

export default function QuestStudioDocsPage() {
  return (
    <DocsFlagshipPage
      eyebrow="Project Docs"
      title="Quest Studio explains how a single mission becomes clear, verifiable and member-facing."
      description="This page documents the guided builder for quests: action posture, placement, verification, reward framing and the member preview that keeps the builder tied to the actual experience."
      actions={[
        { href: "/project-docs", label: "Back to Project Docs" },
        { href: "/reference", label: "Open Reference" },
        { href: "/reference/builder-controls-and-state-actions", label: "Builder Controls" },
      ]}
      chips={["Flagship page", "Guided builder", "Verification and preview"]}
      relatedHrefs={[
        "/project-docs",
        "/project-docs/campaign-studio",
        "/project-docs/community-os",
        "/reference",
        "/reference/builder-controls-and-state-actions",
        "/reference/warning-badges-and-status-cues",
        "/reference/lifecycle-states",
        "/reference/builder-and-handoff-model",
        "/reference/verification-and-reward-model",
        "/reference/community-and-member-signal-model",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">Primary users</p>
          <h2 className="text-2xl font-black text-white">Project builders and launch operators.</h2>
          <p className="text-sm leading-7 text-slate-300">
            Quest Studio turns a single mission into something the team can explain internally and members can understand instantly.
          </p>
        </div>
      }
      snapshotSlug="quest-studio"
      stateExplorerSlug="verification-reward"
      whatItIs={{
        description:
          "Quest Studio is the mission-focused builder for a single quest. Its job is to make action, verification, reward posture and member-facing presentation feel like one coherent object.",
        bullets: [
          "It separates the action itself from the proof needed to trust completion.",
          "It keeps campaign and project context prefilled instead of making the builder feel detached.",
          "It keeps a member-facing preview in view so the builder does not drift into pure admin language.",
        ],
        asideTitle: "Why it exists",
        asideBody:
          "If quest creation is only a data-entry form, projects lose clarity on what members actually need to do and how that action will be verified.",
      }}
      whereToFind={{
        title: "Where to find it",
        description: "Quest Studio is typically reached from project or campaign context, not from a hidden generic route.",
        items: [
          {
            label: "Primary route",
            meta: "/quests/new",
            summary: "The direct creation route for a fresh quest builder session.",
          },
          {
            label: "Project and campaign handoff",
            summary: "Project overview, launch workspace and campaign detail pages hand context into the builder automatically.",
          },
          {
            label: "Connected surfaces",
            summary: "Campaign Studio sets the bigger mission architecture while Rewards and Member Journey show what the quest ultimately changes downstream.",
          },
        ],
      }}
      keyRules={{
        title: "Key rules",
        items: [
          {
            label: "Action and verification stay separate",
            meta: "Builder rule",
            summary: "The member task and the proof model should be understandable independently, even when they are tightly linked in the product.",
          },
          {
            label: "Project context should persist",
            meta: "System rule",
            summary: "Quest creation should inherit project or campaign context so builders are not forced to reconstruct placement manually.",
          },
          {
            label: "Preview is part of the builder",
            meta: "Experience rule",
            summary: "The member-facing presentation is not an afterthought; it is part of how the builder validates the quest design.",
          },
        ],
      }}
      controlAtlas={{
        title: "The controls that matter most inside Quest Studio",
        description:
          "Quest Studio becomes much easier to understand once the key controls are grouped by what they change: action clarity, proof trust, incentive posture and member-facing presentation.",
        sections: [
          {
            title: "Action and placement controls",
            description: "These controls define what the member is being asked to do and where that mission belongs.",
            items: [
              {
                label: "Action type and destination",
                meta: "Mission control",
                summary: "This control changes what the quest actually asks of the member and whether the CTA feels specific or vague later on.",
              },
              {
                label: "Placement inside project or campaign context",
                meta: "Architecture control",
                summary: "Placement matters because the same quest reads differently when it sits at onboarding, mid-campaign or in a comeback lane.",
              },
              {
                label: "Member-facing title and framing",
                meta: "Experience control",
                summary: "Preview-facing language should help the team judge the quest from the member side before it goes live.",
              },
            ],
          },
          {
            title: "Verification and trust controls",
            description: "These controls explain why the product will trust a completion signal after the mission runs live.",
            items: [
              {
                label: "Verification type",
                meta: "Proof control",
                summary: "This is one of the most important quest controls because it changes how the system decides whether completion is credible, manual or provider-backed.",
              },
              {
                label: "Review posture and proof depth",
                meta: "Trust control",
                summary: "Controls in this family affect whether the later operator side sees clean verification, manual review pressure or ambiguous mission proof.",
              },
              {
                label: "Connected provider or integration dependency",
                meta: "Dependency control",
                summary: "Some quest controls only become meaningful when the right integration rail exists, which is why Quest Studio links back into integrations and on-chain or verification models.",
              },
            ],
          },
          {
            title: "Reward and preview controls",
            description: "These controls shape why the quest matters to a member and how that choice later affects payout and recognition posture.",
            items: [
              {
                label: "Reward framing",
                meta: "Incentive control",
                summary: "This control changes whether the quest reads as conversion, unlock or recognition and influences later claim pressure.",
              },
              {
                label: "Member preview",
                meta: "Validation control",
                summary: "The preview is important because it lets the team test whether the quest feels understandable before any operator has to explain it later.",
              },
              {
                label: "Save, publish and return-path actions",
                meta: "State control",
                summary: "Quest lifecycle controls matter because they decide when a mission becomes active and how the team returns to the wider campaign or launch posture afterward.",
              },
            ],
          },
        ],
      }}
      deepDive={{
        title: "How Quest Studio turns one mission into a trusted and incentivized product moment",
        description:
          "Quest Studio is deeper than a task form. It combines action clarity, proof logic, reward framing and member-facing presentation into one mission model.",
        sections: [
          {
            title: "Why action and proof are separated",
            description: "The docs should make this split feel intentional because it is a core product principle.",
            items: [
              {
                label: "Action posture",
                meta: "Member language",
                summary:
                  "The member first needs to understand what to do and why it belongs in the campaign path before the system starts talking about verification or reward logic.",
              },
              {
                label: "Proof posture",
                meta: "Trust layer",
                summary:
                  "Verification is separate because trusting a completion signal is a different problem than designing a clear mission action in the first place.",
              },
              {
                label: "Operators need both",
                meta: "Console consequence",
                summary:
                  "This split also helps the later operator side explain why something was accepted, manually reviewed or disputed instead of burying those concepts in one blob of builder settings.",
              },
            ],
          },
          {
            title: "How reward framing belongs in the same builder",
            description: "Reward logic changes the quest long before anything reaches a claim queue.",
            items: [
              {
                label: "Incentive changes behavior",
                meta: "Motivation model",
                summary:
                  "Rewards shape whether the quest feels like a meaningful mission, a conversion step or a recognition moment, which is why the docs should not explain rewards only on separate pages.",
              },
              {
                label: "Claim posture starts upstream",
                meta: "Downstream consequence",
                summary:
                  "A quest reward can later create inventory pressure, claim reviews or payout incidents, so the builder docs should acknowledge that operational tail directly.",
              },
              {
                label: "Preview needs reward context",
                meta: "Member-facing rule",
                summary:
                  "The quest preview is stronger when it shows both CTA clarity and what the member stands to unlock or earn from finishing the mission.",
              },
            ],
          },
          {
            title: "Why project and campaign context matter",
            description: "Quest creation should not feel detached from the wider project system.",
            items: [
              {
                label: "Campaign placement",
                meta: "Architecture rule",
                summary:
                  "Quest Studio is strongest when it inherits its project and campaign lane, because that keeps the mission tied to the broader launch path instead of forcing the team to reconstruct placement manually.",
              },
              {
                label: "Community and member consequences",
                meta: "Execution loop",
                summary:
                  "Once a quest is live, Community OS, bot commands and the member journey all become part of how that quest is experienced and measured.",
              },
              {
                label: "Builder return path",
                meta: "Launch rule",
                summary:
                  "After a quest is shaped, the system should route the team back into Campaign or Launch posture so they can judge what the quest changed in the wider stack.",
              },
            ],
          },
        ],
      }}
    />
  );
}
