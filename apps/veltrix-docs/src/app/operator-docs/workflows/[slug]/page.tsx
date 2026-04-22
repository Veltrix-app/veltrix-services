import { DocsWorkflowPage } from "@/components/docs/docs-workflow-page";

export default async function OperatorDocsWorkflowPage({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;

  return <DocsWorkflowPage track="operator-docs" slug={slug} />;
}
