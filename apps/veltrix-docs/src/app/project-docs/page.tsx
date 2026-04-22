import Link from "next/link";
import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsSection } from "@/components/docs/docs-section";
import { DocsSnapshotFrame } from "@/components/docs/docs-snapshot-frame";
import { DocsStateExplorer } from "@/components/docs/docs-state-explorer";
import { getDocsTrackById } from "@/lib/docs/docs-nav";

export default function ProjectDocsPage() {
  const track = getDocsTrackById("project-docs");

  if (!track) {
    return null;
  }

  return (
    <DocsPageFrame
      eyebrow="Project Docs"
      title="Public docs for teams running launches, growth and community execution."
      description="This track explains the project-facing parts of Veltrix: how launches are set up, how campaigns and missions are built, how communities are operated and how members move through the product."
      actions={[
        { href: "/reference", label: "Open Reference" },
        { href: "/release-notes", label: "Open Release Notes" },
      ]}
      chips={["Launch setup", "Studios", "Community OS", "Member Journey"]}
      relatedHrefs={[
        "/",
        "/operator-docs",
        "/reference",
        "/project-docs/campaign-studio",
        "/project-docs/quest-studio",
        "/project-docs/community-os",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Track focus</p>
          <h2 className="text-2xl font-black text-white">For founders, growth leads and community teams.</h2>
          <p className="text-sm leading-7 text-slate-300">
            This lane explains how a project touches Veltrix from launch planning through community execution and member follow-through.
          </p>
        </div>
      }
    >
      <DocsSection
        eyebrow="Coverage map"
        title="The project encyclopedia follows the launch lifecycle."
        description="Project Docs is not a loose pile of feature pages. It is structured to mirror how a team actually moves through the product: set up, build, operate, guide members and keep systems connected."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {track.sections.map((section) => (
            <div key={section.id} className="rounded-[26px] border border-white/8 bg-black/20 p-5">
              <p className="docs-kicker text-cyan-200">{section.label}</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{section.summary}</p>

              <div className="mt-5 grid gap-3">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-[20px] border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/14 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-black text-white">{item.label}</p>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                          item.status === "flagship"
                            ? "text-lime-200"
                            : item.status === "live"
                              ? "text-cyan-200"
                              : "text-slate-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DocsSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <DocsSnapshotFrame
          title="How Project Docs reads"
          description="The project lane should visually demonstrate how launch, build and execution surfaces fit together before the deep single-feature pages arrive."
          caption="Project documentation preview"
          stats={[
            { label: "Sections", value: String(track.sections.length) },
            { label: "Flagship pages", value: "3" },
            { label: "Audience", value: "Project teams" },
          ]}
        >
          <div className="grid gap-4">
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
              <p className="docs-kicker text-lime-300">Build path</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {track.sections[0]?.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-[18px] border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/14 hover:bg-white/[0.05]"
                  >
                    <p className="text-sm font-black text-white">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
              <p className="docs-kicker text-white/70">Workflow path</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {track.sections[2]?.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-[18px] border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/14 hover:bg-white/[0.05]"
                  >
                    <p className="text-sm font-black text-white">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
              <p className="docs-kicker text-cyan-200">Operate path</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {track.sections[1]?.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-[18px] border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/14 hover:bg-white/[0.05]"
                  >
                    <p className="text-sm font-black text-white">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </DocsSnapshotFrame>

        <div className="grid gap-6">
          <DocsStateExplorer
            eyebrow="Reading modes"
            title="This lane should answer three different project questions."
            states={[
              {
                label: "Build",
                summary: "How do we set up the launch, shape campaigns, configure quests and get rewards or raids ready?",
                bullets: [
                  "Launch Workspace and the studios explain entry posture.",
                  "Snapshots show what the builder surfaces look like in practice.",
                  "Reference links explain the exact lifecycle and permission rules behind the build flow.",
                ],
              },
              {
                label: "Operate",
                summary: "How does the team run the community once the launch is already moving?",
                bullets: [
                  "Community OS coverage explains owner and captain responsibilities.",
                  "Bot Commands and Integrations show how activation flows reach members.",
                  "Docs keep execution and governance language in the same lane.",
                ],
              },
              {
                label: "Guide members",
                summary: "How do the project-side surfaces connect to what members actually experience?",
                bullets: [
                  "Member Journey pages show how onboarding, comeback and mission routing behave.",
                  "Rewards and command surfaces link back into the same operating model.",
                  "This prevents project docs from becoming purely admin-facing.",
                ],
              },
            ]}
          />

          <DocsReferenceBlock
            title="Key objects behind this lane"
            items={[
              {
                label: "Lifecycle-safe content",
                meta: "Reference dependency",
                summary: "Campaigns, quests, raids and rewards all depend on the same lifecycle posture and action safety rules.",
              },
              {
                label: "Project-first context",
                meta: "System posture",
                summary: "Studios, launch and community routes should always explain how project context is carried forward automatically.",
              },
              {
                label: "Member-facing consequences",
                meta: "Journey layer",
                summary: "Project-side setup only makes sense when the docs also show what that means for the member journey.",
              },
            ]}
          />
        </div>
      </div>
    </DocsPageFrame>
  );
}
