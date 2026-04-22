import { DocsWorkflowPage } from "@/components/docs/docs-workflow-page";

export default async function ProjectDocsWorkflowPage({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;

  return <DocsWorkflowPage track="project-docs" slug={slug} />;
}
