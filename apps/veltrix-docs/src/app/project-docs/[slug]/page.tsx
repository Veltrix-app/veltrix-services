import { DocsGuidePage } from "@/components/docs/docs-guide-page";

export default async function ProjectDocsDynamicPage({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;

  return <DocsGuidePage track="project-docs" slug={slug} />;
}
