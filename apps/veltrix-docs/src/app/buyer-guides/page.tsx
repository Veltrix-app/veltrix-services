import Link from "next/link";
import { DocsPageFrame } from "@/components/docs/docs-page-frame";
import { DocsReferenceBlock } from "@/components/docs/docs-reference-block";
import { DocsSection } from "@/components/docs/docs-section";
import { DocsSnapshotFrame } from "@/components/docs/docs-snapshot-frame";
import { getDocsTrackById } from "@/lib/docs/docs-nav";

export default function BuyerGuidesPage() {
  const track = getDocsTrackById("buyer-guides");

  if (!track) {
    return null;
  }

  return (
    <DocsPageFrame
      eyebrow="Buyer Guides"
      title="Commercial docs for teams evaluating VYNTRO as a real launch system."
      description="This lane is for buyers deciding between self-serve and enterprise. It keeps pricing, launch operations and enterprise readiness in one commercial story instead of scattering it across unrelated pages."
      actions={[
        { href: "/buyer-guides/pricing-and-plans", label: "Open Pricing and Plans" },
        { href: "/buyer-guides/enterprise-readiness", label: "Open Enterprise Readiness" },
        { href: "/buyer-guides/launch-operations", label: "Open Launch Operations" },
      ]}
      chips={["Self-serve", "Enterprise", "Pricing", "Launch ops"]}
      relatedHrefs={["/", "/project-docs", "/operator-docs", "/buyer-guides/pricing-and-plans", "/buyer-guides/enterprise-readiness"]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Buyer posture</p>
          <h2 className="text-2xl font-black text-white">Choose the route that fits your operating shape.</h2>
          <p className="text-sm leading-7 text-slate-300">
            VYNTRO is designed to let smaller teams self-serve quickly while giving larger launch programs a clean
            path into trust review, onboarding and high-touch rollout planning.
          </p>
        </div>
      }
    >
      <DocsSection
        eyebrow="Commercial coverage"
        title="The buyer lane follows the evaluation path, not just the product map."
        description="These guides help a team decide how to start, which package fits and when a human commercial path is actually useful."
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
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">{item.status}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DocsSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <DocsSnapshotFrame
          title="How buyer docs should read"
          description="Buyer-facing docs should explain what the product does commercially without turning into generic marketing pages."
          caption="Commercial docs preview"
          stats={[
            { label: "Buyer tracks", value: String(track.sections.length) },
            { label: "Starting guides", value: "3" },
            { label: "Commercial posture", value: "Self-serve first" },
          ]}
        >
          <div className="grid gap-4">
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
              <p className="docs-kicker text-lime-300">Self-serve buyer</p>
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
              <p className="docs-kicker text-cyan-200">Enterprise buyer</p>
              <div className="mt-4 grid gap-3">
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

        <DocsReferenceBlock
          title="What this lane needs to explain"
          description="Buyer docs should make the commercial shape of VYNTRO easy to understand without hiding the real operating model underneath."
          items={[
            {
              label: "Package clarity",
              meta: "Commercial layer",
              summary: "Explain the difference between Free, Starter, Growth and Enterprise through actual limits and operating depth, not only marketing copy.",
            },
            {
              label: "Launch-system value",
              meta: "Product narrative",
              summary: "Show how launch planning, missions, community execution, trust and recovery live inside one platform so buyers understand why VYNTRO is broader than a quest tool.",
            },
            {
              label: "Enterprise route",
              meta: "Buyer handoff",
              summary: "Security review, onboarding posture and human follow-up should feel like a natural continuation of evaluation, not a disconnected sales detour.",
            },
          ]}
        />
      </div>
    </DocsPageFrame>
  );
}
