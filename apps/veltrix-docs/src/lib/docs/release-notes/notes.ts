export type DocsReleaseNote = {
  slug: string;
  title: string;
  dateLabel: string;
  summary: string;
  highlights: string[];
  relatedHrefs: string[];
};

export const docsReleaseNotes: DocsReleaseNote[] = [
  {
    slug: "public-launch",
    title: "Public launch baseline",
    dateLabel: "April 2026",
    summary:
      "Veltrix crossed from product-complete infrastructure into a public launch posture with a real public site, full product surfaces and shared system language across portal, webapp, bots and docs.",
    highlights: [
      "Public launch site now lives on the main web root instead of hiding behind product entry.",
      "Portal, member webapp and bot copy were aligned so the product reads like one brand instead of separate systems.",
      "Legal, support and reward disclaimer routes were added as part of the public launch layer.",
    ],
    relatedHrefs: ["/", "/project-docs", "/operator-docs", "/reference"],
  },
  {
    slug: "platform-phases",
    title: "Platform phases 1-8",
    dateLabel: "April 2026",
    summary:
      "The core platform was completed through a structured roadmap: hardening, project operating system, community execution, member journey, bot excellence, safety consoles, observability and final launch polish.",
    highlights: [
      "Phase 1 built the shared incident, override, audit and lifecycle hardening foundation.",
      "Phases 2 to 5 deepened project OS, community OS, member journey and bot delivery into a coherent operating system.",
      "Phases 6 to 8 added trust, payout, on-chain, observability and the public launch layer needed for a real market-facing release.",
    ],
    relatedHrefs: ["/operator-docs", "/project-docs", "/reference", "/release-notes"],
  },
];

export function listDocsReleaseNotes() {
  return docsReleaseNotes;
}

export function loadDocsReleaseNote(slug: string) {
  return docsReleaseNotes.find((note) => note.slug === slug);
}
